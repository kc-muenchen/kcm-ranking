import { TrueSkillChart } from './TrueSkillChart'

/**
 * Performance tab component showing TrueSkill chart and match history
 */
export const PerformanceTab = ({ history, playerName, matchHistory, initialSkill }) => {
  return (
    <div className="tab-panel">
      {/* TrueSkill Evolution Chart */}
      <div className="trueskill-chart-section">
        <h2>TrueSkill Evolution</h2>
        <TrueSkillChart history={history} playerName={playerName} />
      </div>

      {/* Match History */}
      <div className="match-history-section">
        <h2>Match History</h2>
        <p className="section-subtitle">Showing {matchHistory.length} matches</p>
        
        <div className="match-list">
          {matchHistory.map((entry, index) => {
            const { match } = entry
            const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
            const teammates = playerTeam === 'team1' ? match.team1Players : match.team2Players
            const opponents = playerTeam === 'team1' ? match.team2Players : match.team1Players
            const score = playerTeam === 'team1' 
              ? `${match.team1Score} - ${match.team2Score}`
              : `${match.team2Score} - ${match.team1Score}`
            
            // Since array is reversed (newest first), calculate delta from next match (older)
            const skillDelta = index < matchHistory.length - 1 
              ? entry.skill - matchHistory[index + 1].skill 
              : entry.skill - initialSkill
            
            return (
              <div 
                key={index} 
                className={`match-card ${match.won ? 'won' : 'lost'}`}
              >
                <div className="match-header">
                  <span className={`match-result ${match.won ? 'won' : 'lost'}`}>
                    {match.won ? '✓ Won' : '✗ Lost'}
                  </span>
                  <span className="match-score">{score}</span>
                  <span className={`skill-change ${skillDelta >= 0 ? 'positive' : 'negative'}`}>
                    {skillDelta >= 0 ? '+' : ''}{skillDelta.toFixed(2)}
                  </span>
                </div>
                <div className="match-details">
                  <div className="team-info">
                    <span className="team-label">Your Team:</span>
                    <span className="team-players">{teammates.join(', ')}</span>
                  </div>
                  <div className="team-info">
                    <span className="team-label">Opponents:</span>
                    <span className="team-players">{opponents.join(', ')}</span>
                  </div>
                </div>
                <div className="match-footer">
                  <span className="match-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="trueskill-after">
                    TrueSkill: {entry.skill.toFixed(1)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

