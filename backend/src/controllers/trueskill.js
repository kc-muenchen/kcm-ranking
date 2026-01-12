import { calculateTrueSkillRatings } from '../services/trueskill-service.js'

// GET /api/trueskill
export async function getTrueSkillRatings(req, res, next) {
  try {
    const { ratings, history } = await calculateTrueSkillRatings()
    
    res.json({
      success: true,
      data: {
        ratings,
        history
      }
    })
  } catch (error) {
    next(error)
  }
}

