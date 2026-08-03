import { useState, useMemo } from 'react'
import SearchableSelect from './SearchableSelect'
import { calculateWinProbability } from '../utils/trueskill'
import './ProbabilityCalculator.css'

/**
 * Probability Calculator Component
 */
export const ProbabilityCalculator = ({ players  }: { players: any }) => {
  const [team1Player1, setTeam1Player1] = useState('')
  const [team1Player2, setTeam1Player2] = useState('')
  const [team2Player1, setTeam2Player1] = useState('')
  const [team2Player2, setTeam2Player2] = useState('')

  // Create player options for dropdowns
  const playerOptions = useMemo(() => {
    return players
      .sort((a: any, b: any) => b.trueSkill - a.trueSkill)
      .map((player: any) => ({
        value: player.name,
        label: `${player.name} (${player.trueSkill.toFixed(1)})`,
        trueSkill: player.trueSkill
      }))
  }, [players])

  // Look up a player's full rating (mu/sigma), not just the conservative estimate
  const getPlayer = (playerName: string) =>
    players.find((p: any) => p.name === playerName)

  // Calculate probabilities
  const probabilities = useMemo(() => {
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      return null
    }

    return calculateWinProbability(
      [getPlayer(team1Player1), getPlayer(team1Player2)],
      [getPlayer(team2Player1), getPlayer(team2Player2)]
    )
  }, [team1Player1, team1Player2, team2Player1, team2Player2, players])

  // Get filtered options (exclude already selected players)
  const getFilteredOptions = (excludePlayers: string[]) => {
    return playerOptions.filter((option: any) => !excludePlayers.includes(option.value))
  }

  const handleReset = () => {
    setTeam1Player1('')
    setTeam1Player2('')
    setTeam2Player1('')
    setTeam2Player2('')
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
                getOptionLabel={(option: any) => option.label || option}
                getOptionValue={(option: any) => option.value || option}
              />
            </div>
            <div className="player-selector">
              <label>Player 2</label>
              <SearchableSelect
                options={getFilteredOptions([team1Player1, team2Player1, team2Player2])}
                value={team1Player2}
                onChange={setTeam1Player2}
                placeholder="Select player..."
                getOptionLabel={(option: any) => option.label || option}
                getOptionValue={(option: any) => option.value || option}
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
                getOptionLabel={(option: any) => option.label || option}
                getOptionValue={(option: any) => option.value || option}
              />
            </div>
            <div className="player-selector">
              <label>Player 2</label>
              <SearchableSelect
                options={getFilteredOptions([team2Player1, team1Player1, team1Player2])}
                value={team2Player2}
                onChange={setTeam2Player2}
                placeholder="Select player..."
                getOptionLabel={(option: any) => option.label || option}
                getOptionValue={(option: any) => option.value || option}
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
                style={{ width: `${probabilities.team1WinProb * 100}%` }}
              >
                <span className="probability-label">
                  {(probabilities.team1WinProb * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="probability-bar team-2-bar">
              <div 
                className="probability-fill"
                style={{ width: `${probabilities.team2WinProb * 100}%` }}
              >
                <span className="probability-label">
                  {(probabilities.team2WinProb * 100).toFixed(1)}%
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
                  {(probabilities.team1WinProb * 100).toFixed(1)}%
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
                  {(probabilities.team2WinProb * 100).toFixed(1)}%
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

