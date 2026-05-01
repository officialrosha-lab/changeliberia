import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async join(userId: string, role: 'supporter' | 'advocate' = 'supporter') {
    return this.prisma.membership.upsert({
      where: { userId },
      create: { userId, role },
      update: { role },
    });
  }

  async leave(userId: string) {
    return this.prisma.membership.delete({ where: { userId } }).catch(() => null);
  }

  async status(userId: string) {
    return this.prisma.membership.findUnique({ where: { userId } });
  }

  async count() {
    return this.prisma.membership.count();
  }
}
