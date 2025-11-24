import { normalizePlayerNameSync } from '../config/playerAliases'
import { calculateTrueSkillRatings, getConservativeRating } from './trueskill'
import { calculateSeasonPoints } from '../constants/seasonPoints'

/**
 * Process players for a single tournament view
 */
export const processTournamentPlayers = (tournamentData) => {
  if (!tournamentData.qualifying || tournamentData.qualifying.length === 0) {
    return []
  }

  // Get qualifying standings
  const qualifyingStandings = tournamentData.qualifying[0].standings || []
  
  // Create a map to aggregate stats by player ID
  const playerStatsMap = new Map()
  
  // Process qualifying round
  qualifyingStandings.forEach(player => {
    if (player.deactivated || player.removed) return
    
    const normalizedName = normalizePlayerNameSync(player.name)
    
    playerStatsMap.set(player._id, {
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
      eliminationPlace: null
    })
  })
  
  // Process elimination rounds if they exist
  if (tournamentData.eliminations && tournamentData.eliminations.length > 0) {
    tournamentData.eliminations.forEach(elimination => {
      const eliminationStandings = elimination.standings || []
      
      eliminationStandings.forEach(player => {
        if (player.deactivated || player.removed) return
        
        const existingPlayer = playerStatsMap.get(player._id)
        
        if (existingPlayer) {
          // Add elimination stats to existing player
          existingPlayer.matches += player.stats.matches
          existingPlayer.points += player.stats.points
          existingPlayer.won += player.stats.won
          existingPlayer.lost += player.stats.lost
          existingPlayer.goalsFor += player.stats.goals
          existingPlayer.goalsAgainst += player.stats.goals_in
          existingPlayer.goalDiff = existingPlayer.goalsFor - existingPlayer.goalsAgainst
          existingPlayer.eliminationPlace = player.stats.place
          
          // Recalculate points per game
          if (existingPlayer.matches > 0) {
            existingPlayer.pointsPerGame = (existingPlayer.points / existingPlayer.matches).toFixed(2)
          }
        }
      })
    })
  }
  
  // Convert map to array and calculate final stats
  return Array.from(playerStatsMap.values())
    .map(player => ({
      ...player,
      winRate: player.matches > 0 
        ? ((player.won / player.matches) * 100).toFixed(1)
        : 0,
      // Use elimination place if available, otherwise qualifying place
      finalPlace: player.eliminationPlace !== null ? player.eliminationPlace : player.qualifyingPlace
    }))
    .sort((a, b) => {
      // Sort by final place (elimination > qualifying)
      if (a.eliminationPlace !== null && b.eliminationPlace !== null) {
        return a.eliminationPlace - b.eliminationPlace
      }
      if (a.eliminationPlace !== null) return -1
      if (b.eliminationPlace !== null) return 1
      return a.qualifyingPlace - b.qualifyingPlace
    })
}

/**
 * Process player final placements from tournament data
 */
const getPlayerFinalPlacements = (tournament) => {
  const qualifyingStandings = tournament.data.qualifying?.[0]?.standings || []
  const eliminationStandings = tournament.data.eliminations?.[0]?.standings || []
  
  // Create a map to track final placements (elimination takes precedence)
  const playerFinalPlacement = new Map()
  
  // First, add all qualifying placements
  qualifyingStandings.forEach(player => {
    if (!player.removed && player.stats.matches > 0) {
      const normalizedName = normalizePlayerNameSync(player.name)
      playerFinalPlacement.set(normalizedName, {
        place: player.stats.place,
        stats: player.stats,
        external: player.external
      })
    }
  })
  
  // Override with elimination placements (these are the final tournament results)
  eliminationStandings.forEach(player => {
    if (!player.removed) {
      const normalizedName = normalizePlayerNameSync(player.name)
      const existing = playerFinalPlacement.get(normalizedName)
      if (existing) {
        playerFinalPlacement.set(normalizedName, {
          ...existing,
          place: player.stats.place // Use elimination place as final place
        })
      }
    }
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
  return Array.from(playerStats.values())
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
 * Process aggregated players across all tournaments
 */
export const processAggregatedPlayers = (tournaments) => {
  const playerStats = aggregatePlayerStats(tournaments)
  const { playerRatings: trueSkillRatings, playerHistory } = calculateTrueSkillRatings(tournaments)
  
  return {
    players: convertToPlayerArray(playerStats, trueSkillRatings),
    playerHistory
  }
}

/**
 * Process players for a specific season
 */
export const processSeasonPlayers = (tournaments, seasonYear, seasonFinal) => {
  // Filter tournaments by year, exclude season finals, and exclude tournaments after season final date
  const seasonTournaments = tournaments.filter(tournament => {
    const tournamentYear = new Date(tournament.date).getFullYear()
    const isInSeason = tournamentYear.toString() === seasonYear
    
    // Exclude season finals
    if (tournament.isSeasonFinal) return false
    
    // If season final exists, exclude tournaments after the season final date
    if (seasonFinal) {
      const tournamentDate = new Date(tournament.date)
      const finalDate = new Date(seasonFinal.date)
      if (tournamentDate > finalDate) return false
    }
    
    return isInSeason
  })

  if (seasonTournaments.length === 0) {
    return { players: [], playerHistory: new Map() }
  }

  const playerStats = aggregatePlayerStats(seasonTournaments)
  const { playerRatings: trueSkillRatings } = calculateTrueSkillRatings(seasonTournaments)
  
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

