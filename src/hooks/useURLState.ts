import { useEffect, useCallback, useRef } from 'react'
import { URLStateOptions, URLStateUpdates } from '../types/components'

const isViewMode = (value: string | null): value is URLStateOptions['viewMode'] => {
  return value === 'overall' || value === 'tournament' || value === 'season' || value === 'probability' || value === 'player'
}

/**
 * Custom hook to manage URL state and browser history
 */
export const useURLState = ({ viewMode,
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
 }: URLStateOptions) => {
  const initializedRef = useRef(false)
  // Helper function to update URL
  const updateURL = useCallback((updates: URLStateUpdates) => {
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
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        // Browser went back/forward - the URL is already updated by the browser
        // We just need to sync our app state to match the URL
        // Read directly from the current URL which browser has already restored
        const params = new URLSearchParams(window.location.search)
        const view = params.get('view')
        const player = params.get('player')
        const tournamentId = params.get('tournament')
        const season = params.get('season')
        const finaleQualifiers = params.get('finaleQualifiers')
        
        // Restore state from URL (which browser already restored for us)
        if (isViewMode(view)) {
          onViewModeChange(view)
        } else {
          onViewModeChange(null)
        }
        
        if (tournamentId) {
          const tournament = tournaments.find((t) => t.id === tournamentId)
          if (tournament) onTournamentChange(tournament)
        }
        
        if (player && view === 'player') {
          onPlayerChange(player)
        } else {
          onPlayerChange(null)
        }
        
        if (season) {
          onSeasonChange(season)
        }
        
        if (finaleQualifiers === 'true') {
          onFiltersChange({ showFinaleQualifiers: true })
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

      // Set view mode
      if (isViewMode(view)) {
        onViewModeChange(view)
      }
      
      // Set player only if view is 'player'
      if (player && view === 'player') {
        onPlayerChange(player)
      }
      
      if (tournamentId) {
        const tournament = tournaments.find((t) => t.id === tournamentId)
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

