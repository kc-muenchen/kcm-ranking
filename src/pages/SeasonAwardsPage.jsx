import { useEffect, useState } from 'react'
import { useTournaments } from '../hooks/useTournaments'
import { processSeasonPlayers } from '../utils/playerProcessing'
import { getAvailableSeasons, getSeasonFinal } from '../utils/seasonUtils'
import { AwardsCeremony } from '../components/AwardsCeremony'
import { AppLayout } from '../components/AppLayout'
import './SeasonAwardsPage.css'

/**
 * Full page dedicated to season awards
 * Route: /season-awards-YYYY
 */
export function SeasonAwardsPage() {
  const { tournaments, loading } = useTournaments()
  const [seasonYear, setSeasonYear] = useState(null)
  const [seasonPlayers, setSeasonPlayers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    // Extract year from pathname: /season-awards-2025
    const pathMatch = window.location.pathname.match(/\/season-awards-(\d{4})/)
    if (pathMatch) {
      const year = pathMatch[1]
      setSeasonYear(year)
    } else {
      setError('Invalid season year in URL')
    }
  }, [])

  useEffect(() => {
    if (seasonYear && tournaments.length > 0) {
      try {
        const seasonFinal = getSeasonFinal(tournaments, seasonYear)
        const { players } = processSeasonPlayers(tournaments, seasonYear, seasonFinal)
        setSeasonPlayers(players)
        setError(null)
      } catch (err) {
        console.error('Error processing season players:', err)
        setError('Failed to load season data')
      }
    }
  }, [seasonYear, tournaments])

  if (loading) {
    return (
      <AppLayout>
        <div className="season-awards-page">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading tournament data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="season-awards-page">
          <div className="error-message">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <a href="/" className="back-link">← Back to Rankings</a>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!seasonYear) {
    return (
      <AppLayout>
        <div className="season-awards-page">
          <div className="error-message">
            <h2>⚠️ Invalid URL</h2>
            <p>Please use the format: /season-awards-YYYY (e.g., /season-awards-2025)</p>
            <a href="/" className="back-link">← Back to Rankings</a>
          </div>
        </div>
      </AppLayout>
    )
  }

  const availableSeasons = getAvailableSeasons(tournaments)
  if (!availableSeasons.includes(seasonYear)) {
    return (
      <AppLayout>
        <div className="season-awards-page">
          <div className="error-message">
            <h2>⚠️ Season Not Found</h2>
            <p>Season {seasonYear} does not exist in the data.</p>
            <p>Available seasons: {availableSeasons.join(', ')}</p>
            <a href="/" className="back-link">← Back to Rankings</a>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="season-awards-page">
        <div className="season-awards-header">
          <a href="/" className="back-link">← Back to Rankings</a>
          <h1 className="page-title">🏆 Season {seasonYear} Awards</h1>
          <p className="page-subtitle">
            Celebrating outstanding achievements throughout the season
          </p>
        </div>
        
        <AwardsCeremony 
          players={seasonPlayers}
          seasonYear={seasonYear}
          autoExpand={true}
        />
      </div>
    </AppLayout>
  )
}

