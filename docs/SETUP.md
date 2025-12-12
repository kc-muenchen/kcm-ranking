# Setup Guide

Complete guide for setting up the KCM Ranking application locally and in production.

## Quick Start (Docker - Recommended)

The fastest way to get started is using Docker Compose:

```bash
# 1. Start all services (database, backend, frontend)
docker-compose up -d

# 2. Import existing tournament data
docker-compose exec backend npm run migrate:data

# 3. Import player aliases
docker-compose exec backend npm run migrate:aliases

# 4. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001
# Health check: http://localhost:3001/health
```

## Architecture Overview

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

## Prerequisites

### For Docker Setup
- Docker & Docker Compose
- That's it!

### For Local Development
- Node.js v20+
- PostgreSQL 16
- npm or yarn

## Local Development Setup

### Option 1: Using Docker for Database Only

```bash
# 1. Start PostgreSQL with Docker
docker-compose up -d database

# 2. Setup backend
cd backend
npm install
cp env.example .env
npm run prisma:migrate
npm run migrate:data
npm run migrate:aliases
npm run dev

# 3. Setup frontend (new terminal)
cd ..
npm install
npm run dev

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3001
```

### Option 2: Full Local Setup (No Docker)

**1. Install PostgreSQL:**

macOS (Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

Linux (Ubuntu):
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

**2. Create Database:**

```bash
psql postgres
```

```sql
CREATE USER kcmranking WITH PASSWORD 'changeme123';
CREATE DATABASE kcm_ranking OWNER kcmranking;
\q
```

**3. Setup Backend:**

```bash
cd backend
npm install
cp env.example .env

# Edit .env and update DATABASE_URL if needed:
# DATABASE_URL="postgresql://kcmranking:changeme123@localhost:5432/kcm_ranking?schema=public"

# Run migrations
npm run prisma:migrate
npm run prisma:generate

# Import data
npm run migrate:data
npm run migrate:aliases

# Start server
npm run dev
```

**4. Setup Frontend:**

```bash
cd ..
npm install
npm run dev
```

## Environment Configuration

### Frontend Environment Variables

Create `.env` in project root (optional, defaults work for local dev):

```env
# Backend API URL (without /api suffix)
VITE_API_URL=http://localhost:3001
```

**Important:** Do NOT include `/api` in the URL. It's added automatically.

### Backend Environment Variables

Backend uses `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://kcmranking:changeme123@localhost:5432/kcm_ranking?schema=public"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# API
API_PREFIX=/api

# Security (for production)
API_KEYS=your-secret-key-1,your-secret-key-2
```

## API Endpoints

### Tournaments
```bash
GET    /api/tournaments           # List all tournaments
GET    /api/tournaments/:id       # Get specific tournament
POST   /api/tournaments           # Create tournament (requires API key)
DELETE /api/tournaments/:id       # Delete tournament (requires API key)
```

### Players
```bash
GET /api/players                  # List all players
GET /api/players/:name            # Get player details
GET /api/players/:name/history    # Get player match history
```

### Aliases
```bash
GET    /api/aliases               # List all aliases
POST   /api/aliases               # Create/update alias (requires API key)
DELETE /api/aliases/:id           # Delete alias (requires API key)
```

### Stats
```bash
GET /api/stats/overall            # Overall statistics
GET /api/stats/tournament/:id     # Tournament-specific stats
```

## Database Management

### Prisma Studio (Database GUI)

```bash
cd backend
npm run prisma:studio
```

Opens at http://localhost:5555

### Database Migrations

```bash
cd backend

# Create new migration
npm run prisma:migrate

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Backup & Restore

```bash
# Backup
docker-compose exec database pg_dump -U kcmranking kcm_ranking > backup.sql

# Restore
docker-compose exec -T database psql -U kcmranking kcm_ranking < backup.sql
```

## Data Migration from JSON Files

If you're migrating from the old JSON-based system:

```bash
# All JSON files from dummy_data/ will be imported
cd backend
npm run migrate:data

# This imports:
# - Tournament metadata
# - Player standings
# - Match data
# - Raw JSON (for elimination brackets)
```

## Verification Checklist

After setup, verify everything works:

- [ ] PostgreSQL running: `docker-compose ps database`
- [ ] Backend health: `curl http://localhost:3001/health`
- [ ] Tournaments API: `curl http://localhost:3001/api/tournaments`
- [ ] Frontend loads: Open http://localhost:5173 or http://localhost:8080
- [ ] Data appears: Check that tournaments show in the UI
- [ ] Player pages work: Click on a player name
- [ ] Browser console: No errors

## Troubleshooting

### Frontend shows "Falling back to local JSON files"

Backend API is not accessible.

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running
cd backend
npm run dev
```

### "Environment variable not found: DATABASE_URL"

`.env` file missing or incorrect.

**Solution:**
```bash
cd backend
cp env.example .env
# Edit .env with correct values
```

### "Cannot connect to database"

PostgreSQL not running.

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d database

# Check it's running
docker-compose ps database
```

### Port already in use

Another process is using port 3001 or 5173.

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in .env
```

### CORS errors in browser

Backend CORS misconfigured.

**Solution:**
```bash
# Check backend/.env
CORS_ORIGIN=http://localhost:5173
```

### Frontend API calls go to wrong URL

Check runtime configuration.

**Solution:**
```bash
# Set VITE_API_URL environment variable
# For Docker:
VITE_API_URL=http://localhost:3001 docker-compose up --build frontend

# For local dev:
echo "VITE_API_URL=http://localhost:3001" > .env
npm run dev
```

## Next Steps

- [Configuration Guide](./CONFIGURATION.md) - Configure player aliases, seasons, etc.
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [CI/CD Setup](./CI_CD.md) - Set up automated builds
- [Browser Extension](../browser-extension/README.md) - Install the browser extension

## Useful Commands

```bash
# Docker Compose
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend sh    # Shell into backend
docker-compose restart backend    # Restart backend

# Backend (in backend/ directory)
npm run dev                       # Dev server with auto-reload
npm run prisma:studio             # Database GUI
npm run migrate:data              # Import JSON data
npm run migrate:aliases           # Import aliases

# Frontend (in root directory)
npm run dev                       # Dev server
npm run build                     # Build for production
npm run preview                   # Preview production build
```

