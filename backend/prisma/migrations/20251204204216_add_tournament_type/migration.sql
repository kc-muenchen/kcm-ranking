-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "tournamentType" TEXT NOT NULL DEFAULT 'doubles';

-- CreateIndex
CREATE INDEX "tournaments_tournamentType_idx" ON "tournaments"("tournamentType");
