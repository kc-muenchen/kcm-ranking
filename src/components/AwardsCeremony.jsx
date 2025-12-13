import { useState } from 'react'
import { calculateSeasonAwards, getAwardsSummary } from '../utils/seasonAwards'
import './AwardsCeremony.css'

/**
 * Awards Ceremony Component
 * Displays season awards in a celebratory format
 */
export function AwardsCeremony({ players, seasonYear, autoExpand = false }) {
  const [isExpanded, setIsExpanded] = useState(autoExpand)
  const [revealedAwards, setRevealedAwards] = useState(new Set())
  const [revealingAwards, setRevealingAwards] = useState(new Set())
  
  if (!players || players.length === 0) {
    return null
  }
  
  const awards = calculateSeasonAwards(players)
  const awardsList = getAwardsSummary(awards)
  
  if (awardsList.length === 0) {
    return null
  }
  
  const handleReveal = (awardId) => {
    if (revealedAwards.has(awardId) || revealingAwards.has(awardId)) {
      return
    }
    
    setRevealingAwards(prev => new Set([...prev, awardId]))
    // Start reveal animation
    setTimeout(() => {
      setRevealedAwards(prev => new Set([...prev, awardId]))
      // Clear revealing state after animation completes
      setTimeout(() => {
        setRevealingAwards(prev => {
          const next = new Set(prev)
          next.delete(awardId)
          return next
        })
      }, 600)
    }, 100)
  }
  
  const handleRevealAll = () => {
    // Reveal all with staggered timing
    awardsList.forEach((award, index) => {
      setTimeout(() => {
        handleReveal(award.id)
      }, index * 200)
    })
  }
  
  return (
    <div className="awards-ceremony">
      {!autoExpand && (
        <div 
          className="awards-ceremony-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="awards-ceremony-title">
            <span className="awards-icon">🏆</span>
            <h2>Season {seasonYear} Awards Ceremony</h2>
          </div>
          <button 
            className="awards-ceremony-toggle"
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      )}
      
      {isExpanded && (
        <div className="awards-ceremony-content">
          {!autoExpand && (
            <p className="awards-intro">
              Celebrating outstanding achievements throughout the season! 🎉
            </p>
          )}
          
          {revealedAwards.size < awardsList.length && (
            <div className="awards-reveal-controls">
              <button 
                className="reveal-all-button"
                onClick={handleRevealAll}
              >
                🎊 Reveal All Awards
              </button>
            </div>
          )}
          
          <div className="awards-grid">
            {awardsList.map((award, index) => {
              const isRevealed = revealedAwards.has(award.id)
              const isRevealing = revealingAwards.has(award.id)
              return (
                <div 
                  key={award.id}
                  className={`award-card ${isRevealed ? 'revealed' : 'hidden'} ${isRevealing ? 'revealing' : ''}`}
                  onClick={() => !isRevealed && !isRevealing && handleReveal(award.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {!isRevealed ? (
                    <div className="award-hidden">
                      {isRevealing ? (
                        <div className="reveal-animation">
                          <div className="sparkles">
                            <span className="sparkle">✨</span>
                            <span className="sparkle">⭐</span>
                            <span className="sparkle">💫</span>
                            <span className="sparkle">✨</span>
                          </div>
                          <div className="reveal-gift">🎁</div>
                        </div>
                      ) : (
                        <>
                          <div className="award-mystery">🎁</div>
                          <p>Click to reveal</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="award-revealed-content">
                      <div className="award-icon">{award.emoji}</div>
                      <div className="award-content">
                        <h3 className="award-name">{award.name}</h3>
                        <p className="award-description">{award.description}</p>
                        <div className="award-winner">
                          <span className="winner-name">{award.winner}</span>
                          {award.ties && award.ties.length > 0 && (
                            <span className="ties-note">
                              (Tied with {award.ties.filter(t => t !== award.winner).join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="award-value">{award.display}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="awards-footer">
            <p className="awards-note">
              Awards are calculated based on season statistics. Congratulations to all winners! 🎊
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

