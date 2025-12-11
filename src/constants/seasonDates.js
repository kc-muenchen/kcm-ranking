// Season date boundaries (month is 1-based)
export const DEFAULT_SEASON_START = { month: 1, day: 1 }
export const DEFAULT_SEASON_END = { month: 12, day: 31 }

// Optional per-season overrides (use ISO date strings)
export const SEASON_DATE_OVERRIDES = {
  '2025': { start: '2025-01-01', end: '2025-11-30' },
}

