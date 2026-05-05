import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RolePermissionService } from './role-permission.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RbacController {
  constructor(private readonly rbac: RolePermissionService) {}

  @Get('roles')
  listRoles() {
    return this.rbac.listRoles();
  }

  @Get('users/:userId/roles')
  getUserRoles(@Param('userId') userId: string) {
    return this.rbac.getUserRoles(userId);
  }

  @Post('users/:userId/roles/:roleId')
  assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Body() body: { expiresAt?: string | null },
  ) {
    return this.rbac.assignRoleToUser(userId, roleId, body.expiresAt ? new Date(body.expiresAt) : undefined);
  }

  @Delete('users/:userId/roles/:roleId')
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbac.removeRoleFromUser(userId, roleId);
  }
}
