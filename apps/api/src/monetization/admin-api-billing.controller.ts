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
  ApiBillingService,
  CreateApiPlanDto,
  UpdateApiPlanDto,
} from './api-billing.service';

@Controller('admin/api-plans')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminApiBillingController {
  constructor(private readonly apiBilling: ApiBillingService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.apiBilling.listAllPlans();
  }

  @Post()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  create(@Body() dto: CreateApiPlanDto) {
    return this.apiBilling.createPlan(dto);
  }

  @Patch(':id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateApiPlanDto) {
    return this.apiBilling.updatePlan(id, dto);
  }
}
