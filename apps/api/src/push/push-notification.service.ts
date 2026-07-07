import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly configured: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? 'mailto:support@changelib.org';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
      this.logger.log('Web push VAPID keys configured');
    } else {
      this.configured = false;
      this.logger.warn('VAPID keys not set — push notifications will be logged only');
    }
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  async subscribe(userId: string | undefined, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId: userId ?? null, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      create: {
        userId: userId ?? null,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  /** Sends to every subscription owned by a specific user (e.g. petition followers). */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(subs.map((sub) => this.sendToSubscription(sub, payload)));
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
    await Promise.all(subs.map((sub) => this.sendToSubscription(sub, payload)));
  }

  private async sendToSubscription(
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: PushPayload,
  ): Promise<void> {
    if (!this.configured) {
      this.logger.log(`[PUSH CONSOLE] To: ${sub.endpoint.slice(-16)} | ${payload.title}: ${payload.body}`);
      return;
    }

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      // 404/410 = subscription expired or the user revoked permission — clean up
      if (e.statusCode === 404 || e.statusCode === 410) {
        await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        this.logger.warn(`Push delivery failed for subscription ${sub.id}: ${e.statusCode ?? 'unknown'}`);
      }
    }
  }
}
