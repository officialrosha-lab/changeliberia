-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "amountDecimal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "totalPriceDecimal" DECIMAL(12,2),
ADD COLUMN     "unitPriceDecimal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountDecimal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "amountDecimal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "amountDecimal" DECIMAL(12,2);
