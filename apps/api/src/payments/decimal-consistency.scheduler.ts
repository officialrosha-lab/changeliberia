import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';

/** More than half a cent of drift between the Float and Decimal columns is real, not rounding noise. */
const DRIFT_TOLERANCE = 0.005;

interface DriftTarget {
  table: string;
  floatColumn: string;
  decimalColumn: string;
}

const DRIFT_TARGETS: DriftTarget[] = [
  { table: 'Payment', floatColumn: 'amount', decimalColumn: 'amountDecimal' },
  {
    table: 'Subscription',
    floatColumn: 'amount',
    decimalColumn: 'amountDecimal',
  },
  { table: 'Donation', floatColumn: 'amount', decimalColumn: 'amountDecimal' },
  { table: 'Refund', floatColumn: 'amount', decimalColumn: 'amountDecimal' },
  {
    table: 'OrderItem',
    floatColumn: 'unitPrice',
    decimalColumn: 'unitPriceDecimal',
  },
  {
    table: 'OrderItem',
    floatColumn: 'totalPrice',
    decimalColumn: 'totalPriceDecimal',
  },
  {
    table: 'MoMoSubscriptionAuthorization',
    floatColumn: 'maxAmount',
    decimalColumn: 'maxAmountDecimal',
  },
];

interface DriftRow {
  id: string;
  floatValue: number;
  decimalValue: string;
}

interface DriftReport {
  table: string;
  column: string;
  rows: DriftRow[];
}

interface MissingReport {
  table: string;
  column: string;
  count: number;
  sampleIds: string[];
}

/**
 * Flags two distinct dual-write failure modes for the Decimal migration
 * (Milestone 7 Phase A dual-write, Milestone 12 Phase B read cutover):
 *
 * 1. Drift — the Decimal column is populated but disagrees with its Float
 *    counterpart by more than rounding noise. Always a bug in a write path
 *    (the two columns should be set from the same value in the same call).
 * 2. Missing — the Decimal column is still NULL. Before the one-off
 *    backfill runs this is expected; after it runs, a NULL here means some
 *    write path creates rows without dual-writing (the exact class of bug
 *    the admin refund endpoint had before Milestone 12) — the read cutover
 *    can't be trusted as long as this can happen silently.
 *
 * Runs daily; neither condition is auto-corrected, only reported via
 * ActivityLoggerService for manual review.
 */
@Injectable()
export class DecimalConsistencyScheduler {
  private readonly logger = new Logger(DecimalConsistencyScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async checkConsistency() {
    const driftReports = await this.findDrift();
    const missingReports = await this.findMissingDualWrites();
    const totalDrifted = driftReports.reduce(
      (sum, r) => sum + r.rows.length,
      0,
    );
    const totalMissing = missingReports.reduce((sum, r) => sum + r.count, 0);

    if (totalDrifted === 0 && totalMissing === 0) {
      this.logger.debug('Decimal consistency check: no issues found');
      return { driftReports, missingReports };
    }

    if (totalDrifted > 0) {
      this.logger.warn(
        `Decimal consistency check found ${totalDrifted} drifted row(s) across ${driftReports.length} column(s)`,
      );
    }
    if (totalMissing > 0) {
      this.logger.warn(
        `Decimal consistency check found ${totalMissing} row(s) with a missing dual-write across ${missingReports.length} column(s)`,
      );
    }

    for (const report of driftReports) {
      this.activityLogger.logAsync({
        action: 'DECIMAL_DRIFT_DETECTED',
        entityType: report.table.toUpperCase(),
        description: `${report.rows.length} ${report.table}.${report.column} row(s) drifted from their Float counterpart by more than ${DRIFT_TOLERANCE}`,
        status: 'FAILED',
        changes: {
          table: report.table,
          column: report.column,
          sampleRowIds: report.rows.slice(0, 10).map((r) => r.id),
          count: report.rows.length,
        },
      });
    }

    for (const report of missingReports) {
      this.activityLogger.logAsync({
        action: 'DECIMAL_DUAL_WRITE_MISSING',
        entityType: report.table.toUpperCase(),
        description: `${report.count} ${report.table}.${report.column} row(s) have no Decimal value — some write path is not dual-writing`,
        status: 'FAILED',
        changes: {
          table: report.table,
          column: report.column,
          sampleRowIds: report.sampleIds,
          count: report.count,
        },
      });
    }

    return { driftReports, missingReports };
  }

  async findMissingDualWrites(): Promise<MissingReport[]> {
    const reports: MissingReport[] = [];

    for (const target of DRIFT_TARGETS) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id
        FROM ${Prisma.raw(`"${target.table}"`)}
        WHERE ${Prisma.raw(`"${target.decimalColumn}"`)} IS NULL
      `);

      if (rows.length > 0) {
        reports.push({
          table: target.table,
          column: target.decimalColumn,
          count: rows.length,
          sampleIds: rows.slice(0, 10).map((r) => r.id),
        });
      }
    }

    return reports;
  }

  async findDrift(): Promise<DriftReport[]> {
    const reports: DriftReport[] = [];

    for (const target of DRIFT_TARGETS) {
      const rows = await this.prisma.$queryRaw<
        { id: string; floatValue: number; decimalValue: Prisma.Decimal }[]
      >(Prisma.sql`
        SELECT id,
               ${Prisma.raw(`"${target.floatColumn}"`)} AS "floatValue",
               ${Prisma.raw(`"${target.decimalColumn}"`)} AS "decimalValue"
        FROM ${Prisma.raw(`"${target.table}"`)}
        WHERE ${Prisma.raw(`"${target.decimalColumn}"`)} IS NOT NULL
          AND ABS(${Prisma.raw(`"${target.floatColumn}"`)} - ${Prisma.raw(`"${target.decimalColumn}"`)}::float) > ${DRIFT_TOLERANCE}
      `);

      if (rows.length > 0) {
        reports.push({
          table: target.table,
          column: target.decimalColumn,
          rows: rows.map((r) => ({
            id: r.id,
            floatValue: r.floatValue,
            decimalValue: r.decimalValue.toString(),
          })),
        });
      }
    }

    return reports;
  }
}
