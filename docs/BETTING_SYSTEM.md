# Betting System

The KCM Ranking application includes a fun virtual betting system where users can place bets on live games and compete on a leaderboard.

## Features

### For Users
- **Virtual Currency**: Each new user starts with 1000 coins
- **Live Betting**: Place bets on active games in real-time
- **Win Predictions**: See TrueSkill-based win probabilities before betting
- **Leaderboard**: Compete with other users for the highest balance
- **Bet History**: Track all your past bets and their outcomes
- **ROI Tracking**: Monitor your return on investment

### Authentication
- Simple username/password registration
- JWT-based authentication
- 7-day session tokens
- Secure password hashing with bcrypt

## How to Use

### Getting Started
1. Navigate to the **Live View** (📺 button in header)
2. Click **🎲 Login to Bet** button
3. Register a new account or login
4. You'll start with 1000 coins

### Placing Bets
1. View active games on different tables
2. Check the win probability for each team
3. Click "Bet on Team 1" or "Bet on Team 2"
4. Choose your bet amount (or use quick amounts: 10, 50, 100, All In)
5. See potential winnings before confirming
6. Confirm your bet

### Viewing Stats
- Click **🏆 Leaderboard** to see:
  - Top players by balance
  - Profit/loss for each player
  - ROI (Return on Investment) percentages
- Switch to **📋 My Bets** tab to see:
  - All your past bets
  - Bet status (pending, won, lost)
  - Payout amounts for winning bets

## Technical Details

### Backend API Endpoints

#### Public Endpoints
- `POST /api/betting/register` - Register new user
- `POST /api/betting/login` - Login user
- `GET /api/betting/leaderboard` - Get top players
- `GET /api/betting/active-bets` - Get all active bets

#### Protected Endpoints (require JWT token)
- `GET /api/betting/profile` - Get user profile
- `POST /api/betting/bets` - Place a bet
- `GET /api/betting/bets` - Get user's bet history

### Database Schema

#### BettingUser
- `id`: Unique identifier
- `username`: Unique username
- `passwordHash`: Bcrypt hashed password
- `balance`: Current coin balance
- `totalWagered`: Total amount bet
- `totalWon`: Total amount won
- `createdAt`: Account creation date
- `lastActive`: Last activity timestamp

#### Bet
- `id`: Unique identifier
- `userId`: User who placed the bet
- `tournamentId`: Kickertool tournament ID
- `matchId`: Kickertool match ID (optional)
- `tableName`: Table number/name
- `amount`: Bet amount
- `predictedWinner`: 1 or 2 (team number)
- `odds`: Win probability at time of bet
- `team1Names`: JSON array of team 1 players
- `team2Names`: JSON array of team 2 players
- `status`: pending, won, lost, or cancelled
- `payout`: Amount won (if status = won)
- `placedAt`: Bet placement timestamp
- `resolvedAt`: Bet resolution timestamp

### Odds Calculation

Bets use TrueSkill-based win probabilities:
- Higher probability = lower potential payout
- Lower probability = higher potential payout
- Formula: `payout = betAmount * (1 / probability)`

Example:
- Team with 70% win chance: Bet 100 → Win ~143 coins
- Team with 30% win chance: Bet 100 → Win ~333 coins

### Security

- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- API endpoints are protected with JWT authentication
- User balances are validated before placing bets
- Transactions use Prisma's atomic operations

## Environment Variables

Add to your backend `.env` file:

```env
JWT_SECRET=your-secret-key-change-in-production
```

⚠️ **Important**: Change the JWT_SECRET in production!

## Future Enhancements

Potential features for future development:
- Bet resolution automation (when match results are available)
- Daily/weekly leaderboard resets
- Achievement badges
- Bet limits and responsible gaming features
- Live bet feed showing recent bets
- Social features (following other users)
- Tournament-specific leaderboards
- Bet statistics and analytics

## Development

### Running Locally

1. Install dependencies:
```bash
cd backend
npm install
```

2. Run database migration:
```bash
npx prisma migrate dev
```

3. Start backend:
```bash
npm run dev
```

4. Frontend will connect automatically using the configured API URL

### Testing

Test the betting system:
1. Register multiple test accounts
2. Place bets on different teams
3. Check leaderboard updates
4. Verify bet history tracking
5. Test balance deductions and payouts

## Notes

- This is a **virtual currency system** for entertainment only
- No real money is involved
- Bets are currently manually resolved (auto-resolution coming soon)
- Starting balance: 1000 coins per user
- Minimum bet: 1 coin
- Maximum bet: Your current balance

