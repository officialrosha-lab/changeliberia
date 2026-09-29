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

/**
 * Flags rows where the Decimal migration's dual-written column (Milestone
 * 7 Phase A) has drifted from the original Float column by more than
 * rounding noise — the backstop the architecture plan calls for before any
 * read cutover (Milestone 12) can be trusted. Runs daily; any drift is a
 * bug in a write path, not something to auto-correct, so this only
 * reports via ActivityLoggerService for manual review.
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
    const reports = await this.findDrift();
    const totalDrifted = reports.reduce((sum, r) => sum + r.rows.length, 0);

    if (totalDrifted === 0) {
      this.logger.debug('Decimal consistency check: no drift found');
      return;
    }

    this.logger.warn(
      `Decimal consistency check found ${totalDrifted} drifted row(s) across ${reports.length} column(s)`,
    );

    for (const report of reports) {
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
