-- DropIndex
DROP INDEX "InstitutionSubscription_institutionId_key";

-- CreateIndex
CREATE INDEX "InstitutionSubscription_institutionId_status_idx" ON "InstitutionSubscription"("institutionId", "status");
