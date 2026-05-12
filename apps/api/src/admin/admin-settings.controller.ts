import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FeatureToggle, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

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
  createPermissionTemplate(@Body() body: { name: string; description?: string }) {
    return this.prisma.role.create({
      data: { name: body.name, description: body.description, isSystem: false },
    });
  }

  @Delete('permission-templates/:id')
  async deletePermissionTemplate(@Param('id') id: string) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.userRoleAssignment.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  // ── System Settings (FeatureToggle key-value store) ───────────────────────

  @Get('system')
  async getSystemSettings() {
    const toggles = await this.prisma.featureToggle.findMany({
      where: { name: { not: { startsWith: 'moderator_scope_' } } },
    });
    return mapSystemSettings(toggles);
  }

  @Patch('system')
  async saveSystemSettings(@Body() body: Record<string, boolean | string | number>) {
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
    return { success: true };
  }
}
