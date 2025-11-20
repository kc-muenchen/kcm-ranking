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
        className={`toggle-button ${viewMode === 'tournament' ? 'active' : ''}`}
        onClick={() => onViewModeChange('tournament')}
      >
        <span className="button-icon">📅</span>
        Single Tournament
      </button>
    </div>
  )
}

export default ViewToggle

