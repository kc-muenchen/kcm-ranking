/**
 * Player header component with name and summary stats
 */
export const PlayerHeader = ({ playerName, currentSkill, skillChange, totalMatches, winRate, wins, losses }) => {
  return (
    <div className="player-header">
      <h1 className="player-title">{playerName}</h1>
      <div className="player-stats-summary">
        <div className="stat-box">
          <div className="stat-label">Current TrueSkill</div>
          <div className="stat-value trueskill">{currentSkill.toFixed(1)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Skill Change</div>
          <div className={`stat-value ${skillChange >= 0 ? 'positive' : 'negative'}`}>
            {skillChange >= 0 ? '+' : ''}{skillChange.toFixed(1)}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Matches</div>
          <div className="stat-value">{totalMatches}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{winRate}%</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Wins / Losses</div>
          <div className="stat-value">{wins} / {losses}</div>
        </div>
      </div>
    </div>
  )
}

