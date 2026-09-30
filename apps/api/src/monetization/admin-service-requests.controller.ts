import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  AdvanceServiceRequestDto,
  ServiceRequestsService,
} from './service-requests.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('admin/service-requests')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminServiceRequestsController {
  constructor(private readonly serviceRequests: ServiceRequestsService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.serviceRequests.listAll();
  }

  @Patch(':id/advance')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  advance(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdvanceServiceRequestDto,
  ) {
    return this.serviceRequests.advance(id, user.userId, dto);
  }
}
