-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT,
    "sport" TEXT,
    "version" INTEGER NOT NULL DEFAULT 14,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationalId" TEXT,
    "internationalId" TEXT,
    "country" TEXT,
    "club" TEXT,
    "license" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundId" TEXT,
    "roundName" TEXT,
    "groupId" TEXT,
    "isElimination" BOOLEAN NOT NULL DEFAULT false,
    "eliminationLevel" TEXT,
    "timeStart" TIMESTAMP(3),
    "timeEnd" TIMESTAMP(3),
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "team1Score" INTEGER NOT NULL,
    "team2Score" INTEGER NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "team_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "matchesDrawn" INTEGER NOT NULL DEFAULT 0,
    "setsWon" INTEGER NOT NULL DEFAULT 0,
    "setsLost" INTEGER NOT NULL DEFAULT 0,
    "ballsWon" INTEGER NOT NULL DEFAULT 0,
    "ballsLost" INTEGER NOT NULL DEFAULT 0,
    "deactivated" BOOLEAN NOT NULL DEFAULT false,
    "removed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_externalId_key" ON "tournaments"("externalId");

-- CreateIndex
CREATE INDEX "tournaments_createdAt_idx" ON "tournaments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "players_externalId_key" ON "players"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE UNIQUE INDEX "matches_externalId_key" ON "matches"("externalId");

-- CreateIndex
CREATE INDEX "matches_tournamentId_idx" ON "matches"("tournamentId");

-- CreateIndex
CREATE INDEX "matches_isElimination_idx" ON "matches"("isElimination");

-- CreateIndex
CREATE INDEX "teams_matchId_idx" ON "teams"("matchId");

-- CreateIndex
CREATE INDEX "team_players_playerId_idx" ON "team_players"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "team_players_teamId_playerId_key" ON "team_players"("teamId", "playerId");

-- CreateIndex
CREATE INDEX "standings_tournamentId_idx" ON "standings"("tournamentId");

-- CreateIndex
CREATE INDEX "standings_playerId_idx" ON "standings"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "standings_tournamentId_playerId_type_key" ON "standings"("tournamentId", "playerId", "type");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
