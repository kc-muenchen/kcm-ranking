import './StatsCards.css'

function StatsCards({ players, viewMode, tournaments }) {
  const totalPlayers = players.length

  // Count unique matches from tournament data
  // Matches are nested: qualifying[0].rounds[].matches and eliminations[].levels[].matches
  const totalMatches = tournaments?.reduce((sum, tournament) => {
    let matchCount = 0
    
    // Count qualifying matches (nested in rounds)
    if (tournament.data?.qualifying?.[0]?.rounds) {
      tournament.data.qualifying[0].rounds.forEach(round => {
        matchCount += round.matches?.length || 0
      })
    }
    
    // Count elimination matches (nested in levels)
    if (tournament.data?.eliminations) {
      tournament.data.eliminations.forEach(elim => {
        if (elim.levels) {
          elim.levels.forEach(level => {
            matchCount += level.matches?.length || 0
          })
        }
        // Count the match for the third place if there was one.
        if (elim.thirdPlace) {
          ++matchCount;
        }
      })
    }
    
    return sum + matchCount
  }, 0) || 0
  const topScorer = players.reduce((max, p) => 
    p.goalsFor > max.goalsFor ? p : max
  , players[0])
  const bestWinRate = players
    .filter(p => p.matches >= 3)
    .reduce((max, p) => 
      parseFloat(p.winRate) > parseFloat(max.winRate) ? p : max
    , players[0])

  const cards = viewMode === 'overall' ? [
    {
      title: 'Total Players',
      value: totalPlayers,
      icon: '👥',
      color: 'primary'
    },
    {
      title: 'Tournaments',
      value: tournaments?.length || 0,
      icon: '📅',
      color: 'secondary'
    },
    {
      title: 'Season Leader',
      value: players[0]?.name,
      subtitle: `${players[0]?.seasonPoints || 0} points`,
      icon: '🏆',
      color: 'warning'
    },
    {
      title: 'Top Scorer',
      value: topScorer?.name,
      subtitle: `${topScorer?.goalsFor} goals`,
      icon: '⚽',
      color: 'success'
    }
  ] : [
    {
      title: 'Total Players',
      value: totalPlayers,
      icon: '👥',
      color: 'primary'
    },
    {
      title: 'Total Matches',
      value: totalMatches,
      icon: '🎯',
      color: 'secondary'
    },
    {
      title: 'Top Scorer',
      value: topScorer?.name,
      subtitle: `${topScorer?.goalsFor} goals`,
      icon: '⚽',
      color: 'success'
    },
    {
      title: 'Best Win Rate',
      value: bestWinRate?.name,
      subtitle: `${bestWinRate?.winRate}%`,
      icon: '🏆',
      color: 'warning'
    }
  ]

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div key={index} className={`stat-card ${card.color}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-content">
            <div className="stat-title">{card.title}</div>
            <div className="stat-value">{card.value}</div>
            {card.subtitle && (
              <div className="stat-subtitle">{card.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards

