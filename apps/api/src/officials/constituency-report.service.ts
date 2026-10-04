import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ConstituencyReportPeriod,
  ConstituencyReportStatus,
  Institution,
  OfficialVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { EmailService } from '../email/services/email.service';
import { EmailType } from '@prisma/client';
import { ConstituencyReportGeneratorService } from './constituency-report-generator.service';
import { ConstituencyReportStorageService } from './constituency-report-storage.service';

const PERIOD_LABELS: Record<ConstituencyReportPeriod, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

/** Start of the period ending "now", per cadence. */
function periodStartFor(period: ConstituencyReportPeriod, end: Date): Date {
  const start = new Date(end);
  switch (period) {
    case ConstituencyReportPeriod.WEEKLY:
      start.setDate(start.getDate() - 7);
      break;
    case ConstituencyReportPeriod.MONTHLY:
      start.setMonth(start.getMonth() - 1);
      break;
    case ConstituencyReportPeriod.QUARTERLY:
      start.setMonth(start.getMonth() - 3);
      break;
    case ConstituencyReportPeriod.ANNUAL:
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return start;
}

/**
 * Orchestrates the constituency report pipeline: enqueueing, preference
 * management, listing, and ownership-checked file retrieval. Actual
 * generation/delivery happens in `ConstituencyReportScheduler`, which calls
 * `processNextQueuedReport` — this mirrors `FraudService`'s
 * enqueue/processNextQueuedJob split.
 */
@Injectable()
export class ConstituencyReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: ConstituencyReportGeneratorService,
    private readonly storage: ConstituencyReportStorageService,
    private readonly emailService: EmailService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async getPreference(institutionId: string) {
    const existing = await this.prisma.constituencyReportPreference.findUnique({
      where: { institutionId },
    });
    if (existing) return existing;
    // Defaults mirror the schema's column defaults — a preference row only
    // materializes on first read/write, so verified officials who never
    // touch this settings panel still get the documented default cadence.
    return {
      id: null,
      institutionId,
      weeklyEnabled: false,
      monthlyEnabled: true,
      quarterlyEnabled: false,
      annualEnabled: false,
      updatedAt: null,
      updatedByUserId: null,
    };
  }

  async upsertPreference(
    institutionId: string,
    updatedByUserId: string,
    data: {
      weeklyEnabled?: boolean;
      monthlyEnabled?: boolean;
      quarterlyEnabled?: boolean;
      annualEnabled?: boolean;
    },
  ) {
    return this.prisma.constituencyReportPreference.upsert({
      where: { institutionId },
      create: { institutionId, ...data, updatedByUserId },
      update: { ...data, updatedByUserId },
    });
  }

  async listReports(institutionId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.constituencyReport.findMany({
        where: { institutionId },
        include: { files: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.constituencyReport.count({ where: { institutionId } }),
    ]);
    return {
      data,
      pagination: {
        page: Math.max(page, 1),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async enqueueOnDemandReport(
    institution: Institution,
    period: ConstituencyReportPeriod,
  ) {
    const periodEnd = new Date();
    const periodStart = periodStartFor(period, periodEnd);
    return this.prisma.constituencyReport.create({
      data: {
        institutionId: institution.id,
        period,
        periodStart,
        periodEnd,
        status: ConstituencyReportStatus.QUEUED,
      },
    });
  }

  /**
   * Ownership-checked file lookup: only returns a path belonging to a
   * report on the caller's own institution, and only once the report
   * completed successfully.
   */
  async getReportFile(
    institutionId: string,
    reportId: string,
    format: 'PDF' | 'CSV',
  ) {
    const report = await this.prisma.constituencyReport.findFirst({
      where: { id: reportId, institutionId },
      include: { files: { where: { format } } },
    });
    if (!report || report.status !== ConstituencyReportStatus.COMPLETED) {
      throw new NotFoundException('Report not found');
    }
    const file = report.files[0];
    if (!file) throw new NotFoundException('Report file not found');
    const key = this.storage.safeKey(file.filePath.split('/').pop() as string);
    if (!key) throw new NotFoundException('Report file not found');
    return key;
  }

  /**
   * Same ownership check as getReportFile, but looked up by the stored
   * filename instead of a reportId+format pair — used by the
   * CONSTITUENCY_REPORT_READY email's direct download link.
   */
  async getReportFileByFilename(institutionId: string, filename: string) {
    const file = await this.prisma.constituencyReportFile.findFirst({
      where: { filePath: filename, report: { institutionId } },
      include: { report: true },
    });
    if (!file || file.report.status !== ConstituencyReportStatus.COMPLETED) {
      throw new NotFoundException('Report file not found');
    }
    const key = this.storage.safeKey(filename);
    if (!key) throw new NotFoundException('Report file not found');
    return { key, format: file.format as 'PDF' | 'CSV' };
  }

  /** Enqueues QUEUED report rows for every VERIFIED institution opted into `period`. */
  async enqueueScheduledReports(period: ConstituencyReportPeriod) {
    const flagField = {
      [ConstituencyReportPeriod.WEEKLY]: 'weeklyEnabled',
      [ConstituencyReportPeriod.MONTHLY]: 'monthlyEnabled',
      [ConstituencyReportPeriod.QUARTERLY]: 'quarterlyEnabled',
      [ConstituencyReportPeriod.ANNUAL]: 'annualEnabled',
    }[period];

    const preferences = await this.prisma.constituencyReportPreference.findMany(
      {
        where: { [flagField]: true },
        include: { institution: true },
      },
    );

    const periodEnd = new Date();
    const periodStart = periodStartFor(period, periodEnd);
    let created = 0;
    for (const pref of preferences) {
      if (
        pref.institution.officialStatus !== OfficialVerificationStatus.VERIFIED
      ) {
        continue;
      }
      await this.prisma.constituencyReport.create({
        data: {
          institutionId: pref.institutionId,
          period,
          periodStart,
          periodEnd,
          status: ConstituencyReportStatus.QUEUED,
        },
      });
      created += 1;
    }
    return created;
  }

  /** Picks up one QUEUED report, generates files, delivers, marks COMPLETED/FAILED. */
  async processNextQueuedReport() {
    const report = await this.prisma.constituencyReport.findFirst({
      where: { status: ConstituencyReportStatus.QUEUED },
      orderBy: { createdAt: 'asc' },
      include: { institution: true },
    });
    if (!report) return null;

    await this.prisma.constituencyReport.update({
      where: { id: report.id },
      data: {
        status: ConstituencyReportStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    try {
      const [csv, pdf] = await Promise.all([
        this.generator.generateCsv(
          report.institution,
          report.period,
          report.periodStart,
          report.periodEnd,
        ),
        this.generator.generatePdf(
          report.institution,
          report.period,
          report.periodStart,
          report.periodEnd,
        ),
      ]);

      const [csvSaved, pdfSaved] = await Promise.all([
        this.storage.save('CSV', csv),
        this.storage.save('PDF', pdf),
      ]);

      await this.prisma.constituencyReportFile.createMany({
        data: [
          {
            reportId: report.id,
            format: 'CSV',
            filePath: csvSaved.filePath,
            fileSize: Buffer.byteLength(csv),
          },
          {
            reportId: report.id,
            format: 'PDF',
            filePath: pdfSaved.filePath,
            fileSize: pdf.length,
          },
        ],
      });

      await this.deliver(
        report.id,
        report.institution,
        report.period,
        pdfSaved.publicUrl,
      );

      const completed = await this.prisma.constituencyReport.update({
        where: { id: report.id },
        data: {
          status: ConstituencyReportStatus.COMPLETED,
          generatedAt: new Date(),
          error: null,
        },
      });

      this.activityLogger.logAsync({
        action: 'CONSTITUENCY_REPORT_GENERATED',
        entityType: 'CONSTITUENCY_REPORT',
        entityId: report.id,
        description: `Generated ${PERIOD_LABELS[report.period]} constituency report for ${report.institution.name}`,
        status: 'SUCCESS',
        changes: { institutionId: report.institutionId, period: report.period },
      });

      return completed;
    } catch (error) {
      const failed = await this.prisma.constituencyReport.update({
        where: { id: report.id },
        data: {
          status: ConstituencyReportStatus.FAILED,
          error: error instanceof Error ? error.message : 'unknown error',
        },
      });
      this.activityLogger.logAsync({
        action: 'CONSTITUENCY_REPORT_FAILED',
        entityType: 'CONSTITUENCY_REPORT',
        entityId: report.id,
        description: `Failed to generate constituency report for ${report.institution.name}`,
        status: 'FAILED',
        changes: {
          institutionId: report.institutionId,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return failed;
    }
  }

  private async deliver(
    reportId: string,
    institution: Institution,
    period: ConstituencyReportPeriod,
    reportUrl: string,
  ) {
    const recipients: { userId: string; email: string }[] = [];

    if (institution.holderUserId) {
      const holder = await this.prisma.user.findUnique({
        where: { id: institution.holderUserId },
        select: { id: true, email: true },
      });
      if (holder?.email)
        recipients.push({ userId: holder.id, email: holder.email });
    }

    const staff = await this.prisma.officialStaffMember.findMany({
      where: {
        institutionId: institution.id,
        status: 'ACTIVE',
        OR: [{ canGenerateReports: true }, { canView: true }],
      },
      include: { user: { select: { id: true, email: true } } },
    });
    for (const member of staff) {
      if (
        member.user.email &&
        !recipients.some((r) => r.userId === member.user.id)
      ) {
        recipients.push({ userId: member.user.id, email: member.user.email });
      }
    }

    const report = await this.prisma.constituencyReport.findUniqueOrThrow({
      where: { id: reportId },
    });

    for (const recipient of recipients) {
      const delivery = await this.prisma.constituencyReportDelivery.create({
        data: {
          reportId,
          recipientId: recipient.userId,
          status: 'PENDING',
        },
      });
      try {
        await this.emailService.sendTransactional(
          recipient.email,
          recipient.userId,
          EmailType.CONSTITUENCY_REPORT_READY,
          {
            institutionName: institution.name,
            period: PERIOD_LABELS[period],
            periodStart: report.periodStart.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            periodEnd: report.periodEnd.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            reportUrl,
          },
        );
        await this.prisma.constituencyReportDelivery.update({
          where: { id: delivery.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (error) {
        await this.prisma.constituencyReportDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'unknown error',
          },
        });
      }
    }
  }
}
