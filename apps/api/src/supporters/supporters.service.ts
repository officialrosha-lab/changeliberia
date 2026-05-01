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

  async join(sessionId: string, userId?: string, source = 'navbar') {
    const existing = await this.prisma.supporter.findUnique({ where: { sessionId } });
    if (existing) return { count: this.cachedCount, alreadyJoined: true };

    await this.prisma.supporter.create({
      data: { sessionId, userId: userId ?? null, source },
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
