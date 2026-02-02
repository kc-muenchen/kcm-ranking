import './TournamentSelector.css'

function TournamentSelector({ tournaments, selectedTournament, onSelectTournament }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="tournament-selector">
      <label htmlFor="tournament-select" className="selector-label">
        Select Tournament:
      </label>
      <select
        id="tournament-select"
        className="selector-dropdown"
        value={selectedTournament?.id || ''}
        onChange={(e) => {
          const tournament = tournaments.find(t => t.id === e.target.value)
          onSelectTournament(tournament)
        }}
      >
        {tournaments.map(tournament => (
          <option key={tournament.id} value={tournament.id}>
            {tournament.name} - {formatDate(tournament.date)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TournamentSelector

