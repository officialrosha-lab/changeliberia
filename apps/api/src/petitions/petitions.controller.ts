import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  Sse,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { createReadStream, existsSync } from 'fs';
import { extname } from 'path';
import type { Response } from 'express';
import type { MemoryUploadedFile } from '../verification/uploaded-file.types';
import { PetitionMediaStorageService } from './petition-media-storage.service';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Observable, fromEvent, filter, map } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreatePetitionCommentDto,
  CreatePetitionDto,
  CreatePetitionUpdateDto,
  UpdatePetitionDto,
} from './dto';
import { PetitionsService } from './petitions.service';
import { SignatureAddedEvent } from '../events/domain-events';

@Controller('petitions')
export class PetitionsController {
  constructor(
    private readonly service: PetitionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaStorage: PetitionMediaStorageService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('trending')
  trending() {
    return this.service.trending();
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('browse/all')
  browse() {
    return this.service.browse();
  }

  @Get(':id/updates')
  listUpdates(@Param('id') id: string) {
    return this.service.listUpdates(id);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.service.listComments(id);
  }

  @Sse(':id/live')
  liveSignatureCount(@Param('id') id: string): Observable<MessageEvent> {
    return fromEvent<SignatureAddedEvent>(this.eventEmitter, 'SIGNATURE_ADDED').pipe(
      filter((event) => event.petitionId === id),
      map(() => ({ data: JSON.stringify({ petitionId: id }) })),
    );
  }

  @Get('media/:filename')
  async serveMedia(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const abs = this.mediaStorage.resolveSafe(filename);
    if (!abs || !existsSync(abs)) throw new NotFoundException('Media not found');
    const ext = extname(filename).toLowerCase();
    const ct: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    };
    res.setHeader('Content-Type', ct[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(abs).pipe(res);
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreatePetitionDto,
  ) {
    return this.service.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/updates')
  createUpdate(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() dto: CreatePetitionUpdateDto,
  ) {
    return this.service.createUpdate(id, req.user.userId, dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Req() req: { user?: { userId: string } },
    @Body() dto: CreatePetitionCommentDto,
  ) {
    return this.service.createComment(id, dto, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  editPetition(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdatePetitionDto,
  ) {
    return this.service.updatePetition(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  @Post(':id/media')
  async uploadMedia(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @UploadedFile() file: MemoryUploadedFile | undefined,
  ) {
    if (!file) throw new BadRequestException('No file provided or unsupported file type');
    const petition = await this.service.getById(id);
    if (!petition || petition.creatorId !== req.user.userId) {
      throw new BadRequestException('Not your petition');
    }
    const url = await this.mediaStorage.save(file);
    return { url };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { category?: string }) {
    return this.service.approve(id, body.category);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
