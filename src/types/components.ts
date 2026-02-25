import { ReactNode } from 'react'
import { Tournament } from './tournament'

// Layout props
export interface AppLayoutProps {
  children: ReactNode
}

// Component props using 'any' for flexibility where types are not strictly defined
export type AnyComponentProps = Record<string, unknown>

// Helper type for callbacks
export type AnyCallback = (...args: unknown[]) => unknown
export type VoidCallback = (...args: unknown[]) => void

// Player data is not strictly typed in many places, so we use unknown
export type PlayerData = unknown
export type TournamentData = unknown
export type EliminationData = unknown
export type RankingData = unknown

export type ViewMode = 'overall' | 'tournament' | 'season' | 'probability' | 'player'

export interface PlayerRecord {
  id?: string
  name: string
  place?: number
  finalPlace?: number
  seasonPoints?: number
  trueSkill?: number
  tournaments?: number
  bestPlace?: number
  avgPlace?: number | string
  qualifyingPlace?: number | null
  eliminationPlace?: number | null
  buchholz?: number
  sonnebornBerger?: number
  matches: number
  points: number
  won: number
  lost: number
  winRate: number | string
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  pointsPerGame: number | string
  finaleStatus?: 'qualified' | 'successor' | null
  external?: {
    nationalLicence?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MatchHistoryEntry {
  matchIndex: number
  date: number
  skill: number
  rating?: unknown
  match: {
    team1Players: string[]
    team2Players: string[]
    team1Score: number
    team2Score: number
    won: boolean
  } | null
}

export interface URLStateUpdates {
  view?: ViewMode | null
  tournament?: string | null
  player?: string | null
  season?: string | null
  finaleQualifiers?: boolean
}

export interface URLStateOptions {
  viewMode: ViewMode
  selectedTournament: Tournament | null
  selectedPlayer: string | null
  selectedSeason: string | null
  showFinaleQualifiers: boolean
  tournaments: Tournament[]
  onViewModeChange: (mode: ViewMode | null) => void
  onTournamentChange: (tournament: Tournament | null) => void
  onPlayerChange: (playerName: string | null) => void
  onSeasonChange: (season: string | null) => void
  onFiltersChange: (filters: { showFinaleQualifiers?: boolean }) => void
}
