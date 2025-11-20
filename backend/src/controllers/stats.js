import prisma from '../utils/db.js';

// GET /api/stats/overall
export async function getOverallStats(req, res, next) {
  try {
    const [
      totalTournaments,
      totalPlayers,
      totalMatches,
      recentTournament
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.tournament.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { name: true, createdAt: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalTournaments,
        totalPlayers,
        totalMatches,
        recentTournament
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/stats/tournament/:id
export async function getTournamentStats(req, res, next) {
  try {
    const { id } = req.params;

    const [
      tournament,
      totalMatches,
      totalPlayers
    ] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id },
        select: { name: true, createdAt: true }
      }),
      prisma.match.count({ where: { tournamentId: id } }),
      prisma.standing.count({ where: { tournamentId: id, type: 'qualifying' } })
    ]);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: {
        tournament,
        totalMatches,
        totalPlayers
      }
    });
  } catch (error) {
    next(error);
  }
}

