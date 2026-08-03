import prisma from '../utils/db.js'
import { rateMatches } from './trueskill-engine.js'

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
 * Calculate TrueSkill ratings for all players across all tournaments.
 * Loads and normalizes matches from the database, then hands them to the
 * rating engine.
 * @returns {Promise<Object>} Object with ratings and history keyed by player name
 */
export async function calculateTrueSkillRatings() {
  // Load aliases for name normalization
  const aliasesMap = await loadAliases()

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
      // timeStart is nullable and Postgres sorts NULLS LAST on ASC, so the query
      // order alone would rate those matches after everything else. The engine
      // re-sorts on this resolved date.
      date: match.timeStart ? match.timeStart.getTime() : match.tournament.createdAt.getTime(),
      team1Players,
      team2Players,
      team1Score: match.team1Score,
      team2Score: match.team2Score
    }
  }).filter(match => match !== null)

  const { ratings, history } = rateMatches(allMatches)

  return { ratings, history }
}
