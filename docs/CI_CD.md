# CI/CD Setup Guide

Automated Docker image building and deployment using GitHub Actions.

## Overview

The GitHub Actions workflow automatically:
- ✅ Builds Docker images on every push to `main`
- ✅ Pushes to Docker Hub and GitHub Container Registry
- ✅ Creates multi-platform images (amd64, arm64)
- ✅ Tags images appropriately (latest, version tags, commit SHA)
- ✅ Caches layers for faster builds
- ✅ Separate images for frontend and backend

## Prerequisites

1. GitHub account (you already have this!)
2. Docker Hub account

## Step-by-Step Setup

### 1. Create Docker Hub Account

If you don't have one:
1. Go to https://hub.docker.com
2. Sign up for free account
3. Remember your username

### 2. Generate Docker Hub Access Token

1. Log in to Docker Hub
2. Click username (top right) → **Account Settings**
3. Go to **Security** tab
4. Click **New Access Token**
5. Description: `GitHub Actions - kcm-ranking`
6. Permissions: **Read, Write, Delete**
7. Click **Generate**
8. **Copy token immediately** (won't be shown again!)

### 3. Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these secrets:

**Secret 1: DOCKERHUB_USERNAME**
- Name: `DOCKERHUB_USERNAME`
- Value: Your Docker Hub username
- Click **Add secret**

**Secret 2: DOCKERHUB_TOKEN**
- Name: `DOCKERHUB_TOKEN`
- Value: The access token you generated
- Click **Add secret**

### 4. Verify Workflow

Trigger a build:

```bash
# Make a change
git add .
git commit -m "Trigger CI/CD"
git push
```

### 5. Monitor Build

1. Go to repository → **Actions** tab
2. See "Build and Push Docker Images" running
3. Click to view details
4. Wait 5-10 minutes for completion

## Workflow Details

### What Gets Built

Two separate images:

**Frontend:**
- `mfreitag1/kcm-ranking-frontend:latest`
- React + Vite build + Nginx

**Backend:**
- `mfreitag1/kcm-ranking-backend:latest`
- Node.js + Express + Prisma

### Image Registries

Images pushed to:
- **Docker Hub**: `https://hub.docker.com/u/mfreitag1`
- **GHCR**: `ghcr.io/mgaesslein/kcm-ranking-*`

### Image Tags

Automatically created tags:

**For main branch:**
- `latest` - Latest main branch build
- `main` - Same as latest
- `main-<commit-sha>` - Specific commit

**For version tags:**
- `v1.0.0` - Exact version
- `v1.0` - Minor version
- `v1` - Major version

## Creating Releases

### Version Tag Release

```bash
# Tag a release
git tag v1.0.0

# Push tag
git push origin v1.0.0
```

This creates images with all version tags plus `latest`.

### Pre-release / Beta

```bash
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

Creates: `v1.0.0-beta.1` tag (not `latest`).

## Using CI/CD Images

### Pull Pre-built Images

```bash
# Frontend
docker pull mfreitag1/kcm-ranking-frontend:latest

# Backend
docker pull mfreitag1/kcm-ranking-backend:latest

# Specific version
docker pull mfreitag1/kcm-ranking-frontend:v1.0.0
```

### Deploy with Docker Compose

```yaml
version: '3.8'
services:
  backend:
    image: mfreitag1/kcm-ranking-backend:latest
    # ... config ...
    
  frontend:
    image: mfreitag1/kcm-ranking-frontend:latest
    # ... config ...
```

Then:
```bash
docker-compose pull
docker-compose up -d
```

## Update Workflow

### When You Make Changes

1. **Develop locally:**
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

2. **Push to trigger build:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions automatically:**
   - Runs tests (if configured)
   - Builds Docker images
   - Pushes to registries
   - Tags appropriately

4. **Deploy updates:**
   ```bash
   # On your server
   cd /opt/kcm-ranking
   docker-compose pull
   docker-compose up -d
   ```

## Workflow Configuration

The workflow file is at `.github/workflows/docker-build-push.yml`.

### Key Features

**Multi-platform builds:**
```yaml
platforms: linux/amd64,linux/arm64
```

**Layer caching:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

**Build arguments:**
```yaml
build-args: |
  NODE_ENV=production
  VITE_API_URL=${{ secrets.VITE_API_URL }}
```

### Customizing the Workflow

Edit `.github/workflows/docker-build-push.yml`:

**Change trigger events:**
```yaml
on:
  push:
    branches: [main, develop]  # Add develop branch
  pull_request:
    branches: [main]
```

**Add build steps:**
```yaml
- name: Run tests
  run: npm test
  
- name: Lint code
  run: npm run lint
```

**Change image names:**
```yaml
tags: |
  ${{ secrets.DOCKERHUB_USERNAME }}/my-app:latest
```

## Troubleshooting

### Workflow Fails with Authentication Error

**Problem:** Docker Hub authentication failed

**Solutions:**
- Verify secrets are set correctly
- Check token has Read, Write, Delete permissions
- Try regenerating Docker Hub token
- Ensure token hasn't expired

### Image Not Found on Docker Hub

**Problem:** Can't pull image

**Solutions:**
- Check Actions tab - did build succeed?
- Verify pushed to `main` branch
- Check image name matches Docker Hub username
- Wait a few minutes (publishing takes time)

### Workflow Not Running

**Problem:** No workflow triggered on push

**Solutions:**
- Verify workflow file in `.github/workflows/`
- Check YAML syntax is valid
- Ensure secrets are set
- Check branch name matches trigger

### Build Takes Too Long

**Expected behavior:**
- First build: 10-15 minutes (no cache)
- Subsequent builds: 5-10 minutes (with cache)
- Multi-platform adds extra time

**Optimizations:**
- Use layer caching (already configured)
- Reduce number of platforms if needed
- Optimize Dockerfile (fewer layers)

### Out of Disk Space

**Problem:** Runner out of space

**Solution:**
```yaml
- name: Free disk space
  run: |
    docker system prune -af
    df -h
```

## Best Practices

### Security

- ✅ Never commit secrets to repo
- ✅ Use GitHub Secrets for credentials
- ✅ Rotate tokens periodically
- ✅ Use least-privilege access
- ✅ Review workflow changes carefully

### Versioning

- ✅ Use semantic versioning (v1.0.0)
- ✅ Tag releases properly
- ✅ Maintain changelog
- ✅ Test before tagging

### Performance

- ✅ Use build caching
- ✅ Optimize Dockerfile layers
- ✅ Only build on relevant changes
- ✅ Use `.dockerignore`

### Reliability

- ✅ Pin action versions (@v2)
- ✅ Add health checks to workflows
- ✅ Test builds locally first
- ✅ Monitor build status

## Advanced Configuration

### Build Only on File Changes

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'package.json'
```

### Matrix Builds

```yaml
strategy:
  matrix:
    include:
      - service: frontend
        context: .
        dockerfile: Dockerfile
      - service: backend
        context: ./backend
        dockerfile: Dockerfile
```

### Slack Notifications

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy After Build

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: |
    # SSH into server and update
    ssh user@server 'cd /opt/app && docker-compose pull && docker-compose up -d'
```

## Cost Considerations

### GitHub Actions Minutes

- **Free tier:** 2,000 minutes/month
- **Typical build:** 10 minutes
- **Estimate:** ~200 builds/month free

### Docker Hub

- **Free tier:** Unlimited public repositories
- **Rate limits:** 200 pulls/6 hours (anonymous), 5,000/day (authenticated)

### Optimization Tips

- Use caching (reduces build time by 50-70%)
- Build only on main branch pushes
- Skip builds for documentation changes

## Monitoring

### Build Status Badge

Add to README.md:

```markdown
![Build Status](https://github.com/username/repo/workflows/Build%20and%20Push/badge.svg)
```

### Notifications

Configure GitHub notifications:
- Settings → Notifications → Actions
- Enable email/Slack for build failures

## Next Steps

- [Deployment Guide](./DEPLOYMENT.md) - Deploy built images
- [Configuration Guide](./CONFIGURATION.md) - Configure application
- [Setup Guide](./SETUP.md) - Local development setup

## Helpful Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Hub](https://hub.docker.com)
- [GitHub Container Registry](https://docs.github.com/en/packages)

