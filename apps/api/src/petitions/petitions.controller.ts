import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
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
} from './dto';
import { PetitionsService } from './petitions.service';
import { SignatureAddedEvent } from '../events/domain-events';

@Controller('petitions')
export class PetitionsController {
  constructor(
    private readonly service: PetitionsService,
    private readonly eventEmitter: EventEmitter2,
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
