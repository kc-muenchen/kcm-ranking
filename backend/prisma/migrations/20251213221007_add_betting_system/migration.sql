-- CreateTable
CREATE TABLE "betting_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "totalWagered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "betting_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "matchId" TEXT,
    "tableName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "predictedWinner" INTEGER NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "team1Names" TEXT NOT NULL,
    "team2Names" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payout" DOUBLE PRECISION,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "betting_users_username_key" ON "betting_users"("username");

-- CreateIndex
CREATE INDEX "betting_users_username_idx" ON "betting_users"("username");

-- CreateIndex
CREATE INDEX "bets_userId_idx" ON "bets"("userId");

-- CreateIndex
CREATE INDEX "bets_status_idx" ON "bets"("status");

-- CreateIndex
CREATE INDEX "bets_placedAt_idx" ON "bets"("placedAt");

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "betting_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
