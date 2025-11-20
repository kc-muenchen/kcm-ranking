import express from 'express';
import {
  getAllPlayers,
  getPlayerByName,
  getPlayerHistory
} from '../controllers/players.js';

const router = express.Router();

// GET /api/players - Get all players with aggregated stats
router.get('/', getAllPlayers);

// GET /api/players/:name - Get player by name
router.get('/:name', getPlayerByName);

// GET /api/players/:name/history - Get player match history
router.get('/:name/history', getPlayerHistory);

export default router;

