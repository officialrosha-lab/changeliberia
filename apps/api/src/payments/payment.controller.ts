import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  RawBodyRequest,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentService, CreatePaymentIntentDto, CreateSubscriptionDto } from './payment.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  private stripe: InstanceType<typeof Stripe> | null;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: PaymentWebhookService,
  ) {
    const apiKey = process.env.STRIPE_API_KEY;
    this.stripe = apiKey ? new Stripe(apiKey, { apiVersion: '2024-11-20' as any }) : null;
  }

  /**
   * Create a payment intent for one-time donation
   */
  @UseGuards(JwtAuthGuard)
  @Post('intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    const intent = await this.paymentService.createPaymentIntent(dto);

    return {
      success: true,
      data: intent,
    };
  }

  /**
   * Confirm payment after client-side token generation
   */
  @UseGuards(JwtAuthGuard)
  @Post('confirm/:intentId')
  async confirmPayment(
    @Param('intentId') intentId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    const payment = await this.paymentService.confirmPayment(
      intentId,
      paymentMethodId,
    );

    return {
      success: true,
      data: payment,
    };
  }

  /**
   * Create a Stripe Checkout session
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckoutSession(@Body() dto: CreatePaymentIntentDto & { recurringInterval?: string }) {
    const session = await this.paymentService.createCheckoutSession(dto);

    return {
      success: true,
      data: session,
    };
  }

  /**
   * Get payment status
   */
  @UseGuards(JwtAuthGuard)
  @Get('status/:intentId')
  async getPaymentStatus(@Param('intentId') intentId: string) {
    const payment = await this.paymentService.getPaymentStatus(intentId);

    return {
      success: true,
      data: payment,
    };
  }

  /**
   * Create recurring subscription
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscription')
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    const subscription =
      await this.paymentService.createSubscription(dto);

    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Update subscription (amount)
   */
  @UseGuards(JwtAuthGuard)
  @Put('subscription/:subscriptionId')
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('amount') amount?: number,
  ) {
    const subscription = await this.paymentService.updateSubscription(
      subscriptionId,
      amount,
    );

    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Cancel subscription
   */
  @UseGuards(JwtAuthGuard)
  @Delete('subscription/:subscriptionId')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const subscription =
      await this.paymentService.cancelSubscription(subscriptionId);

    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Get user payment history
   */
  @UseGuards(JwtAuthGuard)
  @Get('history/:userId')
  async getUserPaymentHistory(@Param('userId') userId: string) {
    const history = await this.paymentService.getUserPaymentHistory(userId);

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Refund a payment
   */
  @UseGuards(JwtAuthGuard)
  @Post('refund/:paymentId')
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body('reason') reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }

    const refund = await this.paymentService.refundPayment(paymentId, reason);

    return {
      success: true,
      data: refund,
    };
  }

  /**
   * Handle Stripe webhook
   * Routes to PaymentWebhookService for signature verification,
   * deduplication, and event processing
   */
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // Delegate to webhook service for comprehensive webhook processing
    // - Verifies Stripe signature (HMAC-SHA256)
    // - Checks for duplicate events (prevents double-charging)
    // - Records webhook in database for audit trail
    // - Routes to event-specific handlers
    // - Returns 500 if Stripe should retry (on transient errors)
    await this.webhookService.processWebhook(req as any);

    return {
      success: true,
      received: true,
    };
  }
}
