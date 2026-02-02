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
