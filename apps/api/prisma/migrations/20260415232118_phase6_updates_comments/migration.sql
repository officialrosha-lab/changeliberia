-- CreateTable
CREATE TABLE "PetitionUpdate" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetitionUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetitionComment" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetitionComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetitionUpdate_petitionId_createdAt_idx" ON "PetitionUpdate"("petitionId", "createdAt");

-- CreateIndex
CREATE INDEX "PetitionComment_petitionId_createdAt_idx" ON "PetitionComment"("petitionId", "createdAt");

-- AddForeignKey
ALTER TABLE "PetitionUpdate" ADD CONSTRAINT "PetitionUpdate_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionComment" ADD CONSTRAINT "PetitionComment_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionComment" ADD CONSTRAINT "PetitionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
