-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "isSeasonFinal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tournaments_isSeasonFinal_idx" ON "tournaments"("isSeasonFinal");
