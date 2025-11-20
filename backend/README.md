# KCM Ranking Backend API

Backend API service for the KCM Table Soccer Rankings application.

## 🏗️ Stack

- **Runtime**: Node.js 20
- **Framework**: Express
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Language**: JavaScript (ES Modules)

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or Docker

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file (copy from `env.example`):

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://kcmranking:password@localhost:5432/kcm_ranking?schema=public"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database

Run Prisma migrations:

```bash
npm run prisma:migrate
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

### 4. Migrate Existing Data

Import existing JSON tournament data:

```bash
npm run migrate:data
```

This will read all JSON files from `../dummy_data` and import them into the database.

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📡 API Endpoints

### Tournaments

- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament by ID
- `POST /api/tournaments` - Create new tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Players

- `GET /api/players` - Get all players with aggregated stats
- `GET /api/players/:name` - Get player by name
- `GET /api/players/:name/history` - Get player match history

### Stats

- `GET /api/stats/overall` - Get overall statistics
- `GET /api/stats/tournament/:id` - Get tournament statistics

### Health Check

- `GET /health` - API health check

## 🐳 Docker Deployment

The backend is included in the multi-container Docker setup. From the project root:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Backend API (port 3001)
- Frontend (port 8080)

## 🔧 Useful Commands

```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Regenerate Prisma Client
npm run prisma:generate

# Import JSON data
npm run migrate:data
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── scripts/         # Utility scripts
│   ├── utils/           # Helper functions
│   └── index.js         # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## 🧪 Testing

```bash
# Test the API
curl http://localhost:3001/health

# Get all tournaments
curl http://localhost:3001/api/tournaments

# Get all players
curl http://localhost:3001/api/players
```

## 📝 Notes

- The database schema is designed to handle complex tournament structures
- TrueSkill calculations will be implemented server-side for consistency
- All timestamps are stored in UTC
- Player names are used as unique identifiers (aliasing handled in application logic)

