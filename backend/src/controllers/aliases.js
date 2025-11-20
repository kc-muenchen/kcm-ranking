import prisma from '../utils/db.js';

// GET /api/aliases
export async function getAllAliases(req, res, next) {
  try {
    const aliases = await prisma.playerAlias.findMany({
      include: {
        player: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        canonicalName: 'asc'
      }
    });

    res.json(aliases);
  } catch (error) {
    next(error);
  }
}

// GET /api/aliases/normalize/:name
export async function normalizeName(req, res, next) {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({
        error: 'Name parameter is required'
      });
    }

    // Find alias
    const alias = await prisma.playerAlias.findUnique({
      where: { alias: name },
      include: {
        player: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const normalizedName = alias ? alias.canonicalName : name;

    res.json({
      original: name,
      normalized: normalizedName,
      hasAlias: !!alias
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/aliases/:id
export async function getAliasById(req, res, next) {
  try {
    const { id } = req.params;

    const alias = await prisma.playerAlias.findUnique({
      where: { id },
      include: {
        player: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!alias) {
      return res.status(404).json({
        error: 'Alias not found'
      });
    }

    res.json(alias);
  } catch (error) {
    next(error);
  }
}

// POST /api/aliases
export async function createAlias(req, res, next) {
  try {
    const { alias, canonicalName, playerId } = req.body;

    if (!alias || !canonicalName) {
      return res.status(400).json({
        error: 'Alias and canonicalName are required'
      });
    }

    // Try to find player by canonical name if playerId not provided
    let finalPlayerId = playerId;
    if (!finalPlayerId) {
      const player = await prisma.player.findUnique({
        where: { name: canonicalName }
      });
      if (player) {
        finalPlayerId = player.id;
      }
    }

    const createdAlias = await prisma.playerAlias.create({
      data: {
        alias,
        canonicalName,
        playerId: finalPlayerId
      },
      include: {
        player: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(createdAlias);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Alias already exists'
      });
    }
    next(error);
  }
}

// PUT /api/aliases/:id
export async function updateAlias(req, res, next) {
  try {
    const { id } = req.params;
    const { alias, canonicalName, playerId } = req.body;

    // Try to find player by canonical name if playerId not provided
    let finalPlayerId = playerId;
    if (canonicalName && !finalPlayerId) {
      const player = await prisma.player.findUnique({
        where: { name: canonicalName }
      });
      if (player) {
        finalPlayerId = player.id;
      }
    }

    const updateData = {};
    if (alias !== undefined) updateData.alias = alias;
    if (canonicalName !== undefined) updateData.canonicalName = canonicalName;
    if (playerId !== undefined) updateData.playerId = finalPlayerId;

    const updatedAlias = await prisma.playerAlias.update({
      where: { id },
      data: updateData,
      include: {
        player: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedAlias);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Alias not found'
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Alias already exists'
      });
    }
    next(error);
  }
}

// DELETE /api/aliases/:id
export async function deleteAlias(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.playerAlias.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Alias deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Alias not found'
      });
    }
    next(error);
  }
}

