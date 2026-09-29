/**
 * One-off backfill for the Decimal migration (Milestone 7, Phase A): copies
 * every Float amount column into its new nullable Decimal(12,2) sibling —
 * `Payment.amount` → `amountDecimal`, `Subscription.amount` →
 * `amountDecimal`, `Donation.amount` → `amountDecimal`, `Refund.amount` →
 * `amountDecimal`, `OrderItem.unitPrice`/`totalPrice` →
 * `unitPriceDecimal`/`totalPriceDecimal`.
 *
 * This is a direct numeric cast, not a unit conversion: every one of these
 * columns already stores major units (dollars) — confirmed against
 * `payment.service.spec.ts`'s own fixtures (`amount: 50` means $50; the
 * `* 100` cents conversion happens only when calling the Stripe API, never
 * in what gets written to these Prisma models). A wrong assumption here
 * would silently corrupt financial data, so this script does NOT multiply
 * or divide by 100 anywhere.
 *
 * Idempotent (`WHERE ... IS NULL`) and additive — never touches the
 * original Float column. Run again any time; already-backfilled rows are
 * skipped.
 *
 * Run: npx tsx src/scripts/backfill-decimal-amounts.ts
 * Not wired into any Nest module or the app's own seed/start scripts —
 * this is a deliberate one-time migration step, run manually per
 * environment, same convention as backfill-geography.ts.
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BackfillTarget {
  table: string;
  floatColumn: string;
  decimalColumn: string;
}

export const BACKFILL_TARGETS: BackfillTarget[] = [
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

export function buildBackfillQuery(target: BackfillTarget): Prisma.Sql {
  return Prisma.sql`
    UPDATE ${Prisma.raw(`"${target.table}"`)}
    SET ${Prisma.raw(`"${target.decimalColumn}"`)} = ${Prisma.raw(`"${target.floatColumn}"`)}::decimal(12,2)
    WHERE ${Prisma.raw(`"${target.decimalColumn}"`)} IS NULL
  `;
}

async function main() {
  console.log('Backfilling Decimal amount columns...\n');

  for (const target of BACKFILL_TARGETS) {
    const affected = await prisma.$executeRaw(buildBackfillQuery(target));
    console.log(
      `${target.table}.${target.decimalColumn}: backfilled ${affected} row(s)`,
    );
  }

  console.log('\nBackfill complete.');
}

if (require.main === module) {
  main()
    .catch((err: unknown) => {
      console.error(
        'Backfill failed:',
        err instanceof Error ? err.message : err,
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
