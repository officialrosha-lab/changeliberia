import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { SponsorsService } from './sponsors.service';

@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Get()
  findAll() {
    return this.sponsors.findAll();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/sponsors')
export class AdminSponsorsController {
  constructor(
    private readonly sponsors: SponsorsService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  @Get()
  findAll() {
    return this.sponsors.findAllAdmin();
  }

  @Post()
  async create(
    @Req() req: { user: RequestUser },
    @Body() body: {
      name: string;
      logoUrl: string;
      websiteUrl?: string;
      type?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const sponsor = await this.sponsors.create(body);

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'CREATE_SPONSOR',
      entityType: 'SPONSOR',
      entityId: sponsor.id,
      description: `Created sponsor ${sponsor.name}`,
      changes: { logoUrl: sponsor.logoUrl, websiteUrl: sponsor.websiteUrl, type: sponsor.type },
    });

    return sponsor;
  }

  @Patch(':id')
  async update(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      logoUrl?: string;
      websiteUrl?: string;
      type?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const sponsor = await this.sponsors.update(id, body);

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'UPDATE_SPONSOR',
      entityType: 'SPONSOR',
      entityId: sponsor.id,
      description: `Updated sponsor ${sponsor.name}`,
      changes: body,
    });

    return sponsor;
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    const result = await this.sponsors.remove(id);

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'DELETE_SPONSOR',
      entityType: 'SPONSOR',
      entityId: id,
      description: `Deleted sponsor ${id}`,
    });

    return result;
  }
}
