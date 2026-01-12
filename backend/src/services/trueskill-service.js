import { Rating, TrueSkill } from 'ts-trueskill'
import prisma from '../utils/db.js'

/**
 * TrueSkill configuration
 * - mu: 25 (initial skill estimate)
 * - sigma: 25/3 ≈ 8.333 (initial uncertainty)
 * - beta: 5.5 (skill vs luck factor - higher = more luck-based)
 * - tau: 0.12 (dynamics factor - higher = skills change faster over time)
 */
const TRUESKILL_CONFIG = {
  mu: 25,
  sigma: 25 / 3,
  beta: 5.5,
  tau: 0.12
}

// Create a TrueSkill environment with custom parameters
const trueskill = new TrueSkill(TRUESKILL_CONFIG.mu, TRUESKILL_CONFIG.sigma, TRUESKILL_CONFIG.beta, TRUESKILL_CONFIG.tau, 0)

/**
 * Get the conservative skill estimate (mu - 3*sigma) for a player
 * @param {Rating} rating - TrueSkill Rating object
 * @returns {number} Conservative skill estimate
 */
function getConservativeRating(rating) {
  if (!rating) return 0
  return rating.mu - 3 * rating.sigma
}

/**
 * Normalize player name using aliases
 * @param {string} name - Player name to normalize
 * @param {Map<string, string>} aliasesMap - Map of alias -> canonical name
 * @returns {string} Normalized player name
 */
function normalizePlayerName(name, aliasesMap) {
  if (!name) return name
  const trimmed = name.trim()
  return aliasesMap.get(trimmed) || trimmed
}

/**
 * Load all player aliases from database
 * @returns {Promise<Map<string, string>>} Map of alias -> canonical name
 */
async function loadAliases() {
  const aliases = await prisma.playerAlias.findMany({
    select: {
      alias: true,
      canonicalName: true
    }
  })
  
  const map = new Map()
  aliases.forEach(alias => {
    map.set(alias.alias, alias.canonicalName)
  })
  
  return map
}

/**
 * Calculate TrueSkill ratings for all players across all tournaments
 * @returns {Promise<Object>} Object with playerRatings Map and playerHistory Map
 */
export async function calculateTrueSkillRatings() {
  // Load aliases for name normalization
  const aliasesMap = await loadAliases()
  
  // Initialize player ratings
  const playerRatings = new Map()
  const playerHistory = new Map()
  
  // Fetch all matches with teams and players, ordered by date
  const matches = await prisma.match.findMany({
    where: {
      valid: true,
      skipped: false
    },
    include: {
      tournament: {
        select: {
          createdAt: true
        }
      },
      teams: {
        include: {
          players: {
            include: {
              player: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          teamNumber: 'asc'
        }
      }
    },
    orderBy: {
      timeStart: 'asc'
    }
  })
  
  // Convert matches to format needed for TrueSkill calculation
  const allMatches = matches.map(match => {
    const team1 = match.teams.find(t => t.teamNumber === 1)
    const team2 = match.teams.find(t => t.teamNumber === 2)
    
    if (!team1 || !team2) return null
    
    const team1Players = team1.players
      .map(tp => normalizePlayerName(tp.player.name, aliasesMap))
      .filter(name => name)
    
    const team2Players = team2.players
      .map(tp => normalizePlayerName(tp.player.name, aliasesMap))
      .filter(name => name)
    
    if (team1Players.length === 0 || team2Players.length === 0) return null
    
    return {
      matchId: match.id,
      date: match.timeStart ? match.timeStart.getTime() : match.tournament.createdAt.getTime(),
      team1Players,
      team2Players,
      team1Score: match.team1Score,
      team2Score: match.team2Score
    }
  }).filter(match => match !== null)
  
  // Initialize history for all players with their starting rating
  allMatches.forEach(match => {
    [...match.team1Players, ...match.team2Players].forEach(playerName => {
      if (!playerHistory.has(playerName)) {
        const initialRating = trueskill.createRating()
        playerHistory.set(playerName, [{
          matchIndex: -1,
          date: allMatches[0]?.date || Date.now(),
          rating: {
            mu: initialRating.mu,
            sigma: initialRating.sigma
          },
          skill: getConservativeRating(initialRating),
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
        playerRatings.set(playerName, trueskill.createRating())
      }
      return playerRatings.get(playerName)
    })
    
    const team2Ratings = match.team2Players.map(playerName => {
      if (!playerRatings.has(playerName)) {
        playerRatings.set(playerName, trueskill.createRating())
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
    
    // Calculate new ratings with custom environment
    try {
      const result = trueskill.rate([team1Ratings, team2Ratings], ranks)
      const [newTeam1Ratings, newTeam2Ratings] = result
      
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
            rating: {
              mu: newRating.mu,
              sigma: newRating.sigma
            },
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
            rating: {
              mu: newRating.mu,
              sigma: newRating.sigma
            },
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
  
  // Convert Maps to objects for JSON serialization
  const ratingsObj = {}
  playerRatings.forEach((rating, playerName) => {
    ratingsObj[playerName] = {
      skill: getConservativeRating(rating),
      mu: rating.mu,
      sigma: rating.sigma
    }
  })
  
  const historyObj = {}
  playerHistory.forEach((history, playerName) => {
    historyObj[playerName] = history
  })
  
  return {
    ratings: ratingsObj,
    history: historyObj
  }
}

