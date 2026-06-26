import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { MoMoWebhookService } from './momo-webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentController {
  private stripe: InstanceType<typeof Stripe> | null;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: PaymentWebhookService,
    private readonly momoWebhookService: MoMoWebhookService,
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
  async getUserPaymentHistory(@Param('userId') userId: string, @Req() req: Request & { user: { userId: string } }) {
    if (req.user.userId !== userId) throw new ForbiddenException('Cannot access another user\'s payment history');
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
   * Create a payment (unified endpoint for Stripe and MoMo)
   */
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPayment(@Body() dto: CreatePaymentIntentDto) {
    const result = await this.paymentService.createPayment(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Create recurring subscription (unified for Stripe and MoMo)
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscription/create')
  async createUnifiedSubscription(@Body() dto: CreateSubscriptionDto) {
    const subscription = await this.paymentService.createSubscription(dto);

    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Handle MTN MoMo webhook
   * Processes payment confirmations and subscription updates
   */
  @Post('momo/webhook')
  async handleMoMoWebhook(
    @Body() payload: any,
    @Req() req: Request,
  ) {
    // Extract signature from headers (case-insensitive)
    const signature = req.headers['x-momo-signature'] as string ||
                     req.headers['X-MOMO-SIGNATURE'] as string ||
                     req.headers['x-momo-signature'.toLowerCase()] as string;

    try {
      await this.momoWebhookService.handleWebhook(payload, signature);

      return {
        success: true,
        received: true,
      };
    } catch (error) {
      // Log error but return success to prevent MoMo retries
      // MoMo expects 200 OK even for processing errors
      console.error('MoMo webhook processing error:', error);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get MoMo account balance (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('momo/balance')
  async getMoMoBalance() {
    const balance = await this.paymentService.getMoMoBalance();

    return {
      success: true,
      data: balance,
    };
  }

  /**
   * Validate phone number format
   */
  @UseGuards(JwtAuthGuard)
  @Post('validate-phone')
  async validatePhoneNumber(@Body('phoneNumber') phoneNumber: string) {
    const isValid = await this.paymentService.validatePhoneNumber(phoneNumber);

    return {
      success: true,
      data: {
        valid: isValid,
        formatted: isValid ? await this.paymentService.formatPhoneNumber(phoneNumber) : null,
      },
    };
  }

  /**   * Handle Stripe webhook
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
