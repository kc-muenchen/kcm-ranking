# 🚀 Quick Deployment Guide

## ✅ What You Have Now

### Docker Images (Automatically Built)
When you push to `main` branch, GitHub Actions automatically builds and pushes:

1. **Frontend**: `mfreitag1/kcm-ranking-frontend:latest`
2. **Backend**: `mfreitag1/kcm-ranking-backend:latest`

Both images are pushed to:
- Docker Hub: https://hub.docker.com/u/mfreitag1
- GitHub Container Registry (GHCR)

### Services
- ✅ **Frontend** (React + Nginx)
- ✅ **Backend** (Node.js + Express + Prisma)
- ✅ **Database** (PostgreSQL 16)

## 🎯 Deploy to Production (3 Options)

### Option 1: Pre-built Images (Easiest)

**On your server:**

```bash
# 1. Create project directory
mkdir -p /opt/kcm-ranking && cd /opt/kcm-ranking

# 2. Download production compose file
wget https://raw.githubusercontent.com/yourusername/kcm-ranking/main/docker-compose.prod.yml

# 3. Create .env file
cat > .env << EOF
DB_PASSWORD=YOUR_SUPER_SECURE_PASSWORD
CORS_ORIGIN=https://yourdomain.com
EOF

# 4. Start services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run migrate:data
docker-compose -f docker-compose.prod.yml exec backend npm run migrate:aliases
```

**Done!** Services are running:
- Frontend: http://your-server:8080
- Backend: http://your-server:3001

### Option 2: Build from Source

```bash
# 1. Clone repository
git clone https://github.com/yourusername/kcm-ranking.git
cd kcm-ranking

# 2. Create .env file
cat > .env << EOF
DB_PASSWORD=YOUR_SUPER_SECURE_PASSWORD
CORS_ORIGIN=https://yourdomain.com
EOF

# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Run migrations (same as above)
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run migrate:data
docker-compose exec backend npm run migrate:aliases
```

### Option 3: Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed manual setup instructions.

## 🔐 Add SSL/HTTPS (Recommended)

**1. Install Nginx:**
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

**2. Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/kcm-ranking
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

**3. Enable and get SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/kcm-ranking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## 🔄 Update Workflow

### When You Make Changes:

1. **Commit and push to main:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **GitHub Actions automatically:**
   - Builds new Docker images
   - Pushes to Docker Hub
   - Tags with `latest` and git commit SHA

3. **On your server:**
   ```bash
   cd /opt/kcm-ranking
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

**That's it!** Your app is updated.

## 📊 Current CI/CD Pipeline

```
Push to main
    ↓
GitHub Actions
    ↓
Build Frontend Image → Push to Docker Hub (mfreitag1/kcm-ranking-frontend:latest)
    ↓
Build Backend Image → Push to Docker Hub (mfreitag1/kcm-ranking-backend:latest)
    ↓
Ready to pull on your server!
```

## 🎯 Browser Extension

Users need to update extension settings to point to production:
- API URL: `https://api.yourdomain.com` (or `https://yourdomain.com`)

## ✅ Verify Deployment

```bash
# Check services are running
docker-compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:8080

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📝 Database Backups

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec -T database pg_dump -U kcmranking kcm_ranking > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T database psql -U kcmranking kcm_ranking < backup.sql
```

## 🐛 Troubleshooting

### Images not pulling?
- Check Docker Hub: https://hub.docker.com/r/mfreitag1/kcm-ranking-frontend
- Verify GitHub Actions ran: https://github.com/yourusername/kcm-ranking/actions

### Backend can't connect to database?
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs database

# Verify DATABASE_URL in backend
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE_URL
```

### Frontend shows API errors?
- Check CORS_ORIGIN matches your domain
- Verify backend is running: `curl http://localhost:3001/health`

## 🎉 You're Done!

Your complete stack is:
- ✅ Docker images auto-built on git push
- ✅ Production-ready docker-compose
- ✅ Database with migrations
- ✅ SSL-ready Nginx config
- ✅ Browser extension support

**Next:** Configure your domain DNS and SSL, then you're live!

