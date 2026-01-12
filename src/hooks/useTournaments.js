import { useState, useEffect } from 'react'
import { API_ENDPOINTS, apiFetch } from '../config/api'
import { preloadAliases } from '../config/playerAliases'
import { convertNewFormatToOld } from '../utils/format-converter'

/**
 * Custom hook to load and manage tournaments
 */
export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Preload aliases from API, then load tournaments
    preloadAliases().then(() => {
      loadTournaments()
    })
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      
      // Fetch tournaments from backend API
      const tournamentsData = await apiFetch(API_ENDPOINTS.tournaments)
      
      // Transform API response to match the expected format
      const loadedTournaments = tournamentsData
        .map(tournament => {
          // Convert new format to old format if needed (safety net in case backend didn't convert)
          const convertedData = tournament.rawData ? convertNewFormatToOld(tournament.rawData) : null
          
          return {
            id: tournament.externalId || tournament.id,
            name: tournament.name,
            date: tournament.createdAt,
            fileName: `${tournament.name}.json`,
            isSeasonFinal: tournament.isSeasonFinal || false,
            data: convertedData || tournament.rawData
          }
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))

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
      // Use Vite's glob import to automatically load all JSON files
      const tournamentModules = import.meta.glob('../dummy_data/*.json')
      
      const loadedTournaments = await Promise.all(
        Object.entries(tournamentModules).map(async ([path, importFn]) => {
          try {
            const module = await importFn()
            const data = module.default
            const fileName = path.split('/').pop()
            
            // Convert new format to old format if needed
            const convertedData = convertNewFormatToOld(data)
            
            return {
              id: data._id,
              name: data.name,
              date: data.createdAt,
              fileName: fileName,
              isSeasonFinal: false,
              data: convertedData
            }
          } catch (error) {
            console.warn(`Error loading ${path}:`, error)
            return null
          }
        })
      )

      // Filter out any failed loads and sort by date (most recent first)
      const validTournaments = loadedTournaments
        .filter(t => t !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      console.log(`Loaded ${validTournaments.length} tournaments from files`)
      
      setTournaments(validTournaments)
    } catch (error) {
      console.error('Error loading tournaments from files:', error)
    }
  }

  return { tournaments, loading, reloadTournaments: loadTournaments }
}

