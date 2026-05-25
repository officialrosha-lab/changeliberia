import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { PaymentService } from '../payments/payment.service';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/stripe')
export class StripeAdminController {
  private readonly logger = new Logger(StripeAdminController.name);
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly activityLogger: ActivityLoggerService,
  ) {
    const apiKey = process.env.STRIPE_API_KEY;
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2024-11-20' as any,
      });
    }
  }

  private getStripe(): InstanceType<typeof Stripe> {
    if (!this.stripe) {
      throw new InternalServerErrorException(
        'Stripe is not configured on this server.',
      );
    }
    return this.stripe;
  }

  /**
   * Get Stripe dashboard overview with key metrics
   */
  @Get('dashboard')
  async getDashboard() {
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalPayments, thisMonthPayments, activeSubscriptions, refunds] =
        await Promise.all([
          this.prisma.payment.findMany({
            where: { status: 'COMPLETED' as PaymentStatus },
          }),
          this.prisma.payment.findMany({
            where: {
              status: 'COMPLETED' as PaymentStatus,
              completedAt: { gte: monthAgo },
            },
          }),
          this.prisma.subscription.findMany({
            where: { status: 'ACTIVE' as SubscriptionStatus },
          }),
          this.prisma.refund.findMany({
            where: { createdAt: { gte: monthAgo } },
          }),
        ]);

      const totalRevenue = totalPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyRevenue = thisMonthPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const refundAmount = refunds.reduce((sum, r) => sum + r.amount, 0);

      return {
        totalRevenue,
        monthlyRevenue,
        refundAmount,
        activeSubscriptions: activeSubscriptions.length,
        totalPayments: totalPayments.length,
        refundCount: refunds.length,
        refundRate:
          totalPayments.length > 0
            ? (refunds.length / totalPayments.length) * 100
            : 0,
        averageOrderValue:
          totalPayments.length > 0 ? totalRevenue / totalPayments.length : 0,
        metrics: {
          payments: totalPayments.length,
          subscriptions: activeSubscriptions.length,
          refunds: refunds.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get stripe dashboard', error);
      throw new InternalServerErrorException('Failed to get dashboard metrics');
    }
  }

  /**
   * List all payments with optional filtering
   */
  @Get('payments')
  async listPayments(
    @Query('status') status?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const filters: any = {};
      if (status) filters.status = status;
      if (startDate || endDate) {
        filters.completedAt = {};
        if (startDate) filters.completedAt.gte = new Date(startDate);
        if (endDate) filters.completedAt.lte = new Date(endDate);
      }

      const payments = await this.prisma.payment.findMany({
        where: filters,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          petition: { select: { id: true, title: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });

      return payments;
    } catch (error) {
      this.logger.error('Failed to list payments', error);
      throw new InternalServerErrorException('Failed to list payments');
    }
  }

  /**
   * Get payment details
   */
  @Get('payments/:id')
  async getPaymentDetails(@Param('id') id: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          petition: { select: { id: true, title: true } },
        },
      });

      if (!payment) throw new NotFoundException('Payment not found');

      // Fetch Stripe details if available
      let stripeDetails: any = null;
      if (payment.stripePaymentIntentId && this.stripe) {
        try {
          stripeDetails = await this.getStripe().paymentIntents.retrieve(
            payment.stripePaymentIntentId,
          );
        } catch (e) {
          this.logger.warn('Could not fetch Stripe details for payment', e);
        }
      }

      return { ...payment, stripeDetails };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get payment details', error);
      throw new InternalServerErrorException('Failed to get payment details');
    }
  }

  /**
   * List all subscriptions
   */
  @Get('subscriptions')
  async listSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const filters = status ? { status } : {};

      const subscriptions = await this.prisma.subscription.findMany({
        where: filters,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          petition: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });

      return subscriptions;
    } catch (error) {
      this.logger.error('Failed to list subscriptions', error);
      throw new InternalServerErrorException('Failed to list subscriptions');
    }
  }

  /**
   * Get subscription details
   */
  @Get('subscriptions/:id')
  async getSubscriptionDetails(@Param('id') id: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          petition: { select: { id: true, title: true } },
        },
      });

      if (!subscription) throw new NotFoundException('Subscription not found');

      // Fetch Stripe subscription if available
      let stripeDetails: any = null;
      if (subscription.stripeSubscriptionId && this.stripe) {
        try {
          stripeDetails = await this.getStripe().subscriptions.retrieve(
            subscription.stripeSubscriptionId,
          );
        } catch (e) {
          this.logger.warn('Could not fetch Stripe details for subscription', e);
        }
      }

      return { ...subscription, stripeDetails };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get subscription details', error);
      throw new InternalServerErrorException(
        'Failed to get subscription details',
      );
    }
  }

  /**
   * Cancel a subscription
   */
  @Patch('subscriptions/:id/cancel')
  async cancelSubscription(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
      });

      if (!subscription) throw new NotFoundException('Subscription not found');

      if (subscription.stripeSubscriptionId && this.stripe) {
        try {
          await this.getStripe().subscriptions.cancel(
            subscription.stripeSubscriptionId,
          );
        } catch (e) {
          this.logger.warn('Could not cancel Stripe subscription', e);
        }
      }

      const updated = await this.prisma.subscription.update({
        where: { id },
        data: {
          status: 'CANCELED' as SubscriptionStatus,
          cancelledAt: new Date(),
        },
        include: { user: { select: { id: true, email: true } } },
      });

      this.activityLogger.logAsync({
        adminId: req.user.userId,
        action: 'CANCEL_SUBSCRIPTION',
        entityType: 'SUBSCRIPTION',
        entityId: id,
        description: `Cancelled subscription ${id}`,
        changes: { status: updated.status },
      });

      return { success: true, subscription: updated };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to cancel subscription', error);
      throw new InternalServerErrorException('Failed to cancel subscription');
    }
  }

  /**
   * List all refunds
   */
  @Get('refunds')
  async listRefunds(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const filters: any = {};
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const refunds = await this.prisma.refund.findMany({
        where: filters,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });

      return refunds;
    } catch (error) {
      this.logger.error('Failed to list refunds', error);
      throw new InternalServerErrorException('Failed to list refunds');
    }
  }

  /**
   * Create a refund for a payment
   */
  @Post('refunds')
  async createRefund(
    @Req() req: { user: RequestUser },
    @Body()
    dto: {
      paymentId: string;
      reason: string;
      amount?: number;
    },
  ) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: dto.paymentId },
      });

      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'COMPLETED') {
        throw new InternalServerErrorException(
          'Only completed payments can be refunded',
        );
      }

      const refundAmount = dto.amount || payment.amount;
      let stripeRefundId = '';

      if (payment.stripePaymentIntentId && this.stripe) {
        try {
          const stripeRefund = await this.getStripe().refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(refundAmount * 100),
            reason: dto.reason as any,
          });
          stripeRefundId = stripeRefund.id;
        } catch (e) {
          this.logger.warn('Could not create Stripe refund', e);
        }
      }

      const refund = await this.prisma.refund.create({
        data: {
          paymentId: dto.paymentId,
          amount: refundAmount,
          currency: payment.currency,
          reason: dto.reason,
          stripeRefundId,
          status: 'COMPLETED',
        },
      });

      this.activityLogger.logAsync({
        adminId: req.user.userId,
        action: 'CREATE_REFUND',
        entityType: 'REFUND',
        entityId: refund.id,
        description: `Created refund ${refund.id} for payment ${dto.paymentId}`,
        changes: {
          amount: refundAmount,
          reason: dto.reason,
        },
      });

      return { success: true, refund };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Failed to create refund', error);
      throw new InternalServerErrorException('Failed to create refund');
    }
  }

  /**
   * Get analytics: revenue trends and subscription metrics
   */
  @Get('analytics')
  async getAnalytics(
    @Query('days') days: string = '30',
    @Query('metric') metric?: 'revenue' | 'subscriptions' | 'refunds' | 'all',
  ) {
    try {
      const numDays = Math.min(parseInt(days), 365);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);

      const payments = await this.prisma.payment.findMany({
        where: {
          status: 'COMPLETED' as PaymentStatus,
          completedAt: { gte: startDate },
        },
        select: { amount: true, completedAt: true, currency: true },
        orderBy: { completedAt: 'asc' },
      });

      const subscriptions = await this.prisma.subscription.findMany({
        where: { createdAt: { gte: startDate } },
        select: { amount: true, interval: true, createdAt: true, status: true },
      });

      const refunds = await this.prisma.refund.findMany({
        where: { createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true },
      });

      // Group revenue by day
      const revenueByDay: Record<string, number> = {};
      payments.forEach((p) => {
        const day = new Date(p.completedAt || new Date())
          .toISOString()
          .split('T')[0];
        revenueByDay[day] = (revenueByDay[day] || 0) + p.amount;
      });

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const avgDailyRevenue = totalRevenue / numDays;
      const projectedMonthly = avgDailyRevenue * 30;

      return {
        summary: {
          totalRevenue,
          avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
          projectedMonthly: Math.round(projectedMonthly * 100) / 100,
          paymentCount: payments.length,
          subscriptionCount: subscriptions.length,
          refundCount: refunds.length,
        },
        revenueByDay,
        subscriptionsByInterval: subscriptions.reduce(
          (acc, s) => {
            acc[s.interval] = (acc[s.interval] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to get analytics', error);
      throw new InternalServerErrorException('Failed to get analytics');
    }
  }

  /**
   * Get webhook health status
   */
  @Get('webhooks/health')
  async getWebhookHealth() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const webhookEvents = await this.prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count
        FROM public."WebhookEvent"
        WHERE "createdAt" >= ${last24Hours}
        GROUP BY status
      `;

      return {
        lastChecked: now,
        status: 'healthy',
        events24h: webhookEvents,
      };
    } catch (error) {
      this.logger.error('Failed to get webhook health', error);
      throw new InternalServerErrorException('Failed to get webhook health');
    }
  }

  /**
   * Get customer payment history
   */
  @Get('customers/:userId')
  async getCustomerHistory(@Param('userId') userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      const [payments, subscriptions] = await Promise.all([
        this.prisma.payment.findMany({
          where: { userId },
          include: { petition: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.subscription.findMany({
          where: { userId },
          include: { petition: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        user: { id: user.id, fullName: user.fullName, email: user.email },
        payments,
        subscriptions,
        totalSpent: payments
          .filter((p) => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount, 0),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get customer history', error);
      throw new InternalServerErrorException('Failed to get customer history');
    }
  }
}
