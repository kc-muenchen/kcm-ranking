/**
 * Achievements display component
 */
export const AchievementsDisplay = ({ achievements }) => {
  const { unlocked, progress } = achievements
  
  return (
    <div className="achievements-container">
      {/* Unlocked Achievements */}
      <div className="achievements-unlocked">
        <h3 className="achievements-section-title">
          <span className="achievements-icon">✅</span>
          Unlocked ({unlocked.length})
        </h3>
        {unlocked.length > 0 ? (
          <div className="achievements-grid">
            {unlocked.map(achievement => (
              <div key={achievement.id} className={`achievement-badge unlocked tier-${achievement.tier}`}>
                <div className="achievement-emoji">{achievement.emoji}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                  {achievement.unlockedDate && (
                    <div className="achievement-date">
                      Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-achievements">No achievements unlocked yet. Keep playing!</div>
        )}
      </div>
      
      {/* Progress Toward Next Achievements */}
      {progress.length > 0 && (
        <div className="achievements-progress">
          <h3 className="achievements-section-title">
            <span className="achievements-icon">🎯</span>
            In Progress
          </h3>
          <div className="progress-list">
            {progress.map(achievement => {
              const progressPercent = Math.min((achievement.current / achievement.next) * 100, 100)
              const displayCurrent = achievement.id.includes('winRate') 
                ? achievement.current.toFixed(1) + '%'
                : achievement.current
              const displayNext = achievement.id.includes('winRate')
                ? achievement.next + '%'
                : achievement.next
              
              return (
                <div key={achievement.id} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-emoji">{achievement.emoji}</span>
                    <div className="progress-info">
                      <div className="progress-name">{achievement.name}</div>
                      <div className="progress-description">{achievement.description}</div>
                    </div>
                    <div className="progress-stats">
                      {displayCurrent} / {displayNext}
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${progressPercent}%` }}
                    >
                      <span className="progress-percent">{Math.round(progressPercent)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

