-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "IDDocument_userId_createdAt_idx" ON "IDDocument"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_createdAt_idx" ON "Payment"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "PetitionComment_userId_createdAt_idx" ON "PetitionComment"("userId", "createdAt");
