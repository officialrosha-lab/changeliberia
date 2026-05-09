-- AlterTable
ALTER TABLE "CMSPage" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CMSPageVersion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "blocks" TEXT NOT NULL,
    "authorId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSPageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSBlockAnalytics" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variantId" TEXT,
    "recordDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSBlockAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSExperiment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "controlVariant" TEXT NOT NULL,
    "variants" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "winningVariantId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSSchedule" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CMSPageVersion_pageId_createdAt_idx" ON "CMSPageVersion"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "CMSPageVersion_pageId_idx" ON "CMSPageVersion"("pageId");

-- CreateIndex
CREATE INDEX "CMSFile_uploadedBy_createdAt_idx" ON "CMSFile"("uploadedBy", "createdAt");

-- CreateIndex
CREATE INDEX "CMSBlockAnalytics_pageId_recordDate_idx" ON "CMSBlockAnalytics"("pageId", "recordDate");

-- CreateIndex
CREATE INDEX "CMSBlockAnalytics_blockType_recordDate_idx" ON "CMSBlockAnalytics"("blockType", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "CMSBlockAnalytics_pageId_blockId_variantId_recordDate_key" ON "CMSBlockAnalytics"("pageId", "blockId", "variantId", "recordDate");

-- CreateIndex
CREATE INDEX "CMSExperiment_pageId_status_idx" ON "CMSExperiment"("pageId", "status");

-- CreateIndex
CREATE INDEX "CMSExperiment_blockId_idx" ON "CMSExperiment"("blockId");

-- CreateIndex
CREATE INDEX "CMSExperiment_createdBy_idx" ON "CMSExperiment"("createdBy");

-- CreateIndex
CREATE INDEX "CMSSchedule_pageId_scheduledFor_idx" ON "CMSSchedule"("pageId", "scheduledFor");

-- CreateIndex
CREATE INDEX "CMSSchedule_executed_scheduledFor_idx" ON "CMSSchedule"("executed", "scheduledFor");

-- AddForeignKey
ALTER TABLE "CMSPageVersion" ADD CONSTRAINT "CMSPageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPageVersion" ADD CONSTRAINT "CMSPageVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSFile" ADD CONSTRAINT "CMSFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSExperiment" ADD CONSTRAINT "CMSExperiment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSSchedule" ADD CONSTRAINT "CMSSchedule_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSSchedule" ADD CONSTRAINT "CMSSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
