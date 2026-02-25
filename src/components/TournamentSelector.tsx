import './TournamentSelector.css'

function TournamentSelector({ tournaments, selectedTournament, onSelectTournament  }: { tournaments: any, selectedTournament: any, onSelectTournament: any }) {
  const formatDate = (dateString: any) => {
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
        onChange={(e: any) => {
          const tournament = tournaments.find((t: any) => t.id === e.target.value)
          onSelectTournament(tournament)
        }}
      >
        {tournaments.map((tournament: any) => (
          <option key={tournament.id} value={tournament.id}>
            {tournament.name} - {formatDate(tournament.date)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TournamentSelector

