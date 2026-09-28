-- CreateEnum
CREATE TYPE "PetitionMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "PetitionMedia" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "type" "PetitionMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetitionMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetitionMedia_petitionId_order_idx" ON "PetitionMedia"("petitionId", "order");

-- AddForeignKey
ALTER TABLE "PetitionMedia" ADD CONSTRAINT "PetitionMedia_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
