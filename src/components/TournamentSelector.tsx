import SearchableSelect from './SearchableSelect'

const formatDate = (dateString: any) =>
  new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })

/**
 * Tournament picker.
 *
 * There are dozens of tournaments, so this is a searchable combobox rather than
 * a native select - typing a date or a name beats scrolling a long list.
 */
function TournamentSelector({
  tournaments,
  selectedTournament,
  onSelectTournament
}: {
  tournaments: any
  selectedTournament: any
  onSelectTournament: any
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="eyebrow">Tournament</span>
        <span className="eyebrow tnum">{tournaments.length} total</span>
      </div>

      <div className="max-w-xl">
        <SearchableSelect
          options={tournaments}
          value={selectedTournament?.id || ''}
          onChange={(id: string) => {
            const tournament = tournaments.find((t: any) => t.id === id)
            if (tournament) onSelectTournament(tournament)
          }}
          placeholder="Search tournaments by name or date..."
          emptyMessage="No tournaments match that search"
          getOptionValue={(tournament: any) => tournament.id}
          getOptionLabel={(tournament: any) => `${formatDate(tournament.date)}  ${tournament.name}`}
        />
      </div>
    </div>
  )
}

export default TournamentSelector
