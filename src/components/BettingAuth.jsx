import { useState } from 'react'
import './BettingAuth.css'

export function BettingAuth({ onLogin, onClose }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const endpoint = mode === 'login' ? '/api/betting/login' : '/api/betting/register'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Store token
      localStorage.setItem('betting_token', data.token)
      localStorage.setItem('betting_user', JSON.stringify(data.user))

      onLogin(data.user, data.token)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="betting-auth-overlay" onClick={onClose}>
      <div className="betting-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="betting-auth-close" onClick={onClose}>×</button>
        
        <h2>{mode === 'login' ? '🎲 Login to Bet' : '🎲 Create Account'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="betting-form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              minLength={3}
            />
          </div>

          <div className="betting-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>

          {error && <div className="betting-auth-error">{error}</div>}

          <button type="submit" className="betting-auth-submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="betting-auth-toggle">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button onClick={() => setMode('register')}>Register</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button onClick={() => setMode('login')}>Login</button>
            </span>
          )}
        </div>

        {mode === 'register' && (
          <div className="betting-auth-info">
            <p>💰 New users start with 1000 coins!</p>
          </div>
        )}
      </div>
    </div>
  )
}

