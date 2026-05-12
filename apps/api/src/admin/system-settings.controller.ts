import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function mapSystemSettings(toggles: any[]) {
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

@Controller('settings')
export class SystemSettingsController {
  constructor(private prisma: PrismaService) {}

  @Get('system')
  async getSystemSettings() {
    const toggles = await this.prisma.featureToggle.findMany({
      where: { name: { not: { startsWith: 'moderator_scope_' } } },
    });
    return mapSystemSettings(toggles);
  }
}