import { describe, expect, it } from 'vitest'
import { calculateWinProbability, getConservativeRating, toRating } from './trueskill'

/** An aggregated player as produced by playerProcessing. */
const player = (mu: number, sigma: number) => ({ mu, sigma, trueSkill: mu - 3 * sigma })

describe('getConservativeRating', () => {
  it('exposes mu - 3*sigma', () => {
    expect(getConservativeRating({ mu: 30, sigma: 2 })).toBe(24)
  })

  it('returns 0 for a missing rating', () => {
    expect(getConservativeRating(null)).toBe(0)
  })
})

describe('toRating', () => {
  it('uses the player\'s own mu and sigma', () => {
    const rating = toRating(player(31, 1.6))

    expect(rating.mu).toBe(31)
    expect(rating.sigma).toBe(1.6)
  })

  it('falls back to the environment defaults for an unrated player', () => {
    const rating = toRating({ name: 'Newcomer' })

    expect(rating.mu).toBe(25)
    expect(rating.sigma).toBeCloseTo(25 / 3, 10)
  })
})

describe('calculateWinProbability', () => {
  it('gives evenly matched players 50/50', () => {
    const { team1WinProb, team2WinProb } = calculateWinProbability([player(25, 3)], [player(25, 3)])

    expect(team1WinProb).toBeCloseTo(0.5, 6)
    expect(team2WinProb).toBeCloseTo(0.5, 6)
  })

  it('always returns probabilities that sum to 1', () => {
    const { team1WinProb, team2WinProb } = calculateWinProbability(
      [player(31, 1.6), player(29, 1.8)],
      [player(27, 2.0), player(26, 2.2)]
    )

    expect(team1WinProb + team2WinProb).toBeCloseTo(1, 10)
  })

  it('favours the stronger side', () => {
    const { team1WinProb } = calculateWinProbability([player(32, 2)], [player(22, 2)])

    expect(team1WinProb).toBeGreaterThan(0.5)
  })

  it('grows more confident as the gap widens', () => {
    const gaps = [1, 3, 6, 10].map(
      gap => calculateWinProbability([player(25 + gap, 2)], [player(25, 2)]).team1WinProb
    )

    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i]).toBeGreaterThan(gaps[i - 1])
    }
  })

  it('is less confident about an uncertain player than a well-established one', () => {
    const certain = calculateWinProbability([player(32, 1.5)], [player(25, 1.5)]).team1WinProb
    const uncertain = calculateWinProbability([player(32, 7)], [player(25, 1.5)]).team1WinProb

    expect(uncertain).toBeLessThan(certain)
  })

  it('does not double-count uncertainty the way the old logistic did', () => {
    // The previous implementation applied 1/(1+exp(-delta/3)) to conservative
    // ratings, which read a 10-point gap as 96.6%. The model puts it near 88.7%.
    const { team1WinProb } = calculateWinProbability([player(32, 2)], [player(22, 2)])

    expect(team1WinProb).toBeLessThan(0.92)
    expect(team1WinProb).toBeGreaterThan(0.85)
  })

  it('is symmetric under swapping the teams', () => {
    const teamA = [player(31, 1.6), player(29, 1.8)]
    const teamB = [player(27, 2.0), player(26, 2.2)]

    const forward = calculateWinProbability(teamA, teamB)
    const reverse = calculateWinProbability(teamB, teamA)

    expect(forward.team1WinProb).toBeCloseTo(reverse.team2WinProb, 10)
    expect(forward.team1Skill).toBeCloseTo(reverse.team2Skill, 10)
  })

  it('reports conservative team skill below the summed means', () => {
    const { team1Skill } = calculateWinProbability([player(31, 1.6), player(29, 1.8)], [player(25, 2)])

    expect(team1Skill).toBeLessThan(31 + 29)
  })

  it('falls back to 50/50 when a team is empty or a player is missing', () => {
    expect(calculateWinProbability([], [player(25, 3)]).team1WinProb).toBe(0.5)
    expect(calculateWinProbability([undefined], [player(25, 3)]).team1WinProb).toBe(0.5)
  })
})
