/**
 * Convert new Kickertool format to old format for compatibility
 * New format: disciplines -> stages -> groups -> rounds -> matches
 * Old format: qualifying/eliminations -> rounds/levels -> matches
 *
 * This is the ONLY converter in the codebase. It runs on import, before anything
 * is stored, so every consumer sees the old-format shape and nothing else has to
 * know that two export formats exist.
 *
 * See docs/TOURNAMENT_DATA_FORMAT.md for the invariants this must preserve, and
 * `npm run verify:conversion -- <export.json>` to check them against an export.
 */

function getDefaultLevelName(levelIndex) {
  return levelIndex === 0 ? 'Quarterfinal'
    : levelIndex === 1 ? 'Semifinal'
      : levelIndex === 2 ? 'Final'
        : levelIndex === 3 ? 'Third Place'
          : `Round ${levelIndex + 1}`
}

/**
 * In a bracket, players eliminated in the same round share a place.
 * rank 1-4 stay as-is; 5+ are grouped by elimination round:
 *   5-8 → 5, 9-16 → 9, 17-32 → 17, etc.
 */
export function rankToBracketPlace(rank) {
  if (!rank || rank <= 4) return rank || 0
  let base = 5
  let groupSize = 4
  while (base + groupSize <= rank) {
    base += groupSize
    groupSize *= 2
  }
  return base
}

function ensureEliminationLevelNames(data) {
  if (!data?.eliminations || !Array.isArray(data.eliminations)) return

  data.eliminations.forEach(elimination => {
    if (!elimination?.levels || !Array.isArray(elimination.levels)) return

    elimination.levels.forEach((level, levelIndex) => {
      if (!level.name) {
        level.name = level.groupName || getDefaultLevelName(levelIndex)
      }
    })
  })
}

/**
 * Convert new format tournament to old format
 * @param {Object} data - Tournament data in new format
 * @returns {Object} Tournament data in old format
 */
export function convertNewFormatToOld(data) {
  // If it already has qualifying/eliminations, assume it's old format
  if (data.qualifying || data.eliminations) {
    // Ensure elimination levels have names if they're missing
    ensureEliminationLevelNames(data)
    return data
  }

  // If it doesn't have disciplines, it's not the new format either
  if (!data.disciplines || !Array.isArray(data.disciplines) || data.disciplines.length === 0) {
    return data
  }

  // Create participants map for quick lookup
  // New format uses 'entries' instead of 'participants'
  const participantsMap = new Map()
  const participantsArray = data.participants || data.entries || []
  if (Array.isArray(participantsArray)) {
    participantsArray.forEach(participant => {
      participantsMap.set(participant._id, participant)
    })
  }

  // Kickertool has more than one single-player entry type: "player" for people
  // picked from the registered player list, and "player_name" for people typed
  // in by name on the night (those get a hash id instead of player-XXXX).
  // Anything that is not a team and carries a name is one person.
  const isPlayerEntry = (entry) =>
    !!entry && entry.type !== 'team' && Array.isArray(entry.name) && !!entry.name[0]

  // Helper to resolve participant to old-format player object list
  const getParticipantPlayers = (participant) => {
    if (!participant) return []

    // Team entries carry both players in name array, and ID is often "playerA_playerB"
    if (participant.type === 'team' && Array.isArray(participant.name)) {
      const names = participant.name.filter(Boolean)
      if (names.length === 0) return []

      const teamParts = typeof participant._id === 'string' ? participant._id.split('_') : []

      // If every team part resolves to a player entry, use those: the name array
      // order does not always match the order of the IDs in the team ID.
      const memberLookups = teamParts.map(partId => participantsMap.get(partId))
      const allMembersResolved = teamParts.length > 0 && memberLookups.every(isPlayerEntry)
      if (allMembersResolved) {
        return memberLookups.map(member => ({
          _id: member._id,
          name: member.name[0],
          guest: !!member.guest || !!participant.guest,
          external: null
        }))
      }

      return names.map((name, index) => ({
        _id: teamParts[index] || `${participant._id}:${index}`,
        name,
        guest: !!participant.guest,
        external: null
      }))
    }

    // Player entries carry a single name in an array
    if (isPlayerEntry(participant)) {
      const name = participant.name[0]
      return [{
        _id: participant._id,
        name,
        guest: !!participant.guest,
        external: null
      }]
    }

    return []
  }

  // Helper to get player objects from entry IDs
  const getPlayerInfo = (entryIds) => {
    if (!Array.isArray(entryIds)) return []

    const players = []
    const seen = new Set()

    entryIds.forEach(entryId => {
      const participant = participantsMap.get(entryId)
      if (participant) {
        getParticipantPlayers(participant).forEach(player => {
          const key = `${player._id}:${player.name}`
          if (!seen.has(key)) {
            seen.add(key)
            players.push(player)
          }
        })
        return
      }

      // Fallback: if team entry isn't present, derive players from combined team ID
      if (typeof entryId === 'string' && entryId.includes('_')) {
        entryId.split('_').forEach(playerId => {
          const playerEntry = participantsMap.get(playerId)
          if (!playerEntry) return

          getParticipantPlayers(playerEntry).forEach(player => {
            const key = `${player._id}:${player.name}`
            if (!seen.has(key)) {
              seen.add(key)
              players.push(player)
            }
          })
        })
      }
    })

    return players
  }

  // Old format lists standings per player: a team's stats appear once for every
  // member of that team. New format lists them per entry, which for doubles and
  // Monster-DYP is a team. Expand them so both formats aggregate identically.
  // Handles registered team entries as well as Monster-DYP team IDs like
  // "player-XXX_player-YYY" that are not registered as entries themselves.
  const buildPlayerStandings = (standing, place) => {
    const players = getPlayerInfo([standing.entryId])
    if (players.length === 0) return []

    const participant = participantsMap.get(standing.entryId)
    // A player who drops out mid-tournament is "paused" in the new format and
    // "deactivated" in the old one. Their played matches still count.
    const deactivated = !!(standing.deactivated || standing.paused || participant?.paused)
    const removed = !!(standing.removed || participant?.removed)
    const standingId = standing._id || standing.entryId

    return players.map(player => ({
      _id: players.length > 1 ? `${standingId}_${player._id}` : standingId,
      name: player.name,
      deactivated,
      removed,
      stats: {
        place,
        finalResult: standing.finalResult ?? false,
        matches: standing.matches ?? 0,
        points: standing.points ?? 0,
        won: standing.matchesWon ?? standing.won ?? 0,
        lost: standing.matchesLost ?? standing.lost ?? 0,
        draws: standing.matchesDraw ?? standing.draws ?? 0,
        goals: standing.goals ?? 0,
        goals_in: standing.goalsIn ?? 0,
        goal_diff: standing.goalsDiff ?? 0,
        points_per_game: standing.pointsPerMatch ?? 0,
        corrected_points_per_game: standing.correctedPointsPerMatch ?? 0,
        bh1: standing.bh1 ?? 0,
        bh2: standing.bh2 ?? 0,
        sb: standing.sb ?? 0,
        lives: standing.lives ?? 0,
        lastRound: standing.lastRound ?? -1,
        sets_won: standing.setsWon ?? 0,
        sets_lost: standing.setsLost ?? 0,
        sets_diff: standing.setsDiff ?? 0,
        dis_won: standing.encounterWon ?? 0,
        dis_lost: standing.encounterLost ?? 0,
        dis_draw: standing.encounterDraw ?? 0,
        dis_diff: standing.encounterDiff ?? 0
      },
      guest: !!player.guest,
      external: null
    }))
  }

  const extractTeamEntryIds = (match) => {
    if (Array.isArray(match.entries) && match.entries.length >= 2) {
      const rawTeam1 = match.entries[0]
      const rawTeam2 = match.entries[1]
      return [
        Array.isArray(rawTeam1) ? rawTeam1 : [rawTeam1],
        Array.isArray(rawTeam2) ? rawTeam2 : [rawTeam2]
      ]
    }

    if (Array.isArray(match.entryIds)) {
      const teamIds = match.entryIds.filter(
        entryId => typeof entryId === 'string' && entryId.includes('_') && participantsMap.has(entryId)
      )
      if (teamIds.length >= 2) {
        return [[teamIds[0]], [teamIds[1]]]
      }

      // Fallback: split entryIds in half (legacy assumption)
      const mid = Math.floor(match.entryIds.length / 2)
      return [match.entryIds.slice(0, mid), match.entryIds.slice(mid)]
    }

    return [[], []]
  }

  // Preserve original data but add converted structure
  const converted = {
    ...data,
    // Use startTime as createdAt if createdAt doesn't exist
    mode: data.mode || data.disciplines?.[0]?.entryType || null,
    nameType: data.nameType || data.disciplines?.[0]?.entryType || null,
    createdAt: data.createdAt || data.startTime || new Date().toISOString(),
    qualifying: [],
    eliminations: []
  }

  // Process each discipline
  data.disciplines.forEach(discipline => {
    if (!discipline.stages || !Array.isArray(discipline.stages)) return

    discipline.stages.forEach(stage => {
      if (!stage.groups || !Array.isArray(stage.groups)) return

      stage.groups.forEach(group => {
        const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : ''
        const groupName = typeof group.name === 'string' ? group.name.toLowerCase() : ''
        const isElimination = stage.tournamentMode === 'elimination' || (
          stageName && (
            stageName.includes('elimination') ||
            stageName.includes('final') ||
            groupName.includes('final') ||
            groupName.includes('semifinal') ||
            groupName.includes('quarterfinal')
          )
        )

        // Process rounds
        if (group.rounds && Array.isArray(group.rounds)) {
          group.rounds.forEach(round => {
            if (!round.matches || !Array.isArray(round.matches)) return

            const convertedMatches = round.matches
              .filter(match => match.state === 'played' && match.points && Array.isArray(match.points))
              .map(match => {
                const [team1EntryIds, team2EntryIds] = extractTeamEntryIds(match)

                // Resolve player objects for both teams
                const team1Players = getPlayerInfo(team1EntryIds)
                const team2Players = getPlayerInfo(team2EntryIds)

                if (team1Players.length === 0 || team2Players.length === 0) {
                  return null
                }

                // Convert match to old format
                return {
                  _id: match._id,
                  valid: match.state === 'played',
                  skipped: match.state !== 'played',
                  timeStart: match.startTime ? new Date(match.startTime).getTime() : null,
                  timeEnd: match.endTime ? new Date(match.endTime).getTime() : null,
                  roundId: round._id || null,
                  groupId: group._id || null,
                  result: match.points || [0, 0],
                  team1: {
                    players: team1Players,
                    name: team1Players.map(player => player.name).join(' / ')
                  },
                  team2: {
                    players: team2Players,
                    name: team2Players.map(player => player.name).join(' / ')
                  }
                }
              })
              .filter(match => match !== null)

            if (convertedMatches.length === 0) return

            if (isElimination) {
              // Add to eliminations
              if (converted.eliminations.length === 0) {
                converted.eliminations.push({ 
                  levels: [],
                  name: stage.name || group.name || 'Knockout Stage'
                })
              }
              const elimination = converted.eliminations[0]
              if (!elimination.levels) elimination.levels = []
              // Preserve name if not already set
              if (!elimination.name && (stage.name || group.name)) {
                elimination.name = stage.name || group.name
              }

              const roundName = typeof round.name === 'string' ? round.name.toUpperCase() : ''
              if (roundName.includes('THIRD_PLACE') || roundName.includes('THIRD PLACE')) {
                elimination.third = {
                  matches: convertedMatches,
                  name: 'Third Place'
                }
                // Old format carries this flag alongside the third-place match
                elimination.thirdPlace = true
              } else {
                elimination.levels.push({
                  matches: convertedMatches,
                  name: round.name || group.name || null,
                  groupName: group.name || null // Preserve group name separately for reference
                })
              }
            } else {
              // Add to qualifying
              if (converted.qualifying.length === 0) {
                converted.qualifying.push({ rounds: [] })
              }
              const qualifying = converted.qualifying[0]
              if (!qualifying.rounds) qualifying.rounds = []
              
              qualifying.rounds.push({
                matches: convertedMatches
              })
            }
          })
        }

        // Process standings
        if (group.standings && Array.isArray(group.standings)) {
          if (isElimination) {
            // Process elimination standings
            if (converted.eliminations.length === 0) {
              converted.eliminations.push({ standings: [] })
            }
            const elimination = converted.eliminations[0]
            if (!elimination.standings) elimination.standings = []

            group.standings.forEach(standing => {
              // Bracket-correct place for elimination: players knocked out in the
              // same round share a place.
              const rawRank = standing.rank ?? standing.result ?? 0
              elimination.standings.push(...buildPlayerStandings(standing, rankToBracketPlace(rawRank)))
            })
          } else {
            // Process qualifying standings
            if (converted.qualifying.length === 0) {
              converted.qualifying.push({ standings: [] })
            }
            const qualifying = converted.qualifying[0]
            if (!qualifying.standings) qualifying.standings = []

            group.standings.forEach(standing => {
              qualifying.standings.push(...buildPlayerStandings(standing, standing.rank ?? standing.result ?? 0))
            })
          }
        }
      })
    })
  })

  // Ensure all elimination levels have readable names
  ensureEliminationLevelNames(converted)

  return converted
}

