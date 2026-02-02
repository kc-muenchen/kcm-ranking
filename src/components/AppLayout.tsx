import logo from '../Logo-kcm.png'
import ScrollToTop from './ScrollToTop'

/**
 * App layout component with header and footer
 */
export const AppLayout = ({ children }) => {
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">
            <img src={logo} alt="KCM Logo" className="logo" />
            KCM Ranking
          </h1>
          <p className="subtitle">Table Soccer Tournament Rankings</p>
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
          <p><a href="https://kc-muenchen.de/">KC München</a> Table Soccer Rankings</p>
        </div>
      </footer>
    </div>
  )
}

