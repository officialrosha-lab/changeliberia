import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as ipaddr from 'ipaddr.js';

@Injectable()
export class SessionFingerprintService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a session fingerprint from IP address and user-agent
   * Returns a hash of IP + user-agent combination
   */
  generateFingerprint(ipAddress: string, userAgent: string): string {
    const ipHash = this.hashIP(ipAddress);
    const combined = `${ipHash}:${userAgent}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Hash an IP address to protect privacy
   * Converts IP to hash while handling both IPv4 and IPv6
   */
  private hashIP(ipAddress: string): string {
    try {
      // If it's a private IP, still hash it but note it's private
      const hash = crypto.createHash('sha256').update(ipAddress).digest('hex');
      return hash.substring(0, 16);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if a fingerprint has exceeded rate limit
   * Current limit: 10 votes per fingerprint per hour
   */
  async isRateLimited(fingerprint: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentVotes = await this.prisma.pollVote.count({
      where: {
        fingerprint,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    return recentVotes >= 10;
  }

  /**
   * Record or update a session fingerprint
   */
  async recordFingerprint(
    fingerprint: string,
    ipHash: string,
    userAgent: string,
  ) {
    return this.prisma.sessionFingerprint.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        ipHash,
        userAgent,
        voteCount: 1,
      },
      update: {
        voteCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Flag a fingerprint as suspected spam
   */
  async flagFingerprint(fingerprint: string) {
    return this.prisma.sessionFingerprint.update({
      where: { fingerprint },
      data: { flagged: true },
    });
  }

  /**
   * Get statistics for a fingerprint
   */
  async getFingerprintStats(fingerprint: string) {
    return this.prisma.sessionFingerprint.findUnique({
      where: { fingerprint },
    });
  }

  /**
   * Extract real IP from request (handles proxies)
   */
  extractRealIP(request: any): string {
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      '0.0.0.0';

    return ip.trim();
  }

  /**
   * Get user agent from request
   */
  extractUserAgent(request: any): string {
    return request.headers['user-agent'] || 'unknown';
  }
}
