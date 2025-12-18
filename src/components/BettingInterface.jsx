import { useState } from 'react'
import './BettingInterface.css'

export function BettingInterface({ game, prediction, tableColor, user, onBetPlaced }) {
  const [showBetForm, setShowBetForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [loading, setLoading] = useState(false)

  const handlePlaceBet = async (team) => {
    setSelectedTeam(team)
    setShowBetForm(true)
  }

  const handleConfirmBet = async () => {
    if (!selectedTeam || betAmount <= 0) return

    setLoading(true)
    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const token = localStorage.getItem('betting_token')
      const tournamentId = '0lgRZQ6wREz5LLLd0XGDJ' // TODO: make dynamic

      const response = await fetch(`${API_BASE_URL}/api/betting/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tournamentId,
          tableName: game.tableName,
          amount: betAmount,
          predictedWinner: selectedTeam,
          odds: selectedTeam === 1 ? prediction.team1Probability : prediction.team2Probability,
          team1Names: game.team1,
          team2Names: game.team2
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet')
      }

      // Update user balance
      onBetPlaced(data.balance)
      setShowBetForm(false)
      setSelectedTeam(null)
      setBetAmount(10)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const potentialWin = (amount, probability) => {
    // Calculate potential win: higher probability = lower payout
    const odds = 1 / probability
    return (amount * odds).toFixed(2)
  }

  return (
    <div className="betting-interface">
      <div className="betting-actions">
        <button
          className="bet-button bet-team1"
          onClick={() => handlePlaceBet(1)}
          style={{ borderColor: tableColor }}
          disabled={!prediction}
        >
          Bet on Team 1
        </button>
        <button
          className="bet-button bet-team2"
          onClick={() => handlePlaceBet(2)}
          style={{ borderColor: tableColor }}
          disabled={!prediction}
        >
          Bet on Team 2
        </button>
      </div>

      {showBetForm && (
        <div className="bet-form-overlay" onClick={() => setShowBetForm(false)}>
          <div className="bet-form" onClick={(e) => e.stopPropagation()}>
            <h3>Place Bet on Team {selectedTeam}</h3>
            
            <div className="bet-form-details">
              <div className="bet-detail">
                <span>Win Probability:</span>
                <strong>
                  {Math.round((selectedTeam === 1 ? prediction.team1Probability : prediction.team2Probability) * 100)}%
                </strong>
              </div>
              <div className="bet-detail">
                <span>Potential Win:</span>
                <strong>
                  💰 {potentialWin(betAmount, selectedTeam === 1 ? prediction.team1Probability : prediction.team2Probability)}
                </strong>
              </div>
            </div>

            <div className="bet-form-group">
              <label>Bet Amount</label>
              <input
                type="number"
                min="1"
                max={user.balance}
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              />
              <div className="bet-quick-amounts">
                <button type="button" onClick={() => setBetAmount(10)}>10</button>
                <button type="button" onClick={() => setBetAmount(50)}>50</button>
                <button type="button" onClick={() => setBetAmount(100)}>100</button>
                <button type="button" onClick={() => setBetAmount(user.balance)}>All In</button>
              </div>
            </div>

            <div className="bet-form-actions">
              <button
                className="bet-form-cancel"
                onClick={() => setShowBetForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="bet-form-confirm"
                onClick={handleConfirmBet}
                disabled={loading || betAmount <= 0 || betAmount > user.balance}
              >
                {loading ? 'Placing...' : 'Confirm Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

