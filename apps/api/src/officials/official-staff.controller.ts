import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { OfficialOwnershipGuard, OfficialAccess } from './guards/official-ownership.guard';
import { OfficialsService } from './officials.service';
import { OfficialStaffService } from './official-staff.service';
import { InviteStaffDto, UpdateStaffPermissionsDto } from './dto';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface OfficialRequest {
  officialAccess?: OfficialAccess;
  officialInstitution?: { id: string };
}

/**
 * Public Officials Portal — delegated office staff management ("leftover
 * work"). Invite/list/update/revoke are officeholder-only (enforced in
 * OfficialStaffService, not just the guard, since staff must never be able
 * to manage other staff regardless of their own permission flags).
 */
@Controller('officials/staff')
export class OfficialStaffController {
  constructor(
    private readonly officialsService: OfficialsService,
    private readonly staffService: OfficialStaffService,
  ) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async invite(@CurrentUser() user: AuthUser, @Req() req: OfficialRequest, @Body() dto: InviteStaffDto) {
    return this.staffService.invite(req.officialInstitution!.id, user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async list(@Req() req: OfficialRequest) {
    return this.staffService.list(req.officialInstitution!.id);
  }

  @Patch(':staffId')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async updatePermissions(
    @CurrentUser() user: AuthUser,
    @Req() req: OfficialRequest,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffPermissionsDto,
  ) {
    return this.staffService.updatePermissions(req.officialInstitution!.id, user.userId, staffId, dto);
  }

  @Post(':staffId/revoke')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async revoke(@CurrentUser() user: AuthUser, @Req() req: OfficialRequest, @Param('staffId') staffId: string) {
    return this.staffService.revoke(req.officialInstitution!.id, user.userId, staffId);
  }

  @Get('invites/mine')
  @UseGuards(JwtAuthGuard)
  async myInvites(@CurrentUser() user: AuthUser) {
    return this.staffService.listMyInvites(user.userId);
  }

  @Post('invites/:staffId/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@CurrentUser() user: AuthUser, @Param('staffId') staffId: string) {
    return this.staffService.acceptInvite(user.userId, staffId);
  }
}
