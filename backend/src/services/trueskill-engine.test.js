import { describe, expect, it } from 'vitest'
import { TRUESKILL_CONFIG, getConservativeRating, rateMatches } from './trueskill-engine.js'

const DAY = 24 * 60 * 60 * 1000

/** Build a match in the shape rateMatches expects. */
const match = (date, team1Players, team2Players, team1Score, team2Score) => ({
  date, team1Players, team2Players, team1Score, team2Score
})

/** A decisive 2v2 win for team 1. */
const win = (date, team1Players, team2Players) => match(date, team1Players, team2Players, 5, 3)

describe('getConservativeRating', () => {
  it('exposes mu - 3*sigma', () => {
    expect(getConservativeRating({ mu: 30, sigma: 2 })).toBe(24)
  })

  it('puts a fresh rating at 0, not at mu', () => {
    expect(getConservativeRating({ mu: TRUESKILL_CONFIG.mu, sigma: TRUESKILL_CONFIG.sigma })).toBeCloseTo(0, 10)
  })

  it('returns 0 for a missing rating', () => {
    expect(getConservativeRating(null)).toBe(0)
  })
})

describe('rateMatches - basic updates', () => {
  it('raises the winners and lowers the losers', () => {
    const { ratings } = rateMatches([win(DAY, ['A', 'B'], ['C', 'D'])])

    expect(ratings.A.mu).toBeGreaterThan(TRUESKILL_CONFIG.mu)
    expect(ratings.B.mu).toBeGreaterThan(TRUESKILL_CONFIG.mu)
    expect(ratings.C.mu).toBeLessThan(TRUESKILL_CONFIG.mu)
    expect(ratings.D.mu).toBeLessThan(TRUESKILL_CONFIG.mu)
  })

  it('reduces uncertainty for everyone involved in a decisive result', () => {
    const { ratings } = rateMatches([win(DAY, ['A', 'B'], ['C', 'D'])])

    for (const name of ['A', 'B', 'C', 'D']) {
      expect(ratings[name].sigma).toBeLessThan(TRUESKILL_CONFIG.sigma)
    }
  })

  it('is symmetric under swapping the two teams', () => {
    const a = rateMatches([match(DAY, ['A', 'B'], ['C', 'D'], 5, 3)])
    const b = rateMatches([match(DAY, ['C', 'D'], ['A', 'B'], 3, 5)])

    expect(a.ratings.A.mu).toBeCloseTo(b.ratings.A.mu, 10)
    expect(a.ratings.C.mu).toBeCloseTo(b.ratings.C.mu, 10)
  })

  it('rewards beating a strong opponent more than beating a weak one', () => {
    // Build up C and D, then have A beat each of two identical-looking opponents
    const buildUp = [
      win(1 * DAY, ['C', 'D'], ['E', 'F']),
      win(2 * DAY, ['C', 'D'], ['E', 'F']),
      win(3 * DAY, ['C', 'D'], ['E', 'F'])
    ]

    const vsStrong = rateMatches([...buildUp, win(4 * DAY, ['A', 'B'], ['C', 'D'])])
    const vsWeak = rateMatches([...buildUp, win(4 * DAY, ['A', 'B'], ['E', 'F'])])

    expect(vsStrong.ratings.A.mu).toBeGreaterThan(vsWeak.ratings.A.mu)
  })

  it('ignores margin of victory', () => {
    const narrow = rateMatches([match(DAY, ['A', 'B'], ['C', 'D'], 5, 4)])
    const blowout = rateMatches([match(DAY, ['A', 'B'], ['C', 'D'], 5, 0)])

    expect(narrow.ratings.A.mu).toBeCloseTo(blowout.ratings.A.mu, 10)
  })
})

describe('rateMatches - chronological ordering', () => {
  it('rates matches by date regardless of input order', () => {
    const matches = [
      win(1 * DAY, ['A', 'B'], ['C', 'D']),
      win(2 * DAY, ['A', 'B'], ['E', 'F']),
      win(3 * DAY, ['C', 'D'], ['E', 'F'])
    ]
    const shuffled = [matches[2], matches[0], matches[1]]

    const inOrder = rateMatches(matches)
    const outOfOrder = rateMatches(shuffled)

    for (const name of ['A', 'B', 'C', 'D', 'E', 'F']) {
      expect(outOfOrder.ratings[name].mu).toBeCloseTo(inOrder.ratings[name].mu, 10)
      expect(outOfOrder.ratings[name].sigma).toBeCloseTo(inOrder.ratings[name].sigma, 10)
    }
  })

  it('rates a match that sorts last in the input at its real position', () => {
    // Mirrors the Postgres NULLS LAST hazard: the earliest match arrives last
    // because it has no timeStart and fell back to the tournament date.
    const early = win(1 * DAY, ['A', 'B'], ['C', 'D'])
    const late = win(2 * DAY, ['C', 'D'], ['A', 'B'])

    const correct = rateMatches([early, late])
    const asDelivered = rateMatches([late, early])

    expect(asDelivered.ratings.A.mu).toBeCloseTo(correct.ratings.A.mu, 10)
  })

  it('produces history in chronological order', () => {
    const { history } = rateMatches([
      win(3 * DAY, ['A', 'B'], ['C', 'D']),
      win(1 * DAY, ['A', 'B'], ['C', 'D']),
      win(2 * DAY, ['A', 'B'], ['C', 'D'])
    ])

    const dates = history.A.map(entry => entry.date)
    expect(dates).toEqual([...dates].sort((x, y) => x - y))
  })
})

describe('rateMatches - history', () => {
  it('seeds every player with a fresh rating before their first match', () => {
    const { history } = rateMatches([win(DAY, ['A', 'B'], ['C', 'D'])])

    const seed = history.A[0]
    expect(seed.matchIndex).toBe(-1)
    expect(seed.match).toBeNull()
    expect(seed.rating.mu).toBe(TRUESKILL_CONFIG.mu)
    expect(seed.rating.sigma).toBe(TRUESKILL_CONFIG.sigma)
    expect(seed.skill).toBeCloseTo(0, 10)
  })

  it('records one entry per match played, plus the seed', () => {
    const { history } = rateMatches([
      win(1 * DAY, ['A', 'B'], ['C', 'D']),
      win(2 * DAY, ['A', 'B'], ['E', 'F'])
    ])

    expect(history.A).toHaveLength(3)
    expect(history.E).toHaveLength(2)
  })

  it('marks won from each side of the match', () => {
    const { history } = rateMatches([win(DAY, ['A', 'B'], ['C', 'D'])])

    expect(history.A.at(-1).match.won).toBe(true)
    expect(history.C.at(-1).match.won).toBe(false)
  })

  it('keeps the final history skill in step with the final rating', () => {
    const { ratings, history } = rateMatches([
      win(1 * DAY, ['A', 'B'], ['C', 'D']),
      win(2 * DAY, ['C', 'D'], ['A', 'B'])
    ])

    expect(history.A.at(-1).skill).toBeCloseTo(ratings.A.skill, 10)
  })
})

describe('rateMatches - name handling', () => {
  it('accumulates matches onto one rating per canonical name', () => {
    // The service normalizes aliases before calling in, so two aliases of the
    // same player arrive as the same string and must share a rating.
    const { ratings, history } = rateMatches([
      win(1 * DAY, ['Phi', 'B'], ['C', 'D']),
      win(2 * DAY, ['Phi', 'B'], ['C', 'D'])
    ])

    expect(Object.keys(ratings).sort()).toEqual(['B', 'C', 'D', 'Phi'])
    expect(history.Phi).toHaveLength(3)
    expect(ratings.Phi.sigma).toBeLessThan(TRUESKILL_CONFIG.sigma)
  })

  it('handles a 1v1 match', () => {
    const { ratings } = rateMatches([win(DAY, ['A'], ['B'])])

    expect(ratings.A.mu).toBeGreaterThan(ratings.B.mu)
  })

  it('returns nothing for no matches', () => {
    expect(rateMatches([])).toEqual({ ratings: {}, history: {}, skipped: 0 })
  })

  it('does not mutate the caller\'s array', () => {
    const matches = [win(2 * DAY, ['A'], ['B']), win(1 * DAY, ['C'], ['D'])]
    const order = matches.map(m => m.date)

    rateMatches(matches)

    expect(matches.map(m => m.date)).toEqual(order)
  })
})

describe('rateMatches - draws', () => {
  // Table soccer has no draws, and equal scores in the source data are byes that
  // the importer filters out - so this path is unreachable today. These tests
  // pin down what it currently does, including the fact that it is wrong: with
  // drawProbability 0 the draw margin is 0, making a tie a zero-probability
  // event whose update inflates sigma instead of shrinking it.
  it('rates equal scores as a draw, leaving both sides level', () => {
    const { ratings } = rateMatches([match(DAY, ['A', 'B'], ['C', 'D'], 0, 0)])

    expect(ratings.A.mu).toBeCloseTo(ratings.C.mu, 10)
  })

  it('KNOWN ISSUE: a draw increases uncertainty instead of reducing it', () => {
    const { ratings } = rateMatches([match(DAY, ['A', 'B'], ['C', 'D'], 0, 0)])

    // Should be `toBeLessThan` if draws were modelled properly.
    expect(ratings.A.sigma).toBeGreaterThan(TRUESKILL_CONFIG.sigma)
  })
})
