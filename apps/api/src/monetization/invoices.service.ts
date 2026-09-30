import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';

export interface InvoiceLineItemDto {
  description: string;
  quantity?: number;
  unitAmount: number;
}

export interface CreateDraftInvoiceDto {
  userId?: string;
  organizationId?: string;
  institutionId?: string;
  serviceRequestId?: string;
  currency?: string;
  dueAt?: Date;
  notes?: string;
  lineItems: InvoiceLineItemDto[];
}

/**
 * The platform's first real invoice model — see the schema comment on
 * Invoice for why generation is scoped to Studio service-request billing
 * this milestone rather than every purchase type.
 */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private async nextInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  async createDraft(dto: CreateDraftInvoiceDto): Promise<Invoice> {
    if (dto.lineItems.length === 0) {
      throw new BadRequestException('An invoice needs at least one line item');
    }
    const lineItems = dto.lineItems.map((item) => {
      const quantity = item.quantity ?? 1;
      return {
        description: item.description,
        quantity,
        unitAmount: new Prisma.Decimal(item.unitAmount),
        totalAmount: new Prisma.Decimal(item.unitAmount * quantity),
      };
    });
    const totalAmount = lineItems.reduce(
      (sum, item) => sum.add(item.totalAmount),
      new Prisma.Decimal(0),
    );

    return this.prisma.invoice.create({
      data: {
        number: await this.nextInvoiceNumber(),
        status: InvoiceStatus.DRAFT,
        userId: dto.userId,
        organizationId: dto.organizationId,
        institutionId: dto.institutionId,
        serviceRequestId: dto.serviceRequestId,
        currency: dto.currency ?? 'USD',
        totalAmount,
        dueAt: dto.dueAt,
        notes: dto.notes,
        lineItems: { create: lineItems },
      },
      include: { lineItems: true },
    });
  }

  async issue(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice not found: ${id}`);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only a draft invoice can be issued');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.ISSUED, issuedAt: new Date() },
    });
  }

  async markPaid(id: string, actorUserId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice not found: ${id}`);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException(
        'Only an issued invoice can be marked paid',
      );
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    });
    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'INVOICE_MARKED_PAID',
      entityType: 'INVOICE',
      entityId: invoice.id,
      description: `Invoice ${invoice.number} marked paid`,
    });
    return updated;
  }

  async void(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice not found: ${id}`);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('A paid invoice cannot be voided');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
    });
  }

  async get(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice not found: ${id}`);
    return invoice;
  }

  async listAll(): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listForOrganization(organizationId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForInstitution(institutionId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForUser(userId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
