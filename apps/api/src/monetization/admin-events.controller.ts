import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import {
  CreateEventDto,
  EventsService,
  UpdateEventDto,
} from './events.service';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.events.listAllEvents();
  }

  @Post()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  create(@Body() dto: CreateEventDto) {
    return this.events.createEvent(dto);
  }

  @Patch(':id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.updateEvent(id, dto);
  }
}
