import { rate, Rating } from 'ts-trueskill'
import { normalizePlayerNameSync } from '../config/playerAliases'

/**
 * Calculate TrueSkill ratings for all players across all tournaments
 * @param {Array} tournaments - Array of tournament objects with match data
 * @returns {Object} Object with playerRatings Map and playerHistory Map
 */
export function calculateTrueSkillRatings(tournaments) {
  // Initialize player ratings (mu=25, sigma=8.333 by default)
  const playerRatings = new Map()
  const playerHistory = new Map() // Track rating history per player
  
  // Collect all matches across all tournaments with timestamps
  const allMatches = []
  
  tournaments.forEach(tournament => {
    const tournamentDate = new Date(tournament.date)
    
    // Process qualifying rounds
    if (tournament.data.qualifying && tournament.data.qualifying.length > 0) {
      const qualifying = tournament.data.qualifying[0]
      
      if (qualifying.rounds) {
        qualifying.rounds.forEach(round => {
          if (round.matches) {
            round.matches.forEach(match => {
              if (match.valid && !match.skipped && match.team1 && match.team2 && match.result) {
                allMatches.push({
                  date: match.timeStart || tournamentDate.getTime(),
                  team1Players: match.team1.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                  team2Players: match.team2.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                  team1Score: match.result[0],
                  team2Score: match.result[1]
                })
              }
            })
          }
        })
      }
    }
    
    // Process elimination rounds
    if (tournament.data.eliminations) {
      tournament.data.eliminations.forEach(elimination => {
        // Process all levels (rounds)
        if (elimination.levels) {
          elimination.levels.forEach(level => {
            if (level.matches) {
              level.matches.forEach(match => {
                if (match.valid && !match.skipped && match.team1 && match.team2 && match.result) {
                  allMatches.push({
                    date: match.timeStart || tournamentDate.getTime(),
                    team1Players: match.team1.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                    team2Players: match.team2.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                    team1Score: match.result[0],
                    team2Score: match.result[1]
                  })
                }
              })
            }
          })
        }
        
        // Process third place match
        if (elimination.third && elimination.third.matches) {
          elimination.third.matches.forEach(match => {
            if (match.valid && !match.skipped && match.team1 && match.team2 && match.result) {
              allMatches.push({
                date: match.timeStart || tournamentDate.getTime(),
                team1Players: match.team1.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                team2Players: match.team2.players.map(p => normalizePlayerNameSync(p.name)).filter(name => name),
                team1Score: match.result[0],
                team2Score: match.result[1]
              })
            }
          })
        }
      })
    }
  })
  
  // Sort matches by date (chronological order)
  allMatches.sort((a, b) => a.date - b.date)
  
  // Initialize history for all players with their starting rating
  allMatches.forEach(match => {
    [...match.team1Players, ...match.team2Players].forEach(playerName => {
      if (!playerHistory.has(playerName)) {
        playerHistory.set(playerName, [{
          matchIndex: -1,
          date: allMatches[0].date,
          rating: new Rating(),
          skill: getConservativeRating(new Rating()),
          match: null
        }])
      }
    })
  })
  
  // Process each match and update ratings
  allMatches.forEach((match, matchIndex) => {
    // Get or create ratings for all players
    const team1Ratings = match.team1Players.map(playerName => {
      if (!playerRatings.has(playerName)) {
        playerRatings.set(playerName, new Rating())
      }
      return playerRatings.get(playerName)
    })
    
    const team2Ratings = match.team2Players.map(playerName => {
      if (!playerRatings.has(playerName)) {
        playerRatings.set(playerName, new Rating())
      }
      return playerRatings.get(playerName)
    })
    
    // Determine ranks (lower is better: 1 for winner, 2 for loser, 0 for draw)
    let ranks
    if (match.team1Score > match.team2Score) {
      ranks = [1, 2] // Team 1 wins
    } else if (match.team2Score > match.team1Score) {
      ranks = [2, 1] // Team 2 wins
    } else {
      ranks = [1, 1] // Draw
    }
    
    // Calculate new ratings
    try {
      const [newTeam1Ratings, newTeam2Ratings] = rate([team1Ratings, team2Ratings], ranks)
      
      // Update player ratings and history
      match.team1Players.forEach((playerName, index) => {
        if (index < newTeam1Ratings.length) {
          const newRating = newTeam1Ratings[index]
          playerRatings.set(playerName, newRating)
          
          // Add to history
          const history = playerHistory.get(playerName)
          history.push({
            matchIndex,
            date: match.date,
            rating: newRating,
            skill: getConservativeRating(newRating),
            match: {
              team1Players: match.team1Players,
              team2Players: match.team2Players,
              team1Score: match.team1Score,
              team2Score: match.team2Score,
              won: match.team1Score > match.team2Score
            }
          })
        }
      })
      
      match.team2Players.forEach((playerName, index) => {
        if (index < newTeam2Ratings.length) {
          const newRating = newTeam2Ratings[index]
          playerRatings.set(playerName, newRating)
          
          // Add to history
          const history = playerHistory.get(playerName)
          history.push({
            matchIndex,
            date: match.date,
            rating: newRating,
            skill: getConservativeRating(newRating),
            match: {
              team1Players: match.team1Players,
              team2Players: match.team2Players,
              team1Score: match.team1Score,
              team2Score: match.team2Score,
              won: match.team2Score > match.team1Score
            }
          })
        }
      })
    } catch (error) {
      console.warn('Error calculating TrueSkill for match:', error)
    }
  })
  
  return { playerRatings, playerHistory }
}

/**
 * Get the conservative skill estimate (mu - 3*sigma) for a player
 * This is commonly used as the skill rating in TrueSkill
 * @param {Rating} rating - TrueSkill Rating object
 * @returns {number} Conservative skill estimate
 */
export function getConservativeRating(rating) {
  if (!rating) return 0
  return rating.mu - 3 * rating.sigma
}

/**
 * Export player ratings to a simple object format
 * @param {Map} playerRatings - Map of player names to Rating objects
 * @returns {Object} Object with player names as keys and skill estimates as values
 */
export function exportRatings(playerRatings) {
  const ratings = {}
  playerRatings.forEach((rating, playerName) => {
    ratings[playerName] = {
      skill: getConservativeRating(rating),
      mu: rating.mu,
      sigma: rating.sigma
    }
  })
  return ratings
}

