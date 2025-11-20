# 🚀 Backend API & Database Setup Guide

This guide will help you set up and run the KCM Ranking backend API with PostgreSQL database.

## 📋 What Changed?

We've migrated from storing tournament data in JSON files to a **full backend API with PostgreSQL database**:

**Before:**
- ✗ JSON files in repo
- ✗ Data loaded at build time
- ✗ No real-time updates
- ✗ Limited query capabilities

**After:**
- ✅ PostgreSQL database
- ✅ RESTful API
- ✅ Real-time data updates
- ✅ Complex queries & aggregations
- ✅ Scalable architecture

## 🏗️ Architecture

```
┌─────────────────┐
│  Browser Ext    │──┐
└─────────────────┘  │
                     │  POST /api/tournaments
┌─────────────────┐  │
│   Frontend      │  │
│   (React)       │◄─┼─► ┌──────────────┐
│  Port 5173/8080 │  │   │  Backend API │
└─────────────────┘  │   │  (Express)   │     ┌────────────┐
                     └──►│  Port 3001   │◄───►│ PostgreSQL │
                         └──────────────┘     │  Port 5432 │
                                              └────────────┘
```

## 🚀 Quick Start (Docker - Recommended)

### 1. Install Docker

Make sure you have Docker and Docker Compose installed.

### 2. Start All Services

From the project root:

```bash
# Start database, backend, and frontend
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Import Existing Data

```bash
# Run data migration (imports all JSON files to database)
docker-compose exec backend npm run migrate:data
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🛠️ Local Development Setup

If you want to develop without Docker:

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu):**
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create user and database
CREATE USER kcmranking WITH PASSWORD 'changeme123';
CREATE DATABASE kcm_ranking OWNER kcmranking;
\q
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://kcmranking:changeme123@localhost:5432/kcm_ranking?schema=public"

# Run migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Import existing data
npm run migrate:data

# Start dev server
npm run dev
```

Backend will run at http://localhost:3001

### 4. Setup Frontend

In a new terminal:

```bash
# From project root
npm install
npm run dev
```

Frontend will run at http://localhost:5173

## 📡 API Endpoints

### Tournaments
```bash
# Get all tournaments
GET /api/tournaments

# Get specific tournament
GET /api/tournaments/:id

# Create tournament (from browser extension)
POST /api/tournaments

# Delete tournament
DELETE /api/tournaments/:id
```

### Players
```bash
# Get all players with stats
GET /api/players

# Get specific player
GET /api/players/:name

# Get player match history
GET /api/players/:name/history
```

### Statistics
```bash
# Overall stats
GET /api/stats/overall

# Tournament stats
GET /api/stats/tournament/:id
```

## 🔄 Updating the Browser Extension

The browser extension will need to POST to the backend API instead of GitHub:

**Before:**
```javascript
// Posted to GitHub API
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
  { method: 'PUT', ... }
);
```

**After:**
```javascript
// POST to backend API
const response = await fetch(
  'http://localhost:3001/api/tournaments',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournamentData)
  }
);
```

## 🗄️ Database Schema

The database has the following main tables:

- **tournaments** - Tournament metadata
- **players** - Player information
- **matches** - All matches (qualifying + elimination)
- **teams** - Teams in each match
- **team_players** - Players in teams (many-to-many)
- **standings** - Tournament standings (qualifying/elimination)

## 🔧 Useful Commands

```bash
# Docker Commands
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs backend       # View backend logs
docker-compose exec backend sh    # Shell into backend container
docker-compose exec database psql -U kcmranking  # Connect to DB

# Backend Commands (in backend/ directory)
npm run dev                       # Development mode with auto-reload
npm run prisma:studio             # Open Prisma Studio (DB GUI)
npm run prisma:migrate            # Create new migration
npm run migrate:data              # Import JSON data

# Frontend Commands (in root directory)
npm run dev                       # Development mode
npm run build                     # Build for production
```

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:3001/health

# Get all tournaments
curl http://localhost:3001/api/tournaments

# Get all players
curl http://localhost:3001/api/players

# Get specific player
curl http://localhost:3001/api/players/David%20Brügger
```

## 📊 Database Management

### Prisma Studio (GUI)

```bash
cd backend
npm run prisma:studio
```

Opens a web UI at http://localhost:5555 to browse and edit data.

### Backup Database

```bash
# Backup
docker-compose exec database pg_dump -U kcmranking kcm_ranking > backup.sql

# Restore
docker-compose exec -T database psql -U kcmranking kcm_ranking < backup.sql
```

## 🔐 Security Notes

**For Production:**

1. Change database password in docker-compose.yml
2. Add authentication to API endpoints
3. Use environment variables for secrets
4. Enable HTTPS
5. Configure proper CORS settings
6. Add rate limiting

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps database

# Check logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Then re-import
npm run migrate:data
```

## 📝 Next Steps

1. ✅ Backend API created
2. ✅ Database schema designed
3. ✅ Data migration script ready
4. ⏳ Update frontend to use API
5. ⏳ Update browser extension
6. ⏳ Deploy to production

## 🎉 Benefits

- **Scalability**: Handles thousands of tournaments easily
- **Performance**: Fast queries with indexed database
- **Real-time**: Instant updates across all clients
- **Flexibility**: Easy to add new features
- **Reliability**: Database transactions ensure data consistency
- **Analytics**: Complex queries for insights and statistics

