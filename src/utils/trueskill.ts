import { Rating, TrueSkill } from 'ts-trueskill'

/**
 * TrueSkill configuration - must stay in sync with the backend environment in
 * backend/src/services/trueskill-service.js, which is what actually computes the
 * ratings. This copy exists so the UI can derive win probabilities from them.
 *
 * - mu: 25 (initial skill estimate)
 * - sigma: 25/3 ≈ 8.333 (initial uncertainty)
 * - beta: 5.5 (skill vs luck factor - higher = more luck-based)
 * - tau: 0.12 (dynamics factor - higher = skills change faster over time)
 * - drawProbability: 0 (no draws in table soccer)
 */
const TRUESKILL_CONFIG = {
  mu: 25,
  sigma: 25 / 3,
  beta: 5.5,  // Changed from 3.0 to 5.5 - more luck-based
  tau: 0.12   // Increased from default ≈ 0.083 to 0.12
}

// Create a TrueSkill environment with custom parameters
const trueskill = new TrueSkill(TRUESKILL_CONFIG.mu, TRUESKILL_CONFIG.sigma, TRUESKILL_CONFIG.beta, TRUESKILL_CONFIG.tau, 0)

/**
 * Get the conservative skill estimate (mu - 3*sigma) for a player
 * This is commonly used as the skill rating in TrueSkill
 * @param {Rating} rating - TrueSkill Rating object
 * @returns {number} Conservative skill estimate
 */
export function getConservativeRating(rating: any) {
  if (!rating) return 0
  return rating.mu - 3 * rating.sigma
}

/**
 * Build a TrueSkill Rating from an aggregated player object.
 * Falls back to the environment defaults when a player has no rating yet.
 * @param {Object} player - Player with mu/sigma (as produced by playerProcessing)
 * @returns {Rating} TrueSkill Rating object
 */
export function toRating(player: any) {
  const mu = typeof player?.mu === 'number' ? player.mu : TRUESKILL_CONFIG.mu
  const sigma = typeof player?.sigma === 'number' ? player.sigma : TRUESKILL_CONFIG.sigma
  return new Rating(mu, sigma)
}

/**
 * Conservative skill estimate for a whole team: the summed means minus three
 * standard deviations of the combined (independent) uncertainty.
 * @param {Array} ratings - TrueSkill Rating objects
 * @returns {number} Conservative team skill estimate
 */
function getTeamSkill(ratings: any[]) {
  const mu = ratings.reduce((sum: number, r: any) => sum + r.mu, 0)
  const sigma = Math.sqrt(ratings.reduce((sum: number, r: any) => sum + r.sigma ** 2, 0))
  return mu - 3 * sigma
}

/**
 * Calculate win probability between two teams using the TrueSkill model.
 *
 * Delegates to the library's winProbability so beta and each player's own sigma
 * are accounted for, rather than approximating from conservative ratings (which
 * already have uncertainty baked in and would double-count it).
 *
 * @param {Array} team1Players - Players with mu/sigma (1 for a 1v1, 2 for doubles)
 * @param {Array} team2Players - Players with mu/sigma
 * @returns {Object} Win probabilities (0-1) and conservative team skills
 */
export function calculateWinProbability(team1Players: any[], team2Players: any[]) {
  const team1 = (team1Players || []).filter(Boolean).map(toRating)
  const team2 = (team2Players || []).filter(Boolean).map(toRating)

  if (team1.length === 0 || team2.length === 0) {
    return { team1WinProb: 0.5, team2WinProb: 0.5, team1Skill: 0, team2Skill: 0 }
  }

  const team1WinProb = trueskill.winProbability(team1, team2)

  return {
    team1WinProb,
    team2WinProb: 1 - team1WinProb,
    team1Skill: getTeamSkill(team1),
    team2Skill: getTeamSkill(team2)
  }
}
