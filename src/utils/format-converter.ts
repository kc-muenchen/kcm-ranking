/**
 * Convert new Kickertool format to old format for compatibility (frontend version)
 * New format: disciplines -> stages -> groups -> rounds -> matches
 * Old format: qualifying/eliminations -> rounds/levels -> matches
 */

function getDefaultLevelName(levelIndex: number) {
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
function rankToBracketPlace(rank: number) {
  if (!rank || rank <= 4) return rank || 0
  let base = 5
  let groupSize = 4
  while (base + groupSize <= rank) {
    base += groupSize
    groupSize *= 2
  }
  return base
}

function ensureEliminationLevelNames(data: any) {
  if (!data?.eliminations || !Array.isArray(data.eliminations)) return

  data.eliminations.forEach((elimination: any) => {
    if (!elimination?.levels || !Array.isArray(elimination.levels)) return

    elimination.levels.forEach((level: any, levelIndex: number) => {
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
export function convertNewFormatToOld(data: any) {
  // If it already has qualifying/eliminations, assume it's old format
  if (data.qualifying || data.eliminations) {
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

  // Helper to resolve participant to old-format player object list
  const getParticipantPlayers = (participant: any) => {
    if (!participant) return []

    if (participant.type === 'team' && Array.isArray(participant.name)) {
      const names = participant.name.filter(Boolean)
      if (names.length === 0) return []

      const teamParts = typeof participant._id === 'string' ? participant._id.split('_') : []
      return names.map((name: string, index: number) => ({
        _id: teamParts[index] || `${participant._id}:${index}`,
        name,
        guest: !!participant.guest,
        external: null
      }))
    }

    if (participant.type === 'player' && Array.isArray(participant.name) && participant.name.length > 0) {
      const name = participant.name[0]
      if (!name) return []
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
  const getPlayerInfo = (entryIds: any[]) => {
    if (!Array.isArray(entryIds)) return []

    const players: any[] = []
    const seen = new Set<string>()

    entryIds.forEach((entryId: any) => {
      const participant = participantsMap.get(entryId)
      if (participant) {
        getParticipantPlayers(participant).forEach((player: any) => {
          const key = `${player._id}:${player.name}`
          if (!seen.has(key)) {
            seen.add(key)
            players.push(player)
          }
        })
        return
      }

      if (typeof entryId === 'string' && entryId.includes('_')) {
        entryId.split('_').forEach((playerId: string) => {
          const playerEntry = participantsMap.get(playerId)
          if (!playerEntry) return

          getParticipantPlayers(playerEntry).forEach((player: any) => {
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

  const extractTeamEntryIds = (match: any) => {
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
        (entryId: any) => typeof entryId === 'string' && entryId.includes('_') && participantsMap.has(entryId)
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
  data.disciplines.forEach((discipline: any) => {
    if (!discipline.stages || !Array.isArray(discipline.stages)) return

    discipline.stages.forEach((stage: any) => {
      if (!stage.groups || !Array.isArray(stage.groups)) return

      stage.groups.forEach((group: any) => {
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
          group.rounds.forEach((round: any) => {
            if (!round.matches || !Array.isArray(round.matches)) return

            const convertedMatches = round.matches
              .filter((match: any) => match.state === 'played' && match.points && Array.isArray(match.points))
              .map((match: any) => {
                const [team1EntryIds, team2EntryIds] = extractTeamEntryIds(match)

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
                    name: team1Players.map((player: any) => player.name).join(' / ')
                  },
                  team2: {
                    players: team2Players,
                    name: team2Players.map((player: any) => player.name).join(' / ')
                  }
                }
              })
              .filter((match: any) => match !== null)

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

            group.standings.forEach((standing: any) => {
              if (standing.removed || standing.paused) return
              const participant = participantsMap.get(standing.entryId)
              if (!participant) return

              // Get player name(s)
              let playerName = null
              if (participant.type === 'team' && Array.isArray(participant.name)) {
                // For teams, join all player names so we can split them later
                playerName = participant.name.filter(Boolean).join(' / ')
              } else if (participant.type === 'player' && Array.isArray(participant.name) && participant.name.length > 0) {
                playerName = participant.name[0]
              }

              if (!playerName) return

              // Convert standing to old format (bracket-correct place for elimination)
              const rawRank = standing.rank ?? standing.result ?? 0
              elimination.standings.push({
                _id: standing._id || standing.entryId,
                name: playerName,
                deactivated: standing.deactivated || false,
                removed: standing.removed || false,
                stats: {
                  place: rankToBracketPlace(rawRank),
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
                guest: participant.guest || false,
                external: null
              })
            })
          } else {
            // Process qualifying standings
            if (converted.qualifying.length === 0) {
              converted.qualifying.push({ standings: [] })
            }
            const qualifying = converted.qualifying[0]
            if (!qualifying.standings) qualifying.standings = []

            group.standings.forEach((standing: any) => {
              if (standing.removed || standing.paused) return
              const participant = participantsMap.get(standing.entryId)
              if (!participant) return

              // Get player name(s)
              let playerName = null
              if (participant.type === 'team' && Array.isArray(participant.name)) {
                // For teams, join all player names so we can split them later
                playerName = participant.name.filter(Boolean).join(' / ')
              } else if (participant.type === 'player' && Array.isArray(participant.name) && participant.name.length > 0) {
                playerName = participant.name[0]
              }

              if (!playerName) return

              // Convert standing to old format
              qualifying.standings.push({
                _id: standing._id || standing.entryId,
                name: playerName,
                deactivated: standing.deactivated || false,
                removed: standing.removed || false,
                stats: {
                  place: standing.rank ?? standing.result ?? 0,
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
                guest: participant.guest || false,
                external: null
              })
            })
          }
        }
      })
    })
  })

  ensureEliminationLevelNames(converted)

  return converted
}

