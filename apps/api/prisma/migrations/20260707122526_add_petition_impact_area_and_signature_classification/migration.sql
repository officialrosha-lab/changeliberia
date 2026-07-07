/*
  Warnings:

  - The primary key for the `_ContentToContentTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ContentToContentTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ImpactScope" AS ENUM ('COMMUNITY', 'DISTRICT', 'COUNTY', 'MULTI_COUNTY', 'NATIONAL');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('LIVES_HERE', 'WORKS_HERE', 'ATTENDS_SCHOOL_HERE', 'OWNS_PROPERTY_HERE', 'BUSINESS_OPERATES_HERE', 'FREQUENTLY_USES_AREA', 'OTHER');

-- CreateEnum
CREATE TYPE "SignatureClassification" AS ENUM ('DIRECTLY_AFFECTED', 'NEARBY_COMMUNITY', 'SUPPORTER', 'DIASPORA_SUPPORTER', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Petition" ADD COLUMN     "community" TEXT,
ADD COLUMN     "counties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "district" TEXT,
ADD COLUMN     "impactScope" "ImpactScope",
ADD COLUMN     "landmark" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "community" TEXT,
ADD COLUMN     "district" TEXT;

-- AlterTable
ALTER TABLE "_ContentToContentTag" DROP CONSTRAINT "_ContentToContentTag_AB_pkey";

-- CreateTable
CREATE TABLE "SignatureLocation" (
    "id" TEXT NOT NULL,
    "signatureId" TEXT NOT NULL,
    "personallyAffected" BOOLEAN,
    "relationshipType" "RelationshipType",
    "county" TEXT,
    "district" TEXT,
    "community" TEXT,
    "locationSource" TEXT NOT NULL DEFAULT 'unconfirmed',
    "classification" "SignatureClassification" NOT NULL DEFAULT 'UNKNOWN',
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignatureLocation_signatureId_key" ON "SignatureLocation"("signatureId");

-- CreateIndex
CREATE INDEX "SignatureLocation_signatureId_idx" ON "SignatureLocation"("signatureId");

-- CreateIndex
CREATE INDEX "SignatureLocation_classification_idx" ON "SignatureLocation"("classification");

-- CreateIndex
CREATE INDEX "Petition_impactScope_county_district_idx" ON "Petition"("impactScope", "county", "district");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentToContentTag_AB_unique" ON "_ContentToContentTag"("A", "B");

-- AddForeignKey
ALTER TABLE "SignatureLocation" ADD CONSTRAINT "SignatureLocation_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "Signature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
