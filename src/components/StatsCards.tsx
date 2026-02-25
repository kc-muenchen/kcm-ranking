import './StatsCards.css'
import { PlayerRecord, ViewMode } from '../types/components'
import { Tournament } from '../types/tournament'

interface StatsCardItem {
  title: string
  value: string | number | undefined
  subtitle?: string
  icon: string
  color: 'primary' | 'secondary' | 'warning' | 'success'
}

function StatsCards({ players, viewMode, tournaments  }: { players: PlayerRecord[], viewMode: ViewMode, tournaments: Tournament[] }) {
  const totalPlayers = players.length

  // Count unique matches from tournament data
  // Matches are nested: qualifying[0].rounds[].matches and eliminations[].levels[].matches
  const totalMatches = tournaments?.reduce((sum: number, tournament: Tournament) => {
    let matchCount = 0
    const tournamentData = tournament.data as any
    
    // Count qualifying matches (nested in rounds)
    if (tournamentData?.qualifying?.[0]?.rounds) {
      const qualifying = tournamentData.qualifying as any[]
      ;(qualifying[0]?.rounds as any[]).forEach((round) => {
        matchCount += round.matches?.length || 0
      })
    }
    
    // Count elimination matches (nested in levels)
    if (tournamentData?.eliminations) {
      ;(tournamentData.eliminations as any[]).forEach((elim) => {
        if (elim.levels) {
          ;(elim.levels as any[]).forEach((level) => {
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
  const topScorer = players.reduce((max: PlayerRecord, p: PlayerRecord) => 
    p.goalsFor > max.goalsFor ? p : max
  , players[0])
  const bestWinRate = players
    .filter((p) => p.matches >= 3)
    .reduce((max: PlayerRecord, p: PlayerRecord) => 
      parseFloat(String(p.winRate)) > parseFloat(String(max.winRate)) ? p : max
    , players[0])

  const cards: StatsCardItem[] = viewMode === 'overall' ? [
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

