# Render Deployment Guide

This guide will help you deploy the KCM Ranking backend to Render.

## Prerequisites

1. A Render account (sign up at https://render.com - free tier available)
2. A Supabase database (or other PostgreSQL database)
3. Your repository pushed to GitHub

## Step 1: Prepare Your Repository

Make sure your `render.yaml` is committed and pushed to your GitHub repository.

## Step 2: Create Render Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your repository (`kcm-ranking`)
5. Render will detect the `render.yaml` file automatically
6. Click **"Apply"**

## Step 3: Configure Environment Variables

In the Render dashboard, go to your service → **Environment** tab, and add:

### Required Variables:

1. **DATABASE_URL**
   ```
   postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public&sslmode=require&pgbouncer=true&connection_limit=1
   ```
   - Get this from your Supabase dashboard → Settings → Database
   - Use the **Connection Pooling** connection string (not the direct connection)
   - Make sure to URL-encode your password if it contains special characters

2. **API_KEYS**
   ```
   your-secret-api-key-1,your-secret-api-key-2
   ```
   - Generate strong keys: `openssl rand -hex 32`
   - Comma-separated list of API keys for write operations

3. **CORS_ORIGIN**
   ```
   https://your-frontend-domain.com
   ```
   - Your frontend URL (where the React app will be hosted)

4. **ALLOWED_ORIGINS** (optional, defaults to CORS_ORIGIN)
   ```
   https://your-frontend-domain.com,https://another-domain.com
   ```
   - Comma-separated list of allowed origins

### Optional Variables:

- **PORT** - Automatically set by Render (don't override)
- **NODE_ENV** - Set to `production` (already in render.yaml)
- **API_PREFIX** - Set to `/api` (already in render.yaml)

## Step 4: Run Database Migrations

Before your app can run, you need to run Prisma migrations:

1. In Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

Or run migrations locally pointing to your Supabase database:
```bash
cd backend
DATABASE_URL="your-supabase-connection-string" npx prisma migrate deploy
```

## Step 5: Deploy

1. Render will automatically deploy when you push to your main branch (if autoDeploy is enabled)
2. Or manually trigger a deploy from the Render dashboard
3. Check the **Logs** tab to see the deployment progress

## Step 6: Verify Deployment

1. Your backend will be available at: `https://your-service-name.onrender.com`
2. Health check: `https://your-service-name.onrender.com/health`
3. API endpoint: `https://your-service-name.onrender.com/api/tournaments`

## Troubleshooting

### Build Fails

- Check that `prisma generate` runs successfully
- Verify all dependencies are in `package.json`
- Check build logs in Render dashboard

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Make sure you're using the **pooled connection string** from Supabase
- Check Supabase firewall settings (should allow all IPs or Render's IPs)

### Timeout Issues

- Render free tier has timeout limits
- For long-running tournament imports, consider upgrading or using background jobs

### CORS Errors

- Verify `CORS_ORIGIN` and `ALLOWED_ORIGINS` are set correctly
- Check that your frontend URL matches exactly (including https/http)

## Updating Your Deployment

1. Push changes to your GitHub repository
2. Render will automatically detect and deploy (if autoDeploy is enabled)
3. Or manually trigger a deploy from the dashboard

## Free Tier Limitations

- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- Subsequent requests are fast
- 750 hours/month free (enough for 24/7 if you stay under the limit)

## Next Steps

After backend is deployed:
1. Update your frontend `VITE_API_URL` to point to your Render backend
2. Update browser extension settings with the new API URL
3. Test the full flow!

