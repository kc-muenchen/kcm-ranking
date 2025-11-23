import prisma from '../utils/db.js';

/**
 * Processes and saves tournament data to the database
 * @param {Object} data - Raw tournament data from Kickertool
 * @returns {Promise<Object>} - Saved tournament object
 */
/**
 * Helper function to check if a tournament is a season final based on name
 */
function isSeasonFinalByName(name) {
  if (!name) return false
  const lowerName = name.toLowerCase()
  // Check for various season final patterns
  return lowerName.includes('season final') ||
         lowerName.includes('saison final') ||
         lowerName.includes('saison finale')
}

/**
 * Check if tournament has only qualifying (no elimination matches)
 */
function hasOnlyQualifying(data) {
  const hasQualifying = data.qualifying && 
    data.qualifying[0] && 
    data.qualifying[0].rounds && 
    data.qualifying[0].rounds.length > 0 &&
    data.qualifying[0].rounds.some(round => round.matches && round.matches.length > 0)
  const hasEliminations = data.eliminations && 
    data.eliminations.length > 0 &&
    data.eliminations.some(elim => 
      elim.levels && 
      elim.levels.some(level => level.matches && level.matches.length > 0)
    )
  return hasQualifying && !hasEliminations
}

/**
 * Check if tournament has only eliminations (no qualifying matches)
 */
function hasOnlyEliminations(data) {
  const hasQualifying = data.qualifying && 
    data.qualifying[0] && 
    data.qualifying[0].rounds && 
    data.qualifying[0].rounds.length > 0 &&
    data.qualifying[0].rounds.some(round => round.matches && round.matches.length > 0)
  const hasEliminations = data.eliminations && 
    data.eliminations.length > 0 &&
    data.eliminations.some(elim => 
      elim.levels && 
      elim.levels.some(level => level.matches && level.matches.length > 0)
    )
  return hasEliminations && !hasQualifying
}

/**
 * Merge two tournament data objects
 */
function mergeTournamentData(existingData, newData) {
  const merged = JSON.parse(JSON.stringify(existingData)) // Deep clone
  
  // Merge qualifying data - keep existing if it has matches, otherwise use new
  if (existingData.qualifying && existingData.qualifying[0]) {
    // Keep existing qualifying data (it has the matches)
    merged.qualifying = existingData.qualifying
  } else if (newData.qualifying && newData.qualifying[0]) {
    // Use new qualifying data if existing doesn't have it
    merged.qualifying = newData.qualifying
  }
  
  // Merge elimination data - keep existing if it has matches, otherwise use new
  if (existingData.eliminations && existingData.eliminations.length > 0) {
    // Check if existing has actual matches
    const existingHasMatches = existingData.eliminations.some(elim => 
      elim.levels && elim.levels.some(level => level.matches && level.matches.length > 0)
    )
    if (existingHasMatches) {
      merged.eliminations = existingData.eliminations
    } else if (newData.eliminations && newData.eliminations.length > 0) {
      merged.eliminations = newData.eliminations
    }
  } else if (newData.eliminations && newData.eliminations.length > 0) {
    // Use new elimination data if existing doesn't have it
    merged.eliminations = newData.eliminations
  }
  
  // Update metadata - use the most recent
  const existingDate = existingData.updatedAt ? new Date(existingData.updatedAt) : null
  const newDate = newData.updatedAt ? new Date(newData.updatedAt) : null
  if (newDate && (!existingDate || newDate > existingDate)) {
    merged.updatedAt = newData.updatedAt
  } else if (existingDate) {
    merged.updatedAt = existingData.updatedAt
  }
  
  merged.version = newData.version || existingData.version || 14
  
  // Preserve other important fields from both
  merged.name = newData.name || existingData.name
  merged.mode = newData.mode || existingData.mode
  merged.sport = newData.sport || existingData.sport
  
  return merged
}

export async function processTournamentData(data) {
  // Use a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Check if this is a season final based on name
    const isSeasonFinal = isSeasonFinalByName(data.name)
    
    let tournamentToUse = null
    let mergedData = data
    
    // If this is a season final, check for existing season finals in the same year
    if (isSeasonFinal) {
      const tournamentYear = new Date(data.createdAt).getFullYear()
      const yearStart = new Date(tournamentYear, 0, 1)
      const yearEnd = new Date(tournamentYear + 1, 0, 1)
      
      // Find existing season finals in the same year
      const existingSeasonFinals = await tx.tournament.findMany({
        where: {
          isSeasonFinal: true,
          createdAt: {
            gte: yearStart,
            lt: yearEnd
          },
          NOT: {
            externalId: data._id // Exclude the current tournament
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      // Check if we can merge with an existing season final
      for (const existing of existingSeasonFinals) {
        if (!existing.rawData) continue
        
        const existingHasOnlyQualifying = hasOnlyQualifying(existing.rawData)
        const existingHasOnlyEliminations = hasOnlyEliminations(existing.rawData)
        const newHasOnlyQualifying = hasOnlyQualifying(data)
        const newHasOnlyEliminations = hasOnlyEliminations(data)
        
        // Check if one has only qualifying and the other only eliminations
        if ((existingHasOnlyQualifying && newHasOnlyEliminations) ||
            (existingHasOnlyEliminations && newHasOnlyQualifying)) {
          // Merge the tournaments
          tournamentToUse = existing
          mergedData = mergeTournamentData(existing.rawData, data)
          break
        }
      }
    }
    
    // Use existing tournament if we found one to merge with, otherwise create/update normally
    let tournament
    
    if (tournamentToUse) {
      // Check if a tournament with the new externalId already exists (shouldn't happen, but handle it)
      const existingWithNewId = await tx.tournament.findUnique({
        where: { externalId: data._id }
      })
      
      // If a tournament with the new ID exists and it's different from the one we're merging into, delete it
      if (existingWithNewId && existingWithNewId.id !== tournamentToUse.id) {
        await tx.tournament.delete({
          where: { id: existingWithNewId.id }
        })
      }
      
      // Update the existing tournament with merged data
      tournament = await tx.tournament.update({
        where: { id: tournamentToUse.id },
        data: {
          name: data.name, // Update name to the latest
          mode: data.mode,
          sport: data.sport,
          version: data.version || 14,
          isSeasonFinal: true,
          rawData: mergedData // Store merged JSON
        }
      })
    } else {
      // Normal create/update
      tournament = await tx.tournament.upsert({
        where: { externalId: data._id },
        update: {
          name: data.name,
          mode: data.mode,
          sport: data.sport,
          version: data.version || 14,
          isSeasonFinal: isSeasonFinal,
          rawData: data // Store original JSON for frontend compatibility
        },
        create: {
          externalId: data._id,
          name: data.name,
          createdAt: new Date(data.createdAt),
          mode: data.mode,
          sport: data.sport,
          version: data.version || 14,
          isSeasonFinal: isSeasonFinal,
          rawData: data // Store original JSON for frontend compatibility
        }
      })
    }

    // Use merged data for processing if we merged tournaments
    const dataToProcess = tournamentToUse ? mergedData : data
    
    // 2. Process qualifying rounds
    if (dataToProcess.qualifying && dataToProcess.qualifying[0] && dataToProcess.qualifying[0].rounds) {
      await processMatches(tx, tournament.id, dataToProcess.qualifying[0].rounds, false);
    }

    // 3. Process elimination rounds
    if (dataToProcess.eliminations) {
      for (const elimination of dataToProcess.eliminations) {
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
    if (dataToProcess.qualifying && dataToProcess.qualifying[0] && dataToProcess.qualifying[0].standings) {
      await processStandings(tx, tournament.id, dataToProcess.qualifying[0].standings, 'qualifying');
    }

    // 5. Process elimination standings
    if (dataToProcess.eliminations && dataToProcess.eliminations[0] && dataToProcess.eliminations[0].standings) {
      await processStandings(tx, tournament.id, dataToProcess.eliminations[0].standings, 'elimination');
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

