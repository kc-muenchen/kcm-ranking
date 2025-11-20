import prisma from '../utils/db.js';
import { calculateAggregatedStats } from '../services/stats-calculator.js';

// GET /api/players
export async function getAllPlayers(req, res, next) {
  try {
    const players = await prisma.player.findMany({
      include: {
        standings: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            }
          }
        },
        teamPlayers: {
          include: {
            team: {
              include: {
                match: {
                  include: {
                    tournament: {
                      select: {
                        createdAt: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate aggregated stats for all players
    const playersWithStats = await calculateAggregatedStats(players);

    res.json({
      success: true,
      data: playersWithStats,
      count: playersWithStats.length
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/players/:name
export async function getPlayerByName(req, res, next) {
  try {
    const { name } = req.params;

    const player = await prisma.player.findUnique({
      where: { name },
      include: {
        standings: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            }
          },
          orderBy: { place: 'asc' }
        },
        teamPlayers: {
          include: {
            team: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                },
                match: {
                  include: {
                    tournament: {
                      select: {
                        name: true,
                        createdAt: true
                      }
                    },
                    teams: {
                      include: {
                        players: {
                          include: {
                            player: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/players/:name/history
export async function getPlayerHistory(req, res, next) {
  try {
    const { name } = req.params;

    // Get all matches for this player
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        player: {
          name
        }
      },
      include: {
        team: {
          include: {
            match: {
              include: {
                tournament: {
                  select: {
                    name: true,
                    createdAt: true
                  }
                },
                teams: {
                  include: {
                    players: {
                      include: {
                        player: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        team: {
          match: {
            timeStart: 'desc'
          }
        }
      }
    });

    const matches = teamPlayers.map(tp => tp.team.match);

    res.json({
      success: true,
      data: matches,
      count: matches.length
    });
  } catch (error) {
    next(error);
  }
}

