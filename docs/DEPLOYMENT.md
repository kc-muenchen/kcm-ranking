# Deployment Guide

Complete guide for deploying KCM Ranking to production.

## Deployment Options

1. **Docker (Self-Hosted)** - Easiest, full control
2. **Docker with Pre-built Images** - Pull from Docker Hub
3. **Cloud Platform (Render, Railway, etc)** - Managed hosting
4. **Manual Deployment** - VPS with manual setup

## Option 1: Docker Self-Hosted (Recommended)

### Prerequisites
- A server (VPS) with Docker installed
- Domain name (optional but recommended)

### Quick Deployment

```bash
# 1. Clone repository on your server
git clone https://github.com/yourusername/kcm-ranking.git
cd kcm-ranking

# 2. Create .env file
cat > .env << EOF
DB_PASSWORD=YOUR_SUPER_SECURE_PASSWORD
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
API_KEYS=your-secret-api-key-here
VITE_API_URL=https://api.yourdomain.com
EOF

# 3. Build and start services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run migrate:data
docker-compose exec backend npm run migrate:aliases

# 5. Check status
docker-compose ps
docker-compose logs -f
```

**Access:**
- Frontend: http://your-server-ip:8080
- Backend: http://your-server-ip:3001

### Add SSL/HTTPS with Nginx

**1. Install Nginx and Certbot:**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

**2. Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/kcm-ranking
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**3. Enable site and get SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/kcm-ranking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificates (free from Let's Encrypt)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**4. Update environment variables:**
```bash
# Edit .env file to use HTTPS URLs
nano .env
```

```env
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

**5. Rebuild frontend with new API URL:**
```bash
docker-compose up -d --build frontend
```

## Option 2: Pre-built Docker Images

Pull pre-built images from Docker Hub (no build required on server).

### Production Compose File

Create `docker-compose.prod.yml` or use the one in the repo:

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: kcm-ranking-db
    environment:
      POSTGRES_DB: kcm_ranking
      POSTGRES_USER: kcmranking
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    image: mfreitag1/kcm-ranking-backend:latest
    container_name: kcm-ranking-backend
    environment:
      DATABASE_URL: postgresql://kcmranking:${DB_PASSWORD}@database:5432/kcm_ranking?schema=public
      PORT: 3001
      NODE_ENV: production
      API_PREFIX: /api
      API_KEYS: ${API_KEYS}
      CORS_ORIGIN: ${CORS_ORIGIN}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    ports:
      - "3001:3001"
    depends_on:
      - database
    restart: unless-stopped

  frontend:
    image: mfreitag1/kcm-ranking-frontend:latest
    container_name: kcm-ranking-frontend
    environment:
      VITE_API_URL: ${VITE_API_URL}
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Pre-built Images

```bash
# 1. Create .env file (see above)

# 2. Pull and start
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run migrate:data
```

## Option 3: Cloud Platform (Render, Railway, Fly.io)

### Render Deployment

Render offers a free tier for PostgreSQL and web services.

**Prerequisites:**
1. Render account (https://render.com)
2. Repository pushed to GitHub

**Steps:**

1. **Create PostgreSQL Database:**
   - Go to Render Dashboard
   - New → PostgreSQL
   - Choose free tier
   - Copy the **Internal Database URL**

2. **Create Backend Web Service:**
   - New → Web Service
   - Connect your GitHub repo
   - Configure:
     - Build Command: `cd backend && npm install && npx prisma generate`
     - Start Command: `cd backend && npm start`
     - Environment Variables:
       ```
       DATABASE_URL=your-internal-postgres-url
       PORT=3001
       NODE_ENV=production
       API_PREFIX=/api
       API_KEYS=your-secret-key
       CORS_ORIGIN=https://your-frontend-url.onrender.com
       ```

3. **Create Frontend Web Service:**
   - New → Static Site
   - Connect your GitHub repo
   - Configure:
     - Build Command: `npm install && npm run build`
     - Publish Directory: `dist`
     - Environment Variables:
       ```
       VITE_API_URL=https://your-backend-url.onrender.com
       ```

4. **Run Database Migrations:**
   - Go to backend service → Shell tab
   - Run: `cd backend && npx prisma migrate deploy`

**Note:** Free tier services spin down after inactivity. First request takes ~30 seconds.

### Railway Deployment

Similar to Render but with different UI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy backend
railway up --service backend

# Deploy frontend
railway up --service frontend
```

## Option 4: Manual Deployment (VPS)

For Ubuntu/Debian VPS:

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 3. Setup database
sudo -u postgres psql
CREATE USER kcmranking WITH PASSWORD 'secure_password';
CREATE DATABASE kcm_ranking OWNER kcmranking;
\q

# 4. Clone and setup backend
git clone https://github.com/yourusername/kcm-ranking.git
cd kcm-ranking/backend
npm install
cp env.example .env
# Edit .env with your settings
npx prisma migrate deploy
npm run migrate:data

# 5. Install PM2 (process manager)
sudo npm install -g pm2
pm2 start npm --name "kcm-backend" -- start
pm2 startup
pm2 save

# 6. Build and serve frontend
cd ..
npm install
npm run build

# 7. Setup nginx (see SSL section above)
sudo cp dist/* /var/www/html/
```

## Update Workflow

When you make changes and want to deploy updates:

### With CI/CD (GitHub Actions)

```bash
# 1. Commit and push changes
git add .
git commit -m "Your changes"
git push origin main

# 2. GitHub Actions automatically builds new images

# 3. On your server, pull and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Update

```bash
# On your server
cd kcm-ranking
git pull
docker-compose up -d --build
```

## Security Checklist for Production

- [ ] Change default database password
- [ ] Set strong API keys
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only allow 80, 443, 22)
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Review backend/SECURITY.md

## Database Backups

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

docker-compose exec -T database pg_dump -U kcmranking kcm_ranking > \
  $BACKUP_DIR/kcm_ranking_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

**Setup cron job:**
```bash
chmod +x backup.sh
crontab -e

# Add: Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Monitoring

### Basic Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Check services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Setup Monitoring (Optional)

Use services like:
- **Uptime Kuma** (self-hosted)
- **UptimeRobot** (free tier available)
- **Sentry** (error tracking)
- **DataDog** (full monitoring)

## Troubleshooting Production Issues

### Services not starting
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Database connection issues
```bash
# Test database connection
docker-compose exec database psql -U kcmranking -d kcm_ranking

# Check database logs
docker-compose logs database
```

### Frontend shows API errors
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS settings
docker-compose exec backend env | grep CORS

# Check frontend config
docker-compose exec frontend cat /usr/share/nginx/html/config.js
```

### SSL certificate renewal fails
```bash
# Manually renew
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_tournaments_date ON tournaments(date);
```

### Frontend Caching
Nginx already configured with proper cache headers in `nginx.conf`.

### Database Connection Pooling
Already configured in Prisma (see `backend/prisma/schema.prisma`).

## Cost Estimates

### Self-Hosted VPS
- **Basic**: $5-10/month (DigitalOcean, Linode, Hetzner)
- **Domain**: $10-15/year
- **Total**: ~$70-130/year

### Cloud Platforms
- **Render Free Tier**: $0 (with limitations)
- **Render Paid**: $7/month per service (~$21/month total)
- **Railway**: Similar pricing

### Recommended Setup
- **Development/Testing**: Render free tier
- **Small Production**: $5 VPS + domain
- **Larger Scale**: Cloud platform or better VPS

## Scheduled Tournament Imports

Tournaments can be pulled from the Tournament.app API automatically instead of
being exported by hand. See [Tournament data format](./TOURNAMENT_DATA_FORMAT.md)
for what the importer does.

### Prerequisites

1. `TIO_API_TOKEN` in the server's `.env` (generate it in Kickertool under
   profile → Settings → API). It is passed through to the backend container by
   both compose files.
2. A backend image that contains the importer:
   ```bash
   docker-compose -f docker-compose.prod.yml pull backend
   docker-compose -f docker-compose.prod.yml up -d backend
   ```

### Service names differ per deployment

The examples below use the names from this repo's compose files. A deployment
may rename them (the KCM server uses `stats-backend`, `stats-frontend`,
`stats-database`), so check first:

```bash
docker compose ps --services      # service names, for `docker compose exec`
docker ps --format '{{.Names}}'   # container names, for `docker exec`
```

Note the two are not interchangeable: `docker compose exec` takes the *service*
name, `docker exec` takes the *container* name.

Run everything below through compose:

```bash
cd /path/to/compose-dir
docker compose exec stats-backend node src/scripts/import-from-api.js --list
```

Commands run in the image's working directory (`/app`), so the script path is
relative to it. Outside that directory, point compose at the file with
`docker compose -f /path/to/docker-compose.yml exec ...`, which is what the cron
entry below does.

### Cron entry

The backend container is long-running, so the job just execs into it. As root
(or the user owning the deployment), `crontab -e`:

```cron
# Import finished Monster-DYP tournaments every Thursday at 03:00
# (club plays Wednesday evenings; % must be escaped in crontab)
0 3 * * 4 /usr/bin/flock -n /tmp/kcm-import.lock \
  docker compose -f /opt/kcm-ranking/docker-compose.yml exec -T stats-backend \
  node src/scripts/import-from-api.js --all --state finished --limit 5 \
  --mode monster_dyp --exclude "SOS Kinder" \
  >> /var/log/kcm-import.log 2>&1
```

Substitute the compose file path and service name for your deployment. `-T` is
required because cron has no TTY, and the absolute `-f` path means the job does
not depend on a working directory.

What the flags do, and why they matter unattended:

- `--state finished` — never import a tournament that is still running. Its
  matches are mid-flight, so the stats would be partial and the cross-check
  would fail anyway.
- `--limit 5` — the API lists newest first, so this looks at the last five
  events rather than re-importing the whole year every week. Imports upsert on
  the tournament id, so re-running is safe and picks up late score corrections.
- `--mode` / `--exclude` — keep singles, BYP and one-off charity events out of
  the ranking.
- `flock -n` — skip the run rather than stack up if a previous one is still
  going.

The script exits non-zero if any tournament was skipped or failed, so cron will
mail the output (or your monitoring can watch the log). A tournament is skipped
when its derived stats disagree with the API's own numbers — usually meaning the
Kickertool scoring settings changed and `SCORING` in
`backend/src/utils/tournament-io-mapper.js` needs updating. It is never silently
imported with wrong points.

Check what a run would do without writing anything:

```bash
docker compose exec stats-backend \
  node src/scripts/import-from-api.js --all --state finished --limit 5 \
  --mode monster_dyp --exclude "SOS Kinder" --dry-run
```

Two things to confirm the first time, both true only once the image containing
the importer has been pulled:

```bash
docker compose exec stats-backend printenv TIO_API_TOKEN   # token wired through?
docker compose exec stats-backend ls src/scripts            # importer in this image?
```

### Alternative: webhooks

The API can push instead of being polled — `TournamentAdded`, `MatchUpdated` and
`StandingsUpdated` events to an endpoint of ours (`POST /v1/public/webhooks`).
That would make the ranking update within seconds of a result being entered,
but needs a public endpoint and shared-secret handling, so cron is the simpler
starting point.

## Next Steps

- Configure [CI/CD Pipeline](./CI_CD.md) for automated deployments
- Set up [monitoring and alerts](./MONITORING.md)
- Configure [player aliases and seasons](./CONFIGURATION.md)
- Update [browser extension](../browser-extension/README.md) with production URL

