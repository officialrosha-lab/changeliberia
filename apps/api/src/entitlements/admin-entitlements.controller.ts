import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import {
  CreateEntitlementDto,
  EntitlementsService,
  GrantEntitlementDto,
} from './entitlements.service';

@Controller('admin/entitlements')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminEntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get()
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.READ)
  listEntitlements() {
    return this.entitlements.listEntitlements();
  }

  @Post()
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.CREATE)
  createEntitlement(@Body() dto: CreateEntitlementDto) {
    return this.entitlements.createEntitlement(dto);
  }

  @Post('grants')
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.UPDATE)
  grant(
    @Body()
    body: Omit<GrantEntitlementDto, 'expiresAt'> & { expiresAt?: string },
  ) {
    return this.entitlements.grant({
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Delete('grants/:grantId')
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.DELETE)
  revoke(@Param('grantId') grantId: string) {
    return this.entitlements.revoke(grantId);
  }

  @Get('users/:userId/grants')
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.READ)
  listUserGrants(@Param('userId') userId: string) {
    return this.entitlements.listGrantsForActor({ userId });
  }

  @Get('institutions/:institutionId/grants')
  @Permission(PermissionResource.ENTITLEMENT, PermissionAction.READ)
  listInstitutionGrants(@Param('institutionId') institutionId: string) {
    return this.entitlements.listGrantsForActor({ institutionId });
  }
}
