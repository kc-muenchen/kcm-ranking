import logo from '../Logo-kcm.png'
import ScrollToTop from './ScrollToTop'

/**
 * App layout component with header and footer
 */
export const AppLayout = ({ children, mainViewMode = 'rankings', onMainViewModeChange }) => {
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

