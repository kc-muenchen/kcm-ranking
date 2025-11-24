import { MAX_TOURNAMENT_POINTS } from '../constants/seasonPoints'

/**
 * Get available seasons (years) from tournaments
 */
export const getAvailableSeasons = (tournaments) => {
  const years = new Set()
  tournaments.forEach(tournament => {
    const year = new Date(tournament.date).getFullYear()
    years.add(year.toString())
  })
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // Most recent first
}

/**
 * Get season final tournament for a given season
 */
export const getSeasonFinal = (tournaments, seasonYear) => {
  return tournaments.find(tournament => {
    const tournamentYear = new Date(tournament.date).getFullYear()
    return tournamentYear.toString() === seasonYear && tournament.isSeasonFinal === true
  })
}

/**
 * Calculate which players are "surely qualified" (will remain in top 20 even if they skip next tournament)
 */
export const calculateSurelyQualified = (players) => {
  // Only consider players with 10+ tournaments (eligible for finale)
  const eligiblePlayers = players.filter(player => player.tournaments >= 10)
  
  if (eligiblePlayers.length <= 20) {
    // If there are 20 or fewer eligible players, all are surely qualified
    return new Set(eligiblePlayers.map(p => p.name))
  }
  
  // Sort eligible players by current ranking (season points, then TrueSkill, then points)
  const sortedEligible = [...eligiblePlayers].sort((a, b) => {
    const seasonPointsDiff = b.seasonPoints - a.seasonPoints
    if (seasonPointsDiff !== 0) return seasonPointsDiff
    const trueSkillDiff = b.trueSkill - a.trueSkill
    if (trueSkillDiff !== 0) return trueSkillDiff
    return b.points - a.points
  })
  
  // Get current top 20
  const currentTop20 = sortedEligible.slice(0, 20)
  
  // Simulate worst-case scenario: top 20 get 0 points, players below get max points
  const simulatedPlayers = sortedEligible.map(player => {
    const isInTop20 = currentTop20.some(p => p.name === player.name)
    const simulatedPoints = isInTop20 
      ? player.seasonPoints // Top 20 get 0 additional points (don't attend)
      : player.seasonPoints + MAX_TOURNAMENT_POINTS // Below 20 get max points
    
    return {
      ...player,
      simulatedSeasonPoints: simulatedPoints
    }
  })
  
  // Re-sort with simulated points
  const simulatedSorted = simulatedPlayers.sort((a, b) => {
    const seasonPointsDiff = b.simulatedSeasonPoints - a.simulatedSeasonPoints
    if (seasonPointsDiff !== 0) return seasonPointsDiff
    const trueSkillDiff = b.trueSkill - a.trueSkill
    if (trueSkillDiff !== 0) return trueSkillDiff
    return b.points - a.points
  })
  
  // Get new top 20 after simulation
  const newTop20 = simulatedSorted.slice(0, 20)
  const newTop20Names = new Set(newTop20.map(p => p.name))
  
  // Players who are in both current top 20 and new top 20 are "surely qualified"
  const surelyQualifiedNames = new Set(
    currentTop20
      .filter(p => newTop20Names.has(p.name))
      .map(p => p.name)
  )
  
  return surelyQualifiedNames
}

