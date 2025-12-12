import { useState } from 'react'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { PlayerHeader } from './playerDetail/PlayerHeader'
import { PlayerTabs } from './playerDetail/PlayerTabs'
import { OverviewTab } from './playerDetail/OverviewTab'
import { PerformanceTab } from './playerDetail/PerformanceTab'
import { TournamentsTab } from './playerDetail/TournamentsTab'
import { ComparisonTab } from './playerDetail/ComparisonTab'
import { AchievementsDisplay } from './playerDetail/AchievementsDisplay'
import './PlayerDetail.css'

function PlayerDetail({ playerName, playerHistory, tournaments, aggregatedPlayers, onBack }) {
  const [selectedComparePlayer, setSelectedComparePlayer] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Calculate all player statistics using custom hook
  const {
    history,
    matchHistory,
    summaryStats,
    bestRankingStats,
    topPartners,
    opponentStats,
    tournamentList,
    achievements,
    headToHeadStats,
    teammateStats,
    allPlayers
  } = usePlayerStats(
    playerName,
    playerHistory,
    tournaments,
    aggregatedPlayers,
    selectedComparePlayer
  )

  return (
    <div className="player-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Rankings
      </button>

      <PlayerHeader
        playerName={playerName}
        currentSkill={summaryStats.currentSkill}
        skillChange={summaryStats.skillChange}
        totalMatches={summaryStats.totalMatches}
        winRate={summaryStats.winRate}
        wins={summaryStats.wins}
        losses={summaryStats.losses}
      />

      {/* Tabs */}
      <PlayerTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab
            bestRankingStats={bestRankingStats}
            topPartners={topPartners}
            opponentStats={opponentStats}
          />
        )}

        {activeTab === 'achievements' && (
          <div className="tab-panel">
            <div className="achievements-section">
              <h2>🏆 Achievements</h2>
              <AchievementsDisplay achievements={achievements} />
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceTab
            history={history}
            playerName={playerName}
            matchHistory={matchHistory}
            initialSkill={summaryStats.initialSkill}
            playerHistory={playerHistory}
            allPlayers={allPlayers}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentsTab tournamentList={tournamentList} />
        )}

        {activeTab === 'comparison' && (
          <ComparisonTab
            playerName={playerName}
            allPlayers={allPlayers}
            selectedComparePlayer={selectedComparePlayer}
            onPlayerSelect={setSelectedComparePlayer}
            headToHeadStats={headToHeadStats}
            teammateStats={teammateStats}
          />
        )}
      </div>
    </div>
  )
}

export default PlayerDetail
