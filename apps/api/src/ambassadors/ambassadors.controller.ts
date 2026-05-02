import { Controller, Post, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AmbassadorsService } from './ambassadors.service';
import { CreateAmbassadorApplicationDto, UpdateAmbassadorApplicationDto } from './ambassadors.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('ambassadors')
export class AmbassadorsController {
  constructor(private readonly service: AmbassadorsService) {}

  /**
   * Public endpoint: Submit an ambassador application
   * POST /ambassadors/apply
   */
  @Post('apply')
  async apply(@Body() dto: CreateAmbassadorApplicationDto) {
    return this.service.create(dto);
  }

  /**
   * Admin endpoint: Get all ambassador applications with optional status filter
   * GET /admin/ambassadors
   * Query: status (PENDING | APPROVED | REJECTED)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  async getApplications(@Query('status') status?: string) {
    return this.service.findAll(status as any);
  }

  /**
   * Admin endpoint: Get single ambassador application
   * GET /admin/ambassadors/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  async getApplication(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Admin endpoint: Update ambassador application status and notes
   * PATCH /admin/ambassadors/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body() dto: UpdateAmbassadorApplicationDto,
  ) {
    return this.service.update(id, dto);
  }
}
