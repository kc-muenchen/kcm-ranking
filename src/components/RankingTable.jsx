import { useState } from 'react'
import './RankingTable.css'

function RankingTable({ players, viewMode, onPlayerSelect, selectedSeason, showSurelyQualified }) {
  const [sortBy, setSortBy] = useState(viewMode === 'tournament' ? 'finalPlace' : 'place')
  const [sortOrder, setSortOrder] = useState('asc')
  const [copied, setCopied] = useState(false)

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder(field === 'place' ? 'asc' : 'desc')
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    // Handle numeric sorting
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }

    // Handle string sorting
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return 0
  })

  const getMedalEmoji = (place) => {
    if (place === 1) return '🥇'
    if (place === 2) return '🥈'
    if (place === 3) return '🥉'
    return place
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="sort-icon">↕️</span>
    return sortOrder === 'asc' 
      ? <span className="sort-icon active">↑</span>
      : <span className="sort-icon active">↓</span>
  }

  const exportToWhatsApp = async () => {
    // Sort players by place (ascending) for export, limit to first 25
    const sortedForExport = [...players].sort((a, b) => a.place - b.place).slice(0, 25)
    
    // Format as WhatsApp message
    const seasonText = selectedSeason ? ` ${selectedSeason}` : ''
    let message = `🏆 *Season Rankings${seasonText}*\n\n`
    
    sortedForExport.forEach((player, index) => {
      const place = player.place
      const medal = getMedalEmoji(place)
      const name = player.name
      const points = player.seasonPoints
      
      // Add qualification badges if applicable
      let statusBadge = ''
      if (player.finaleStatus === 'qualified') {
        statusBadge = ' ✓'
      } else if (player.finaleStatus === 'successor') {
        statusBadge = ' →'
      }
      
      message += `${place <= 3 ? medal : place + '.'} ${name} - ${points} pts${statusBadge}\n`
    })

    // Add season points calculation info (in German)
    message += `\n📊 *Punkteberechnung:*\n`
    message += `Punkte basierend auf Endplatzierung (1.: 25, 2.: 20, 3.: 16, 4.: 13, 5.: 10) plus 1 Anwesenheitspunkt für alle.\n`
    message += `Plätze 5-16 erhalten alle 11 Punkte (z.B. 1. Platz = 26 Gesamtpunkte, 5.-16. Platz = 11 Gesamtpunkte, 17.+ Platz = 1 Gesamtpunkt)\n\n`
    message += `*Qualifikation:*\n`
    message += `Mindestens 10 Turnierteilnahmen erforderlich. Top 20 Spieler sind qualifiziert für das Saisonfinale.`
        
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = message
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="ranking-table-container">
      <div className="table-header">
        <div className="table-header-top">
          <div>
            <h2>
              {viewMode === 'overall' ? 'Overall Rankings' : 
               viewMode === 'season' ? 'Season Rankings' : 
               'Player Rankings'}
            </h2>
            <p className="table-subtitle">
              {viewMode === 'overall' 
                ? `Showing ${players.length} players across all tournaments`
                : viewMode === 'season'
                ? (() => {
                    if (showSurelyQualified) {
                      return `Showing ${players.length} players who are surely qualified (will remain in top 20 even if they skip next tournament)`
                    }
                    const qualified = players.filter(p => p.finaleStatus === 'qualified').length
                    const successors = players.filter(p => p.finaleStatus === 'successor').length
                    if (qualified > 0 || successors > 0) {
                      return `Showing ${qualified} qualified players${successors > 0 ? ` + ${successors} potential successors` : ''} (min. 10 games)`
                    }
                    return `Showing ${players.length} players for this season`
                  })()
                : `Showing ${players.length} players`
              }
            </p>
          </div>
          {false && viewMode === 'season' && players.length > 0 && (
            <button 
              className="export-whatsapp-btn"
              onClick={exportToWhatsApp}
              title="Copy ranking to clipboard as WhatsApp message"
            >
              {copied ? '✓ Copied!' : '📱 Export to WhatsApp'}
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="ranking-table">
          <thead>
            <tr>
              <th onClick={() => handleSort(viewMode === 'tournament' ? 'finalPlace' : 'place')} className="sortable">
                {viewMode === 'tournament' ? 'Final' : 'Rank'} <SortIcon field={viewMode === 'tournament' ? 'finalPlace' : 'place'} />
              </th>
              <th onClick={() => handleSort('name')} className="sortable name-col">
                Player <SortIcon field="name" />
              </th>
              {(viewMode === 'overall' || viewMode === 'season') && (
                <>
                  <th onClick={() => handleSort('seasonPoints')} className="sortable season-points-col" title="Season Points - Championship points based on tournament placements">
                    Season Points <SortIcon field="seasonPoints" />
                  </th>
                  <th onClick={() => handleSort('trueSkill')} className="sortable" title="TrueSkill Rating - A skill-based ranking system">
                    TrueSkill <SortIcon field="trueSkill" />
                  </th>
                  {viewMode === 'overall' && (
                    <>
                      <th onClick={() => handleSort('tournaments')} className="sortable">
                        Tournaments <SortIcon field="tournaments" />
                      </th>
                      <th onClick={() => handleSort('bestPlace')} className="sortable">
                        Best Place <SortIcon field="bestPlace" />
                      </th>
                      <th onClick={() => handleSort('avgPlace')} className="sortable">
                        Avg Place <SortIcon field="avgPlace" />
                      </th>
                    </>
                  )}
                  {viewMode === 'season' && (
                    <>
                      <th onClick={() => handleSort('tournaments')} className="sortable">
                        Tournaments <SortIcon field="tournaments" />
                      </th>
                      <th onClick={() => handleSort('bestPlace')} className="sortable">
                        Best Place <SortIcon field="bestPlace" />
                      </th>
                      <th onClick={() => handleSort('avgPlace')} className="sortable">
                        Avg Place <SortIcon field="avgPlace" />
                      </th>
                    </>
                  )}
                </>
              )}
              {viewMode === 'tournament' && (
                <>
                  <th onClick={() => handleSort('qualifyingPlace')} className="sortable">
                    Qualifying <SortIcon field="qualifyingPlace" />
                  </th>
                  <th onClick={() => handleSort('eliminationPlace')} className="sortable">
                    Knockout <SortIcon field="eliminationPlace" />
                  </th>
                </>
              )}
              <th onClick={() => handleSort('matches')} className="sortable">
                Matches <SortIcon field="matches" />
              </th>
              <th onClick={() => handleSort('points')} className="sortable">
                Points <SortIcon field="points" />
              </th>
              <th onClick={() => handleSort('won')} className="sortable">
                Won <SortIcon field="won" />
              </th>
              <th onClick={() => handleSort('lost')} className="sortable">
                Lost <SortIcon field="lost" />
              </th>
              <th onClick={() => handleSort('winRate')} className="sortable">
                Win % <SortIcon field="winRate" />
              </th>
              <th onClick={() => handleSort('goalsFor')} className="sortable">
                GF <SortIcon field="goalsFor" />
              </th>
              <th onClick={() => handleSort('goalsAgainst')} className="sortable">
                GA <SortIcon field="goalsAgainst" />
              </th>
              <th onClick={() => handleSort('goalDiff')} className="sortable">
                GD <SortIcon field="goalDiff" />
              </th>
              <th onClick={() => handleSort('pointsPerGame')} className="sortable">
                PPG <SortIcon field="pointsPerGame" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const displayPlace = viewMode === 'tournament' ? player.finalPlace : player.place
              const finaleClass = player.finaleStatus === 'qualified' ? 'finale-qualified' : 
                                 player.finaleStatus === 'successor' ? 'finale-successor' : ''
              return (
              <tr key={player.id} className={`rank-${displayPlace <= 3 ? displayPlace : ''} ${finaleClass}`}>
                <td className="rank-cell">
                  <span className="rank-badge">
                    {getMedalEmoji(displayPlace)}
                  </span>
                  {player.finaleStatus === 'qualified' && (
                    <span className="finale-badge qualified" title="Qualified for Season Finale">✓</span>
                  )}
                  {player.finaleStatus === 'successor' && (
                    <span className="finale-badge successor" title="Potential Successor">→</span>
                  )}
                </td>
                <td className="name-cell">
                  <div className="player-info">
                    <span 
                      className="player-name clickable" 
                      onClick={() => onPlayerSelect && onPlayerSelect(player.name)}
                      title="Click to view player details"
                    >
                      {player.name}
                    </span>
                    {player.external && (
                      <span className="player-license">
                        {player.external.nationalLicence}
                      </span>
                    )}
                  </div>
                </td>
                {(viewMode === 'overall' || viewMode === 'season') && (
                  <>
                    <td className="season-points-cell">
                      <span className="season-points-value" title={`Season Points: ${player.seasonPoints}`}>
                        {player.seasonPoints}
                      </span>
                    </td>
                    <td className="trueskill-cell">
                      <span className="trueskill-rating" title={`TrueSkill: ${player.trueSkill.toFixed(1)}`}>
                        {player.trueSkill.toFixed(1)}
                      </span>
                    </td>
                    <td>{player.tournaments}</td>
                    <td>
                      <span className="best-place">
                        {getMedalEmoji(player.bestPlace)}
                      </span>
                    </td>
                    <td>{player.avgPlace}</td>
                  </>
                )}
                {viewMode === 'tournament' && (
                  <>
                    <td>{getMedalEmoji(player.qualifyingPlace)}</td>
                    <td>{player.eliminationPlace !== null ? getMedalEmoji(player.eliminationPlace) : '-'}</td>
                  </>
                )}
                <td>{player.matches}</td>
                <td className="points-cell">
                  <strong>{player.points}</strong>
                </td>
                <td className="positive">{player.won}</td>
                <td className="negative">{player.lost}</td>
                <td>
                  <span className={`win-rate ${
                    parseFloat(player.winRate) >= 60 ? 'high' :
                    parseFloat(player.winRate) >= 40 ? 'medium' : 'low'
                  }`}>
                    {player.winRate}%
                  </span>
                </td>
                <td>{player.goalsFor}</td>
                <td>{player.goalsAgainst}</td>
                <td className={player.goalDiff >= 0 ? 'positive' : 'negative'}>
                  {player.goalDiff >= 0 ? '+' : ''}{player.goalDiff}
                </td>
                <td>{typeof player.pointsPerGame === 'number' 
                  ? player.pointsPerGame.toFixed(2) 
                  : player.pointsPerGame}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RankingTable

