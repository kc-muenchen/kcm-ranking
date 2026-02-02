import { useState, useMemo } from 'react'
import { Rating } from 'ts-trueskill'
import SearchableSelect from './SearchableSelect'
import './ProbabilityCalculator.css'

/**
 * Calculate win probability for team1 vs team2 using TrueSkill ratings
 * Based on the TrueSkill algorithm's win probability formula
 */
function calculateWinProbability(team1Ratings, team2Ratings) {
  // Calculate team skill (sum of player skills)
  const team1Mu = team1Ratings.reduce((sum, rating) => sum + rating.mu, 0)
  const team2Mu = team2Ratings.reduce((sum, rating) => sum + rating.mu, 0)
  
  // Calculate team uncertainty (combined variance)
  const team1Sigma = Math.sqrt(team1Ratings.reduce((sum, rating) => sum + rating.sigma ** 2, 0))
  const team2Sigma = Math.sqrt(team2Ratings.reduce((sum, rating) => sum + rating.sigma ** 2, 0))
  
  // Total uncertainty
  const beta = 25 / 6 // Default beta from TrueSkill
  const totalSigma = Math.sqrt(team1Sigma ** 2 + team2Sigma ** 2 + 2 * beta ** 2)
  
  // Win probability using cumulative normal distribution
  const muDiff = team1Mu - team2Mu
  const probability = cumulativeNormal(muDiff / totalSigma)
  
  return {
    team1WinProbability: probability,
    team2WinProbability: 1 - probability,
    team1Skill: team1Mu - 3 * team1Sigma,
    team2Skill: team2Mu - 3 * team2Sigma
  }
}

/**
 * Cumulative normal distribution function
 */
function cumulativeNormal(x) {
  // Using the error function approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  
  return x > 0 ? 1 - probability : probability
}

/**
 * Probability Calculator Component
 */
export const ProbabilityCalculator = ({ players }) => {
  const [team1Player1, setTeam1Player1] = useState(null)
  const [team1Player2, setTeam1Player2] = useState(null)
  const [team2Player1, setTeam2Player1] = useState(null)
  const [team2Player2, setTeam2Player2] = useState(null)

  // Create player options for dropdowns
  const playerOptions = useMemo(() => {
    return players
      .sort((a, b) => b.trueSkill - a.trueSkill)
      .map(player => ({
        value: player.name,
        label: `${player.name} (${player.trueSkill.toFixed(1)})`,
        trueSkill: player.trueSkill,
        rating: player.rating || new Rating() // Use stored rating or default
      }))
  }, [players])

  // Get player rating
  const getPlayerRating = (playerName) => {
    const player = players.find(p => p.name === playerName)
    if (!player) return new Rating()
    
    // If player has rating object, use it, otherwise create from trueSkill
    if (player.rating) return player.rating
    
    // Estimate mu from conservative rating (trueSkill = mu - 3*sigma)
    // Assuming default sigma of 8.333
    const sigma = 8.333
    const mu = player.trueSkill + 3 * sigma
    return new Rating(mu, sigma)
  }

  // Calculate probabilities
  const probabilities = useMemo(() => {
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      return null
    }

    const team1Ratings = [
      getPlayerRating(team1Player1),
      getPlayerRating(team1Player2)
    ]

    const team2Ratings = [
      getPlayerRating(team2Player1),
      getPlayerRating(team2Player2)
    ]

    return calculateWinProbability(team1Ratings, team2Ratings)
  }, [team1Player1, team1Player2, team2Player1, team2Player2, players])

  // Get filtered options (exclude already selected players)
  const getFilteredOptions = (excludePlayers) => {
    return playerOptions.filter(option => !excludePlayers.includes(option.value))
  }

  const handleReset = () => {
    setTeam1Player1(null)
    setTeam1Player2(null)
    setTeam2Player1(null)
    setTeam2Player2(null)
  }

  return (
    <div className="probability-calculator">
      <div className="calculator-header">
        <h2>🎯 Doubles Match Probability Calculator</h2>
        <p className="calculator-description">
          Select two teams to calculate win probabilities based on TrueSkill ratings
        </p>
      </div>

      <div className="teams-selector">
        {/* Team 1 */}
        <div className="team-selector team-1">
          <h3 className="team-title">Team 1</h3>
          <div className="player-selectors">
            <div className="player-selector">
              <label>Player 1</label>
              <SearchableSelect
                options={getFilteredOptions([team1Player2, team2Player1, team2Player2])}
                value={team1Player1}
                onChange={setTeam1Player1}
                placeholder="Select player..."
                getOptionLabel={(option) => option.label || option}
                getOptionValue={(option) => option.value || option}
              />
            </div>
            <div className="player-selector">
              <label>Player 2</label>
              <SearchableSelect
                options={getFilteredOptions([team1Player1, team2Player1, team2Player2])}
                value={team1Player2}
                onChange={setTeam1Player2}
                placeholder="Select player..."
                getOptionLabel={(option) => option.label || option}
                getOptionValue={(option) => option.value || option}
              />
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        {/* Team 2 */}
        <div className="team-selector team-2">
          <h3 className="team-title">Team 2</h3>
          <div className="player-selectors">
            <div className="player-selector">
              <label>Player 1</label>
              <SearchableSelect
                options={getFilteredOptions([team2Player2, team1Player1, team1Player2])}
                value={team2Player1}
                onChange={setTeam2Player1}
                placeholder="Select player..."
                getOptionLabel={(option) => option.label || option}
                getOptionValue={(option) => option.value || option}
              />
            </div>
            <div className="player-selector">
              <label>Player 2</label>
              <SearchableSelect
                options={getFilteredOptions([team2Player1, team1Player1, team1Player2])}
                value={team2Player2}
                onChange={setTeam2Player2}
                placeholder="Select player..."
                getOptionLabel={(option) => option.label || option}
                getOptionValue={(option) => option.value || option}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Probabilities Display */}
      {probabilities && (
        <div className="probabilities-display">
          <div className="probability-bars">
            <div className="probability-bar team-1-bar">
              <div 
                className="probability-fill"
                style={{ width: `${probabilities.team1WinProbability * 100}%` }}
              >
                <span className="probability-label">
                  {(probabilities.team1WinProbability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="probability-bar team-2-bar">
              <div 
                className="probability-fill"
                style={{ width: `${probabilities.team2WinProbability * 100}%` }}
              >
                <span className="probability-label">
                  {(probabilities.team2WinProbability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="detailed-stats">
            <div className="team-stats team-1-stats">
              <h4>Team 1</h4>
              <div className="team-players">
                <span>{team1Player1}</span>
                <span>{team1Player2}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Win Probability:</span>
                <span className="stat-value win-prob">
                  {(probabilities.team1WinProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Combined Skill:</span>
                <span className="stat-value">
                  {probabilities.team1Skill.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="team-stats team-2-stats">
              <h4>Team 2</h4>
              <div className="team-players">
                <span>{team2Player1}</span>
                <span>{team2Player2}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Win Probability:</span>
                <span className="stat-value win-prob">
                  {(probabilities.team2WinProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Combined Skill:</span>
                <span className="stat-value">
                  {probabilities.team2Skill.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="match-info">
            <p className="info-note">
              <strong>Note:</strong> Probabilities are calculated using TrueSkill ratings. 
              Actual match outcomes may vary based on form, table conditions, and other factors.
            </p>
          </div>
        </div>
      )}

      {!probabilities && (
        <div className="no-calculation">
          <p>👆 Select all players to calculate probabilities</p>
        </div>
      )}

      {probabilities && (
        <button className="reset-button" onClick={handleReset}>
          🔄 Reset
        </button>
      )}
    </div>
  )
}

export default ProbabilityCalculator

