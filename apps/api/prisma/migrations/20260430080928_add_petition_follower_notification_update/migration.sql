-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PETITION_UPDATE';

-- CreateTable
CREATE TABLE "PetitionFollower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetitionFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetitionFollower_petitionId_idx" ON "PetitionFollower"("petitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PetitionFollower_userId_petitionId_key" ON "PetitionFollower"("userId", "petitionId");

-- AddForeignKey
ALTER TABLE "PetitionFollower" ADD CONSTRAINT "PetitionFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionFollower" ADD CONSTRAINT "PetitionFollower_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
