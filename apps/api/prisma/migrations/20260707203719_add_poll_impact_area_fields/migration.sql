-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "community" TEXT,
ADD COLUMN     "district" TEXT;

-- AlterTable
ALTER TABLE "PollVote" ADD COLUMN     "community" TEXT,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "district" TEXT;
