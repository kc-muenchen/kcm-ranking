# KC München Ranking - Table Soccer Tournament Rankings

A modern React application for displaying and analyzing table soccer (foosball) tournament rankings with PostgreSQL backend.

## ✨ Features

### Core Features
- 🏆 **Tournament Management** - Track multiple tournaments with detailed statistics
- 🌟 **Overall Rankings** - Aggregate player performance across all tournaments
- 📊 **Player Statistics** - Comprehensive stats and rankings
- 🎯 **Statistics Cards** - Quick overview of top performers
- 📈 **Sortable Tables** - Sort by any metric (points, wins, goals, etc.)
- 🏅 **TrueSkill Rating** - Advanced skill rating system
- 🏆 **Season Points** - Championship-style ranking (25pts for 1st, 20pts for 2nd, etc.)

### Player Features
- 👤 **Individual Player Pages** - Detailed statistics and match history
- 🤝 **Partner Statistics** - See which partners you win most with
- ⚔️ **Opponent Statistics** - Track your best and worst matchups
- 🥇 **Tournament History** - View all tournaments with placements
- 📈 **TrueSkill Evolution** - See rating changes over time

### Technical Features
- 🎭 **Player Aliases** - Merge duplicate players with different names
- 🏆 **Elimination Brackets** - Visualize knockout rounds
- 🔌 **Browser Extension** - Auto-export from Kickertool
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Real-time Updates** - API-based architecture

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Node.js v20+ and PostgreSQL 16

### Using Docker (Easiest)

```bash
# 1. Start all services
docker-compose up -d

# 2. Import data
docker-compose exec backend npm run migrate:data

# 3. Access the app
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

### Local Development

```bash
# 1. Start database
docker-compose up -d database

# 2. Setup backend
cd backend
npm install
cp env.example .env
npm run prisma:migrate
npm run migrate:data
npm run dev

# 3. Setup frontend (new terminal)
cd ..
npm install
npm run dev

# Access at http://localhost:5173
```

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation and setup instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to production (Docker, cloud platforms)
- **[Configuration Guide](docs/CONFIGURATION.md)** - Configure player aliases, seasons, API keys
- **[CI/CD Guide](docs/CI_CD.md)** - Automated builds with GitHub Actions
- **[Browser Extension](browser-extension/README.md)** - Auto-export from Kickertool
- **[Backend Security](backend/SECURITY.md)** - Security best practices

## 🏗️ Architecture

```
┌─────────────────┐
│  Browser Ext    │──┐
└─────────────────┘  │
                     │  POST /api/tournaments
┌─────────────────┐  │
│   Frontend      │  │
│   (React+Vite)  │◄─┼─► ┌──────────────┐
│  Port 5173/8080 │  │   │  Backend API │
└─────────────────┘  │   │  (Express)   │     ┌────────────┐
                     └──►│  Port 3001   │◄───►│ PostgreSQL │
                         └──────────────┘     │  Port 5432 │
                                              └────────────┘
```

## 🐳 Docker Deployment

### Pre-built Images (Recommended)

Pre-built images are automatically published to Docker Hub:

```bash
# Pull latest images
docker pull mfreitag1/kcm-ranking-frontend:latest
docker pull mfreitag1/kcm-ranking-backend:latest

# Use docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

Images are automatically built on every push to `main` via GitHub Actions.

### Configuration

Create `.env` file:

```env
# Database
DB_PASSWORD=your-secure-password

# API Security
API_KEYS=your-secret-api-key

# Frontend
VITE_API_URL=http://localhost:3001

# CORS
CORS_ORIGIN=https://yourdomain.com
```

See [Configuration Guide](docs/CONFIGURATION.md) for details.

## 📡 API Endpoints

### Tournaments
```
GET    /api/tournaments       # List all tournaments
GET    /api/tournaments/:id   # Get specific tournament
POST   /api/tournaments       # Create tournament (requires API key)
DELETE /api/tournaments/:id   # Delete tournament (requires API key)
```

### Players
```
GET /api/players              # List all players
GET /api/players/:name        # Get player details
GET /api/players/:name/history # Get match history
```

### Stats
```
GET /api/stats/overall        # Overall statistics
```

See [Setup Guide](docs/SETUP.md) for complete API documentation.

## 🔧 Configuration

### Player Aliases

Merge players with different name variations:

```javascript
// src/config/playerAliases.js
export const playerAliases = {
  'Max': 'Max Müller',
  'M. Müller': 'Max Müller',
  'Sarah': 'Sarah Weber',
};
```

See [Configuration Guide](docs/CONFIGURATION.md) for details.

### Season Configuration

Define seasons and point systems:

```javascript
// src/constants/seasonDates.js
export const seasons = {
  '2025': {
    name: 'Season 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
};
```

## 🔌 Browser Extension

Auto-export tournaments from Kickertool to your database:

1. Install extension from `browser-extension/` folder
2. Configure API URL and key
3. Export tournament from Kickertool
4. Extension automatically captures and uploads

See [Browser Extension Guide](browser-extension/README.md) for setup.

## 🛠️ Technology Stack

### Frontend
- React 18 - UI framework
- Vite - Build tool and dev server
- CSS3 - Modern styling with CSS variables
- ts-trueskill - TrueSkill rating algorithm

### Backend
- Node.js 20 - JavaScript runtime
- Express - Web framework
- PostgreSQL 16 - Relational database
- Prisma - ORM and migrations
- Helmet - Security headers
- express-rate-limit - Rate limiting

### DevOps
- Docker & Docker Compose - Containerization
- Nginx - Web server for production
- GitHub Actions - CI/CD pipeline

## 📊 Statistics Explained

### Tournament View
- **Points** - Total points earned
- **Matches** - Number of matches played
- **Won/Lost** - Win/loss record
- **Win %** - Win percentage
- **GF/GA** - Goals For/Against
- **GD** - Goal Difference
- **PPG** - Points Per Game

### Overall Ranking
- **Tournaments** - Number of tournaments participated
- **Best Place** - Highest finish
- **Avg Place** - Average placement
- **Total Points** - Cumulative points
- **TrueSkill** - Skill rating (μ - 3σ)

## 🔐 Security

Production security features:
- ✅ API key authentication for write operations
- ✅ Rate limiting (100 req/15min general, 10 req/15min writes)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Environment-based configuration

See [Backend Security Guide](backend/SECURITY.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Data Format

Tournament JSON structure:

```json
{
  "_id": "tournament-id",
  "name": "20251119",
  "createdAt": "2025-11-19T17:31:25.537Z",
  "qualifying": [{
    "standings": [
      {
        "_id": "player-id",
        "name": "Player Name",
        "stats": {
          "place": 1,
          "matches": 10,
          "points": 25,
          "won": 8,
          "lost": 2,
          "goals": 50,
          "goals_in": 30,
          "goal_diff": 20
        }
      }
    ]
  }]
}
```

## 🚀 Deployment Options

1. **Docker Self-Hosted** - Full control, easiest setup
2. **Pre-built Images** - Pull from Docker Hub, no build needed
3. **Cloud Platforms** - Render, Railway, Fly.io
4. **Manual VPS** - Traditional server deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 📦 Useful Commands

```bash
# Development
npm run dev                    # Start frontend dev server
cd backend && npm run dev      # Start backend dev server

# Docker
docker-compose up -d           # Start all services
docker-compose logs -f         # View logs
docker-compose down            # Stop all services

# Database
cd backend
npm run prisma:studio          # Open database GUI
npm run migrate:data           # Import JSON data
npm run prisma:migrate         # Run migrations

# Production
npm run build                  # Build frontend
docker-compose -f docker-compose.prod.yml up -d  # Production deployment
```

## 🐛 Troubleshooting

### Frontend shows "Falling back to local JSON files"
Backend API not accessible. Start backend: `cd backend && npm run dev`

### "Cannot connect to database"
PostgreSQL not running. Start it: `docker-compose up -d database`

### CORS errors
Check `CORS_ORIGIN` in `backend/.env` matches your frontend URL

### Port already in use
Another process using the port. Find and kill it: `lsof -i :3001`

See [Setup Guide](docs/SETUP.md) for more troubleshooting.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built for KC München table soccer community
- TrueSkill algorithm by Microsoft Research
- Kickertool for tournament management platform

---

**Need help?** Check the [documentation](docs/) or open an issue!
