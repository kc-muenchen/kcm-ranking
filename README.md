# KCM Ranking - Table Soccer Tournament Rankings

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
- 👤 **Individual Player Pages** - Detailed player statistics, match history, and TrueSkill evolution
- 🤝 **Partner Statistics** - See which partners you win the most with
- ⚔️ **Opponent Statistics** - Track your best and worst matchups
- 🥇 **Tournament Wins** - View best tournament placements and achievements
- 🎭 **Player Aliases** - Merge duplicate players with different name variations
- 🔄 **Dynamic Data Loading** - Automatically loads all tournament files
- 🏆 **Elimination Brackets** - Visualize knockout rounds and finals

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Deployment

### Automated Builds (GitHub Actions)

This repository includes a GitHub Actions workflow that automatically builds and pushes Docker images to:
- **Docker Hub**: `yourusername/kcm-ranking`
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
docker pull yourusername/kcm-ranking:latest

# Or from GitHub Container Registry
docker pull ghcr.io/mgaesslein/kcm-ranking:latest

# Run it
docker run -d -p 8080:80 --name kcm-ranking yourusername/kcm-ranking:latest
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

- **React** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling with CSS variables
- **JavaScript (ES6+)** - Modern JavaScript features
- **ts-trueskill** - TrueSkill rating algorithm implementation
- **Docker** - Containerization for easy deployment
- **Nginx** - Web server for production deployment

## License

MIT

