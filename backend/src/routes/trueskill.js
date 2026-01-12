import express from 'express'
import { getTrueSkillRatings } from '../controllers/trueskill.js'

const router = express.Router()

// GET /api/trueskill - Get TrueSkill ratings and history for all players
router.get('/', getTrueSkillRatings)

export default router

