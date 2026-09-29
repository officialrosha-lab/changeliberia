-- CreateEnum
CREATE TYPE "EntitlementScope" AS ENUM ('USER', 'ORGANIZATION', 'INSTITUTION');

-- AlterEnum
ALTER TYPE "PermissionResource" ADD VALUE 'ENTITLEMENT';

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "EntitlementScope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementGrant" (
    "id" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "institutionId" TEXT,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "EntitlementGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_key_key" ON "Entitlement"("key");

-- CreateIndex
CREATE INDEX "EntitlementGrant_entitlementId_userId_idx" ON "EntitlementGrant"("entitlementId", "userId");

-- CreateIndex
CREATE INDEX "EntitlementGrant_entitlementId_institutionId_idx" ON "EntitlementGrant"("entitlementId", "institutionId");

-- CreateIndex
CREATE INDEX "EntitlementGrant_expiresAt_idx" ON "EntitlementGrant"("expiresAt");

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
