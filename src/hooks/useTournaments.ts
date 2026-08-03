import { useState, useEffect } from 'react'
import { API_ENDPOINTS, apiFetch } from '../config/api'
import { preloadAliases } from '../config/playerAliases'
import type { Tournament, APITournament } from '../types/tournament'

interface UseTournamentsReturn {
  tournaments: Tournament[]
  loading: boolean
  /** Set when both the API and the local-file fallback failed, so the UI can say so. */
  error: string | null
  reloadTournaments: () => Promise<void>
}

/**
 * Custom hook to load and manage tournaments
 */
export const useTournaments = (): UseTournamentsReturn => {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Preload aliases from API, then load tournaments
    preloadAliases().then(() => {
      loadTournaments()
    })
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch tournaments from backend API
      const tournamentsData = await apiFetch(API_ENDPOINTS.tournaments)
      
      // Transform API response to match the expected format.
      // The backend normalises Kickertool exports on import (see
      // backend/src/utils/format-converter.js), so rawData is always in the
      // qualifying/eliminations shape the app consumes.
      const loadedTournaments = tournamentsData
        .map((tournament: APITournament) => ({
          id: tournament.externalId || tournament.id,
          name: tournament.name,
          date: tournament.createdAt,
          fileName: `${tournament.name}.json`,
          isSeasonFinal: tournament.isSeasonFinal || false,
          data: tournament.rawData
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log(`Loaded ${loadedTournaments.length} tournaments from API`)
      
      setTournaments(loadedTournaments)
    } catch (error) {
      console.error('Error loading tournaments from API:', error)
      
      // Fallback to JSON files if API is not available (for development)
      console.warn('Falling back to local JSON files...')
      await loadTournamentsFromFiles()
    } finally {
      setLoading(false)
    }
  }

  // Fallback method: load from JSON files (for development when API is down)
  const loadTournamentsFromFiles = async () => {
    try {
      // Use Vite's glob import to automatically load all JSON files.
      // dummy_data lives at the repo root, next to src/.
      const tournamentModules = import.meta.glob('../../dummy_data/*.json')
      
      const loadedTournaments = await Promise.all(
        Object.entries(tournamentModules).map(async ([path, importFn]: [string, any]) => {
          try {
            const module = await importFn()
            const data = module.default
            const fileName = path.split('/').pop()

            return {
              id: data._id,
              name: data.name,
              date: data.createdAt,
              fileName: fileName,
              isSeasonFinal: false,
              data: data
            }
          } catch (error) {
            console.warn(`Error loading ${path}:`, error)
            return null
          }
        })
      )

      // Filter out any failed loads and sort by date (most recent first)
      const validTournaments = loadedTournaments
        .filter((t): t is Tournament => t !== null)
        .sort((a: Tournament, b: Tournament) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log(`Loaded ${validTournaments.length} tournaments from files`)
      
      setTournaments(validTournaments)
    } catch (error) {
      console.error('Error loading tournaments from files:', error)
      // Both the API and the fallback failed. Surface it rather than letting the
      // UI render an empty state, which would look identical to having no data.
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return { tournaments, loading, error, reloadTournaments: loadTournaments }
}

