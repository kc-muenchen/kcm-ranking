import express from 'express';
import {
  getAllTournaments,
  getTournamentById,
  createTournament,
  deleteTournament
} from '../controllers/tournaments.js';

const router = express.Router();

// GET /api/tournaments - Get all tournaments
router.get('/', getAllTournaments);

// GET /api/tournaments/:id - Get tournament by ID
router.get('/:id', getTournamentById);

// POST /api/tournaments - Create new tournament
router.post('/', createTournament);

// DELETE /api/tournaments/:id - Delete tournament
router.delete('/:id', deleteTournament);

export default router;

