import { useState } from 'react'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { PlayerHeader } from './playerDetail/PlayerHeader'
import { PlayerTabs } from './playerDetail/PlayerTabs'
import { OverviewTab } from './playerDetail/OverviewTab'
import { PerformanceTab } from './playerDetail/PerformanceTab'
import { TournamentsTab } from './playerDetail/TournamentsTab'
import { ComparisonTab } from './playerDetail/ComparisonTab'
import { AchievementsDisplay } from './playerDetail/AchievementsDisplay'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from '@phosphor-icons/react'
import { panelIn } from '../lib/motion'

function PlayerDetail({ playerName, playerHistory, tournaments, aggregatedPlayers, onBack, onTournamentSelect  }: { playerName: any, playerHistory: any, tournaments: any, aggregatedPlayers: any, onBack: any, onTournamentSelect: any }) {
  const [selectedComparePlayer, setSelectedComparePlayer] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const handleTournamentClick = (tournamentData: any) => {
    // Find the full tournament object
    const tournament = tournaments.find((t: any) => 
      t.name === tournamentData.tournament || 
      (t.data && t.data.name === tournamentData.tournament)
    )
    if (tournament && onTournamentSelect) {
      onTournamentSelect(tournament)
    }
  }
  
  // Calculate all player statistics using custom hook
  const {
    history,
    matchHistory,
    summaryStats,
    playerAggregated,
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
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="tactile group inline-flex w-fit items-center gap-1.5 text-[0.9375rem] text-fg-dim hover:text-accent"
      >
        <ArrowLeft
          size={13}
          weight="bold"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Back to rankings
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

      {/* Tab content. Keyed so each panel animates in on switch. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={panelIn}
          initial="hidden"
          animate="show"
          exit="exit"
          role="tabpanel"
        >
          {activeTab === 'overview' && (
            <OverviewTab
              bestRankingStats={bestRankingStats}
              topPartners={topPartners}
              opponentStats={opponentStats}
              onTournamentClick={handleTournamentClick}
            />
          )}

          {activeTab === 'achievements' && (
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Achievements</span>
              <AchievementsDisplay achievements={achievements} />
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

          {activeTab === 'tournaments' && <TournamentsTab tournamentList={tournamentList} />}

          {activeTab === 'comparison' && (
            <ComparisonTab
              playerName={playerName}
              currentPlayer={playerAggregated}
              allPlayers={allPlayers}
              selectedComparePlayer={selectedComparePlayer}
              onPlayerSelect={setSelectedComparePlayer}
              headToHeadStats={headToHeadStats}
              teammateStats={teammateStats}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default PlayerDetail
