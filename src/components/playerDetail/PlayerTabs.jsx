/**
 * Tab navigation component for player detail
 */
export const PlayerTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'tournaments', label: 'Tournaments', icon: '📅' },
    { id: 'comparison', label: 'Comparison', icon: '🔀' }
  ]

  return (
    <div className="player-detail-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

