-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionPlacement" AS ENUM ('FEATURED_HOME', 'TRENDING_BOOST', 'CATEGORY_TOP');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'ATTENDED');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('SUBMITTED', 'SCOPING', 'QUOTED', 'IN_PROGRESS', 'DELIVERED', 'CLOSED', 'DECLINED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- CreateTable
CREATE TABLE "PetitionPromotion" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "purchaserUserId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "placement" "PromotionPlacement" NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerPaymentIntentId" TEXT,
    "lastWebhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetitionPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipPackage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipPurchase" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "purchaserUserId" TEXT NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sponsorId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerPaymentIntentId" TEXT,
    "lastWebhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProduct" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fileUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProductPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaserUserId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerPaymentIntentId" TEXT,
    "lastWebhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProductPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "priceAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "purchaseStatus" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerPaymentIntentId" TEXT,
    "lastWebhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiPlan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "MembershipInterval" NOT NULL,
    "requestsPerDay" INTEGER NOT NULL,
    "entitlementKeys" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "MembershipSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "lastWebhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageDaily" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalServiceRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "organizationId" TEXT,
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "quotedAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestStatusLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "ServiceRequestStatus",
    "toStatus" "ServiceRequestStatus" NOT NULL,
    "changedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequestStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT,
    "organizationId" TEXT,
    "institutionId" TEXT,
    "serviceRequestId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetitionPromotion_providerPaymentIntentId_key" ON "PetitionPromotion"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "PetitionPromotion_petitionId_status_idx" ON "PetitionPromotion"("petitionId", "status");

-- CreateIndex
CREATE INDEX "PetitionPromotion_status_endsAt_idx" ON "PetitionPromotion"("status", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipPackage_key_key" ON "SponsorshipPackage"("key");

-- CreateIndex
CREATE INDEX "SponsorshipPackage_active_idx" ON "SponsorshipPackage"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipPurchase_sponsorId_key" ON "SponsorshipPurchase"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipPurchase_providerPaymentIntentId_key" ON "SponsorshipPurchase"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "SponsorshipPurchase_status_idx" ON "SponsorshipPurchase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProduct_key_key" ON "ResearchProduct"("key");

-- CreateIndex
CREATE INDEX "ResearchProduct_active_idx" ON "ResearchProduct"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProductPurchase_providerPaymentIntentId_key" ON "ResearchProductPurchase"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "ResearchProductPurchase_purchaserUserId_status_idx" ON "ResearchProductPurchase"("purchaserUserId", "status");

-- CreateIndex
CREATE INDEX "ResearchProductPurchase_status_idx" ON "ResearchProductPurchase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Event_key_key" ON "Event"("key");

-- CreateIndex
CREATE INDEX "Event_active_startsAt_idx" ON "Event"("active", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_providerPaymentIntentId_key" ON "EventRegistration"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiPlan_key_key" ON "ApiPlan"("key");

-- CreateIndex
CREATE INDEX "ApiPlan_active_idx" ON "ApiPlan"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ApiSubscription_providerSubscriptionId_key" ON "ApiSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "ApiSubscription_userId_status_idx" ON "ApiSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "ApiSubscription_status_idx" ON "ApiSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_subscriptionId_idx" ON "ApiKey"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsageDaily_apiKeyId_date_key" ON "ApiUsageDaily"("apiKeyId", "date");

-- CreateIndex
CREATE INDEX "ProfessionalServiceRequest_status_idx" ON "ProfessionalServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ProfessionalServiceRequest_organizationId_idx" ON "ProfessionalServiceRequest"("organizationId");

-- CreateIndex
CREATE INDEX "ProfessionalServiceRequest_institutionId_idx" ON "ProfessionalServiceRequest"("institutionId");

-- CreateIndex
CREATE INDEX "ServiceRequestStatusLog_requestId_idx" ON "ServiceRequestStatusLog"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_institutionId_idx" ON "Invoice"("institutionId");

-- AddForeignKey
ALTER TABLE "PetitionPromotion" ADD CONSTRAINT "PetitionPromotion_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionPromotion" ADD CONSTRAINT "PetitionPromotion_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipPurchase" ADD CONSTRAINT "SponsorshipPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SponsorshipPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipPurchase" ADD CONSTRAINT "SponsorshipPurchase_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipPurchase" ADD CONSTRAINT "SponsorshipPurchase_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProductPurchase" ADD CONSTRAINT "ResearchProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ResearchProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProductPurchase" ADD CONSTRAINT "ResearchProductPurchase_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSubscription" ADD CONSTRAINT "ApiSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSubscription" ADD CONSTRAINT "ApiSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ApiPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ApiSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsageDaily" ADD CONSTRAINT "ApiUsageDaily_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalServiceRequest" ADD CONSTRAINT "ProfessionalServiceRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalServiceRequest" ADD CONSTRAINT "ProfessionalServiceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalServiceRequest" ADD CONSTRAINT "ProfessionalServiceRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestStatusLog" ADD CONSTRAINT "ServiceRequestStatusLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProfessionalServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ProfessionalServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
