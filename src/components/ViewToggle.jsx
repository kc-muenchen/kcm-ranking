import { useState, useRef, useEffect } from 'react'
import './ViewToggle.css'

function ViewToggle({ viewMode, onViewModeChange }) {
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const toolsRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setIsToolsOpen(false)
      }
    }

    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isToolsOpen])

  const handleToolSelect = (tool) => {
    onViewModeChange(tool)
    setIsToolsOpen(false)
  }

  const isToolActive = viewMode === 'probability' // Add more tools here as needed

  return (
    <div className="view-toggle">
      <div className="main-navigation">
        <button
          className={`toggle-button ${viewMode === 'overall' ? 'active' : ''}`}
          onClick={() => onViewModeChange('overall')}
        >
          <span className="button-icon">🌟</span>
          Overall Ranking
        </button>
        <button
          className={`toggle-button ${viewMode === 'season' ? 'active' : ''}`}
          onClick={() => onViewModeChange('season')}
        >
          <span className="button-icon">📊</span>
          Season Ranking
        </button>
        <button
          className={`toggle-button ${viewMode === 'tournament' ? 'active' : ''}`}
          onClick={() => onViewModeChange('tournament')}
        >
          <span className="button-icon">📅</span>
          Single Tournament
        </button>
      </div>

      <div className="tools-dropdown" ref={toolsRef}>
        <button
          className={`toggle-button tools-button ${isToolActive ? 'active' : ''}`}
          onClick={() => setIsToolsOpen(!isToolsOpen)}
        >
          <span className="button-icon">🛠️</span>
          Tools
          <span className="dropdown-arrow">{isToolsOpen ? '▲' : '▼'}</span>
        </button>
        
        {isToolsOpen && (
          <div className="tools-dropdown-menu">
            <button
              className={`tool-item ${viewMode === 'probability' ? 'active' : ''}`}
              onClick={() => handleToolSelect('probability')}
            >
              <span className="tool-icon">🎯</span>
              Match Probability
            </button>
            {/* Add more tools here in the future */}
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewToggle

