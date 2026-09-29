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
  CreatePlanDto,
  MembershipsService,
  UpdatePlanDto,
} from './memberships.service';

@Controller('admin/memberships')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminMembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get('plans')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAllPlans() {
    return this.memberships.listAllPlans();
  }

  @Post('plans')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.memberships.createPlan(dto);
  }

  @Patch('plans/:id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.memberships.updatePlan(id, dto);
  }

  @Get('settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  async getSettings() {
    return { enabled: await this.memberships.isEnabled() };
  }

  @Patch('settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  setSettings(@Body() body: { enabled: boolean }) {
    return this.memberships.setEnabled(body.enabled);
  }
}
