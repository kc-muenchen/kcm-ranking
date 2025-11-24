/**
 * Calculates aggregated stats for players including TrueSkill, season points, etc.
 * This service aggregates data from the database and performs calculations
 */

/**
 * Calculate aggregated stats for all players
 * @param {Array} players - Array of players with their data
 * @returns {Array} - Players with calculated stats
 */
export async function calculateAggregatedStats(players) {
  return players.map(player => {
    // Get all elimination standings (for season points)
    const eliminationStandings = player.standings.filter(s => s.type === 'elimination' && !s.removed);
    
    // Calculate season points
    const seasonPoints = calculateSeasonPoints(eliminationStandings);
    
    // Count tournaments
    const tournaments = new Set(player.standings.map(s => s.tournament.id)).size;
    
    // Calculate match stats
    const matchStats = calculateMatchStats(player.teamPlayers);
    
    // Get best placement
    const bestPlace = eliminationStandings.length > 0 
      ? Math.min(...eliminationStandings.map(s => s.place))
      : null;
    
    return {
      id: player.id,
      name: player.name,
      club: player.club,
      license: player.license,
      tournaments,
      seasonPoints,
      bestPlace,
      ...matchStats,
      trueSkill: 25.0, // Will be calculated separately with TrueSkill algorithm
      external: player.isExternal
    };
  }).sort((a, b) => {
    // Sort by season points, then trueSkill, then points
    if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
    if (b.trueSkill !== a.trueSkill) return b.trueSkill - a.trueSkill;
    return b.points - a.points;
  });
}

/**
 * Calculate season points based on elimination standings
 */
function calculateSeasonPoints(standings) {
  // Season points distribution (places 1-5, everyone below 4th shares place 5)
  const seasonPointsMap = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 10
  };
  
  let totalPoints = 0;
  
  standings.forEach(standing => {
    // Places 5-16 are treated as place 5, places > 16 get 0 points
    const effectivePlace = (standing.place >= 5 && standing.place <= 16) ? 5 : standing.place;
    const placePoints = effectivePlace <= 5 ? (seasonPointsMap[effectivePlace] || 0) : 0;
    const attendancePoint = 1; // +1 for attending (everyone gets this)
    totalPoints += placePoints + attendancePoint;
  });
  
  return totalPoints;
}

/**
 * Calculate match statistics from team players data
 */
function calculateMatchStats(teamPlayers) {
  let matches = 0;
  let wins = 0;
  let losses = 0;
  let points = 0;
  
  teamPlayers.forEach(tp => {
    if (!tp.team.match.valid || tp.team.match.skipped) return;
    
    matches++;
    if (tp.team.won) {
      wins++;
      points += 3; // 3 points for win
    } else {
      losses++;
    }
  });
  
  const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : '0.0';
  
  return {
    matches,
    wins,
    losses,
    points,
    winRate: parseFloat(winRate)
  };
}

/**
 * Calculate TrueSkill ratings for all players
 * This should be called separately and stored/cached
 * @param {Array} matches - All matches with teams and players
 * @returns {Map} - Map of player names to TrueSkill ratings
 */
export async function calculateTrueSkill(matches) {
  // TODO: Implement TrueSkill algorithm
  // This will be similar to the frontend implementation
  // but will run on the backend for consistency
  
  const ratings = new Map();
  
  // For now, return default rating of 25.0
  // This will be implemented with the ts-trueskill library
  
  return ratings;
}

