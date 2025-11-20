import prisma from '../utils/db.js';

/**
 * Processes and saves tournament data to the database
 * @param {Object} data - Raw tournament data from Kickertool
 * @returns {Promise<Object>} - Saved tournament object
 */
export async function processTournamentData(data) {
  // Use a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // 1. Create or get tournament
    const tournament = await tx.tournament.upsert({
      where: { externalId: data._id },
      update: {
        name: data.name,
        mode: data.mode,
        sport: data.sport,
        version: data.version || 14,
        rawData: data // Store original JSON for frontend compatibility
      },
      create: {
        externalId: data._id,
        name: data.name,
        createdAt: new Date(data.createdAt),
        mode: data.mode,
        sport: data.sport,
        version: data.version || 14,
        rawData: data // Store original JSON for frontend compatibility
      }
    });

    // 2. Process qualifying rounds
    if (data.qualifying && data.qualifying.rounds) {
      await processMatches(tx, tournament.id, data.qualifying.rounds, false);
    }

    // 3. Process elimination rounds
    if (data.eliminations) {
      for (const elimination of data.eliminations) {
        if (elimination.levels) {
          await processMatches(tx, tournament.id, elimination.levels, true);
        }
        // Process third place match
        if (elimination.third && elimination.third.matches) {
          await processMatches(tx, tournament.id, [{ matches: elimination.third.matches }], true, 'third');
        }
      }
    }

    // 4. Process qualifying standings
    if (data.qualifying && data.qualifying.standings) {
      await processStandings(tx, tournament.id, data.qualifying.standings, 'qualifying');
    }

    // 5. Process elimination standings
    if (data.eliminations && data.eliminations[0] && data.eliminations[0].standings) {
      await processStandings(tx, tournament.id, data.eliminations[0].standings, 'elimination');
    }

    return tournament;
  });
}

/**
 * Processes matches from rounds/levels
 */
async function processMatches(tx, tournamentId, rounds, isElimination, levelName = null) {
  for (const round of rounds) {
    if (!round.matches) continue;

    for (const match of round.matches) {
      if (!match.valid || match.skipped || !match.result) continue;
      
      // Skip matches with null/empty teams (bye matches, empty slots)
      if (!match.team1 || !match.team2 || !match.team1.players || !match.team2.players) continue;

      // Get or create players for both teams
      const team1Players = await Promise.all(
        match.team1.players.map(p => getOrCreatePlayer(tx, p))
      );
      const team2Players = await Promise.all(
        match.team2.players.map(p => getOrCreatePlayer(tx, p))
      );

      // Create match
      const createdMatch = await tx.match.upsert({
        where: { externalId: match._id },
        update: {
          team1Score: match.result[0],
          team2Score: match.result[1],
          timeStart: match.timeStart ? new Date(match.timeStart) : null,
          timeEnd: match.timeEnd ? new Date(match.timeEnd) : null
        },
        create: {
          externalId: match._id,
          tournamentId,
          roundId: match.roundId,
          roundName: round.name,
          groupId: match.groupId,
          isElimination,
          eliminationLevel: levelName || round.name,
          timeStart: match.timeStart ? new Date(match.timeStart) : null,
          timeEnd: match.timeEnd ? new Date(match.timeEnd) : null,
          team1Score: match.result[0],
          team2Score: match.result[1],
          valid: match.valid,
          skipped: match.skipped
        }
      });

      // Create teams and link players
      const team1Won = match.result[0] > match.result[1];
      await createTeamWithPlayers(tx, createdMatch.id, 1, match.team1.name, match.result[0], team1Won, team1Players);
      await createTeamWithPlayers(tx, createdMatch.id, 2, match.team2.name, match.result[1], !team1Won, team2Players);
    }
  }
}

/**
 * Creates a team and links players
 */
async function createTeamWithPlayers(tx, matchId, teamNumber, name, score, won, players) {
  const team = await tx.team.create({
    data: {
      matchId,
      teamNumber,
      name,
      score,
      won
    }
  });

  // Link players to team
  await Promise.all(
    players.map(player =>
      tx.teamPlayer.create({
        data: {
          teamId: team.id,
          playerId: player.id
        }
      })
    )
  );

  return team;
}

/**
 * Gets or creates a player
 */
async function getOrCreatePlayer(tx, playerData) {
  const playerName = playerData.name;
  
  const player = await tx.player.upsert({
    where: { name: playerName },
    update: {},
    create: {
      externalId: playerData._id,
      name: playerName,
      firstName: playerData.external?.firstName || null,
      lastName: playerData.external?.lastName || null,
      nationalId: playerData.external?.nationalId || null,
      internationalId: playerData.external?.internationalId || null,
      country: playerData.external?.country || null,
      club: playerData.external?.clubMemberships?.[0]?.club || null,
      license: playerData.external?.nationalLicence || null,
      isGuest: playerData.guest || false,
      isExternal: !!playerData.external
    }
  });

  return player;
}

/**
 * Processes standings
 */
async function processStandings(tx, tournamentId, standings, type) {
  for (const standing of standings) {
    if (standing.removed) continue;

    // Get or create player
    const player = await getOrCreatePlayer(tx, standing);

    // Create standing
    await tx.standing.upsert({
      where: {
        tournamentId_playerId_type: {
          tournamentId,
          playerId: player.id,
          type
        }
      },
      update: {
        place: standing.stats.place,
        points: standing.stats.points || 0,
        matchesWon: standing.stats.matchesWon || 0,
        matchesLost: standing.stats.matchesLost || 0,
        matchesDrawn: standing.stats.matchesDrawn || 0,
        setsWon: standing.stats.setsWon || 0,
        setsLost: standing.stats.setsLost || 0,
        ballsWon: standing.stats.ballsWon || 0,
        ballsLost: standing.stats.ballsLost || 0,
        deactivated: standing.deactivated || false
      },
      create: {
        tournamentId,
        playerId: player.id,
        type,
        place: standing.stats.place,
        points: standing.stats.points || 0,
        matchesWon: standing.stats.matchesWon || 0,
        matchesLost: standing.stats.matchesLost || 0,
        matchesDrawn: standing.stats.matchesDrawn || 0,
        setsWon: standing.stats.setsWon || 0,
        setsLost: standing.stats.setsLost || 0,
        ballsWon: standing.stats.ballsWon || 0,
        ballsLost: standing.stats.ballsLost || 0,
        deactivated: standing.deactivated || false
      }
    });
  }
}

