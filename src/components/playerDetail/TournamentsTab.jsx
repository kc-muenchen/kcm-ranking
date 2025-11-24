/**
 * Tournaments tab component showing tournament participation list
 */
export const TournamentsTab = ({ tournamentList }) => {
  return (
    <div className="tab-panel">
      {/* Tournament Participation List */}
      <div className="tournament-list-section">
        <h2>Tournament Participation</h2>
        <p className="section-subtitle">Participated in {tournamentList.length} tournament{tournamentList.length !== 1 ? 's' : ''}</p>
        
        <div className="tournament-grid">
          {tournamentList.map((tournament, index) => (
            <div key={index} className="tournament-card">
              <div className="tournament-card-header">
                <span className="tournament-name">{tournament.name}</span>
                <span className="tournament-date">
                  {new Date(tournament.date).toLocaleDateString()}
                </span>
              </div>
              <div className="tournament-card-body">
                {tournament.finalPlace && (
                  <div className="tournament-placement">
                    <span className="placement-label">Final Place:</span>
                    <span className={`placement-value ${tournament.finalPlace <= 3 ? 'podium' : ''}`}>
                      #{tournament.finalPlace}
                    </span>
                  </div>
                )}
                {tournament.qualifyingPlace && tournament.eliminationPlace && (
                  <div className="tournament-details">
                    <span className="detail-item">
                      <span className="detail-label">Qualifying:</span>
                      <span className="detail-value">#{tournament.qualifyingPlace}</span>
                    </span>
                    <span className="detail-item">
                      <span className="detail-label">Knockout:</span>
                      <span className="detail-value">#{tournament.eliminationPlace}</span>
                    </span>
                  </div>
                )}
                {tournament.seasonPoints !== undefined && (
                  <div className="tournament-season-points">
                    <span className="season-points-label">Season Points:</span>
                    <span className="season-points-earned">+{tournament.seasonPoints}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

