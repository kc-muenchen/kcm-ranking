// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS = {
  // Tournament Performance
  firstPlace: { id: 'firstPlace', emoji: '🥇', name: 'First Place', description: 'Win your first tournament', category: 'tournament', tier: 1, threshold: 1 },
  champion3: { id: 'champion3', emoji: '🏆', name: 'Champion', description: 'Win 3 tournaments', category: 'tournament', tier: 2, threshold: 3 },
  champion5: { id: 'champion5', emoji: '👑', name: 'Elite Champion', description: 'Win 5 tournaments', category: 'tournament', tier: 3, threshold: 5 },
  champion10: { id: 'champion10', emoji: '💎', name: 'Legendary Champion', description: 'Win 10 tournaments', category: 'tournament', tier: 4, threshold: 10 },
  podium3: { id: 'podium3', emoji: '🥉', name: 'Podium Finisher', description: 'Finish in top 3 (3 times)', category: 'tournament', tier: 1, threshold: 3 },
  podium5: { id: 'podium5', emoji: '🎖️', name: 'Consistent Podium', description: 'Finish in top 3 (5 times)', category: 'tournament', tier: 2, threshold: 5 },
  top5_5: { id: 'top5_5', emoji: '⭐', name: 'Consistent Performer', description: 'Finish in top 5 (5 times)', category: 'tournament', tier: 1, threshold: 5 },
  top5_10: { id: 'top5_10', emoji: '🌟', name: 'Elite Performer', description: 'Finish in top 5 (10 times)', category: 'tournament', tier: 2, threshold: 10 },
  
  // Milestones
  matches50: { id: 'matches50', emoji: '🎯', name: 'Veteran', description: 'Play 50 matches', category: 'milestone', tier: 1, threshold: 50 },
  matches100: { id: 'matches100', emoji: '🎖️', name: 'Centurion', description: 'Play 100 matches', category: 'milestone', tier: 2, threshold: 100 },
  matches250: { id: 'matches250', emoji: '🏅', name: 'Master', description: 'Play 250 matches', category: 'milestone', tier: 3, threshold: 250 },
  matches500: { id: 'matches500', emoji: '💫', name: 'Legend', description: 'Play 500 matches', category: 'milestone', tier: 4, threshold: 500 },
  wins25: { id: 'wins25', emoji: '🔥', name: 'Winner', description: 'Win 25 matches', category: 'milestone', tier: 1, threshold: 25 },
  wins50: { id: 'wins50', emoji: '⚡', name: 'Dominator', description: 'Win 50 matches', category: 'milestone', tier: 2, threshold: 50 },
  wins100: { id: 'wins100', emoji: '💥', name: 'Champion', description: 'Win 100 matches', category: 'milestone', tier: 3, threshold: 100 },
  wins250: { id: 'wins250', emoji: '🚀', name: 'Unstoppable', description: 'Win 250 matches', category: 'milestone', tier: 4, threshold: 250 },
  tournaments10: { id: 'tournaments10', emoji: '📅', name: 'Regular', description: 'Play in 10 tournaments', category: 'milestone', tier: 1, threshold: 10 },
  tournaments25: { id: 'tournaments25', emoji: '📆', name: 'Dedicated', description: 'Play in 25 tournaments', category: 'milestone', tier: 2, threshold: 25 },
  tournaments50: { id: 'tournaments50', emoji: '🗓️', name: 'Veteran Competitor', description: 'Play in 50 tournaments', category: 'milestone', tier: 3, threshold: 50 },
  seasons5: { id: 'seasons5', emoji: '📊', name: 'Season Veteran', description: 'Play in 5+ seasons', category: 'milestone', tier: 2, threshold: 5 },
  
  // Performance
  winRate60: { id: 'winRate60', emoji: '🎯', name: 'Sharp Shooter', description: 'Achieve 60%+ win rate (min 20 matches)', category: 'performance', tier: 1, threshold: 60, minMatches: 20 },
  winRate70: { id: 'winRate70', emoji: '🎪', name: 'Elite Player', description: 'Achieve 70%+ win rate (min 20 matches)', category: 'performance', tier: 2, threshold: 70, minMatches: 20 },
  winRate80: { id: 'winRate80', emoji: '🏆', name: 'Master', description: 'Achieve 80%+ win rate (min 20 matches)', category: 'performance', tier: 3, threshold: 80, minMatches: 20 },
  goalDiff50: { id: 'goalDiff50', emoji: '⚽', name: 'Goal Machine', description: 'Achieve +50 goal difference', category: 'performance', tier: 1, threshold: 50 },
  goalDiff100: { id: 'goalDiff100', emoji: '🔥', name: 'Goal Master', description: 'Achieve +100 goal difference', category: 'performance', tier: 2, threshold: 100 },
  goalDiff200: { id: 'goalDiff200', emoji: '💥', name: 'Goal Legend', description: 'Achieve +200 goal difference', category: 'performance', tier: 3, threshold: 200 },
  
  // TrueSkill
  trueskill20: { id: 'trueskill20', emoji: '⭐', name: 'Rising Star', description: 'Reach TrueSkill 20', category: 'trueskill', tier: 1, threshold: 20 },
  trueskill25: { id: 'trueskill25', emoji: '🌟', name: 'Star Player', description: 'Reach TrueSkill 25', category: 'trueskill', tier: 2, threshold: 25 },
  trueskill30: { id: 'trueskill30', emoji: '💫', name: 'Elite', description: 'Reach TrueSkill 30', category: 'trueskill', tier: 3, threshold: 30 },
  trueskill35: { id: 'trueskill35', emoji: '🏆', name: 'Master', description: 'Reach TrueSkill 35', category: 'trueskill', tier: 4, threshold: 35 },
  trueskill40: { id: 'trueskill40', emoji: '👑', name: 'Grandmaster', description: 'Reach TrueSkill 40', category: 'trueskill', tier: 5, threshold: 40 },
  trueskill45: { id: 'trueskill45', emoji: '💎', name: 'Legend', description: 'Reach TrueSkill 45', category: 'trueskill', tier: 6, threshold: 45 },
  trueskill50: { id: 'trueskill50', emoji: '🚀', name: 'Mythic', description: 'Reach TrueSkill 50', category: 'trueskill', tier: 7, threshold: 50 },
  
  // Streaks
  winStreak5: { id: 'winStreak5', emoji: '🔥', name: 'Hot Streak', description: 'Win 5 matches in a row', category: 'streak', tier: 1, threshold: 5 },
  winStreak10: { id: 'winStreak10', emoji: '⚡', name: 'On Fire', description: 'Win 10 matches in a row', category: 'streak', tier: 2, threshold: 10 },
  winStreak15: { id: 'winStreak15', emoji: '💥', name: 'Unstoppable', description: 'Win 15 matches in a row', category: 'streak', tier: 3, threshold: 15 },
  
  // Partnerships
  partner10: { id: 'partner10', emoji: '🤝', name: 'Dynamic Duo', description: 'Win 10+ matches with the same partner', category: 'partnership', tier: 1, threshold: 10 },
  partner5: { id: 'partner5', emoji: '👥', name: 'Team Player', description: 'Win with 5+ different partners', category: 'partnership', tier: 1, threshold: 5 },
  
  // Season Achievements
  seasonChampion: { id: 'seasonChampion', emoji: '🏆', name: 'Season Champion', description: 'Win a season', category: 'season', tier: 3, threshold: 1 },
  seasonPodium: { id: 'seasonPodium', emoji: '🥉', name: 'Season Podium', description: 'Finish top 3 in a season', category: 'season', tier: 2, threshold: 1 },
  seasonPoints50: { id: 'seasonPoints50', emoji: '⭐', name: 'Season Star', description: 'Earn 50+ season points in one season', category: 'season', tier: 1, threshold: 50 },
  seasonPoints100: { id: 'seasonPoints100', emoji: '🌟', name: 'Season Elite', description: 'Earn 100+ season points in one season', category: 'season', tier: 2, threshold: 100 },
  seasonPoints200: { id: 'seasonPoints200', emoji: '💎', name: 'Season Legend', description: 'Earn 200+ season points in one season', category: 'season', tier: 3, threshold: 200 },
}

