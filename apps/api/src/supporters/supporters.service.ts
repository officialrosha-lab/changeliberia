import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportersService implements OnModuleInit {
  private cachedCount = 0;
  private readonly logger = new Logger(SupportersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      this.cachedCount = await this.prisma.supporter.count();
      this.logger.log(`Initialized supporter count: ${this.cachedCount}`);
    } catch (error) {
      this.logger.error('Failed to initialize supporter count from database:', error);
      // Start with 0 if database is unavailable during startup
      this.cachedCount = 0;
    }
  }

  async getCount() {
    try {
      // Periodically sync with database to ensure accuracy
      // This prevents cache drift if there are multiple API instances
      const dbCount = await this.prisma.supporter.count();
      if (dbCount !== this.cachedCount) {
        this.logger.warn(
          `Supporter count mismatch: cached=${this.cachedCount}, db=${dbCount}. Syncing...`,
        );
        this.cachedCount = dbCount;
      }
      return { count: this.cachedCount };
    } catch (error) {
      this.logger.error('Error fetching supporter count:', error);
      // Return cached value if database query fails
      return { count: this.cachedCount };
    }
  }

  async join(sessionId: string, ipAddress: string, userId?: string, source = 'navbar') {
    try {
      // Layer 1: sessionId deduplication (fast — unique index)
      const bySession = await this.prisma.supporter.findUnique({ where: { sessionId } });
      if (bySession) {
        this.logger.debug(`Duplicate join attempt by sessionId: ${sessionId}`);
        return { count: this.cachedCount, alreadyJoined: true };
      }

      // Layer 2: IP deduplication — prevents re-join after clearing localStorage,
      // incognito windows, or different browsers on the same device/network.
      if (ipAddress && ipAddress !== 'unknown') {
        const byIp = await this.prisma.supporter.findFirst({ where: { ipAddress } });
        if (byIp) {
          this.logger.debug(`Duplicate join attempt by IP: ${ipAddress}`);
          return { count: this.cachedCount, alreadyJoined: true };
        }
      }

      await this.prisma.supporter.create({
        data: { sessionId, userId: userId ?? null, source, ipAddress },
      });
      this.cachedCount++;
      this.logger.log(`New supporter joined via ${source}. Total count: ${this.cachedCount}`);
      return { count: this.cachedCount, alreadyJoined: false };
    } catch (error) {
      this.logger.error('Error creating supporter record:', error);
      throw error;
    }
  }

  async updateContact(sessionId: string, email?: string, phone?: string) {
    try {
      const supporter = await this.prisma.supporter.findUnique({ where: { sessionId } });
      if (!supporter) {
        this.logger.warn(`Supporter not found for sessionId: ${sessionId}`);
        return null;
      }
      return this.prisma.supporter.update({
        where: { sessionId },
        data: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    } catch (error) {
      this.logger.error('Error updating supporter contact:', error);
      throw error;
    }
  }
}
