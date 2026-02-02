import { normalizePlayerNameSync } from '../config/playerAliases'
import { getConservativeRating } from './trueskill'
import { calculateSeasonPoints } from '../constants/seasonPoints'
import { getSeasonYearForDate, isTournamentInSeasonWindow } from './seasonUtils'
import { API_ENDPOINTS, apiFetch } from '../config/api'
import { Rating } from 'ts-trueskill'

/**
 * Calculate Buchholz and Sonneborn-Berger tie-breakers from match data
 * Only uses qualifying matches (excludes knockout/elimination stages)
 */
function calculateTieBreakers(tournamentData, playerStatsMap) {
  // Create a map from player ID to normalized name for lookup
  const playerIdToName = new Map()
  if (tournamentData.qualifying && tournamentData.qualifying[0] && tournamentData.qualifying[0].standings) {
    tournamentData.qualifying[0].standings.forEach(player => {
      if (!player.deactivated && !player.removed) {
        const normalizedName = normalizePlayerNameSync(player.name)
        playerIdToName.set(player._id, normalizedName)
      }
    })
  }
  
  // Create maps: playerName -> opponents and results
  const playerOpponents = new Map() // playerName -> Set of opponent player names
  const playerResults = new Map() // playerName -> Map of opponentName -> result (1=win, 0.5=draw, 0=loss)
  
  // Process qualifying matches only (exclude elimination/knockout stages)
  if (tournamentData.qualifying && tournamentData.qualifying[0] && tournamentData.qualifying[0].rounds) {
    tournamentData.qualifying[0].rounds.forEach(round => {
      if (!round.matches) return
      
      round.matches.forEach(match => {
        if (!match.valid || match.skipped || !match.result || !match.team1 || !match.team2) return
        if (!match.team1.players || !match.team2.players) return
        
        // Get player names - handle both old format (IDs) and new format (names already present)
        const team1PlayerNames = match.team1.players
          .map(p => {
            // If name is already present (converted format), use it directly
            if (p.name) {
              return normalizePlayerNameSync(p.name)
            }
            // Otherwise, look up by ID (old format)
            const name = playerIdToName.get(p._id || p.id)
            return name ? normalizePlayerNameSync(name) : null
          })
          .filter(Boolean)
        const team2PlayerNames = match.team2.players
          .map(p => {
            // If name is already present (converted format), use it directly
            if (p.name) {
              return normalizePlayerNameSync(p.name)
            }
            // Otherwise, look up by ID (old format)
            const name = playerIdToName.get(p._id || p.id)
            return name ? normalizePlayerNameSync(name) : null
          })
          .filter(Boolean)
        const team1Score = match.result[0]
        const team2Score = match.result[1]
        
        // Determine result: 1 for win, 0.5 for draw, 0 for loss
        let team1Result = 0
        let team2Result = 0
        if (team1Score > team2Score) {
          team1Result = 1
          team2Result = 0
        } else if (team1Score < team2Score) {
          team1Result = 0
          team2Result = 1
        } else {
          team1Result = 0.5
          team2Result = 0.5
        }
        
        // Record opponents and results for each player (by name)
        team1PlayerNames.forEach(playerName => {
          if (!playerOpponents.has(playerName)) {
            playerOpponents.set(playerName, new Set())
            playerResults.set(playerName, new Map())
          }
          team2PlayerNames.forEach(opponentName => {
            playerOpponents.get(playerName).add(opponentName)
            playerResults.get(playerName).set(opponentName, team1Result)
          })
        })
        
        team2PlayerNames.forEach(playerName => {
          if (!playerOpponents.has(playerName)) {
            playerOpponents.set(playerName, new Set())
            playerResults.set(playerName, new Map())
          }
          team1PlayerNames.forEach(opponentName => {
            playerOpponents.get(playerName).add(opponentName)
            playerResults.get(playerName).set(opponentName, team2Result)
          })
        })
      })
    })
  }
  
  // Note: Elimination/knockout matches are excluded from tie-breaker calculations
  // This ensures fair comparison since knockout brackets are based on qualifying results
  
  // Calculate Buchholz and Sonneborn-Berger for each player
  playerStatsMap.forEach((player, playerName) => {
    let buchholz = 0
    let sonnebornBerger = 0
    
    const opponents = playerOpponents.get(playerName) || new Set()
    const results = playerResults.get(playerName) || new Map()
    
    opponents.forEach(opponentName => {
      const opponent = playerStatsMap.get(opponentName)
      if (opponent) {
        const opponentPoints = opponent.points || 0
        buchholz += opponentPoints
        
        const result = results.get(opponentName) || 0
        sonnebornBerger += opponentPoints * result
      }
    })
    
    player.buchholz = buchholz
    player.sonnebornBerger = sonnebornBerger
  })
}

/**
 * Process players for a single tournament view
 */
export const processTournamentPlayers = (tournamentData) => {
  if (!tournamentData.qualifying || tournamentData.qualifying.length === 0) {
    return []
  }

  // Get qualifying standings
  const qualifyingStandings = tournamentData.qualifying[0].standings || []
  
  // Create a map to aggregate stats by player name (not ID, to handle merged tournaments)
  const playerStatsMap = new Map()
  // Also create a case-insensitive lookup map as a fallback
  const playerStatsMapLowercase = new Map()
  
  // Process qualifying round
  qualifyingStandings.forEach(player => {
    if (player.deactivated || player.removed) return
    
    const normalizedName = normalizePlayerNameSync(player.name)
    const playerData = {
      id: player._id,
      name: normalizedName,
      qualifyingPlace: player.stats.place,
      matches: player.stats.matches,
      points: player.stats.points,
      won: player.stats.won,
      lost: player.stats.lost,
      goalsFor: player.stats.goals,
      goalsAgainst: player.stats.goals_in,
      goalDiff: player.stats.goal_diff,
      pointsPerGame: player.stats.points_per_game,
      correctedPointsPerGame: player.stats.corrected_points_per_game,
      bh1: player.stats.bh1,
      bh2: player.stats.bh2,
      external: player.external,
      eliminationPlace: null,
      buchholz: 0,
      sonnebornBerger: 0
    }
    
    playerStatsMap.set(normalizedName, playerData)
    // Also store by lowercase key for fallback lookup
    const lowerKey = normalizedName.toLowerCase().trim()
    if (!playerStatsMapLowercase.has(lowerKey)) {
      playerStatsMapLowercase.set(lowerKey, normalizedName)
    }
  })
  
  // Process elimination rounds if they exist
  if (tournamentData.eliminations && tournamentData.eliminations.length > 0) {
    tournamentData.eliminations.forEach(elimination => {
      const eliminationStandings = elimination.standings || []
      
      eliminationStandings.forEach(player => {
        if (player.deactivated || player.removed) return
        
        const playerName = player.name
        const eliminationPlace = player.stats.place
        
        // Check if this is a team name (contains " / " or " | ")
        const teamNameSeparators = [' / ', ' | ', ' & ']
        const isTeamName = teamNameSeparators.some(sep => playerName.includes(sep))
        
        if (isTeamName) {
          // Split team name into individual players
          let playerNames = []
          if (playerName.includes(' / ')) {
            playerNames = playerName.split(' / ').map(n => n.trim())
          } else if (playerName.includes(' | ')) {
            playerNames = playerName.split(' | ').map(n => n.trim())
          } else if (playerName.includes(' & ')) {
            playerNames = playerName.split(' & ').map(n => n.trim())
          }
          
          // Set elimination place for all players in the team
          playerNames.forEach(name => {
            const normalizedName = normalizePlayerNameSync(name)
            let existingPlayer = playerStatsMap.get(normalizedName)
            
            // Fallback: try case-insensitive lookup if exact match not found
            if (!existingPlayer) {
              const lowerKey = normalizedName.toLowerCase().trim()
              const matchingKey = playerStatsMapLowercase.get(lowerKey)
              if (matchingKey) {
                existingPlayer = playerStatsMap.get(matchingKey)
              }
            }
            
            if (existingPlayer) {
              // Add elimination stats to existing player (only add once per team)
              if (existingPlayer.eliminationPlace === null || existingPlayer.eliminationPlace === undefined) {
                existingPlayer.matches += player.stats.matches
                existingPlayer.points += player.stats.points
                existingPlayer.won += player.stats.won
                existingPlayer.lost += player.stats.lost
                existingPlayer.goalsFor += player.stats.goals
                existingPlayer.goalsAgainst += player.stats.goals_in
                existingPlayer.goalDiff = existingPlayer.goalsFor - existingPlayer.goalsAgainst
                
                // Recalculate points per game
                if (existingPlayer.matches > 0) {
                  existingPlayer.pointsPerGame = (existingPlayer.points / existingPlayer.matches).toFixed(2)
                }
              }
              // Set elimination place for this player (both players get the same place)
              existingPlayer.eliminationPlace = eliminationPlace
            } else {
              // New player in elimination (shouldn't happen often, but handle it)
              playerStatsMap.set(normalizedName, {
                id: player._id,
                name: normalizedName,
                qualifyingPlace: null,
                matches: player.stats.matches,
                points: player.stats.points,
                won: player.stats.won,
                lost: player.stats.lost,
                goalsFor: player.stats.goals,
                goalsAgainst: player.stats.goals_in,
                goalDiff: player.stats.goal_diff,
                pointsPerGame: player.stats.points_per_game || '0.00',
                correctedPointsPerGame: player.stats.corrected_points_per_game || '0.00',
                bh1: player.stats.bh1,
                bh2: player.stats.bh2,
                external: player.external,
                eliminationPlace: eliminationPlace,
                buchholz: 0,
                sonnebornBerger: 0
              })
            }
          })
        } else {
          // Single player (not a team)
          const normalizedName = normalizePlayerNameSync(playerName)
          let existingPlayer = playerStatsMap.get(normalizedName)
          
          // Fallback: try case-insensitive lookup if exact match not found
          if (!existingPlayer) {
            const lowerKey = normalizedName.toLowerCase().trim()
            const matchingKey = playerStatsMapLowercase.get(lowerKey)
            if (matchingKey) {
              existingPlayer = playerStatsMap.get(matchingKey)
            }
          }
          
          if (existingPlayer) {
            // Add elimination stats to existing player
            existingPlayer.matches += player.stats.matches
            existingPlayer.points += player.stats.points
            existingPlayer.won += player.stats.won
            existingPlayer.lost += player.stats.lost
            existingPlayer.goalsFor += player.stats.goals
            existingPlayer.goalsAgainst += player.stats.goals_in
            existingPlayer.goalDiff = existingPlayer.goalsFor - existingPlayer.goalsAgainst
            existingPlayer.eliminationPlace = eliminationPlace
            
            // Recalculate points per game
            if (existingPlayer.matches > 0) {
              existingPlayer.pointsPerGame = (existingPlayer.points / existingPlayer.matches).toFixed(2)
            }
          } else {
            // New player in elimination (shouldn't happen often, but handle it)
            playerStatsMap.set(normalizedName, {
              id: player._id,
              name: normalizedName,
              qualifyingPlace: null,
              matches: player.stats.matches,
              points: player.stats.points,
              won: player.stats.won,
              lost: player.stats.lost,
              goalsFor: player.stats.goals,
              goalsAgainst: player.stats.goals_in,
              goalDiff: player.stats.goal_diff,
              pointsPerGame: player.stats.points_per_game || '0.00',
              correctedPointsPerGame: player.stats.corrected_points_per_game || '0.00',
              bh1: player.stats.bh1,
              bh2: player.stats.bh2,
              external: player.external,
              eliminationPlace: eliminationPlace,
              buchholz: 0,
              sonnebornBerger: 0
            })
          }
        }
      })
    })
  }
  
  // Calculate Buchholz and Sonneborn-Berger from match data
  calculateTieBreakers(tournamentData, playerStatsMap)
  
  // Convert map to array and calculate final stats
  const players = Array.from(playerStatsMap.values())
    .map(player => ({
      ...player,
      winRate: player.matches > 0 
        ? ((player.won / player.matches) * 100).toFixed(1)
        : 0,
      // Format tie-breakers to 2 decimal places
      buchholz: player.buchholz ? parseFloat(player.buchholz.toFixed(2)) : 0,
      sonnebornBerger: player.sonnebornBerger ? parseFloat(player.sonnebornBerger.toFixed(2)) : 0
    }))
    .sort((a, b) => {
      // Sort by elimination place first (if both have it), then by qualifying place
      // This ensures knockout players are sorted by their knockout results
      if (a.eliminationPlace !== null && b.eliminationPlace !== null) {
        return a.eliminationPlace - b.eliminationPlace
      }
      if (a.eliminationPlace !== null && a.eliminationPlace !== undefined) return -1
      if (b.eliminationPlace !== null && b.eliminationPlace !== undefined) return 1
      return (a.qualifyingPlace ?? Infinity) - (b.qualifyingPlace ?? Infinity)
    })
  
  // Calculate unified combined ranking
  // Strategy: Knockout players get ranks 1-N (from knockout results)
  // Qualifying-only players get ranks (N+1)+, re-ranked sequentially by qualifying position
  
  // Filter players: knockout players have a valid eliminationPlace (number >= 1)
  const knockoutPlayers = players.filter(p => 
    p.eliminationPlace !== null && 
    p.eliminationPlace !== undefined && 
    typeof p.eliminationPlace === 'number' &&
    p.eliminationPlace >= 1
  )
  const qualifyingOnlyPlayers = players.filter(p => 
    p.eliminationPlace === null || 
    p.eliminationPlace === undefined || 
    (typeof p.eliminationPlace !== 'number') ||
    p.eliminationPlace < 1
  )
  const numKnockoutPlayers = knockoutPlayers.length
  
  // Sort qualifying-only players by their qualifying place
  const sortedQualifyingOnly = [...qualifyingOnlyPlayers].sort((a, b) => {
    const aPlace = a.qualifyingPlace ?? Infinity
    const bPlace = b.qualifyingPlace ?? Infinity
    return aPlace - bPlace
  })
  
  // Create a map for quick lookup: player name -> index in sorted qualifying-only list
  const qualifyingOnlyIndexMap = new Map()
  sortedQualifyingOnly.forEach((player, index) => {
    qualifyingOnlyIndexMap.set(player.name, index)
  })
  
  // Assign final places to all players
  const playersWithFinalPlace = players.map(player => {
    if (player.eliminationPlace !== null && player.eliminationPlace !== undefined) {
      // Player made it to knockout - use knockout place as final place (1-N)
      return {
        ...player,
        finalPlace: player.eliminationPlace
      }
    } else {
      // Player only in qualifying - assign sequential rank starting after knockout players
      const indexInQualifyingOnly = qualifyingOnlyIndexMap.get(player.name) ?? sortedQualifyingOnly.length
      const calculatedFinalPlace = numKnockoutPlayers + indexInQualifyingOnly + 1
      return {
        ...player,
        finalPlace: calculatedFinalPlace
      }
    }
  })
  
  // Re-sort by finalPlace to ensure correct display order
  return playersWithFinalPlace.sort((a, b) => {
    const aPlace = a.finalPlace ?? Infinity
    const bPlace = b.finalPlace ?? Infinity
    return aPlace - bPlace
  })
}

/**
 * Process player final placements from tournament data
 */
const getPlayerFinalPlacements = (tournament) => {
  const qualifyingStandings = tournament.data.qualifying?.[0]?.standings || []
  const eliminationStandings = tournament.data.eliminations?.[0]?.standings || []
  
  // Create a map to track placements and stats
  const playerData = new Map()
  
  // First, add all qualifying placements
  qualifyingStandings.forEach(player => {
    if (!player.removed && player.stats.matches > 0) {
      const normalizedName = normalizePlayerNameSync(player.name)
      playerData.set(normalizedName, {
        qualifyingPlace: player.stats.place,
        eliminationPlace: null,
        stats: { ...player.stats },
        external: player.external
      })
    }
  })
  
  // Override with elimination placements (these are the final tournament results)
  // Also ADD elimination stats to qualifying stats (not replace them)
  eliminationStandings.forEach(player => {
    if (!player.removed) {
      const playerName = player.name
      const eliminationPlace = player.stats.place
      
      // Check if this is a team name (contains " / " or " | ")
      const teamNameSeparators = [' / ', ' | ', ' & ']
      const isTeamName = teamNameSeparators.some(sep => playerName.includes(sep))
      
      if (isTeamName) {
        // Split team name into individual players
        let playerNames = []
        if (playerName.includes(' / ')) {
          playerNames = playerName.split(' / ').map(n => n.trim())
        } else if (playerName.includes(' | ')) {
          playerNames = playerName.split(' | ').map(n => n.trim())
        } else if (playerName.includes(' & ')) {
          playerNames = playerName.split(' & ').map(n => n.trim())
        }
        
        // Set elimination place for all players in the team
        // Track if we've added stats to avoid double-counting
        let statsAdded = false
        playerNames.forEach((name, index) => {
          const normalizedName = normalizePlayerNameSync(name)
          const existing = playerData.get(normalizedName)
          
          if (existing) {
            // Update elimination place and stats
            if (!statsAdded) {
              existing.eliminationPlace = eliminationPlace
              existing.stats.matches += player.stats.matches
              existing.stats.points += player.stats.points
              existing.stats.won += player.stats.won
              existing.stats.lost += player.stats.lost
              existing.stats.goals += player.stats.goals
              existing.stats.goals_in += player.stats.goals_in
              existing.stats.goal_diff = existing.stats.goals - existing.stats.goals_in
              statsAdded = true
            } else {
              // For other players in team, just set elimination place
              existing.eliminationPlace = eliminationPlace
            }
          } else {
            // Player only in elimination (didn't play qualifying)
            if (!statsAdded) {
              playerData.set(normalizedName, {
                qualifyingPlace: null,
                eliminationPlace: eliminationPlace,
                stats: { ...player.stats },
                external: player.external
              })
              statsAdded = true
            } else {
              // For other players, just set elimination place
              playerData.set(normalizedName, {
                qualifyingPlace: null,
                eliminationPlace: eliminationPlace,
                stats: {
                  matches: 0,
                  points: 0,
                  won: 0,
                  lost: 0,
                  goals: 0,
                  goals_in: 0,
                  goal_diff: 0
                },
                external: player.external
              })
            }
          }
        })
      } else {
        // Single player (not a team)
        const normalizedName = normalizePlayerNameSync(playerName)
        const existing = playerData.get(normalizedName)
        
        if (existing) {
          // Add elimination stats to qualifying stats
          existing.eliminationPlace = eliminationPlace
          existing.stats.matches += player.stats.matches
          existing.stats.points += player.stats.points
          existing.stats.won += player.stats.won
          existing.stats.lost += player.stats.lost
          existing.stats.goals += player.stats.goals
          existing.stats.goals_in += player.stats.goals_in
          existing.stats.goal_diff = existing.stats.goals - existing.stats.goals_in
        } else {
          // Player only in elimination (didn't play qualifying)
          playerData.set(normalizedName, {
            qualifyingPlace: null,
            eliminationPlace: eliminationPlace,
            stats: { ...player.stats },
            external: player.external
          })
        }
      }
    }
  })
  
  // Calculate combined ranking (finalPlace) for season points
  // Knockout players get ranks 1-N, qualifying-only players get ranks (N+1)+
  const allPlayerEntries = Array.from(playerData.entries())
  const knockoutPlayers = allPlayerEntries.filter(([name, data]) => 
    data.eliminationPlace !== null && data.eliminationPlace !== undefined
  )
  const qualifyingOnlyPlayers = allPlayerEntries.filter(([name, data]) => 
    data.eliminationPlace === null || data.eliminationPlace === undefined
  )
  const numKnockoutPlayers = knockoutPlayers.length
  
  // Sort qualifying-only players by their qualifying place
  const sortedQualifyingOnly = [...qualifyingOnlyPlayers].sort((a, b) => {
    const aPlace = a[1].qualifyingPlace ?? Infinity
    const bPlace = b[1].qualifyingPlace ?? Infinity
    return aPlace - bPlace
  })
  
  // Create a map for quick lookup: player name -> index in sorted qualifying-only list
  const qualifyingOnlyIndexMap = new Map()
  sortedQualifyingOnly.forEach(([name, data], index) => {
    qualifyingOnlyIndexMap.set(name, index)
  })
  
  // Convert to final placement map with combined ranking
  const playerFinalPlacement = new Map()
  playerData.forEach((data, normalizedName) => {
    let finalPlace
    if (data.eliminationPlace !== null && data.eliminationPlace !== undefined) {
      // Player made it to knockout - use knockout place (1-N)
      finalPlace = data.eliminationPlace
    } else {
      // Player only in qualifying - assign sequential rank starting after knockout players
      const indexInQualifyingOnly = qualifyingOnlyIndexMap.get(normalizedName) ?? sortedQualifyingOnly.length
      finalPlace = numKnockoutPlayers + indexInQualifyingOnly + 1
    }
    
    playerFinalPlacement.set(normalizedName, {
      place: finalPlace, // Use combined ranking for season points
      stats: data.stats,
      external: data.external
    })
  })
  
  return playerFinalPlacement
}

/**
 * Aggregate player stats from multiple tournaments
 */
const aggregatePlayerStats = (tournaments) => {
  const playerStats = new Map()

  tournaments.forEach(tournament => {
    const playerFinalPlacement = getPlayerFinalPlacements(tournament)
    
    // Process each player's tournament result
    playerFinalPlacement.forEach((playerData, normalizedName) => {
      if (!playerStats.has(normalizedName)) {
        playerStats.set(normalizedName, {
          name: normalizedName,
          matches: 0,
          points: 0,
          won: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          tournaments: 0,
          external: playerData.external,
          bestPlace: playerData.place,
          places: [],
          seasonPoints: 0
        })
      }

      const stats = playerStats.get(normalizedName)
      stats.matches += playerData.stats.matches
      stats.points += playerData.stats.points
      stats.won += playerData.stats.won
      stats.lost += playerData.stats.lost
      stats.goalsFor += playerData.stats.goals
      stats.goalsAgainst += playerData.stats.goals_in
      stats.tournaments += 1
      stats.bestPlace = Math.min(stats.bestPlace, playerData.place)
      stats.places.push(playerData.place)
      
      // Calculate season points
      stats.seasonPoints += calculateSeasonPoints(playerData.place)
    })
  })

  return playerStats
}

/**
 * Convert aggregated stats to player array with derived stats
 */
const convertToPlayerArray = (playerStats, trueSkillRatings) => {
  // Deduplicate by normalized name (in case of normalization issues)
  // Use case-insensitive matching as a safety net
  const deduplicatedMap = new Map()
  const keyToOriginalName = new Map() // lowercase key -> first normalized name seen
  
  playerStats.forEach((player, normalizedName) => {
    const key = normalizedName.toLowerCase().trim()
    
    if (!keyToOriginalName.has(key)) {
      // First time seeing this player (case-insensitive)
      keyToOriginalName.set(key, normalizedName)
      deduplicatedMap.set(normalizedName, player)
    } else {
      // Duplicate found - merge with existing player
      const existingName = keyToOriginalName.get(key)
      const existing = deduplicatedMap.get(existingName)
      existing.matches += player.matches
      existing.points += player.points
      existing.won += player.won
      existing.lost += player.lost
      existing.goalsFor += player.goalsFor
      existing.goalsAgainst += player.goalsAgainst
      existing.tournaments += player.tournaments
      existing.bestPlace = Math.min(existing.bestPlace, player.bestPlace)
      existing.places.push(...player.places)
      existing.seasonPoints += player.seasonPoints
    }
  })
  
  return Array.from(deduplicatedMap.values())
    .filter(player => player.matches > 0)
    .map(player => {
      const rating = trueSkillRatings.get(player.name)
      const trueSkill = rating ? getConservativeRating(rating) : 0
      
      return {
        id: player.name,
        name: player.name,
        matches: player.matches,
        points: player.points,
        won: player.won,
        lost: player.lost,
        goalsFor: player.goalsFor,
        goalsAgainst: player.goalsAgainst,
        goalDiff: player.goalsFor - player.goalsAgainst,
        tournaments: player.tournaments,
        bestPlace: player.bestPlace,
        avgPlace: (player.places.reduce((a, b) => a + b, 0) / player.places.length).toFixed(1),
        pointsPerGame: player.matches > 0 ? (player.points / player.matches).toFixed(2) : 0,
        winRate: player.matches > 0 
          ? ((player.won / player.matches) * 100).toFixed(1)
          : 0,
        trueSkill: trueSkill,
        mu: rating ? rating.mu : 25,
        sigma: rating ? rating.sigma : 8.333,
        seasonPoints: player.seasonPoints,
        external: player.external
      }
    })
    .sort((a, b) => {
      // Sort by season points (primary), then TrueSkill, then total points
      const seasonPointsDiff = b.seasonPoints - a.seasonPoints
      if (seasonPointsDiff !== 0) return seasonPointsDiff
      
      const trueSkillDiff = b.trueSkill - a.trueSkill
      if (trueSkillDiff !== 0) return trueSkillDiff
      
      return b.points - a.points
    })
    .map((player, index) => ({
      ...player,
      place: index + 1
    }))
}

/**
 * Fetch TrueSkill ratings from backend API
 * @returns {Promise<Object>} Object with playerRatings Map and playerHistory Map
 */
async function fetchTrueSkillRatings() {
  try {
    const response = await apiFetch(API_ENDPOINTS.trueskill)
    const { ratings, history } = response.data
    
    // Convert ratings object to Map of Rating objects
    const playerRatings = new Map()
    Object.entries(ratings).forEach(([playerName, ratingData]) => {
      playerRatings.set(playerName, new Rating(ratingData.mu, ratingData.sigma))
    })
    
    // Convert history object to Map
    const playerHistory = new Map()
    Object.entries(history).forEach(([playerName, historyArray]) => {
      // Convert rating objects back to Rating instances
      const convertedHistory = historyArray.map(entry => ({
        ...entry,
        rating: entry.rating ? new Rating(entry.rating.mu, entry.rating.sigma) : null
      }))
      playerHistory.set(playerName, convertedHistory)
    })
    
    return { playerRatings, playerHistory }
  } catch (error) {
    console.error('Error fetching TrueSkill ratings from API:', error)
    // Return empty maps as fallback
    return { playerRatings: new Map(), playerHistory: new Map() }
  }
}

/**
 * Process aggregated players across all tournaments
 * @param {Array} tournaments - Array of tournament data
 * @returns {Promise<Object>} Object with players array and playerHistory Map
 */
export const processAggregatedPlayers = async (tournaments) => {
  const playerStats = aggregatePlayerStats(tournaments)
  const { playerRatings: trueSkillRatings, playerHistory } = await fetchTrueSkillRatings()
  
  return {
    players: convertToPlayerArray(playerStats, trueSkillRatings),
    playerHistory
  }
}

/**
 * Process players for a specific season
 * TrueSkill is calculated from ALL tournaments (persistent rating)
 * Season points and match stats are calculated from season tournaments only
 * @param {Array} tournaments - Array of tournament data
 * @param {number} seasonYear - Season year
 * @param {Object} seasonFinal - Season final tournament (optional)
 * @returns {Promise<Object>} Object with players array
 */
export const processSeasonPlayers = async (tournaments, seasonYear, seasonFinal) => {
  // Filter tournaments by configured season window, exclude season finals, and exclude tournaments after season final date
  const seasonTournaments = tournaments.filter(tournament => {
    const tournamentDate = new Date(tournament.date)
    const tournamentSeason = getSeasonYearForDate(tournamentDate)
    if (tournamentSeason !== seasonYear) return false
    if (!isTournamentInSeasonWindow(tournamentDate, seasonYear)) return false
    if (tournament.isSeasonFinal) return false

    // If season final exists, exclude tournaments after the season final date
    if (seasonFinal) {
      const finalDate = new Date(seasonFinal.date)
      if (tournamentDate > finalDate) return false
    }

    return true
  })

  if (seasonTournaments.length === 0) {
    return { players: [], playerHistory: new Map() }
  }

  // Calculate season-specific stats (points, matches, etc.) from season tournaments only
  const playerStats = aggregatePlayerStats(seasonTournaments)
  
  // Fetch TrueSkill from ALL tournaments (persistent rating that doesn't reset per season)
  const { playerRatings: trueSkillRatings } = await fetchTrueSkillRatings()
  
  const players = convertToPlayerArray(playerStats, trueSkillRatings)

  // Calculate finale status for all players (based on eligibility and ranking)
  const eligiblePlayers = players.filter(player => player.tournaments >= 10)
  
  // Add finale status to all players
  const playersWithStatus = players.map(player => {
    let finaleStatus = null
    if (player.tournaments >= 10) {
      const eligibleIndex = eligiblePlayers.findIndex(p => p.name === player.name)
      if (eligibleIndex < 20) {
        finaleStatus = 'qualified'
      } else if (eligibleIndex < 25) {
        finaleStatus = 'successor'
      }
    }
    return {
      ...player,
      finaleStatus: finaleStatus
    }
  })

  return { players: playersWithStatus, playerHistory: new Map() }
}

