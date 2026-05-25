import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ActivityLoggerService } from '../activity/activity-logger.service';

@Controller('petitions')
export class PetitionsController {
  constructor(
    private readonly service: PetitionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaStorage: PetitionMediaStorageService,
    private readonly activityLogger: ActivityLoggerService,
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

  @Get(':id/is-creator')
  @UseGuards(OptionalJwtAuthGuard)
  async isCreator(
    @Param('id') id: string,
    @Req() req: { user?: { userId: string } },
  ) {
    const petition = await this.service.getById(id);
    if (!petition) {
      throw new NotFoundException('Petition not found');
    }
    return {
      isCreator: !!req.user && petition.creatorId === req.user.userId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreatePetitionDto,
  ) {
    const result = await this.service.create(req.user.userId, dto);
    
    // Log the petition creation
    this.activityLogger.logAsync({
      userId: req.user.userId,
      action: 'CREATE_PETITION',
      entityType: 'PETITION',
      entityId: result.id,
      description: `User created petition: "${result.title}"`,
      changes: { status: 'PENDING', category: result.category },
    });
    
    return result;
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
  @Get(':id/follow')
  checkFollow(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.service.isFollowing(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  follow(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.service.followPetition(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollow(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.service.unfollowPetition(req.user.userId, id);
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
  async approve(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() body: { category?: string },
  ) {
    const petition = await this.service.getById(id);
    if (!petition) throw new NotFoundException('Petition not found');
    
    const result = await this.service.approve(id, body.category);
    
    // Log the approval action
    this.activityLogger.logAsync({
      userId: petition.creatorId,
      adminId: req.user.userId,
      action: 'APPROVE_PETITION',
      entityType: 'PETITION',
      entityId: id,
      description: `Admin approved petition: "${petition.title}"`,
      changes: { previousStatus: 'PENDING', newStatus: 'APPROVED', category: body.category },
    });
    
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    const petition = await this.service.getById(id);
    if (!petition) throw new NotFoundException('Petition not found');
    
    const result = await this.service.reject(id);
    
    // Log the rejection action
    this.activityLogger.logAsync({
      userId: petition.creatorId,
      adminId: req.user.userId,
      action: 'REJECT_PETITION',
      entityType: 'PETITION',
      entityId: id,
      description: `Admin rejected petition: "${petition.title}"`,
      changes: { previousStatus: 'PENDING', newStatus: 'REJECTED' },
    });
    
    return result;
  }

  @Get(':id/status-log')
  getStatusLog(@Param('id') id: string) {
    return this.service.getStatusLog(id);
  }
}
