import './EliminationBracket.css'

function EliminationBracket({ eliminationData }) {
  if (!eliminationData || eliminationData.length === 0) {
    return null
  }

  // Convert technical group names to readable names
  const getReadableLevelName = (name, levelIndex) => {
    if (!name) {
      // Fallback to index-based names if no name provided
      return levelIndex === 0 ? 'Quarterfinal' : 
             levelIndex === 1 ? 'Semifinal' : 
             levelIndex === 2 ? 'Final' : 
             levelIndex === 3 ? 'Third Place' :
             `Round ${levelIndex + 1}`
    }

    const upperName = name.toUpperCase()
    
    // Map technical names to readable names
    if (upperName.includes('THIRD_PLACE') || upperName.includes('THIRD PLACE')) {
      return 'Third Place'
    }
    if (upperName.includes('FINALS-1-1') || (upperName.includes('FINAL') && upperName.includes('1-1'))) {
      return 'Final'
    }
    if (upperName.includes('FINALS-1-2') || (upperName.includes('FINAL') && upperName.includes('1-2'))) {
      return 'Semifinal'
    }
    if (upperName.includes('FINALS-1-4') || (upperName.includes('FINAL') && upperName.includes('1-4'))) {
      return 'Quarterfinal'
    }
    if (upperName.includes('QUARTERFINAL') || upperName.includes('QUARTER')) {
      return 'Quarterfinal'
    }
    if (upperName.includes('SEMIFINAL') || upperName.includes('SEMI')) {
      return 'Semifinal'
    }
    if (upperName.includes('FINAL') && !upperName.includes('SEMI') && !upperName.includes('QUARTER')) {
      return 'Final'
    }
    
    // If no match, return the original name (might already be readable)
    return name
  }

  const renderMatch = (match) => {
    if (!match || !match.team1 || !match.team2) return null

    const team1Won = match.result && match.result[0] > match.result[1]
    const team2Won = match.result && match.result[1] > match.result[0]

    return (
      <div key={match._id} className="match-card">
        <div className={`team ${team1Won ? 'winner' : ''}`}>
          <span className="team-name">{match.team1.name}</span>
          {match.result && <span className="score">{match.result[0]}</span>}
        </div>
        <div className={`team ${team2Won ? 'winner' : ''}`}>
          <span className="team-name">{match.team2.name}</span>
          {match.result && <span className="score">{match.result[1]}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="elimination-bracket">
      <div className="bracket-header">
        <h2>🏆 Knockout Stage</h2>
        <p className="bracket-subtitle">Finals and Playoffs</p>
      </div>

      {eliminationData.map((elimination, index) => (
        <div key={`elimination-${index}`} className="elimination-section">

          <div className="bracket-container">
            {/* Render levels (rounds) */}
            {elimination.levels && elimination.levels.map((level, levelIndex) => {
            // Try multiple sources for the level name (group.name from export might be in different fields)
              const rawName = level.name || level.groupName || level.group?.name || null
              const levelName = getReadableLevelName(rawName, levelIndex)
              return (
                <div key={`level-${levelIndex}`} className="bracket-round">
                  <div className="round-title">{levelName}</div>
                  <div className="matches">
                    {level.matches && level.matches.map(renderMatch)}
                  </div>
                </div>
              );
            })}

            {/* Render third place match if exists */}
            {elimination.third && elimination.third.matches && (
              <div className="bracket-round third-place">
                <div className="round-title">{elimination.third.name}</div>
                <div className="matches">
                  {elimination.third.matches.map(renderMatch)}
                </div>
              </div>
            )}
          </div>

          {/* Display final standings */}
          {elimination.standings && elimination.standings.length > 0 && (
            <div className="elimination-standings">
              <h4>Final Results</h4>
              <div className="podium">
                {elimination.standings
                  .filter(player => player.stats.finalResult && player.stats.place <= 4)
                  .sort((a, b) => a.stats.place - b.stats.place)
                  .map((player) => (
                    <div key={player._id} className={`podium-place place-${player.stats.place}`}>
                      <div className="podium-rank">
                        {player.stats.place === 1 && '🥇'}
                        {player.stats.place === 2 && '🥈'}
                        {player.stats.place === 3 && '🥉'}
                        {player.stats.place === 4 && '4th'}
                      </div>
                      <div className="podium-name">{player.name}</div>
                      <div className="podium-stats">
                        {player.stats.won}W - {player.stats.lost}L
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default EliminationBracket

