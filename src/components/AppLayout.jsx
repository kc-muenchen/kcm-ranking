import logo from '../Logo-kcm.png'
import ScrollToTop from './ScrollToTop'

/**
 * App layout component with header and footer
 */
export const AppLayout = ({ 
  children, 
  mainViewMode = 'rankings', 
  onMainViewModeChange,
  bettingUser,
  onShowAuth,
  onLogout
}) => {
  const isLiveView = mainViewMode === 'live'
  
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <h1 className="title">
                <img src={logo} alt="KCM Logo" className="logo" />
                KCM Ranking
              </h1>
              <p className="subtitle">Table Soccer Tournament Rankings</p>
            </div>
            {onMainViewModeChange && (
              <div className="header-right">
                <button 
                  className="live-view-button" 
                  onClick={() => {
                    onMainViewModeChange(isLiveView ? 'rankings' : 'live')
                  }}
                >
                  {isLiveView ? '📊 Rankings' : '📺 Live View'}
                </button>
                {!bettingUser ? (
                  <button className="betting-login-btn" onClick={onShowAuth}>
                    🎲 Login
                  </button>
                ) : (
                  <div className="betting-user-header">
                    <span className="betting-user-name">{bettingUser.username}</span>
                    <span className="betting-user-balance">💰 {bettingUser.balance.toFixed(2)}</span>
                    <button className="betting-logout-btn" onClick={onLogout} title="Logout">
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>

      <ScrollToTop />

      <footer className="footer">
        <div className="container">
          <p>KC München Table Soccer Rankings</p>
        </div>
      </footer>
    </div>
  )
}

