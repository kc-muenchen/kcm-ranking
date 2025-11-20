import express from 'express';
import {
  getOverallStats,
  getTournamentStats
} from '../controllers/stats.js';

const router = express.Router();

// GET /api/stats/overall - Get overall statistics across all tournaments
router.get('/overall', getOverallStats);

// GET /api/stats/tournament/:id - Get statistics for a specific tournament
router.get('/tournament/:id', getTournamentStats);

export default router;

