/**
 * Calculate season awards for players
 * Returns awards in categories with winners
 */

/**
 * Award categories and their calculation functions
 */
export const AWARD_CATEGORIES = {
  highestWinRate: {
    id: 'highestWinRate',
    name: 'Highest Win Rate',
    emoji: '🏆',
    description: 'Best win percentage (minimum 20 matches)',
    calculate: (players) => {
      const eligible = players.filter(p => p.matches >= 20)
      if (eligible.length === 0) return null
      const winner = eligible.reduce((max, p) => 
        parseFloat(p.winRate) > parseFloat(max.winRate) ? p : max
      , eligible[0])
      return winner ? {
        winner: winner.name,
        value: parseFloat(winner.winRate),
        display: `${winner.winRate}% (${winner.won}W-${winner.lost}L)`
      } : null
    }
  },
  
  mostGoals: {
    id: 'mostGoals',
    name: 'Top Scorer',
    emoji: '⚽',
    description: 'Scored the most goals',
    calculate: (players) => {
      const winner = players.reduce((max, p) => 
        p.goalsFor > max.goalsFor ? p : max
      , players[0])
      return winner ? {
        winner: winner.name,
        value: winner.goalsFor,
        display: `${winner.goalsFor} goals`
      } : null
    }
  },
  
  bestGoalDifference: {
    id: 'bestGoalDifference',
    name: 'Best Goal Difference',
    emoji: '📊',
    description: 'Best goal difference (goals for - goals against)',
    calculate: (players) => {
      const winner = players.reduce((max, p) => 
        p.goalDiff > max.goalDiff ? p : max
      , players[0])
      return winner ? {
        winner: winner.name,
        value: winner.goalDiff,
        display: `+${winner.goalDiff} (${winner.goalsFor}G - ${winner.goalsAgainst}GA)`
      } : null
    }
  },
  
  mostTournaments: {
    id: 'mostTournaments',
    name: 'Perfect Attendance',
    emoji: '📅',
    description: 'Participated in the most tournaments',
    calculate: (players) => {
      const maxTournaments = Math.max(...players.map(p => p.tournaments))
      const winners = players.filter(p => p.tournaments === maxTournaments)
      return winners.length > 0 ? {
        winner: winners[0].name,
        value: maxTournaments,
        display: `${maxTournaments} tournaments`,
        ties: winners.length > 1 ? winners.map(w => w.name) : null
      } : null
    }
  },
  
  mostConsistent: {
    id: 'mostConsistent',
    name: 'Most Consistent',
    emoji: '⭐',
    description: 'Best average placement (minimum 5 tournaments)',
    calculate: (players) => {
      const eligible = players.filter(p => p.tournaments >= 5)
      if (eligible.length === 0) return null
      const winner = eligible.reduce((min, p) => 
        parseFloat(p.avgPlace) < parseFloat(min.avgPlace) ? p : min
      , eligible[0])
      return winner ? {
        winner: winner.name,
        value: parseFloat(winner.avgPlace),
        display: `Avg ${winner.avgPlace}th place`
      } : null
    }
  },
  
  highestTrueSkill: {
    id: 'highestTrueSkill',
    name: 'Highest TrueSkill Rating',
    emoji: '💫',
    description: 'Highest skill rating at end of season',
    calculate: (players) => {
      const winner = players.reduce((max, p) => 
        p.trueSkill > max.trueSkill ? p : max
      , players[0])
      return winner ? {
        winner: winner.name,
        value: winner.trueSkill,
        display: `TrueSkill ${winner.trueSkill.toFixed(1)}`
      } : null
    }
  },
  
  mostWins: {
    id: 'mostWins',
    name: 'Most Wins',
    emoji: '🔥',
    description: 'Won the most matches',
    calculate: (players) => {
      const winner = players.reduce((max, p) => 
        p.won > max.won ? p : max
      , players[0])
      return winner ? {
        winner: winner.name,
        value: winner.won,
        display: `${winner.won} wins`
      } : null
    }
  },
  
  bestPointsPerGame: {
    id: 'bestPointsPerGame',
    name: 'Best Points Per Game',
    emoji: '📈',
    description: 'Highest average points per match (minimum 20 matches)',
    calculate: (players) => {
      const eligible = players.filter(p => p.matches >= 20)
      if (eligible.length === 0) return null
      const winner = eligible.reduce((max, p) => 
        parseFloat(p.pointsPerGame) > parseFloat(max.pointsPerGame) ? p : max
      , eligible[0])
      return winner ? {
        winner: winner.name,
        value: parseFloat(winner.pointsPerGame),
        display: `${winner.pointsPerGame} PPG`
      } : null
    }
  }
}

/**
 * Calculate all season awards
 * @param {Array} players - Array of player objects with season stats
 * @returns {Object} Object with awards by category
 */
export function calculateSeasonAwards(players) {
  if (!players || players.length === 0) {
    return {}
  }
  
  // Only consider players with at least 10 tournament attendances
  const eligiblePlayers = players.filter(p => p.tournaments >= 10)
  
  if (eligiblePlayers.length === 0) {
    return {}
  }
  
  const awards = {}
  
  // Calculate each award category (using only eligible players)
  Object.values(AWARD_CATEGORIES).forEach(category => {
    try {
      const result = category.calculate(eligiblePlayers)
      if (result) {
        awards[category.id] = {
          ...category,
          ...result
        }
      }
    } catch (error) {
      console.warn(`Error calculating award ${category.id}:`, error)
    }
  })
  
  return awards
}

/**
 * Get awards summary for display
 * @param {Object} awards - Awards object from calculateSeasonAwards
 * @returns {Array} Array of award objects sorted by importance
 */
export function getAwardsSummary(awards) {
  return Object.values(awards).sort((a, b) => {
    // Sort by value (higher is better for most awards)
    return b.value - a.value
  })
}

