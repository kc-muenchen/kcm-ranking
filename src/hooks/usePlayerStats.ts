import { useMemo } from 'react'
import { 
  calculateBestRanking, 
  calculateTopPartners, 
  calculateOpponentStats, 
  calculateTournamentList,
  calculateHeadToHead,
  calculateTeammateStats
} from '../utils/playerStats'
import { calculateAchievements } from '../utils/achievements'

/**
 * Custom hook to calculate all player statistics
 */
export const usePlayerStats = (
  playerName,
  playerHistory,
  tournaments,
  aggregatedPlayers,
  selectedComparePlayer
) => {
  const history = playerHistory.get(playerName) || []
  
  // Filter out the initial rating entry and reverse to show most recent first
  const matchHistory = useMemo(() => {
    return history.filter(entry => entry.matchIndex >= 0).reverse()
  }, [history])
  
  const tournamentList = useMemo(() => {
    return calculateTournamentList(playerName, tournaments)
  }, [playerName, tournaments])

  // Calculate skill at the end of the last tournament (before current tournament)
  const lastTournamentSkill = useMemo(() => {
    if (tournamentList.length < 2) {
      // If player has less than 2 tournaments, use first match skill as baseline
      return matchHistory.length > 0 
        ? matchHistory[matchHistory.length - 1].skill  // Last in reversed array = first match
        : (history.length > 0 ? history[0].skill : 0)
    }
    
    // Get the date of the last tournament (second most recent)
    const lastTournamentDate = new Date(tournamentList[1].date)
    // Add one day to include matches from the last tournament day
    const lastTournamentEndDate = new Date(lastTournamentDate)
    lastTournamentEndDate.setDate(lastTournamentEndDate.getDate() + 1)
    
    // Find the most recent match that occurred on or before the last tournament's date
    // Since matchHistory is reversed (newest first), we iterate to find the first match
    // that is on or before the last tournament date
    for (let i = 0; i < matchHistory.length; i++) {
      const matchDate = new Date(matchHistory[i].date)
      if (matchDate <= lastTournamentEndDate) {
        // Found a match from the last tournament or earlier, return its skill
        return matchHistory[i].skill
      }
    }
    
    // If no match found, use the first match skill
    return matchHistory.length > 0 
      ? matchHistory[matchHistory.length - 1].skill
      : (history.length > 0 ? history[0].skill : 0)
  }, [tournamentList, matchHistory, history])
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalMatches = matchHistory.length
    const wins = matchHistory.filter(entry => entry.match.won).length
    const losses = totalMatches - wins
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0
    const currentSkill = history.length > 0 ? history[history.length - 1].skill : 0
    // Initial skill is the rating before any matches (for PerformanceTab to show first match delta)
    const initialSkill = history.length > 0 ? history[0].skill : 0
    
    return {
      totalMatches,
      wins,
      losses,
      winRate,
      currentSkill,
      initialSkill,
      skillChange: currentSkill - lastTournamentSkill
    }
  }, [matchHistory, history, lastTournamentSkill])
  
  // Find player's aggregated stats
  const playerAggregated = useMemo(() => {
    return aggregatedPlayers.find(p => p.name === playerName)
  }, [aggregatedPlayers, playerName])
  
  // Calculate statistics
  const bestRankingStats = useMemo(() => {
    return calculateBestRanking(playerName, tournaments)
  }, [playerName, tournaments])
  
  const topPartners = useMemo(() => {
    return calculateTopPartners(matchHistory, playerName)
  }, [matchHistory, playerName])
  
  const opponentStats = useMemo(() => {
    return calculateOpponentStats(matchHistory, playerName)
  }, [matchHistory, playerName])
  
  const achievements = useMemo(() => {
    return calculateAchievements(
      playerName,
      matchHistory,
      tournaments,
      tournamentList,
      bestRankingStats,
      topPartners,
      summaryStats.currentSkill,
      summaryStats.totalMatches,
      summaryStats.wins,
      summaryStats.winRate,
      playerAggregated
    )
  }, [
    playerName,
    matchHistory,
    tournaments,
    tournamentList,
    bestRankingStats,
    topPartners,
    summaryStats.currentSkill,
    summaryStats.totalMatches,
    summaryStats.wins,
    summaryStats.winRate,
    playerAggregated
  ])
  
  const headToHeadStats = useMemo(() => {
    return selectedComparePlayer 
      ? calculateHeadToHead(matchHistory, playerName, selectedComparePlayer)
      : null
  }, [matchHistory, playerName, selectedComparePlayer])
  
  const teammateStats = useMemo(() => {
    return selectedComparePlayer
      ? calculateTeammateStats(matchHistory, playerName, selectedComparePlayer)
      : null
  }, [matchHistory, playerName, selectedComparePlayer])
  
  // Get list of all players for comparison dropdown
  const allPlayers = useMemo(() => {
    return aggregatedPlayers
      .filter(p => p.name !== playerName)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [aggregatedPlayers, playerName])
  
  return {
    history,
    matchHistory,
    summaryStats,
    playerAggregated,
    bestRankingStats,
    topPartners,
    opponentStats,
    tournamentList,
    achievements,
    headToHeadStats,
    teammateStats,
    allPlayers
  }
}

