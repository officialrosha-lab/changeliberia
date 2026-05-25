import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeatureToggle, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';

export function mapSystemSettings(toggles: FeatureToggle[]) {
  const byName = Object.fromEntries(toggles.map((t) => [t.name, t]));

  return {
    petitionApprovalThreshold: Number(byName['petitionApprovalThreshold']?.config ?? 10),
    autoApprovalSignatureThreshold: Number(byName['autoApprovalSignatureThreshold']?.config ?? 1000),
    routingDefaultPriority: byName['routingDefaultPriority']?.config ?? 'NORMAL',
    emailNotificationEnabled: byName['emailNotificationEnabled']?.enabled ?? true,
    fraudDetectionLevel: byName['fraudDetectionLevel']?.config ?? 'MEDIUM',
    maxSignaturesPerUser: Number(byName['maxSignaturesPerUser']?.config ?? 5),
    donationsEnabled: byName['donationsEnabled']?.enabled ?? true,
    platformDonationsEnabled: byName['platformDonationsEnabled']?.enabled ?? true,
    petitionDonationsEnabled: byName['petitionDonationsEnabled']?.enabled ?? true,
    phoneVerificationRequired: byName['phoneVerificationRequired']?.enabled ?? true,
  };
}

export interface SocialMediaSettings {
  facebook: {
    appId: string;
    appSecret: string;
    pixelId: string;
    apiVersion: string;
    accessToken: string;
  };
  whatsapp: {
    apiToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookToken: string;
  };
}

export function mapSocialMediaSettings(toggles: FeatureToggle[]) {
  const byName = Object.fromEntries(toggles.map((t) => [t.name, t]));

  return {
    facebook: {
      appId: byName['FACEBOOK_APP_ID']?.config ?? '',
      appSecret: byName['FACEBOOK_APP_SECRET']?.config ?? '',
      pixelId: byName['FACEBOOK_PIXEL_ID']?.config ?? '',
      apiVersion: byName['FACEBOOK_API_VERSION']?.config ?? '18.0',
      accessToken: byName['FACEBOOK_ACCESS_TOKEN']?.config ?? '',
    },
    whatsapp: {
      apiToken: byName['WHATSAPP_API_TOKEN']?.config ?? '',
      phoneNumberId: byName['WHATSAPP_PHONE_NUMBER_ID']?.config ?? '',
      businessAccountId: byName['WHATSAPP_BUSINESS_ACCOUNT_ID']?.config ?? '',
      webhookToken: byName['WHATSAPP_WEBHOOK_TOKEN']?.config ?? '',
    },
  } as SocialMediaSettings;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  // ── Moderator Scopes ──────────────────────────────────────────────────────

  @Get('moderator-scopes')
  async getModeratorScopes() {
    const moderatorRole = await this.prisma.role.findFirst({ where: { name: 'MODERATOR' } });
    if (!moderatorRole) return [];

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        roleId: moderatorRole.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        userId: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    const scopeToggles = await this.prisma.featureToggle.findMany({
      where: { name: { startsWith: 'moderator_scope_' } },
    });
    const scopeMap = Object.fromEntries(
      scopeToggles.map((t) => [t.name, t.config ? (JSON.parse(t.config) as string[]) : []]),
    );

    return assignments.map((a) => ({
      moderatorId: a.user.id,
      moderatorName: a.user.fullName ?? a.user.email ?? a.user.id,
      allowedCategories: scopeMap[`moderator_scope_${a.user.id}`] ?? [],
    }));
  }

  @Post('moderator-scopes/:userId')
  async saveModeratorScope(
    @Req() req: { user: RequestUser },
    @Param('userId') userId: string,
    @Body() body: { allowedCategories?: string[]; categories?: string[] },
  ) {
    const categories = body.allowedCategories ?? body.categories ?? [];
    await this.prisma.featureToggle.upsert({
      where: { name: `moderator_scope_${userId}` },
      create: {
        name: `moderator_scope_${userId}`,
        enabled: true,
        config: JSON.stringify(categories),
      },
      update: { config: JSON.stringify(categories) },
    });

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'UPDATE_MODERATOR_SCOPE',
      entityType: 'MODERATOR_SCOPE',
      entityId: userId,
      description: `Updated moderator scope for user ${userId}`,
      changes: { categories },
    });

    return { success: true };
  }

  // ── Permission Templates (custom roles) ───────────────────────────────────

  @Get('permission-templates')
  getPermissionTemplates() {
    return this.prisma.role.findMany({
      where: { isSystem: false },
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('permission-templates')
  async createPermissionTemplate(
    @Req() req: { user: RequestUser },
    @Body() body: { name: string; description?: string },
  ) {
    const role = await this.prisma.role.create({
      data: { name: body.name, description: body.description, isSystem: false },
    });

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'CREATE_PERMISSION_TEMPLATE',
      entityType: 'ROLE',
      entityId: role.id,
      description: `Created permission template ${role.name}`,
      changes: { description: role.description },
    });

    return role;
  }

  @Delete('permission-templates/:id')
  async deletePermissionTemplate(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.userRoleAssignment.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'DELETE_PERMISSION_TEMPLATE',
      entityType: 'ROLE',
      entityId: id,
      description: `Deleted permission template ${id}`,
    });

    return { success: true };
  }

  // ── System Settings (FeatureToggle key-value store) ───────────────────────

  @Get('social-media')
  async getSocialMediaSettings() {
    const toggles = await this.prisma.featureToggle.findMany({
      where: {
        name: {
          in: [
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET',
            'FACEBOOK_PIXEL_ID',
            'FACEBOOK_API_VERSION',
            'FACEBOOK_ACCESS_TOKEN',
            'WHATSAPP_API_TOKEN',
            'WHATSAPP_PHONE_NUMBER_ID',
            'WHATSAPP_BUSINESS_ACCOUNT_ID',
            'WHATSAPP_WEBHOOK_TOKEN',
          ],
        },
      },
    });
    return mapSocialMediaSettings(toggles);
  }

  @Patch('social-media')
  async saveSocialMediaSettings(
    @Req() req: { user: RequestUser },
    @Body() body: Partial<SocialMediaSettings>,
  ) {
    const values: Record<string, string | undefined> = {
      FACEBOOK_APP_ID: body.facebook?.appId,
      FACEBOOK_APP_SECRET: body.facebook?.appSecret,
      FACEBOOK_PIXEL_ID: body.facebook?.pixelId,
      FACEBOOK_API_VERSION: body.facebook?.apiVersion,
      FACEBOOK_ACCESS_TOKEN: body.facebook?.accessToken,
      WHATSAPP_API_TOKEN: body.whatsapp?.apiToken,
      WHATSAPP_PHONE_NUMBER_ID: body.whatsapp?.phoneNumberId,
      WHATSAPP_BUSINESS_ACCOUNT_ID: body.whatsapp?.businessAccountId,
      WHATSAPP_WEBHOOK_TOKEN: body.whatsapp?.webhookToken,
    };

    await Promise.all(
      Object.entries(values)
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) =>
          this.prisma.featureToggle.upsert({
            where: { name },
            create: { name, enabled: true, config: String(value) },
            update: { enabled: true, config: String(value) },
          }),
        ),
    );

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'UPDATE_SOCIAL_MEDIA_SETTINGS',
      entityType: 'SOCIAL_MEDIA_SETTINGS',
      description: 'Updated social media configuration',
      changes: body,
    });

    return { success: true };
  }

  @Get('system')
  async getSystemSettings() {
    const toggles = await this.prisma.featureToggle.findMany({
      where: { name: { not: { startsWith: 'moderator_scope_' } } },
    });
    return mapSystemSettings(toggles);
  }

  @Patch('system')
  async saveSystemSettings(
    @Req() req: { user: RequestUser },
    @Body() body: Record<string, boolean | string | number>,
  ) {
    await Promise.all(
      Object.entries(body).map(([name, value]) => {
        const isBoolean = typeof value === 'boolean';
        return this.prisma.featureToggle.upsert({
          where: { name },
          create: { name, enabled: isBoolean ? value : true, config: isBoolean ? undefined : String(value) },
          update: { enabled: isBoolean ? value : true, config: isBoolean ? undefined : String(value) },
        });
      }),
    );

    this.activityLogger.logAsync({
      adminId: req.user.userId,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'SYSTEM_SETTINGS',
      description: `Updated system settings`,
      changes: { settings: body },
    });

    return { success: true };
  }
}
