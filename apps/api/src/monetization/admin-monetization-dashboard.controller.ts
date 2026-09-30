import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { FeatureFlagService } from '../admin/feature-flag.service';
import { MonetizationAggregatesService } from './monetization-aggregates.service';

const TRANSPARENCY_PAGE_FLAG = 'TRANSPARENCY_PAGE_ENABLED';

@Controller('admin/monetization')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminMonetizationDashboardController {
  constructor(
    private readonly aggregates: MonetizationAggregatesService,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  @Get('dashboard')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  getDashboard() {
    return this.aggregates.getSummary();
  }

  @Get('subscriptions')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listSubscriptions() {
    return this.aggregates.listAllSubscriptions();
  }

  @Get('transparency-settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  async getTransparencySettings() {
    return {
      enabled: await this.featureFlags.isEnabled(TRANSPARENCY_PAGE_FLAG),
    };
  }

  @Patch('transparency-settings')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  setTransparencySettings(@Body() body: { enabled: boolean }) {
    return this.featureFlags.setToggle(TRANSPARENCY_PAGE_FLAG, body.enabled);
  }
}
