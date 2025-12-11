import { normalizePlayerNameSync } from '../config/playerAliases'
import { calculateSeasonPoints } from '../constants/seasonPoints'
import { ACHIEVEMENT_DEFINITIONS } from '../constants/achievements'
import { getSeasonYearForDate, isTournamentInSeasonWindow } from './seasonUtils'

/**
 * Calculate all achievements for a player
 */
export const calculateAchievements = (
  playerName,
  matchHistory,
  tournaments,
  tournamentList,
  bestRankingStats,
  topPartners,
  currentSkill,
  totalMatches,
  wins,
  winRate,
  playerAggregated
) => {
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  const achievements = []
  const progress = []
  
  // Tournament wins count
  const tournamentWins = bestRankingStats.filter(r => r.place === 1).reduce((sum, r) => sum + r.count, 0)
  const top3Count = bestRankingStats.filter(r => r.place <= 3).reduce((sum, r) => sum + r.count, 0)
  const top5Count = bestRankingStats.filter(r => r.place <= 5).reduce((sum, r) => sum + r.count, 0)
  
  // Find achievement unlock dates from tournament dates
  const getUnlockDate = (count, targetCount, rankingStats) => {
    if (count < targetCount) return null
    // Find the tournament date when the target count was reached
    const sortedWins = []
    rankingStats.forEach(r => {
      if (r.place === 1) {
        r.tournaments.forEach(t => {
          sortedWins.push(new Date(t.date))
        })
      }
    })
    sortedWins.sort((a, b) => a - b) // Sort chronologically
    return sortedWins.length >= targetCount ? sortedWins[targetCount - 1] : null
  }
  
  // Tournament Performance Achievements
  if (tournamentWins >= 1) {
    const unlockDate = getUnlockDate(tournamentWins, 1, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.firstPlace, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.firstPlace, current: tournamentWins, next: 1 })
  }
  
  if (tournamentWins >= 3) {
    const unlockDate = getUnlockDate(tournamentWins, 3, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion3, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion3, current: tournamentWins, next: 3 })
  }
  
  if (tournamentWins >= 5) {
    const unlockDate = getUnlockDate(tournamentWins, 5, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion5, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion5, current: tournamentWins, next: 5 })
  }
  
  if (tournamentWins >= 10) {
    const unlockDate = getUnlockDate(tournamentWins, 10, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion10, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion10, current: tournamentWins, next: 10 })
  }
  
  if (top3Count >= 3) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.podium3, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.podium3, current: top3Count, next: 3 })
  
  if (top3Count >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.podium5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.podium5, current: top3Count, next: 5 })
  
  if (top5Count >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.top5_5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.top5_5, current: top5Count, next: 5 })
  
  if (top5Count >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.top5_10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.top5_10, current: top5Count, next: 10 })
  
  // Milestone Achievements
  if (totalMatches >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches50, current: totalMatches, next: 50 })
  
  if (totalMatches >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches100, current: totalMatches, next: 100 })
  
  if (totalMatches >= 250) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches250, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches250, current: totalMatches, next: 250 })
  
  if (totalMatches >= 500) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches500, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches500, current: totalMatches, next: 500 })
  
  if (wins >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins25, current: wins, next: 25 })
  
  if (wins >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins50, current: wins, next: 50 })
  
  if (wins >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins100, current: wins, next: 100 })
  
  if (wins >= 250) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins250, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins250, current: wins, next: 250 })
  
  const tournamentCount = tournamentList.length
  if (tournamentCount >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments10, current: tournamentCount, next: 10 })
  
  if (tournamentCount >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments25, current: tournamentCount, next: 25 })
  
  if (tournamentCount >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments50, current: tournamentCount, next: 50 })
  
  // Count unique seasons
  const seasons = new Set()
  tournamentList.forEach(t => {
    const seasonYear = getSeasonYearForDate(new Date(t.date))
    seasons.add(seasonYear)
  })
  const seasonCount = seasons.size
  if (seasonCount >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasons5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasons5, current: seasonCount, next: 5 })
  
  // Performance Achievements
  const winRateNum = parseFloat(winRate)
  if (winRateNum >= 60 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate60, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate60, current: winRateNum, next: 60 })
  
  if (winRateNum >= 70 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate70, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate70, current: winRateNum, next: 70 })
  
  if (winRateNum >= 80 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate80, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate80, current: winRateNum, next: 80 })
  
  const goalDiff = playerAggregated ? playerAggregated.goalDiff : 0
  if (goalDiff >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff50, current: goalDiff, next: 50 })
  
  if (goalDiff >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff100, current: goalDiff, next: 100 })
  
  if (goalDiff >= 200) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff200, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff200, current: goalDiff, next: 200 })
  
  // TrueSkill Achievements
  if (currentSkill >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill20, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill20, current: currentSkill, next: 20 })
  
  if (currentSkill >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill25, current: currentSkill, next: 25 })
  
  if (currentSkill >= 30) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill30, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill30, current: currentSkill, next: 30 })
  
  if (currentSkill >= 35) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill35, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill35, current: currentSkill, next: 35 })
  
  if (currentSkill >= 40) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill40, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill40, current: currentSkill, next: 40 })
  
  if (currentSkill >= 45) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill45, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill45, current: currentSkill, next: 45 })
  
  if (currentSkill >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill50, current: currentSkill, next: 50 })
  
  // Win Streak Achievements (calculate from oldest to newest)
  let currentStreak = 0
  let maxStreak = 0
  // Reverse matchHistory to get chronological order (oldest first) for streak calculation
  const chronologicalMatches = [...matchHistory].reverse()
  chronologicalMatches.forEach(entry => {
    if (entry.match.won) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })
  
  if (maxStreak >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak5, current: maxStreak, next: 5 })
  
  if (maxStreak >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak10, current: maxStreak, next: 10 })
  
  if (maxStreak >= 15) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak15, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak15, current: maxStreak, next: 15 })
  
  // Partnership Achievements
  if (topPartners.length > 0 && topPartners[0].wins >= 10) {
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.partner10, unlocked: true, unlockedDate: null })
  } else {
    const maxPartnerWins = topPartners.length > 0 ? topPartners[0].wins : 0
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.partner10, current: maxPartnerWins, next: 10 })
  }
  
  const uniquePartners = topPartners.length
  if (uniquePartners >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.partner5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.partner5, current: uniquePartners, next: 5 })
  
  // Season Achievements (check actual season ranking position, not tournament placement)
  const seasonStats = calculateSeasonRankings(normalizedPlayerName, tournaments)
  
  const bestSeasonPoints = seasonStats.bestSeasonPoints
  const bestSeasonRankingPlace = seasonStats.bestSeasonRankingPlace
  
  // Check achievements based on actual season ranking position
  if (bestSeasonRankingPlace === 1) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonChampion, unlocked: true, unlockedDate: null })
  if (bestSeasonRankingPlace <= 3 && bestSeasonRankingPlace !== 1) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPodium, unlocked: true, unlockedDate: null })
  
  if (bestSeasonPoints >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints50, current: bestSeasonPoints, next: 50 })
  
  if (bestSeasonPoints >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints100, current: bestSeasonPoints, next: 100 })
  
  if (bestSeasonPoints >= 200) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints200, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints200, current: bestSeasonPoints, next: 200 })
  
  return {
    unlocked: achievements.sort((a, b) => {
      // Sort by category, then by tier
      const categoryOrder = { tournament: 1, milestone: 2, performance: 3, trueskill: 4, streak: 5, partnership: 6, season: 7 }
      if (categoryOrder[a.category] !== categoryOrder[b.category]) {
        return categoryOrder[a.category] - categoryOrder[b.category]
      }
      return a.tier - b.tier
    }),
    progress: progress.sort((a, b) => {
      // Sort by progress percentage (closest to completion first)
      const aProgress = (a.current / a.next) * 100
      const bProgress = (b.current / b.next) * 100
      return bProgress - aProgress
    }).slice(0, 5) // Show top 5 in progress
  }
}

/**
 * Calculate season rankings for achievement purposes
 */
const calculateSeasonRankings = (normalizedPlayerName, tournaments) => {
  // Group tournaments by season (year), excluding season finals and tournaments after season final
  const tournamentsBySeason = new Map()
  const seasonFinalsByYear = new Map()
  
  // First pass: find all season finals by year
  tournaments.forEach(tournament => {
    if (!tournament || !tournament.data) return
    if (tournament.isSeasonFinal !== true) return
    const tournamentDate = new Date(tournament.date)
    const seasonYear = getSeasonYearForDate(tournamentDate)
    if (!isTournamentInSeasonWindow(tournamentDate, seasonYear)) return
    seasonFinalsByYear.set(seasonYear, tournament)
  })
  
  // Second pass: group tournaments by season, excluding season finals and tournaments after season final date
  tournaments.forEach(tournament => {
    if (!tournament || !tournament.data) return
    const tournamentDate = new Date(tournament.date)
    const seasonYear = getSeasonYearForDate(tournamentDate)
    if (!isTournamentInSeasonWindow(tournamentDate, seasonYear)) return
    if (tournament.isSeasonFinal === true) return // Exclude season finals from achievement calculations
    
    const seasonFinal = seasonFinalsByYear.get(seasonYear)
    
    // If season final exists, exclude tournaments after the season final date
    if (seasonFinal) {
      const finalDate = new Date(seasonFinal.date)
      if (tournamentDate > finalDate) return // Exclude tournaments after season final
    }
    
    if (!tournamentsBySeason.has(seasonYear)) {
      tournamentsBySeason.set(seasonYear, [])
    }
    tournamentsBySeason.get(seasonYear).push(tournament)
  })
  
  let bestSeasonPoints = 0
  let bestSeasonRankingPlace = Infinity
  
  tournamentsBySeason.forEach((seasonTournaments, year) => {
    // Calculate season points for all players in this season
    const playerSeasonStats = new Map()
    
    seasonTournaments.forEach(tournament => {
      // Get all players from qualifying
      const qualifyingStandings = tournament.data.qualifying?.[0]?.standings || []
      const eliminationStandings = tournament.data.eliminations?.[0]?.standings || []
      
      // Create a map to track final placements
      const playerFinalPlacement = new Map()
      
      // First, add all qualifying placements
      qualifyingStandings.forEach(player => {
        if (!player.removed && player.stats.matches > 0) {
          const normalizedName = normalizePlayerNameSync(player.name)
          playerFinalPlacement.set(normalizedName, {
            place: player.stats.place
          })
        }
      })
      
      // Override with elimination placements
      eliminationStandings.forEach(player => {
        if (!player.removed) {
          const normalizedName = normalizePlayerNameSync(player.name)
          playerFinalPlacement.set(normalizedName, {
            place: player.stats.place
          })
        }
      })
      
      // Process each player's tournament result
      playerFinalPlacement.forEach((playerData, normalizedName) => {
        if (!playerSeasonStats.has(normalizedName)) {
          playerSeasonStats.set(normalizedName, {
            name: normalizedName,
            seasonPoints: 0
          })
        }
        
        const stats = playerSeasonStats.get(normalizedName)
        stats.seasonPoints += calculateSeasonPoints(playerData.place)
      })
    })
    
    // Sort players by season points to determine ranking
    const seasonRanking = Array.from(playerSeasonStats.values())
      .sort((a, b) => {
        if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints
        return 0
      })
      .map((player, index) => ({
        ...player,
        rankingPlace: index + 1
      }))
    
    // Find the player's position in this season's ranking
    const playerSeasonData = seasonRanking.find(p => p.name === normalizedPlayerName)
    if (playerSeasonData) {
      const seasonPoints = playerSeasonData.seasonPoints
      const rankingPlace = playerSeasonData.rankingPlace
      
      if (seasonPoints > bestSeasonPoints) bestSeasonPoints = seasonPoints
      if (rankingPlace < bestSeasonRankingPlace) bestSeasonRankingPlace = rankingPlace
    }
  })
  
  return {
    bestSeasonPoints,
    bestSeasonRankingPlace: bestSeasonRankingPlace === Infinity ? null : bestSeasonRankingPlace
  }
}

