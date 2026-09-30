import {
  BACKFILL_TARGETS,
  buildBackfillQuery,
} from './backfill-decimal-amounts';

describe('backfill-decimal-amounts', () => {
  describe('BACKFILL_TARGETS', () => {
    it('covers every money-bearing column named in the Decimal migration plan', () => {
      const pairs = BACKFILL_TARGETS.map(
        (t) => `${t.table}.${t.floatColumn}->${t.decimalColumn}`,
      );
      expect(pairs).toEqual([
        'Payment.amount->amountDecimal',
        'Subscription.amount->amountDecimal',
        'Donation.amount->amountDecimal',
        'Refund.amount->amountDecimal',
        'OrderItem.unitPrice->unitPriceDecimal',
        'OrderItem.totalPrice->totalPriceDecimal',
        'MoMoSubscriptionAuthorization.maxAmount->maxAmountDecimal',
      ]);
    });
  });

  describe('buildBackfillQuery', () => {
    it('is a direct numeric cast — never multiplies or divides by 100', () => {
      const { sql } = buildBackfillQuery({
        table: 'Payment',
        floatColumn: 'amount',
        decimalColumn: 'amountDecimal',
      });
      expect(sql).not.toMatch(/100/);
      expect(sql).not.toContain('*');
      expect(sql).not.toContain('/');
    });

    it('only touches rows where the Decimal column is still null (idempotent)', () => {
      const { sql } = buildBackfillQuery({
        table: 'Payment',
        floatColumn: 'amount',
        decimalColumn: 'amountDecimal',
      });
      expect(sql).toContain('IS NULL');
    });

    it('never overwrites the original Float column', () => {
      const { sql } = buildBackfillQuery({
        table: 'Payment',
        floatColumn: 'amount',
        decimalColumn: 'amountDecimal',
      });
      // The float column may appear on the right-hand side (as the source
      // value being cast) but must never appear as a SET target.
      expect(sql).not.toMatch(/SET\s+"amount"\s*=/);
    });

    it('references the correct table and both column names for OrderItem.unitPrice', () => {
      const { sql } = buildBackfillQuery({
        table: 'OrderItem',
        floatColumn: 'unitPrice',
        decimalColumn: 'unitPriceDecimal',
      });
      expect(sql).toContain('"OrderItem"');
      expect(sql).toContain('"unitPrice"');
      expect(sql).toContain('"unitPriceDecimal"');
    });
  });
});
