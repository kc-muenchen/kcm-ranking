import { useEffect, useState } from 'react'
import './BettingLeaderboard.css'

export function BettingLeaderboard({ onClose }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [userBets, setUserBets] = useState([])
  const [activeTab, setActiveTab] = useState('leaderboard') // 'leaderboard' or 'mybets'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
    fetchUserBets()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const response = await fetch(`${API_BASE_URL}/api/betting/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBets = async () => {
    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const token = localStorage.getItem('betting_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/betting/bets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserBets(data)
      }
    } catch (error) {
      console.error('Failed to fetch user bets:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'won': return '#10b981'
      case 'lost': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'won': return '✅'
      case 'lost': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="betting-leaderboard-overlay" onClick={onClose}>
      <div className="betting-leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <button className="betting-leaderboard-close" onClick={onClose}>×</button>
        
        <div className="betting-leaderboard-tabs">
          <button
            className={activeTab === 'leaderboard' ? 'active' : ''}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            className={activeTab === 'mybets' ? 'active' : ''}
            onClick={() => setActiveTab('mybets')}
          >
            📋 My Bets
          </button>
        </div>

        {loading && <div className="betting-loading">Loading...</div>}

        {!loading && activeTab === 'leaderboard' && (
          <div className="leaderboard-content">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Balance</th>
                  <th>Profit</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <tr key={index}>
                    <td className="rank-cell">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && (index + 1)}
                    </td>
                    <td className="username-cell">{user.username}</td>
                    <td className="balance-cell">💰 {user.balance.toFixed(2)}</td>
                    <td className="profit-cell" style={{ color: user.profit >= 0 ? '#10b981' : '#ef4444' }}>
                      {user.profit >= 0 ? '+' : ''}{user.profit.toFixed(2)}
                    </td>
                    <td className="roi-cell" style={{ color: user.roi >= 0 ? '#10b981' : '#ef4444' }}>
                      {user.roi >= 0 ? '+' : ''}{user.roi.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'mybets' && (
          <div className="mybets-content">
            {userBets.length === 0 ? (
              <div className="no-bets">
                <p>No bets placed yet. Go place some bets!</p>
              </div>
            ) : (
              <div className="bets-list">
                {userBets.map((bet) => (
                  <div key={bet.id} className="bet-card">
                    <div className="bet-header">
                      <span className="bet-table">Table {bet.tableName}</span>
                      <span className="bet-status" style={{ color: getStatusColor(bet.status) }}>
                        {getStatusIcon(bet.status)} {bet.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="bet-teams">
                      <div className={`bet-team ${bet.predictedWinner === 1 ? 'selected' : ''}`}>
                        {JSON.parse(bet.team1Names).join(' / ')}
                      </div>
                      <div className="bet-vs">VS</div>
                      <div className={`bet-team ${bet.predictedWinner === 2 ? 'selected' : ''}`}>
                        {JSON.parse(bet.team2Names).join(' / ')}
                      </div>
                    </div>
                    <div className="bet-details">
                      <div className="bet-detail">
                        <span>Bet Amount:</span>
                        <strong>💰 {bet.amount.toFixed(2)}</strong>
                      </div>
                      {bet.payout && (
                        <div className="bet-detail">
                          <span>Payout:</span>
                          <strong style={{ color: '#10b981' }}>💰 {bet.payout.toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="bet-detail">
                        <span>Date:</span>
                        <strong>{new Date(bet.placedAt).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

