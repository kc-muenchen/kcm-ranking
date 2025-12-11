import './SeasonSelector.css'

function SeasonSelector({ seasons, selectedSeason, onSelectSeason, showFinaleQualifiers, onToggleFinaleQualifiers }) {
  return (
    <div className="season-selector">
      <div className="selector-row">
        <label htmlFor="season-select" className="selector-label">
          Select Season:
        </label>
        <select
          id="season-select"
          className="selector-dropdown"
          value={selectedSeason || ''}
          onChange={(e) => {
            onSelectSeason(e.target.value)
          }}
        >
          {seasons.map(season => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-row">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showFinaleQualifiers || false}
            onChange={(e) => onToggleFinaleQualifiers && onToggleFinaleQualifiers(e.target.checked)}
          />
          <span>Show Season Finale Qualifiers (Top 20 + 5 successors, min. 10 games)</span>
        </label>
      </div>
    </div>
  )
}

export default SeasonSelector

