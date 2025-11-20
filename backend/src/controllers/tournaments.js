import prisma from '../utils/db.js';
import { processTournamentData } from '../services/tournament-processor.js';

// GET /api/tournaments
export async function getAllTournaments(req, res, next) {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        externalId: true,
        name: true,
        createdAt: true,
        mode: true,
        sport: true,
        rawData: true, // Include raw JSON data for frontend
        _count: {
          select: {
            matches: true,
            standings: true
          }
        }
      }
    });

    // Return tournaments array directly (not wrapped in object) for frontend compatibility
    res.json(tournaments);
  } catch (error) {
    next(error);
  }
}

// GET /api/tournaments/:id
export async function getTournamentById(req, res, next) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            teams: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                }
              }
            }
          },
          orderBy: { timeStart: 'asc' }
        },
        standings: {
          include: {
            player: true
          },
          orderBy: { place: 'asc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/tournaments
export async function createTournament(req, res, next) {
  try {
    const tournamentData = req.body;

    // Validate data
    if (!tournamentData || !tournamentData.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tournament data'
      });
    }

    // Process and save tournament data
    const tournament = await processTournamentData(tournamentData);

    res.status(201).json({
      success: true,
      data: tournament,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Tournament already exists'
      });
    }
    next(error);
  }
}

// DELETE /api/tournaments/:id
export async function deleteTournament(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.tournament.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    next(error);
  }
}

