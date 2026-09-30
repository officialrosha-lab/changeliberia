-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- AlterTable
ALTER TABLE "Petition" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- AlterTable
ALTER TABLE "PollVote" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- AlterTable
ALTER TABLE "SignatureLocation" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "electoralDistrictId" TEXT;

-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capital" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectoralDistrict" (
    "id" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "seatCount" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectoralDistrict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "County_name_key" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "County_code_key" ON "County"("code");

-- CreateIndex
CREATE INDEX "County_name_idx" ON "County"("name");

-- CreateIndex
CREATE INDEX "ElectoralDistrict_countyId_idx" ON "ElectoralDistrict"("countyId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectoralDistrict_countyId_name_key" ON "ElectoralDistrict"("countyId", "name");

-- CreateIndex
CREATE INDEX "Institution_category_countyId_idx" ON "Institution"("category", "countyId");

-- CreateIndex
CREATE INDEX "Institution_category_electoralDistrictId_idx" ON "Institution"("category", "electoralDistrictId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petition" ADD CONSTRAINT "Petition_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petition" ADD CONSTRAINT "Petition_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureLocation" ADD CONSTRAINT "SignatureLocation_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureLocation" ADD CONSTRAINT "SignatureLocation_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralDistrict" ADD CONSTRAINT "ElectoralDistrict_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_electoralDistrictId_fkey" FOREIGN KEY ("electoralDistrictId") REFERENCES "ElectoralDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;
