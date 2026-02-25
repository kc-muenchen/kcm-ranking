import './TournamentTypeToggle.css'

function TournamentTypeToggle({ tournamentType, onTournamentTypeChange  }: { tournamentType: any, onTournamentTypeChange: any }) {
  return (
    <div className="tournament-type-toggle">
      <button
        className={`type-button ${tournamentType === 'doubles' ? 'active' : ''}`}
        onClick={() => onTournamentTypeChange('doubles')}
      >
        <span className="button-icon">👥</span>
        Doubles
      </button>
      <button
        className={`type-button ${tournamentType === 'singles' ? 'active' : ''}`}
        onClick={() => onTournamentTypeChange('singles')}
      >
        <span className="button-icon">👤</span>
        Singles
      </button>
    </div>
  )
}

export default TournamentTypeToggle

