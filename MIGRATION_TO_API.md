# 🔄 Migration to API-Based Architecture

This document explains the migration from JSON files to a database-backed API.

## 📊 What Changed?

### Before (JSON-based)
- ❌ Tournament data stored as JSON files in repository
- ❌ Data loaded at build time from `dummy_data/` folder
- ❌ No real-time updates
- ❌ Large repository size with binary/JSON files

### After (API-based)
- ✅ PostgreSQL database for tournament data
- ✅ RESTful backend API (Express + Prisma)
- ✅ Frontend fetches data from API at runtime
- ✅ Browser extension posts directly to backend
- ✅ Automatic fallback to JSON files if API unavailable

## 🚀 Migration Steps

### Step 1: Update Backend Schema

The database schema now includes a `rawData` field to store the original JSON:

```bash
cd backend

# Run the new migration
npm run prisma:migrate

# This will create a new migration for the rawData field
```

### Step 2: Re-import Tournament Data

Since we added the `rawData` field, re-import all tournaments:

```bash
cd backend

# Clear existing data (optional, only if you want a fresh start)
# npx prisma migrate reset --force

# Re-import all tournaments with raw data
npm run migrate:data
```

### Step 3: Start Services

**Terminal 1 - Database:**
```bash
docker-compose up -d database
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### Step 4: Verify Everything Works

1. **Check backend health:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check tournaments API:**
   ```bash
   curl http://localhost:3001/api/tournaments
   ```

3. **Open frontend:**
   - Go to http://localhost:5173
   - You should see all tournaments loaded from the API
   - Check browser console for "Loaded X tournaments from API"

## 🔧 Configuration

### Frontend Environment Variables

Create `.env` in the project root (optional, defaults work for development):

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Backend Environment Variables

Already configured in `backend/.env`:

```env
DATABASE_URL="postgresql://kcmranking:changeme123@localhost:5444/kcm_ranking?schema=public"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 📡 API Endpoints

### Tournaments
- `GET /api/tournaments` - Get all tournaments with raw data
- `GET /api/tournaments/:id` - Get specific tournament
- `POST /api/tournaments` - Create new tournament (used by browser extension)
- `DELETE /api/tournaments/:id` - Delete tournament

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:name` - Get specific player

### Stats
- `GET /api/stats/overall` - Get overall statistics

## 🔄 Fallback Behavior

The frontend automatically falls back to loading JSON files if the API is unavailable:

1. First tries to fetch from API (`http://localhost:3001/api/tournaments`)
2. If API fails, falls back to `dummy_data/*.json` files
3. Console will show which method was used

This allows development to continue even if the backend is not running!

## 🐳 Docker Deployment

For production, use Docker Compose:

```bash
# Start all services (database + backend + frontend)
docker-compose up -d

# Import data (first time only)
docker-compose exec backend npm run migrate:data

# View logs
docker-compose logs -f backend

# Access
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

## ✅ Verification Checklist

- [ ] PostgreSQL running (`docker-compose ps database`)
- [ ] Backend running (`curl http://localhost:3001/health`)
- [ ] Tournaments API works (`curl http://localhost:3001/api/tournaments`)
- [ ] Frontend loads data (check browser console)
- [ ] TrueSkill calculations work
- [ ] Player detail pages load
- [ ] Tournament switching works

## 🐛 Troubleshooting

### Frontend shows "Falling back to local JSON files"

**Problem:** Backend API is not accessible

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not, start it
cd backend
npm run dev
```

### Backend shows "Environment variable not found: DATABASE_URL"

**Problem:** `.env` file missing or incorrect

**Solution:**
```bash
cd backend
cp env.example .env
# Edit .env with correct DATABASE_URL
```

### "Cannot connect to database"

**Problem:** PostgreSQL is not running

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d database

# Verify it's running
docker-compose ps database
```

### Frontend shows CORS errors

**Problem:** Backend CORS is misconfigured

**Solution:**
```bash
# Check backend/.env
# Make sure CORS_ORIGIN matches your frontend URL
CORS_ORIGIN=http://localhost:5173
```

## 📝 Next Steps

1. ✅ Frontend migrated to API
2. ⏳ Browser extension update (POST to backend instead of GitHub)
3. ⏳ Production deployment guide
4. ⏳ Monitoring and logging
5. ⏳ API authentication (optional)

## 🎉 Benefits of API Architecture

- **Scalability**: Handle thousands of tournaments
- **Real-time**: Instant updates across all clients
- **Performance**: Database queries much faster than JSON parsing
- **Flexibility**: Easy to add new features and endpoints
- **Separation**: Frontend and backend can be deployed independently
- **Analytics**: Complex queries for insights and statistics

