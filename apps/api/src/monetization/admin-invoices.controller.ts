import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { InvoicesService } from './invoices.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminInvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.invoices.listAll();
  }

  @Get(':id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  get(@Param('id') id: string) {
    return this.invoices.get(id);
  }

  @Post(':id/issue')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  issue(@Param('id') id: string) {
    return this.invoices.issue(id);
  }

  @Post(':id/mark-paid')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  markPaid(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.markPaid(id, user.userId);
  }

  @Post(':id/void')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  void(@Param('id') id: string) {
    return this.invoices.void(id);
  }
}
