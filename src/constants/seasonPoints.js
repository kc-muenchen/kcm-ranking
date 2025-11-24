// Season points distribution
export const SEASON_POINTS_MAP = {
  1: 25,
  2: 20,
  3: 16,
  4: 13,
  5: 10
}

// Maximum points from one tournament (1st place = 25 + 1 attendance = 26)
export const MAX_TOURNAMENT_POINTS = 26

// Attendance point (everyone gets this)
export const ATTENDANCE_POINT = 1

// Calculate effective place for season points (places 5-16 are treated as place 5)
export const getEffectivePlace = (place) => {
  return (place >= 5 && place <= 16) ? 5 : place
}

// Calculate season points for a given placement
export const calculateSeasonPoints = (place) => {
  const effectivePlace = getEffectivePlace(place)
  const placePoints = effectivePlace <= 5 ? (SEASON_POINTS_MAP[effectivePlace] || 0) : 0
  return placePoints + ATTENDANCE_POINT
}

