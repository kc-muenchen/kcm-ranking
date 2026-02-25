// Season date boundaries (month is 1-based)
export interface MonthDay {
  month: number
  day: number
}

export interface SeasonDateOverride {
  start: string
  end: string
}

export const DEFAULT_SEASON_START: MonthDay = { month: 1, day: 1 }
export const DEFAULT_SEASON_END: MonthDay = { month: 12, day: 31 }

// Optional per-season overrides (use ISO date strings)
export const SEASON_DATE_OVERRIDES: Record<string, SeasonDateOverride> = {
  '2025': { start: '2025-01-01', end: '2025-11-30' },
}

