import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { Payment, Subscription } from '@prisma/client';
import * as crypto from 'crypto';

export interface MoMoPaymentResponse {
  referenceId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  expiresAt: Date;
  transactionId?: string;
}

export interface MoMoPreApprovalResponse {
  preapprovalId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiresAt: Date;
}

export interface MoMoPhoneAccount {
  phoneNumber: string;
  displayPhone: string;
  verified: boolean;
}

@Injectable()
export class MoMoService {
  private apiClient: AxiosInstance | null = null;
  private readonly logger = new Logger(MoMoService.name);
  private readonly API_USER = process.env.MOMO_API_USER || '';
  private readonly API_KEY = process.env.MOMO_API_KEY || '';
  private readonly BASE_URL = process.env.MOMO_API_HOST
    ? `https://${process.env.MOMO_API_HOST}/collection`
    : 'https://sandbox.momodeveloper.mtn.com/collection';
  private readonly ENVIRONMENT = process.env.MOMO_TARGET_ENVIRONMENT || 'sandbox';
  private readonly CURRENCY = process.env.MOMO_CURRENCY || 'XOF';
  private readonly COUNTRY = process.env.MOMO_COUNTRY || 'LR';
  private readonly POLLING_INTERVAL = parseInt(process.env.MOMO_POLLING_INTERVAL || '2000');
  private readonly POLLING_MAX_RETRIES = parseInt(process.env.MOMO_POLLING_MAX_RETRIES || '30');
  private readonly WEBHOOK_URL = process.env.MOMO_WEBHOOK_URL || '';

  constructor(private readonly prisma: PrismaService) {
    this.initializeApiClient();
  }

  /**
   * Initialize API client with proper headers
   */
  private initializeApiClient(): void {
    if (!this.API_USER || !this.API_KEY) {
      this.logger.warn('MoMo credentials not configured — MoMo payments disabled');
      return;
    }

    const basicAuth = Buffer.from(`${this.API_USER}:${this.API_KEY}`).toString('base64');

    this.apiClient = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'X-Target-Environment': this.ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': this.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    this.logger.debug(`MoMo API client initialized for ${this.ENVIRONMENT} environment`);
  }

  /**
   * Check if MoMo service is available
   */
  isAvailable(): boolean {
    return !!this.apiClient && !!this.API_USER && !!this.API_KEY;
  }

  /**
   * Normalize phone number to standard format (231xxxxxxxxx)
   * Accepts: 0771234567, +231771234567, 231771234567
   * Returns: 231771234567
   */
  normalizePhoneNumber(input: string): string {
    if (!input) {
      throw new BadRequestException('Phone number is required');
    }

    let normalized = input.trim().replace(/\D/g, ''); // Remove non-digits

    // Handle different formats
    if (normalized.startsWith('0')) {
      // Local format: 0771234567 → 231771234567
      normalized = '231' + normalized.substring(1);
    } else if (normalized.length === 9) {
      // Short format: 771234567 → 231771234567
      normalized = '231' + normalized;
    } else if (!normalized.startsWith('231') && normalized.length === 12) {
      // Assume country code prefix (but not 231)
      throw new BadRequestException(
        `Invalid country code. Expected Liberia (+231), got +${normalized.substring(0, 3)}`
      );
    }

    // Validate final format: must be 231XXXXXXXXX (12 digits)
    if (!/^231\d{9}$/.test(normalized)) {
      throw new BadRequestException(
        `Invalid phone number format. Expected format: +231XXXXXXXXX or 0XXXXXXXXX`
      );
    }

    return normalized;
  }

  /**
   * Format phone for display: 231771234567 → +231 77 123 4567
   */
  formatPhoneForDisplay(normalizedPhone: string): string {
    return `+${normalizedPhone.substring(0, 3)} ${normalizedPhone.substring(3, 5)} ${normalizedPhone.substring(5, 8)} ${normalizedPhone.substring(8)}`;
  }

  /**
   * Generate idempotency key to prevent duplicate charges
   * Format: userId-paymentId-timestamp
   */
  generateIdempotencyKey(userId: string | undefined, paymentId: string): string {
    const timestamp = Date.now();
    const data = `${userId || 'anonymous'}-${paymentId}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Request payment from user (one-time payment)
   * MoMo will send user a USSD prompt or initiate payment
   */
  async requestToPay(params: {
    amount: number;
    currency: string;
    phoneNumber: string;
    externalId: string; // Idempotency key
    description?: string;
    userId?: string;
    paymentId: string;
  }): Promise<MoMoPaymentResponse> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    const normalizedPhone = this.normalizePhoneNumber(params.phoneNumber);

    // Check for duplicate payment (idempotency)
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        momoExternalId: params.externalId,
        paymentMethod: 'MOBILE_MONEY',
      },
    });

    if (existingPayment) {
      this.logger.debug(`Returning existing payment for idempotency key: ${params.externalId}`);
      return {
        referenceId: existingPayment.id,
        status: existingPayment.momoStatus as any,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min default
        transactionId: existingPayment.momoTransactionId || undefined,
      };
    }

    try {
      const requestPayload = {
        amount: params.amount.toString(),
        currency: params.currency,
        externalId: params.externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: normalizedPhone,
        },
        payerMessage: 'Payment for Change Liberia',
        payeeNote: params.description || 'Donation to Change Liberia',
      };

      this.logger.debug(`Initiating MoMo payment: ${JSON.stringify(requestPayload)}`);

      const response = await this.apiClient.post('/v1_0/requesttopay', requestPayload, {
        headers: {
          'X-Reference-Id': params.externalId,
          'X-Callback-Url': this.WEBHOOK_URL,
        },
      });

      // Success response is 202 Accepted with no body
      // We return the referenceId that was sent in header
      return {
        referenceId: params.externalId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };
    } catch (error) {
      this.logger.error(
        `MoMo requestToPay failed: ${(error as Error).message}`,
        (error as any).response?.data
      );
      throw this.parseError(error);
    }
  }

  /**
   * Check payment status by polling MoMo API
   */
  async getTransactionStatus(
    referenceId: string,
    maxRetries: number = this.POLLING_MAX_RETRIES
  ): Promise<{
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'TIMEOUT';
    transactionId?: string;
    failureReason?: string;
  }> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    let retries = 0;
    const startTime = Date.now();

    while (retries < maxRetries) {
      try {
        const response = await this.apiClient.get(
          `/v1_0/requesttopay/${referenceId}`,
          {
            headers: {
              'X-Reference-Id': referenceId,
            },
          }
        );

        const { status, financialTransactionId, reason } = response.data;

        if (status === 'SUCCESSFUL') {
          return {
            status: 'SUCCESSFUL',
            transactionId: financialTransactionId,
          };
        } else if (status === 'FAILED') {
          return {
            status: 'FAILED',
            failureReason: reason || 'Payment declined by user',
          };
        }

        // Still pending, wait and retry
        retries++;
        if (retries < maxRetries) {
          await this.sleep(this.POLLING_INTERVAL);
        }
      } catch (error) {
        // 404 means transaction not found yet (still pending)
        if ((error as any).response?.status === 404) {
          retries++;
          if (retries < maxRetries) {
            await this.sleep(this.POLLING_INTERVAL);
          }
        } else {
          this.logger.error(`Error checking transaction status: ${(error as Error).message}`);
          throw this.parseError(error);
        }
      }
    }

    return {
      status: 'TIMEOUT',
      failureReason: `Payment not confirmed within ${maxRetries * (this.POLLING_INTERVAL / 1000)} seconds`,
    };
  }

  /**
   * Get merchant account balance
   */
  async getAccountBalance(): Promise<{ balance: number; currency: string }> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    try {
      const response = await this.apiClient.get('/v1_0/account/balance', {
        headers: {
          'X-Target-Environment': this.ENVIRONMENT,
        },
      });

      return {
        balance: parseFloat(response.data.availableBalance),
        currency: response.data.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to get account balance: ${(error as Error).message}`);
      throw this.parseError(error);
    }
  }

  /**
   * Create pre-approval for subscriptions
   * User authorizes once, we charge periodically
   */
  async createPreApproval(params: {
    phoneNumber: string;
    maxAmount: number;
    validityTimeInSeconds: number; // How long pre-approval is valid
    externalId: string;
    description?: string;
  }): Promise<MoMoPreApprovalResponse> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    const normalizedPhone = this.normalizePhoneNumber(params.phoneNumber);

    try {
      const requestPayload = {
        payer: {
          partyIdType: 'MSISDN',
          partyId: normalizedPhone,
        },
        payerCurrency: this.CURRENCY,
        payerMessage: 'Subscribe to Change Liberia',
        validityTime: params.validityTimeInSeconds,
      };

      const response = await this.apiClient.post('/v2_0/preapproval', requestPayload, {
        headers: {
          'X-Reference-Id': params.externalId,
          'X-Callback-Url': this.WEBHOOK_URL,
        },
      });

      // Response is 202 Accepted
      return {
        preapprovalId: params.externalId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + params.validityTimeInSeconds * 1000),
      };
    } catch (error) {
      this.logger.error(`Pre-approval creation failed: ${(error as Error).message}`);
      throw this.parseError(error);
    }
  }

  /**
   * Check pre-approval status
   */
  async getPreApprovalStatus(
    preapprovalId: string
  ): Promise<{
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMEOUT';
  }> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    try {
      const response = await this.apiClient.get(
        `/v2_0/preapproval/${preapprovalId}`
      );

      return {
        status: response.data.status || 'PENDING',
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return { status: 'PENDING' };
      }
      this.logger.error(`Error checking pre-approval status: ${(error as Error).message}`);
      throw this.parseError(error);
    }
  }

  /**
   * Execute pre-approved payment (charge subscriber)
   * Call this for recurring subscription charges
   */
  async executePreApprovedPayment(params: {
    preapprovalId: string;
    amount: number;
    currency: string;
    externalId: string; // Idempotency key for this charge
    description?: string;
  }): Promise<{ referenceId: string; status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' }> {
    if (!this.apiClient) {
      throw new BadRequestException('MoMo payment service is not configured');
    }

    try {
      const requestPayload = {
        amount: params.amount.toString(),
        currency: params.currency,
        externalId: params.externalId,
        preapprovalId: params.preapprovalId,
        payerMessage: params.description || 'Subscription charge',
      };

      const response = await this.apiClient.post(
        '/v2_0/payment',
        requestPayload,
        {
          headers: {
            'X-Reference-Id': params.externalId,
          },
        }
      );

      return {
        referenceId: params.externalId,
        status: 'PENDING', // Will receive webhook update
      };
    } catch (error) {
      this.logger.error(`Pre-approved payment execution failed: ${(error as Error).message}`);
      throw this.parseError(error);
    }
  }

  /**
   * Helper: Sleep utility for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse MoMo API errors to user-friendly messages
   */
  private parseError(error: any): Error {
    const status = error?.response?.status;
    const data = error?.response?.data;

    const errorMap: Record<number, string> = {
      400: 'Invalid request parameters',
      401: 'Authentication failed - check API credentials',
      403: 'Access forbidden',
      404: 'Resource not found',
      409: 'Conflict - possibly duplicate request',
      500: 'MoMo service error',
      502: 'MoMo service temporarily unavailable',
      503: 'MoMo service maintenance',
    };

    const message = errorMap[status] || data?.message || (error as Error)?.message || 'Unknown MoMo error';
    return new BadRequestException(message);
  }

  /**
   * Validate phone number format without normalization (for form validation)
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    try {
      this.normalizePhoneNumber(phoneNumber);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate webhook signature for verification
   */
  generateWebhookSignature(payload: any, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}