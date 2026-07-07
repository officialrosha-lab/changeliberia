import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole, PermissionResource, PermissionAction } from '@prisma/client';
import { OfficialsService } from './officials.service';
import { RejectOfficialDto } from './dto';

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

@Controller('admin/officials')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles(UserRole.ADMIN)
export class AdminOfficialsController {
  constructor(private readonly officialsService: OfficialsService) {}

  @Get('pending')
  @Permission(PermissionResource.OFFICIAL, PermissionAction.APPROVE)
  listPending() {
    return this.officialsService.listPending();
  }

  @Patch(':institutionId/approve')
  @Permission(PermissionResource.OFFICIAL, PermissionAction.APPROVE)
  approve(@Param('institutionId') institutionId: string, @CurrentUser() user: AuthUser) {
    return this.officialsService.approve(institutionId, user.userId);
  }

  @Patch(':institutionId/reject')
  @Permission(PermissionResource.OFFICIAL, PermissionAction.APPROVE)
  reject(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RejectOfficialDto,
  ) {
    return this.officialsService.reject(institutionId, user.userId, dto);
  }
}
