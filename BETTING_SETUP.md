# Betting System Setup Guide

## Quick Start

The betting system has been fully implemented! Here's what you need to do to get it running:

### 1. Database Migration

The database migration has already been created. To apply it to your production database:

```bash
cd backend
npx prisma migrate deploy
```

### 2. Environment Variables

Add this to your backend `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

⚠️ **IMPORTANT**: Use a strong, random secret in production!

### 3. Install Dependencies

The required packages (`bcryptjs` and `jsonwebtoken`) have been added to `package.json`. Install them:

```bash
cd backend
npm install
```

### 4. Restart Backend

Restart your backend server to load the new betting routes:

```bash
npm run dev  # or npm start for production
```

### 5. Test It Out!

1. Navigate to the Live View (click the 📺 button in the header)
2. Click "🎲 Login to Bet"
3. Register a new account (you'll get 1000 coins)
4. Place bets on active games!
5. Check the leaderboard to see rankings

## What's Included

### Backend
- ✅ Database schema for users, bets, and balances
- ✅ User registration and login (JWT authentication)
- ✅ Bet placement API
- ✅ Leaderboard API
- ✅ Bet history API
- ✅ User profile API

### Frontend
- ✅ Login/Registration modal
- ✅ Betting interface on each live game
- ✅ Leaderboard with top players
- ✅ Personal bet history
- ✅ Real-time balance updates
- ✅ Win probability calculations
- ✅ Potential payout preview

## Features

- **Virtual Currency**: Users start with 1000 coins
- **Live Betting**: Bet on any active game
- **Smart Odds**: Based on TrueSkill ratings
- **Leaderboard**: Compete for the top spot
- **Bet History**: Track all your bets
- **ROI Tracking**: See your return on investment

## API Endpoints

All betting endpoints are under `/api/betting/`:

- `POST /api/betting/register` - Create account
- `POST /api/betting/login` - Login
- `GET /api/betting/leaderboard` - View rankings
- `GET /api/betting/profile` - Get your profile (auth required)
- `POST /api/betting/bets` - Place a bet (auth required)
- `GET /api/betting/bets` - View your bets (auth required)

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Protected endpoints require Bearer token authentication
- Bet amounts are validated against user balance
- All transactions use Prisma's atomic operations

## Future Enhancements

Currently, bets need to be manually resolved. Future updates could include:
- Automatic bet resolution when matches finish
- Push notifications for bet outcomes
- Daily/weekly leaderboard resets
- Achievement system
- Bet statistics and analytics

## Troubleshooting

### "Failed to place bet"
- Check that user has sufficient balance
- Verify JWT token is valid
- Check backend logs for errors

### "Failed to login"
- Verify username/password are correct
- Check that database migration ran successfully
- Ensure JWT_SECRET is set in backend .env

### Leaderboard not showing
- Check that backend is running
- Verify API_URL is configured correctly
- Check browser console for errors

## Documentation

For more details, see:
- [Betting System Documentation](docs/BETTING_SYSTEM.md)
- [Backend API Documentation](backend/README.md)

## Support

If you encounter issues:
1. Check backend logs
2. Check browser console
3. Verify database migration status
4. Ensure all environment variables are set

---

**Have fun betting! 🎲💰**

