-- CreateTable
CREATE TABLE "Supporter" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'navbar',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supporter_sessionId_key" ON "Supporter"("sessionId");

-- CreateIndex
CREATE INDEX "Supporter_userId_idx" ON "Supporter"("userId");

-- CreateIndex
CREATE INDEX "Supporter_joinedAt_idx" ON "Supporter"("joinedAt");
