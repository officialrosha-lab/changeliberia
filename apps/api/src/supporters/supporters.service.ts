import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportersService implements OnModuleInit {
  private cachedCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.cachedCount = await this.prisma.supporter.count();
  }

  getCount() {
    return { count: this.cachedCount };
  }

  async join(sessionId: string, ipAddress: string, userId?: string, source = 'navbar') {
    // Layer 1: sessionId deduplication (fast — unique index)
    const bySession = await this.prisma.supporter.findUnique({ where: { sessionId } });
    if (bySession) return { count: this.cachedCount, alreadyJoined: true };

    // Layer 2: IP deduplication — prevents re-join after clearing localStorage,
    // incognito windows, or different browsers on the same device/network.
    if (ipAddress && ipAddress !== 'unknown') {
      const byIp = await this.prisma.supporter.findFirst({ where: { ipAddress } });
      if (byIp) return { count: this.cachedCount, alreadyJoined: true };
    }

    await this.prisma.supporter.create({
      data: { sessionId, userId: userId ?? null, source, ipAddress },
    });
    this.cachedCount++;
    return { count: this.cachedCount, alreadyJoined: false };
  }

  async updateContact(sessionId: string, email?: string, phone?: string) {
    const supporter = await this.prisma.supporter.findUnique({ where: { sessionId } });
    if (!supporter) return null;
    return this.prisma.supporter.update({
      where: { sessionId },
      data: {
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
    });
  }
}
