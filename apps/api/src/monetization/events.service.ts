import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Event,
  EventRegistration,
  Prisma,
  PurchaseStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import { PaymentProvider } from '../payments/providers/payment-provider.interface';

export interface CreateEventDto {
  key: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  priceAmount?: number;
  currency?: string;
  capacity?: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  priceAmount?: number | null;
  currency?: string;
  capacity?: number | null;
  active?: boolean;
}

export interface RegisterForEventDto {
  successUrl?: string;
  cancelUrl?: string;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async listActiveEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { active: true, endsAt: { gt: new Date() } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async listAllEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({ orderBy: { startsAt: 'desc' } });
  }

  async createEvent(dto: CreateEventDto): Promise<Event> {
    const existing = await this.prisma.event.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Event "${dto.key}" already exists`);
    }
    return this.prisma.event.create({
      data: {
        key: dto.key,
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        location: dto.location,
        priceAmount:
          dto.priceAmount !== undefined
            ? new Prisma.Decimal(dto.priceAmount)
            : undefined,
        currency: dto.currency ?? 'USD',
        capacity: dto.capacity,
      },
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`Event not found: ${id}`);
    return this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        location: dto.location,
        priceAmount:
          dto.priceAmount === null
            ? null
            : dto.priceAmount !== undefined
              ? new Prisma.Decimal(dto.priceAmount)
              : undefined,
        currency: dto.currency,
        capacity: dto.capacity,
        active: dto.active,
      },
    });
  }

  async register(
    userId: string,
    eventKey: string,
    dto: RegisterForEventDto,
  ): Promise<{ checkoutUrl: string | null; registrationId: string }> {
    const event = await this.prisma.event.findUnique({
      where: { key: eventKey },
    });
    if (!event || !event.active) {
      throw new NotFoundException(`Event not found: ${eventKey}`);
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });
    if (existing && existing.status !== 'CANCELLED') {
      throw new ConflictException('You are already registered for this event');
    }

    if (event.capacity !== null) {
      const registeredCount = await this.prisma.eventRegistration.count({
        where: { eventId: event.id, status: 'REGISTERED' },
      });
      if (registeredCount >= event.capacity) {
        throw new ConflictException('This event is at capacity');
      }
    }

    const isFree = event.priceAmount === null;

    if (isFree) {
      const registration = await this.prisma.eventRegistration.upsert({
        where: { eventId_userId: { eventId: event.id, userId } },
        create: {
          eventId: event.id,
          userId,
          purchaseStatus: PurchaseStatus.COMPLETED,
        },
        update: {
          status: 'REGISTERED',
          purchaseStatus: PurchaseStatus.COMPLETED,
        },
      });
      this.activityLogger.logAsync({
        userId,
        action: 'EVENT_REGISTERED',
        entityType: 'EVENT_REGISTRATION',
        entityId: registration.id,
        description: `User registered for free event ${event.key}`,
      });
      return { checkoutUrl: null, registrationId: registration.id };
    }

    if (!dto.successUrl || !dto.cancelUrl) {
      throw new BadRequestException(
        'successUrl and cancelUrl are required to register for a paid event',
      );
    }

    const registrant = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!registrant?.email) {
      throw new BadRequestException(
        'An email address is required to register for a paid event',
      );
    }

    const registration = await this.prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId } },
      create: {
        eventId: event.id,
        userId,
        purchaseStatus: PurchaseStatus.PENDING,
      },
      update: { status: 'REGISTERED', purchaseStatus: PurchaseStatus.PENDING },
    });

    const provider = this.resolveProvider('STRIPE');
    let checkoutUrl: string | null;
    try {
      const session = await provider.createCheckoutSession({
        amount: Number(event.priceAmount),
        currency: event.currency,
        description: `Event registration — ${event.title}`,
        customerEmail: registrant.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        metadata: {
          eventRegistrationId: registration.id,
          userId,
          eventKey: event.key,
        },
      });
      checkoutUrl = session.url;
    } catch (error) {
      // A retry re-upserts this same row rather than needing a fresh one
      // (see the eventId_userId unique constraint), so unlike the other
      // one-time purchase flows this is a status reset, not a delete.
      await this.prisma.eventRegistration.update({
        where: { id: registration.id },
        data: { status: 'CANCELLED', purchaseStatus: PurchaseStatus.CANCELLED },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'EVENT_REGISTRATION_INITIATED',
      entityType: 'EVENT_REGISTRATION',
      entityId: registration.id,
      description: `User started checkout to register for event ${event.key}`,
    });

    return { checkoutUrl, registrationId: registration.id };
  }

  async cancelRegistration(
    userId: string,
    eventKey: string,
  ): Promise<EventRegistration> {
    const event = await this.prisma.event.findUnique({
      where: { key: eventKey },
    });
    if (!event) throw new NotFoundException(`Event not found: ${eventKey}`);
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });
    if (!registration || registration.status === 'CANCELLED') {
      throw new NotFoundException(
        'No active registration found for this event',
      );
    }
    return this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: 'CANCELLED' },
    });
  }

  async listMine(userId: string): Promise<EventRegistration[]> {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
