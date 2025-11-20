-- CreateTable
CREATE TABLE "player_aliases" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_aliases_alias_key" ON "player_aliases"("alias");

-- CreateIndex
CREATE INDEX "player_aliases_canonicalName_idx" ON "player_aliases"("canonicalName");

-- CreateIndex
CREATE INDEX "player_aliases_alias_idx" ON "player_aliases"("alias");

-- AddForeignKey
ALTER TABLE "player_aliases" ADD CONSTRAINT "player_aliases_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
