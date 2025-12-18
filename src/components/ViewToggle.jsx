import './ViewToggle.css'

function ViewToggle({ viewMode, onViewModeChange }) {
  return (
    <div className="view-toggle">
      <button
        className={`toggle-button ${viewMode === 'overall' ? 'active' : ''}`}
        onClick={() => onViewModeChange('overall')}
      >
        <span className="button-icon">🌟</span>
        Overall Ranking
      </button>
      <button
        className={`toggle-button ${viewMode === 'season' ? 'active' : ''}`}
        onClick={() => onViewModeChange('season')}
      >
        <span className="button-icon">📊</span>
        Season Ranking
      </button>
      <button
        className={`toggle-button ${viewMode === 'tournament' ? 'active' : ''}`}
        onClick={() => onViewModeChange('tournament')}
      >
        <span className="button-icon">📅</span>
        Single Tournament
      </button>
      <button
        className={`toggle-button ${viewMode === 'probability' ? 'active' : ''}`}
        onClick={() => onViewModeChange('probability')}
      >
        <span className="button-icon">🎯</span>
        Match Probability
      </button>
    </div>
  )
}

export default ViewToggle

