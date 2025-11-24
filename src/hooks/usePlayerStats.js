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
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalMatches = matchHistory.length
    const wins = matchHistory.filter(entry => entry.match.won).length
    const losses = totalMatches - wins
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0
    const currentSkill = history.length > 0 ? history[history.length - 1].skill : 0
    const initialSkill = history.length > 0 ? history[0].skill : 0
    const skillChange = currentSkill - initialSkill
    
    return {
      totalMatches,
      wins,
      losses,
      winRate,
      currentSkill,
      initialSkill,
      skillChange
    }
  }, [matchHistory, history])
  
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
  
  const tournamentList = useMemo(() => {
    return calculateTournamentList(playerName, tournaments)
  }, [playerName, tournaments])
  
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

