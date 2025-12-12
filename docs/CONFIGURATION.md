# Configuration Guide

Complete guide for configuring KCM Ranking application settings.

## Environment Variables

### Frontend Environment Variables

Frontend configuration is set via `VITE_API_URL` environment variable.

**Local Development:**
```bash
# .env file in project root
VITE_API_URL=http://localhost:3001
```

**Production (Docker):**
```bash
# Set in docker-compose.yml or at runtime
VITE_API_URL=https://api.yourdomain.com
```

**Important Notes:**
- ✅ Correct: `http://localhost:3001` or `https://api.yourdomain.com`
- ❌ Wrong: `http://localhost:3001/api` (don't include `/api` suffix)
- The `/api` prefix is automatically added by the application

**Runtime Configuration (Docker):**
The frontend Docker image supports runtime configuration - no rebuild needed!

```bash
# Set environment variable when starting container
docker run -e VITE_API_URL=https://api.example.com kcm-ranking-frontend
```

The entrypoint script generates `/config.js` at startup with the API URL.

### Backend Environment Variables

Backend uses `backend/.env` file:

```env
#
# Database
#
DATABASE_URL="postgresql://kcmranking:password@localhost:5432/kcm_ranking?schema=public"

#
# Server Configuration
#
PORT=3001
NODE_ENV=development  # or 'production'
API_PREFIX=/api

#
# CORS (Cross-Origin Resource Sharing)
#
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

#
# Security
#
# Comma-separated list of API keys for write operations
API_KEYS=secret-key-1,secret-key-2

# Comma-separated list of allowed browser extension IDs
ALLOWED_EXTENSION_IDS=your-chrome-extension-id

#
# Optional: Database Connection Pool
#
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**Generating Secure API Keys:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using /dev/urandom
head -c 32 /dev/urandom | base64
```

## Player Aliases

Player aliases allow you to merge players who appear with different name variations.

### Configuration File

Edit `src/config/playerAliases.js`:

```javascript
/**
 * Player Aliases Configuration
 * 
 * Map name variations to canonical player names.
 * All statistics, TrueSkill ratings, and match history will be merged.
 */
export const playerAliases = {
  // Format: 'name-in-data': 'canonical-name'
  
  // Example: Consolidate "Max" variations
  'Max': 'Max Müller',
  'M. Müller': 'Max Müller',
  'Müller, Max': 'Max Müller',
  
  // Example: Consolidate "Sarah" variations  
  'Sarah': 'Sarah Weber',
  'S. Weber': 'Sarah Weber',
  'Weber, S.': 'Sarah Weber',
  
  // Add more aliases as needed
};
```

### How to Use

1. **Identify duplicates** - Look for players appearing multiple times with different names
2. **Choose canonical name** - Pick the full, official name as the target
3. **Add mappings** - Map all variations to the canonical name
4. **Save and test** - The app will automatically merge the data

### What Gets Merged

When aliases are configured, the system merges:
- ✅ Tournament results and placements
- ✅ TrueSkill ratings (all matches recalculated)
- ✅ Win/loss records
- ✅ Goal statistics
- ✅ Match history
- ✅ Partner statistics
- ✅ Opponent statistics

### Backend Alias Management (Optional)

Aliases can also be managed via the backend API:

```bash
# Get all aliases
curl http://localhost:3001/api/aliases

# Create/update alias (requires API key)
curl -X POST http://localhost:3001/api/aliases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "playerName": "Max",
    "canonicalName": "Max Müller"
  }'

# Delete alias (requires API key)
curl -X DELETE http://localhost:3001/api/aliases/:id \
  -H "X-API-Key: your-api-key"
```

To import aliases from config file to database:
```bash
cd backend
npm run migrate:aliases
```

## Season Configuration

### Season Dates

Edit `src/constants/seasonDates.js`:

```javascript
/**
 * Season Definitions
 * 
 * Define time periods for seasonal rankings.
 * Tournaments within these dates are grouped together.
 */
export const seasons = {
  '2025': {
    name: 'Season 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  '2024': {
    name: 'Season 2024', 
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  // Add historical seasons
  '2023': {
    name: 'Season 2023',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
  },
};

export const currentSeason = '2025';
```

### Season Points System

Edit `src/constants/seasonPoints.js`:

```javascript
/**
 * Season Points Configuration
 * 
 * Points awarded based on tournament placement.
 * Similar to Formula 1 / MotoGP point systems.
 */
export const seasonPointsSystem = {
  1: 25,   // 1st place
  2: 20,   // 2nd place
  3: 16,   // 3rd place
  4: 13,   // 4th place
  5: 11,   // 5th place
  6: 10,   // 6th place
  7: 9,    // 7th place
  8: 8,    // 8th place
  9: 7,    // 9th place
  10: 6,   // 10th place
  // Extend as needed
};

// Minimum tournaments to qualify for season ranking
export const minimumTournamentsForSeasonRanking = 3;
```

## TrueSkill Configuration

TrueSkill rating system parameters in `src/utils/trueskill.js`:

```javascript
import { rate, Rating } from 'ts-trueskill';

/**
 * TrueSkill Configuration
 * 
 * Adjust these parameters to tune the rating system behavior.
 */

// Initial rating for new players
export const INITIAL_RATING = 25.0;
export const INITIAL_SIGMA = 8.333;

// System parameters
const TRUESKILL_OPTIONS = {
  mu: INITIAL_RATING,      // Initial mean skill
  sigma: INITIAL_SIGMA,    // Initial uncertainty
  beta: 4.166,             // Skill difference for 80% win probability
  tau: 0.083,              // Dynamics factor (how ratings evolve)
  draw_probability: 0.0,   // No draws in foosball
};

// Calculate rating from mean and sigma
export function calculateDisplayRating(rating) {
  // Conservative estimate: μ - 3σ
  return Math.max(0, rating.mu - 3 * rating.sigma);
}
```

**Parameter Explanations:**
- `mu`: Initial skill level (25.0 is standard)
- `sigma`: Initial uncertainty (higher = more volatile initially)
- `beta`: Skill difference for 80% win probability
- `tau`: How quickly ratings can change over time
- `draw_probability`: Set to 0 since foosball doesn't have draws

## Application Settings

### Browser Extension Configuration

Users configure the extension via the options page:

1. Click extension icon → Settings (gear icon)
2. Configure:
   - **API URL**: `https://api.yourdomain.com` (without `/api`)
   - **API Key**: One of the keys from `API_KEYS` env var

See [Browser Extension Guide](../browser-extension/README.md) for details.

### Nginx Configuration

Frontend nginx config in `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # Don't cache index.html and config.js
    location ~* ^/(index\.html|config\.js)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Docker Compose Configuration

### Development Setup

`docker-compose.yml`:
```yaml
services:
  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kcm_ranking
      POSTGRES_USER: kcmranking
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme123}
    ports:
      - "5444:5432"  # Avoid conflict with local PostgreSQL
      
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://kcmranking:${DB_PASSWORD:-changeme123}@database:5432/kcm_ranking
      CORS_ORIGIN: http://localhost:8080
      API_KEYS: ${API_KEYS:-}
    ports:
      - "3001:3001"
      
  frontend:
    build: .
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3001}
    ports:
      - "8080:80"
```

### Production Setup

`docker-compose.prod.yml`:
```yaml
services:
  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Must be set!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Don't expose port externally in production
    
  backend:
    image: mfreitag1/kcm-ranking-backend:latest
    environment:
      DATABASE_URL: postgresql://kcmranking:${DB_PASSWORD}@database:5432/kcm_ranking
      NODE_ENV: production
      API_KEYS: ${API_KEYS}  # Must be set!
      CORS_ORIGIN: ${CORS_ORIGIN}
      
  frontend:
    image: mfreitag1/kcm-ranking-frontend:latest
    environment:
      VITE_API_URL: ${VITE_API_URL}  # Set at runtime!
```

## Achievements Configuration

Custom achievements in `src/constants/achievements.js`:

```javascript
export const achievements = {
  // Winning achievements
  PERFECTIONIST: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Win a tournament without losing a single match',
    icon: '🏆',
  },
  
  // Streak achievements  
  HOT_STREAK: {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Win 5 matches in a row',
    icon: '🔥',
  },
  
  // Add custom achievements
};
```

## Tips and Best Practices

### Security
- Never commit `.env` files with real passwords/keys
- Use `env.example` as template
- Generate strong, unique API keys for production
- Rotate keys periodically

### Performance
- Keep player aliases list updated to avoid duplicate processing
- Use appropriate TrueSkill tau value (default 0.083 is good)
- Configure database connection pooling for high traffic

### Maintenance
- Regularly backup database
- Monitor disk space (tournament data grows over time)
- Update dependencies periodically (`npm audit`)
- Review logs for errors

## Troubleshooting

### Aliases not working
- Check spelling and capitalization
- Verify file syntax (valid JavaScript)
- Run `npm run migrate:aliases` to sync with database
- Clear browser cache

### TrueSkill ratings seem wrong
- Verify match data is correct
- Check that player aliases are configured
- Ratings stabilize after ~10-15 matches per player

### Environment variables not loaded
- Check `.env` file location (root for frontend, `backend/` for backend)
- Verify no syntax errors in `.env`
- Restart servers after changing environment variables
- In Docker, rebuild with `--build` flag

## Next Steps

- [Setup Guide](./SETUP.md) - Installation and setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [CI/CD Guide](./CI_CD.md) - Automated builds and deployment

