/**
 * Convert new Kickertool format to old format for compatibility (frontend version)
 * New format: disciplines -> stages -> groups -> rounds -> matches
 * Old format: qualifying/eliminations -> rounds/levels -> matches
 */

/**
 * Convert new format tournament to old format
 * @param {Object} data - Tournament data in new format
 * @returns {Object} Tournament data in old format
 */
export function convertNewFormatToOld(data) {
  // If it already has qualifying/eliminations, assume it's old format
  // But we still need to ensure names are set for levels that might be missing them
  if (data.qualifying || data.eliminations) {
    // Ensure elimination levels have names if they're missing
    if (data.eliminations && Array.isArray(data.eliminations)) {
      data.eliminations.forEach((elimination, elimIndex) => {
        if (elimination.levels && Array.isArray(elimination.levels)) {
          elimination.levels.forEach((level, levelIndex) => {
            // If name is missing, use groupName if available, otherwise generate one
            if (!level.name) {
              level.name = level.groupName || 
                          (levelIndex === 0 ? 'Quarterfinal' : 
                           levelIndex === 1 ? 'Semifinal' : 
                           levelIndex === 2 ? 'Final' : 
                           levelIndex === 3 ? 'Third Place' :
                           `Round ${levelIndex + 1}`)
            }
          })
        }
      })
    }
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

  // Helper to get player names from entry IDs
  const getPlayerNames = (entryIds) => {
    if (!Array.isArray(entryIds)) return []
    
    const names = []
    
    entryIds.forEach(entryId => {
      const participant = participantsMap.get(entryId)
      if (!participant) return
      
      // For teams, name is an array of player names
      if (participant.type === 'team' && Array.isArray(participant.name)) {
        names.push(...participant.name.filter(Boolean))
      }
      // For players, name is an array with one element
      else if (participant.type === 'player' && Array.isArray(participant.name) && participant.name.length > 0) {
        names.push(participant.name[0])
      }
    })
    
    return names.filter(Boolean)
  }

  // Preserve original data but add converted structure
  const converted = {
    ...data,
    // Use startTime as createdAt if createdAt doesn't exist
    createdAt: data.createdAt || data.startTime || new Date().toISOString(),
    qualifying: [],
    eliminations: []
  }
  console.log('data', data)
  // Process each discipline
  data.disciplines.forEach(discipline => {
    if (!discipline.stages || !Array.isArray(discipline.stages)) return

    discipline.stages.forEach(stage => {
      if (!stage.groups || !Array.isArray(stage.groups)) return

      stage.groups.forEach(group => {
        const isElimination = stage.name && (
          stage.name.toLowerCase().includes('elimination') ||
          stage.name.toLowerCase().includes('final') ||
          group.name && (
            group.name.toLowerCase().includes('final') ||
            group.name.toLowerCase().includes('semifinal') ||
            group.name.toLowerCase().includes('quarterfinal')
          )
        )

        // Process rounds
        if (group.rounds && Array.isArray(group.rounds)) {
          group.rounds.forEach(round => {
            if (!round.matches || !Array.isArray(round.matches)) return

            const convertedMatches = round.matches
              .filter(match => match.state === 'played' && match.points && Array.isArray(match.points))
              .map(match => {
                // Get teams from entries array
                // entries is array of arrays: [[team1_player1, team1_player2], [team2_player1, team2_player2]]
                // or could be team IDs: [[team_id_1], [team_id_2]]
                let team1EntryIds = []
                let team2EntryIds = []
                
                if (Array.isArray(match.entries) && match.entries.length >= 2) {
                  team1EntryIds = Array.isArray(match.entries[0]) ? match.entries[0] : [match.entries[0]]
                  team2EntryIds = Array.isArray(match.entries[1]) ? match.entries[1] : [match.entries[1]]
                } else if (Array.isArray(match.entryIds)) {
                  // Fallback: split entryIds in half (assuming doubles)
                  const mid = Math.floor(match.entryIds.length / 2)
                  team1EntryIds = match.entryIds.slice(0, mid)
                  team2EntryIds = match.entryIds.slice(mid)
                }

                // Get player names for each team
                const team1Players = getPlayerNames(team1EntryIds)
                const team2Players = getPlayerNames(team2EntryIds)

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
                  result: match.points || [0, 0],
                  team1: {
                    players: team1Players.map(name => ({ name })),
                    name: team1Players.join(' / ')
                  },
                  team2: {
                    players: team2Players.map(name => ({ name })),
                    name: team2Players.join(' / ')
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
              elimination.levels.push({
                matches: convertedMatches,
                name: round.name || group.name || null,
                groupName: group.name || null  // Preserve group name separately for reference
              })
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
              elimination.standings.push({
                _id: standing._id || standing.entryId,
                name: playerName,
                deactivated: standing.deactivated || false,
                removed: standing.removed || false,
                stats: {
                  place: standing.rank || standing.result || 0,
                  matches: standing.matches || 0,
                  points: standing.points || 0,
                  won: standing.matchesWon || 0,
                  lost: standing.matchesLost || 0,
                  goals: standing.goals || 0,
                  goals_in: standing.goalsIn || 0,
                  goal_diff: standing.goalsDiff || 0,
                  points_per_game: standing.pointsPerMatch || 0,
                  corrected_points_per_game: standing.correctedPointsPerMatch || 0,
                  bh1: standing.bh1 || 0,
                  bh2: standing.bh2 || 0
                },
                external: participant.guest || false
              })
            })
          } else {
            // Process qualifying standings
            if (converted.qualifying.length === 0) {
              converted.qualifying.push({ standings: [] })
            }
            const qualifying = converted.qualifying[0]
            if (!qualifying.standings) qualifying.standings = []

            group.standings.forEach(standing => {
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
                  place: standing.rank || standing.result || 0,
                  matches: standing.matches || 0,
                  points: standing.points || 0,
                  won: standing.matchesWon || 0,
                  lost: standing.matchesLost || 0,
                  goals: standing.goals || 0,
                  goals_in: standing.goalsIn || 0,
                  goal_diff: standing.goalsDiff || 0,
                  points_per_game: standing.pointsPerMatch || 0,
                  corrected_points_per_game: standing.correctedPointsPerMatch || 0,
                  bh1: standing.bh1 || 0,
                  bh2: standing.bh2 || 0
                },
                external: participant.guest || false
              })
            })
          }
        }
      })
    })
  })

  return converted
}

