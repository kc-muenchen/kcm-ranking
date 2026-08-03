import { TrueSkill } from 'ts-trueskill'

/**
 * TrueSkill configuration
 * - mu: 25 (initial skill estimate)
 * - sigma: 25/3 ≈ 8.333 (initial uncertainty)
 * - beta: 5.5 (skill vs luck factor - higher = more luck-based)
 * - tau: 0.12 (dynamics factor - higher = skills change faster over time)
 * - drawProbability: 0 (table soccer has no draws)
 */
export const TRUESKILL_CONFIG = {
  mu: 25,
  sigma: 25 / 3,
  beta: 5.5,
  tau: 0.12,
  drawProbability: 0
}

// Create a TrueSkill environment with custom parameters
export const trueskill = new TrueSkill(
  TRUESKILL_CONFIG.mu,
  TRUESKILL_CONFIG.sigma,
  TRUESKILL_CONFIG.beta,
  TRUESKILL_CONFIG.tau,
  TRUESKILL_CONFIG.drawProbability
)

/**
 * Get the conservative skill estimate (mu - 3*sigma) for a player
 * @param {Rating} rating - TrueSkill Rating object
 * @returns {number} Conservative skill estimate
 */
export function getConservativeRating(rating) {
  if (!rating) return 0
  return rating.mu - 3 * rating.sigma
}

/**
 * Run the TrueSkill rating loop over a set of matches.
 *
 * Pure: takes already-normalized matches and returns ratings plus per-player
 * history. No database access, so it can be exercised directly in tests.
 *
 * @param {Array} matches - Objects of the shape
 *   { date, team1Players, team2Players, team1Score, team2Score }
 *   where the player entries are canonical (alias-normalized) names.
 * @returns {Object} { ratings, history, skipped } - ratings and history keyed by
 *   player name, and the number of matches that could not be rated.
 */
export function rateMatches(matches) {
  const playerRatings = new Map()
  const playerHistory = new Map()
  let skipped = 0

  // Rate in chronological order. Callers pass `date` already resolved (match
  // start time, falling back to the tournament date), so sorting here means a
  // match with no start time is still rated in its real position rather than
  // against ratings from its own future.
  const allMatches = [...matches].sort((a, b) => a.date - b.date)

  // Initialize history for all players with their starting rating
  allMatches.forEach(match => {
    [...match.team1Players, ...match.team2Players].forEach(playerName => {
      if (!playerHistory.has(playerName)) {
        const initialRating = trueskill.createRating()
        playerHistory.set(playerName, [{
          matchIndex: -1,
          date: allMatches[0].date,
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

    // Determine ranks (lower is better: 1 for winner, 2 for loser, equal for draw)
    let ranks
    if (match.team1Score > match.team2Score) {
      ranks = [1, 2] // Team 1 wins
    } else if (match.team2Score > match.team1Score) {
      ranks = [2, 1] // Team 2 wins
    } else {
      // Known hazard: drawProbability is 0, so the draw margin is 0 and rating a
      // tie is a zero-probability event whose update runs backwards - it inflates
      // sigma instead of shrinking it. Unreachable in practice because table
      // soccer has no draws and equal scores in the source data are byes, which
      // the importer filters out. See trueskill-engine.test.js.
      ranks = [1, 1] // Draw
    }

    try {
      const [newTeam1Ratings, newTeam2Ratings] = trueskill.rate([team1Ratings, team2Ratings], ranks)

      const record = (playerName, index, newRatings, won) => {
        if (index >= newRatings.length) return
        const newRating = newRatings[index]
        playerRatings.set(playerName, newRating)

        playerHistory.get(playerName).push({
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
            won
          }
        })
      }

      const team1Won = match.team1Score > match.team2Score
      match.team1Players.forEach((name, i) => record(name, i, newTeam1Ratings, team1Won))
      match.team2Players.forEach((name, i) => record(name, i, newTeam2Ratings, !team1Won))
    } catch (error) {
      skipped++
      console.warn('Error calculating TrueSkill for match:', error)
    }
  })

  // Convert Maps to objects for JSON serialization
  const ratings = {}
  playerRatings.forEach((rating, playerName) => {
    ratings[playerName] = {
      skill: getConservativeRating(rating),
      mu: rating.mu,
      sigma: rating.sigma
    }
  })

  const history = {}
  playerHistory.forEach((entries, playerName) => {
    history[playerName] = entries
  })

  return { ratings, history, skipped }
}
