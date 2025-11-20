# KC München Ranking - Table Soccer Tournament Rankings

A modern React application for displaying and analyzing table soccer (foosball) tournament rankings.

## Features

- 🏆 **Tournament Selection** - Switch between different tournaments
- 🌟 **Overall Ranking** - Aggregate view of player performance across all tournaments
- 📊 **Player Rankings** - Comprehensive player statistics and rankings
- 🎯 **Statistics Cards** - Quick overview of top performers
- 📈 **Sortable Tables** - Sort by any metric (points, wins, goals, etc.)
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🏅 **TrueSkill Rating** - Advanced skill rating system that updates based on match outcomes
- 🏆 **Season Points** - Championship-style ranking system (1st: 25pts, 2nd: 20pts, etc.)
- 👤 **Individual Player Pages** - Detailed player statistics, match history, and TrueSkill evolution
- 🤝 **Partner Statistics** - See which partners you win the most with
- ⚔️ **Opponent Statistics** - Track your best and worst matchups
- 🥇 **Tournament History** - View all tournaments participated in with placements
- 🎭 **Player Aliases** - Merge duplicate players with different name variations
- 🔄 **Dynamic Data Loading** - Automatically loads all tournament files
- 🏆 **Elimination Brackets** - Visualize knockout rounds and finals
- 🔌 **Browser Extension** - Auto-export tournaments from Kickertool to GitHub

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Docker (for PostgreSQL database)

### Quick Start (Recommended)

The application now uses a **backend API with PostgreSQL** for data storage. See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed instructions.

**1. Start PostgreSQL:**
```bash
docker-compose up -d database
```

**2. Setup backend:**
```bash
cd backend
npm install
cp env.example .env  # Edit if needed
npm run prisma:migrate
npm run migrate:data  # Import existing tournament data
npm run dev
```

**3. Setup frontend (new terminal):**
```bash
# From project root
npm install
npm run dev
```

**4. Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

> **Note**: The frontend automatically falls back to loading JSON files if the backend is unavailable.

### Migration Guide

If you're upgrading from the JSON-based version, see [MIGRATION_TO_API.md](./MIGRATION_TO_API.md) for step-by-step instructions.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Deployment

### Automated Builds (GitHub Actions)

This repository includes a GitHub Actions workflow that automatically builds and pushes Docker images to:
- **Docker Hub**: [`mfreitag1/kcm-ranking`](https://hub.docker.com/r/mfreitag1/kcm-ranking)
- **GitHub Container Registry**: `ghcr.io/mgaesslein/kcm-ranking`

Images are automatically built when:
- You push to the `main` branch (tagged as `latest`)
- You create a version tag (e.g., `v1.0.0`)
- You create a pull request (build only, no push)

#### Setting Up Automated Builds

1. **Create a Docker Hub account** at https://hub.docker.com

2. **Generate a Docker Hub Access Token**:
   - Go to Account Settings → Security → New Access Token
   - Give it a name (e.g., "GitHub Actions")
   - Copy the token

3. **Add GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret" and add:
     - `DOCKERHUB_USERNAME`: Your Docker Hub username
     - `DOCKERHUB_TOKEN`: Your Docker Hub access token

4. **Push your code** and the workflow will automatically build and push the image!

#### Pulling Pre-built Images

Your friend can pull the latest image:

```bash
# From Docker Hub
docker pull mfreitag1/kcm-ranking:latest

# Or from GitHub Container Registry
docker pull ghcr.io/mgaesslein/kcm-ranking:latest

# Run it
docker run -d -p 8080:80 --name kcm-ranking mfreitag1/kcm-ranking:latest
```

### Building the Docker Image Manually

Build the Docker image using the following command:

```bash
docker build -t kcm-ranking:latest .
```

### Running the Docker Container

Run the container and map it to port 8080 (or any port you prefer):

```bash
docker run -d -p 8080:80 --name kcm-ranking kcm-ranking:latest
```

The application will be available at `http://localhost:8080`

### Docker Commands

**Stop the container:**
```bash
docker stop kcm-ranking
```

**Start the container:**
```bash
docker start kcm-ranking
```

**Remove the container:**
```bash
docker rm kcm-ranking
```

**View logs:**
```bash
docker logs kcm-ranking
```

**Rebuild and restart:**
```bash
docker stop kcm-ranking
docker rm kcm-ranking
docker build -t kcm-ranking:latest .
docker run -d -p 8080:80 --name kcm-ranking kcm-ranking:latest
```

### Docker Compose (Optional)

You can also use Docker Compose. Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  kcm-ranking:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

## Browser Extension - Auto-Export from Kickertool

We've built a Chrome extension that automatically exports tournament data from Kickertool directly to this GitHub repository!

### Quick Start

1. Navigate to `/browser-extension/` folder
2. Open `generate-icons.html` in your browser
3. Download all icons
4. Follow the complete guide in `/browser-extension/SETUP.md`

### What it Does

- 🎯 Monitors Kickertool for tournament exports
- 📥 Automatically captures JSON data
- 🚀 One-click push directly to GitHub
- ✅ No manual file copying needed!

See [browser-extension/README.md](browser-extension/README.md) for full documentation.

## Player Aliases Configuration

If players appear in tournaments with different name variations (e.g., "Max" vs "Max Müller"), you can configure aliases to merge them into a single player.

Edit `src/config/playerAliases.js`:

```javascript
export const playerAliases = {
  'Max': 'Max Müller',
  'M. Müller': 'Max Müller',
  'Sarah': 'Sarah Weber',
  'S. Weber': 'Sarah Weber',
}
```

For detailed instructions, see [PLAYER_ALIASES_GUIDE.md](PLAYER_ALIASES_GUIDE.md)

## Data Format

The application expects JSON files in the `/dummy_data` directory with the following structure:

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
          "goal_diff": 20,
          "points_per_game": 2.5,
          ...
        }
      }
    ]
  }]
}
```

## Statistics Explained

### Single Tournament View
- **Points** - Total points earned in the tournament
- **Matches** - Number of matches played
- **Won/Lost** - Win/loss record
- **Win %** - Win percentage
- **GF** - Goals For (scored)
- **GA** - Goals Against (conceded)
- **GD** - Goal Difference (GF - GA)
- **PPG** - Points Per Game average

### Overall Ranking View
- **Tournaments** - Number of tournaments participated in
- **Best Place** - Highest finish across all tournaments
- **Avg Place** - Average placement across tournaments
- **Total Points** - Cumulative points across all tournaments
- **Total Matches** - Total matches played across all tournaments
- **Win %** - Overall win percentage
- **PPG** - Average points per game across all tournaments

## Technologies Used

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling with CSS variables
- **JavaScript (ES6+)** - Modern JavaScript features
- **ts-trueskill** - TrueSkill rating algorithm implementation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **Prisma** - ORM (Object-Relational Mapping)
- **CORS** - Cross-origin resource sharing

### DevOps
- **Docker** - Containerization for easy deployment
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server for production deployment
- **GitHub Actions** - CI/CD pipeline

## License

MIT

