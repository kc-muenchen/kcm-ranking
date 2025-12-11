import { useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook to manage URL state and browser history
 */
export const useURLState = ({
  viewMode,
  selectedTournament,
  selectedPlayer,
  selectedSeason,
  showFinaleQualifiers,
  tournaments,
  onViewModeChange,
  onTournamentChange,
  onPlayerChange,
  onSeasonChange,
  onFiltersChange
}) => {
  const initializedRef = useRef(false)
  // Helper function to update URL
  const updateURL = useCallback((updates) => {
    const params = new URLSearchParams(window.location.search)
    
    if (updates.view !== undefined) {
      if (updates.view) params.set('view', updates.view)
      else params.delete('view')
    }
    if (updates.tournament !== undefined) {
      if (updates.tournament) params.set('tournament', updates.tournament)
      else params.delete('tournament')
    }
    if (updates.player !== undefined) {
      if (updates.player) {
        params.set('player', updates.player)
      } else {
        params.delete('player')
      }
    }
    if (updates.season !== undefined) {
      if (updates.season) params.set('season', updates.season)
      else params.delete('season')
    }
    if (updates.finaleQualifiers !== undefined) {
      if (updates.finaleQualifiers) params.set('finaleQualifiers', 'true')
      else params.delete('finaleQualifiers')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      {
        viewMode: updates.view !== undefined ? updates.view : viewMode,
        tournamentId: updates.tournament !== undefined ? updates.tournament : selectedTournament?.id,
        playerName: updates.player !== undefined ? updates.player : selectedPlayer,
        season: updates.season !== undefined ? updates.season : selectedSeason,
        finaleQualifiers: updates.finaleQualifiers !== undefined ? updates.finaleQualifiers : showFinaleQualifiers
      },
      '',
      newUrl
    )
  }, [viewMode, selectedTournament, selectedPlayer, selectedSeason, showFinaleQualifiers])

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        // Restore state from history
        onViewModeChange(event.state.viewMode || 'tournament')
        if (event.state.tournamentId) {
          const tournament = tournaments.find(t => t.id === event.state.tournamentId)
          if (tournament) onTournamentChange(tournament)
        }
        if (event.state.playerName) {
          onPlayerChange(event.state.playerName)
        } else {
          onPlayerChange(null)
        }
        if (event.state.season) {
          onSeasonChange(event.state.season)
        }
        if (event.state.finaleQualifiers !== undefined) {
          onFiltersChange({ showFinaleQualifiers: event.state.finaleQualifiers })
        }
      } else {
        // If no state, read from URL
        const params = new URLSearchParams(window.location.search)
        const finaleQualifiers = params.get('finaleQualifiers')
        if (finaleQualifiers === 'true') {
          onFiltersChange({ showFinaleQualifiers: true })
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Initialize state from URL on first load (only once)
    if (!initializedRef.current && tournaments.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view')
      const player = params.get('player')
      const tournamentId = params.get('tournament')
      const season = params.get('season')
      const finaleQualifiers = params.get('finaleQualifiers')

      if (view) onViewModeChange(view)
      if (player) onPlayerChange(player)
      if (tournamentId) {
        const tournament = tournaments.find(t => t.id === tournamentId)
        if (tournament) onTournamentChange(tournament)
      }
      if (season) {
        onSeasonChange(season)
      }
      if (finaleQualifiers === 'true') {
        onFiltersChange({ showFinaleQualifiers: true })
      }
      
      initializedRef.current = true
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [tournaments, onViewModeChange, onTournamentChange, onPlayerChange, onSeasonChange, onFiltersChange])

  return { updateURL }
}

