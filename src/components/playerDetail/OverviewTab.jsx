/**
 * Overview tab component showing best rankings, top partners, and opponent stats
 */
export const OverviewTab = ({ bestRankingStats, topPartners, opponentStats }) => {
  return (
    <div className="tab-panel">
      {/* Best Ranking and Top Partners Section */}
      <div className="player-insights">
        {/* Best Rankings (Top 3) */}
        <div className="insight-box best-ranking">
          <h3 className="insight-title">🏅 Best Rankings</h3>
          {bestRankingStats.length > 0 ? (
            <div className="rankings-list">
              {bestRankingStats.map((ranking, index) => (
                <div key={ranking.place} className={`ranking-item rank-level-${index + 1}`}>
                  <div className="ranking-header">
                    <div className="ranking-badge">
                      #{ranking.place}
                    </div>
                    <div className="ranking-count">
                      {ranking.count} time{ranking.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {ranking.count <= 3 && (
                    <div className="ranking-tournaments">
                      {ranking.tournaments.map((t, i) => (
                        <div key={i} className="tournament-badge-small">
                          {t.tournament}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No tournament data available</div>
          )}
        </div>

        {/* Top Partners */}
        <div className="insight-box top-partners">
          <h3 className="insight-title">🤝 Top Partners</h3>
          {topPartners.length > 0 ? (
            <div className="partners-list">
              {topPartners.map((partner, index) => (
                <div key={partner.name} className={`partner-item rank-${index + 1}`}>
                  <div className="partner-rank">#{index + 1}</div>
                  <div className="partner-info">
                    <div className="partner-name">{partner.name}</div>
                    <div className="partner-stats">
                      {partner.wins}W - {partner.losses}L ({partner.winRate}%)
                    </div>
                  </div>
                  <div className="partner-wins">{partner.wins} wins</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No partner data available</div>
          )}
        </div>
      </div>

      {/* Opponent Statistics */}
      <div className="opponent-stats-section">
        {/* Won Most Against */}
        <div className="insight-box opponent-box">
          <h3 className="insight-title">💪 Won Most Against</h3>
          {opponentStats.wonMostAgainst.length > 0 ? (
            <div className="opponent-list">
              {opponentStats.wonMostAgainst.map((opponent, index) => (
                <div key={opponent.name} className="opponent-item win-opponent">
                  <div className="opponent-rank">#{index + 1}</div>
                  <div className="opponent-info">
                    <div className="opponent-name">{opponent.name}</div>
                    <div className="opponent-record">
                      {opponent.wins}W - {opponent.losses}L ({opponent.winRate}%)
                    </div>
                  </div>
                  <div className="opponent-wins">{opponent.wins}W</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No opponent data available</div>
          )}
        </div>

        {/* Lost Most Against */}
        <div className="insight-box opponent-box">
          <h3 className="insight-title">😓 Lost Most Against</h3>
          {opponentStats.lostMostAgainst.length > 0 ? (
            <div className="opponent-list">
              {opponentStats.lostMostAgainst.map((opponent, index) => (
                <div key={opponent.name} className="opponent-item loss-opponent">
                  <div className="opponent-rank">#{index + 1}</div>
                  <div className="opponent-info">
                    <div className="opponent-name">{opponent.name}</div>
                    <div className="opponent-record">
                      {opponent.wins}W - {opponent.losses}L ({opponent.winRate}%)
                    </div>
                  </div>
                  <div className="opponent-losses">{opponent.losses}L</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No opponent data available</div>
          )}
        </div>
      </div>
    </div>
  )
}

