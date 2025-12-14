import express from 'express';
import { 
  register, 
  login, 
  getProfile,
  placeBet,
  getUserBets,
  getActiveBets,
  getLeaderboard
} from '../controllers/betting.js';
import { requireBettingAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);
router.get('/leaderboard', getLeaderboard);
router.get('/active-bets', getActiveBets);

// Protected routes (require authentication)
router.get('/profile', requireBettingAuth, getProfile);
router.post('/bets', requireBettingAuth, placeBet);
router.get('/bets', requireBettingAuth, getUserBets);

export default router;

