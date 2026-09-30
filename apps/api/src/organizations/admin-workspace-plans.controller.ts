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
  CreateWorkspacePlanDto,
  UpdateWorkspacePlanDto,
  WorkspacePlansService,
} from './workspace-plans.service';

@Controller('admin/workspace-plans')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminWorkspacePlansController {
  constructor(private readonly workspacePlans: WorkspacePlansService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAllPlans() {
    return this.workspacePlans.listAllPlans();
  }

  @Post()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  createPlan(@Body() dto: CreateWorkspacePlanDto) {
    return this.workspacePlans.createPlan(dto);
  }

  // Registered before the ':id' route below — Express/Nest match in
  // registration order, so 'settings' would otherwise be parsed as an :id
  // and hit updatePlan (confirmed live: PATCH .../settings returned "Plan
  // not found: settings" before this reordering).
  @Get('settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  async getSettings() {
    return { enabled: await this.workspacePlans.isEnabled() };
  }

  @Patch('settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  setSettings(@Body() body: { enabled: boolean }) {
    return this.workspacePlans.setEnabled(body.enabled);
  }

  @Patch(':id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  updatePlan(@Param('id') id: string, @Body() dto: UpdateWorkspacePlanDto) {
    return this.workspacePlans.updatePlan(id, dto);
  }
}
