import { normalizePlayerNameSync } from '../config/playerAliases'
import { calculateSeasonPoints } from '../constants/seasonPoints'
import { ACHIEVEMENT_DEFINITIONS } from '../constants/achievements'

/**
 * Calculate best ranking statistics (top 3)
 * Only counts final tournament placements from elimination rounds
 */
export const calculateBestRanking = (playerName, tournaments) => {
  const rankings = []
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  
  if (!tournaments || tournaments.length === 0) {
    return []
  }
  
  tournaments.forEach(tournament => {
    // Skip if tournament data is missing
    if (!tournament || !tournament.data) {
      return
    }
    
    // Only check elimination standings (actual tournament placement)
    // Qualifying standings are NOT counted as tournament wins
    if (tournament.data.eliminations && Array.isArray(tournament.data.eliminations) && tournament.data.eliminations.length > 0) {
      const eliminationStandings = tournament.data.eliminations[0].standings || []
      const eliminationStanding = eliminationStandings.find(p => {
        if (!p || !p.name || p.removed) return false
        return normalizePlayerNameSync(p.name) === normalizedPlayerName
      })
      
      if (eliminationStanding && eliminationStanding.stats && eliminationStanding.stats.place) {
        rankings.push({
          place: eliminationStanding.stats.place,
          tournament: tournament.name || 'Unknown Tournament',
          date: tournament.date || tournament.data.createdAt
        })
      }
    }
  })
  
  if (rankings.length === 0) {
    return []
  }
  
  // Group rankings by place
  const placeMap = new Map()
  rankings.forEach(ranking => {
    if (!placeMap.has(ranking.place)) {
      placeMap.set(ranking.place, [])
    }
    placeMap.get(ranking.place).push(ranking)
  })
  
  // Get unique places sorted ascending
  const uniquePlaces = Array.from(placeMap.keys()).sort((a, b) => a - b)
  
  // Return top 3 unique places with their tournaments
  return uniquePlaces.slice(0, 3).map(place => ({
    place,
    count: placeMap.get(place).length,
    tournaments: placeMap.get(place)
  }))
}

/**
 * Calculate top partners
 */
export const calculateTopPartners = (matchHistory, playerName) => {
  const partnerStats = new Map()
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
    const teammates = playerTeam === 'team1' ? match.team1Players : match.team2Players
    
    // Find partners (teammates who are not the player)
    const partners = teammates.filter(p => p !== playerName)
    
    partners.forEach(partner => {
      if (!partnerStats.has(partner)) {
        partnerStats.set(partner, {
          name: partner,
          matches: 0,
          wins: 0,
          losses: 0
        })
      }
      
      const stats = partnerStats.get(partner)
      stats.matches += 1
      if (match.won) {
        stats.wins += 1
      } else {
        stats.losses += 1
      }
    })
  })
  
  // Convert to array and sort by wins, then by win rate
  const partnersArray = Array.from(partnerStats.values())
    .map(partner => ({
      ...partner,
      winRate: partner.matches > 0 ? ((partner.wins / partner.matches) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => {
      // Sort by wins first, then by win rate
      if (b.wins !== a.wins) return b.wins - a.wins
      return parseFloat(b.winRate) - parseFloat(a.winRate)
    })
  
  return partnersArray.slice(0, 3) // Return top 3
}

/**
 * Calculate opponent statistics
 */
export const calculateOpponentStats = (matchHistory, playerName) => {
  const opponentStats = new Map()
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
    const opponents = playerTeam === 'team1' ? match.team2Players : match.team1Players
    
    opponents.forEach(opponent => {
      if (!opponentStats.has(opponent)) {
        opponentStats.set(opponent, {
          name: opponent,
          matches: 0,
          wins: 0,
          losses: 0
        })
      }
      
      const stats = opponentStats.get(opponent)
      stats.matches += 1
      if (match.won) {
        stats.wins += 1
      } else {
        stats.losses += 1
      }
    })
  })
  
  // Convert to array and add win rates
  const opponentsArray = Array.from(opponentStats.values())
    .map(opponent => ({
      ...opponent,
      winRate: opponent.matches > 0 ? ((opponent.wins / opponent.matches) * 100).toFixed(1) : 0
    }))
    .filter(opponent => opponent.matches >= 2) // Only include opponents faced at least twice
  
  // Get top 3 opponents player won most against
  const wonMostAgainst = [...opponentsArray]
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return parseFloat(b.winRate) - parseFloat(a.winRate)
    })
    .slice(0, 3)
  
  // Get top 3 opponents player lost most against
  const lostMostAgainst = [...opponentsArray]
    .sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses
      return parseFloat(a.winRate) - parseFloat(b.winRate) // Lower win rate is worse
    })
    .slice(0, 3)
  
  return {
    wonMostAgainst,
    lostMostAgainst
  }
}

/**
 * Calculate tournament participation list
 */
export const calculateTournamentList = (playerName, tournaments) => {
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  const tournamentList = []
  
  tournaments.forEach(tournament => {
    // Skip if tournament data is missing
    if (!tournament || !tournament.data) {
      return
    }
    
    let qualifyingPlace = null
    let eliminationPlace = null
    let finalPlace = null
    let foundInQualifying = false
    let foundInElimination = false
    
    // Check qualifying standings
    if (tournament.data.qualifying && Array.isArray(tournament.data.qualifying) && tournament.data.qualifying.length > 0) {
      const qualifyingStandings = tournament.data.qualifying[0].standings || []
      const qualifyingStanding = qualifyingStandings.find(
        p => p && p.name && !p.removed && normalizePlayerNameSync(p.name) === normalizedPlayerName
      )
      
      if (qualifyingStanding && qualifyingStanding.stats && qualifyingStanding.stats.matches > 0) {
        qualifyingPlace = qualifyingStanding.stats.place
        finalPlace = qualifyingPlace
        foundInQualifying = true
      }
    }
    
    // Check elimination standings (overrides qualifying place)
    if (tournament.data.eliminations && Array.isArray(tournament.data.eliminations) && tournament.data.eliminations.length > 0) {
      const eliminationStandings = tournament.data.eliminations[0].standings || []
      const eliminationStanding = eliminationStandings.find(
        p => p && p.name && !p.removed && normalizePlayerNameSync(p.name) === normalizedPlayerName
      )
      
      if (eliminationStanding) {
        eliminationPlace = eliminationStanding.stats.place
        finalPlace = eliminationPlace // Elimination place is the final tournament result
        foundInElimination = true
      }
    }
    
    // Only add if player participated
    if (foundInQualifying || foundInElimination) {
      tournamentList.push({
        name: tournament.name,
        date: tournament.date,
        qualifyingPlace,
        eliminationPlace,
        finalPlace,
        seasonPoints: calculateSeasonPoints(finalPlace)
      })
    }
  })
  
  // Sort by date (most recent first)
  tournamentList.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return tournamentList
}

/**
 * Calculate head-to-head statistics between two players
 * Only counts matches where they played AGAINST each other (as opponents)
 */
export const calculateHeadToHead = (matchHistory, player1Name, player2Name) => {
  const normalizedPlayer1 = normalizePlayerNameSync(player1Name)
  const normalizedPlayer2 = normalizePlayerNameSync(player2Name)
  
  let totalMatches = 0
  let player1Wins = 0
  let player2Wins = 0
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const allPlayers = [...match.team1Players, ...match.team2Players]
    
    // Check if both players were in this match
    const player1InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
    const player2InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
    
    if (player1InMatch && player2InMatch) {
      // Determine which team each player was on
      const player1InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
      const player2InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
      
      // Only count matches where they were OPPONENTS (not teammates)
      if (player1InTeam1 !== player2InTeam1) {
        totalMatches++
        
        // Determine which team won based on scores
        const team1Won = match.team1Score > match.team2Score
        const team2Won = match.team2Score > match.team1Score
        
        if (player1InTeam1) {
          // Player1 on team1, Player2 on team2
          if (team1Won) {
            player1Wins++
          } else if (team2Won) {
            player2Wins++
          }
          // If draw, neither wins
        } else {
          // Player1 on team2, Player2 on team1
          if (team2Won) {
            player1Wins++
          } else if (team1Won) {
            player2Wins++
          }
          // If draw, neither wins
        }
      }
      // Skip matches where they were teammates
    }
  })
  
  return {
    totalMatches,
    player1Wins,
    player2Wins
  }
}

/**
 * Calculate teammate statistics between two players
 * Only counts matches where they played TOGETHER (as teammates)
 */
export const calculateTeammateStats = (matchHistory, player1Name, player2Name) => {
  const normalizedPlayer1 = normalizePlayerNameSync(player1Name)
  const normalizedPlayer2 = normalizePlayerNameSync(player2Name)
  
  let totalMatches = 0
  let wins = 0
  let losses = 0
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const allPlayers = [...match.team1Players, ...match.team2Players]
    
    // Check if both players were in this match
    const player1InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
    const player2InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
    
    if (player1InMatch && player2InMatch) {
      // Determine which team each player was on
      const player1InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
      const player2InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
      
      // Only count matches where they were TEAMMATES (on the same team)
      if (player1InTeam1 === player2InTeam1) {
        totalMatches++
        
        // Determine if their team won
        const theirTeam = player1InTeam1 ? 'team1' : 'team2'
        const theirScore = theirTeam === 'team1' ? match.team1Score : match.team2Score
        const opponentScore = theirTeam === 'team1' ? match.team2Score : match.team1Score
        
        if (theirScore > opponentScore) {
          wins++
        } else if (opponentScore > theirScore) {
          losses++
        }
        // If draw, neither wins nor loses (not counted in wins/losses)
      }
      // Skip matches where they were opponents
    }
  })
  
  return {
    totalMatches,
    wins,
    losses
  }
}

