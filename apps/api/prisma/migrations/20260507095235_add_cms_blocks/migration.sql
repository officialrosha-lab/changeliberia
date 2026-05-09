-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CMSBlock" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "props" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "occupation" TEXT,
    "motivation" TEXT NOT NULL,
    "growthPlan" TEXT NOT NULL,
    "socialLinks" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbassadorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CMSBlock_pageId_order_idx" ON "CMSBlock"("pageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CMSBlock_pageId_order_key" ON "CMSBlock"("pageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorApplication_email_key" ON "AmbassadorApplication"("email");

-- CreateIndex
CREATE INDEX "AmbassadorApplication_status_idx" ON "AmbassadorApplication"("status");

-- CreateIndex
CREATE INDEX "AmbassadorApplication_createdAt_idx" ON "AmbassadorApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "CMSBlock" ADD CONSTRAINT "CMSBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
