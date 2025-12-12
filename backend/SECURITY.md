# Backend Security Guide

Complete security guide for production deployment of the KCM Ranking backend API.

## Current Security Status

✅ **Implemented:**
- API key authentication for write operations
- Rate limiting on all endpoints
- CORS configuration
- Helmet security headers
- Input validation
- Request size limits

⚠️ **Recommended for Production:**
- HTTPS/SSL (via reverse proxy)
- Environment-specific CORS
- Request logging and monitoring
- Database connection security
- Regular security audits

## Security Implementation

### 1. API Key Authentication

**Status:** ✅ Implemented in `src/middleware/auth.js`

Write operations (POST, PUT, DELETE) require a valid API key.

**Configuration:**

```env
# backend/.env
API_KEYS=key1,key2,key3
```

**Generate secure API keys:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**Usage:**

```bash
# With header (recommended)
curl -X POST http://localhost:3001/api/tournaments \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tournament"}'

# With query parameter (for browser extension)
curl -X POST "http://localhost:3001/api/tournaments?apiKey=your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tournament"}'
```

**How it works:**
- GET requests (read operations) don't require authentication
- POST, PUT, DELETE requests require valid API key
- Keys are validated against `API_KEYS` environment variable
- Returns 401 Unauthorized if missing or invalid

### 2. Rate Limiting

**Status:** ✅ Implemented with `express-rate-limit`

Protects against API abuse and DDoS attacks.

**Current Limits:**

```javascript
// General API rate limit
windowMs: 15 * 60 * 1000  // 15 minutes
max: 100                   // 100 requests per window

// Write operations (stricter)
windowMs: 15 * 60 * 1000  // 15 minutes
max: 10                    // 10 write requests per window
```

**Customize limits:**

Edit `backend/src/index.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // Adjust as needed
  message: 'Too many requests',
});
```

**Response when rate limited:**
```json
{
  "error": "Too many requests, please try again later."
}
```

### 3. CORS (Cross-Origin Resource Sharing)

**Status:** ✅ Implemented with environment-based configuration

**Configuration:**

```env
# backend/.env

# Primary origin (usually your frontend)
CORS_ORIGIN=https://yourdomain.com

# Additional allowed origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Allowed browser extension IDs (production only)
ALLOWED_EXTENSION_IDS=chrome-ext-id-1,chrome-ext-id-2
```

**Development vs Production:**

Development (allows all extensions):
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Production (strict checking):
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
ALLOWED_EXTENSION_IDS=your-extension-id
```

**How it works:**
- Validates origin of each request
- In development: allows all chrome-extension:// origins
- In production: only allows specific extension IDs
- Supports credentials for authenticated requests

### 4. Security Headers

**Status:** ✅ Implemented with Helmet

Helmet sets various HTTP headers for security:

```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for API
  crossOriginEmbedderPolicy: false,
}));
```

**Headers set by Helmet:**
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)

### 5. Input Validation

**Status:** ✅ Basic validation implemented

**Tournament creation validation:**
```javascript
// Validates tournament data
if (!name || !rawData) {
  return res.status(400).json({ error: 'Missing required fields' });
}
```

**Enhance with express-validator:**

```bash
npm install express-validator
```

```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/tournaments',
  requireApiKey,
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('date').isISO8601().optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### 6. Request Logging

**Status:** ⚠️ Recommended addition

**Install morgan:**
```bash
npm install morgan
```

**Add to `backend/src/index.js`:**
```javascript
import morgan from 'morgan';

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Production logging (to file or service)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}
```

**For structured logging, use Winston:**
```bash
npm install winston
```

### 7. Database Security

**Current best practices:**

✅ Connection string in environment variable
✅ Prisma connection pooling
✅ Parameterized queries (SQL injection protection)

**Production recommendations:**

```env
# Use connection pooling in production
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=30"

# For cloud databases (like Supabase)
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require&pgbouncer=true"
```

**Database user permissions:**
```sql
-- Create limited user for application
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Don't grant DROP, CREATE, or ALTER permissions
```

### 8. HTTPS/SSL

**Status:** ⚠️ Required for production

API itself doesn't handle SSL - use a reverse proxy.

**Option 1: Nginx Reverse Proxy**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Get free SSL certificate:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

**Option 2: Cloudflare**
- Point DNS to Cloudflare
- Enable SSL/TLS (Full mode)
- Automatic certificate management

### 9. Error Handling

**Status:** ✅ Implemented with environment awareness

**Current implementation:**
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});
```

**Best practices:**
- Log errors securely (don't expose to client)
- Return generic messages in production
- Include request ID for tracking
- Monitor error rates

## Production Checklist

Before deploying to production:

### Required

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong API keys (32+ chars, random)
- [ ] Configure CORS with specific origins
- [ ] Set up HTTPS/SSL
- [ ] Change default database password
- [ ] Review and test rate limits
- [ ] Set up database backups

### Recommended

- [ ] Add request logging (morgan/winston)
- [ ] Set up monitoring (Sentry, DataDog, etc)
- [ ] Configure firewall rules
- [ ] Enable automatic security updates
- [ ] Set up alerting for errors/downtime
- [ ] Document security procedures
- [ ] Create incident response plan

### Optional

- [ ] IP whitelisting for admin operations
- [ ] Two-factor authentication for admin
- [ ] Database encryption at rest
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] DDoS protection (Cloudflare, etc)

## Environment Variables Reference

Complete `.env` file for production:

```env
#
# Database
#
DATABASE_URL="postgresql://user:password@host:5432/kcm_ranking?schema=public&sslmode=require"

#
# Server
#
PORT=3001
NODE_ENV=production
API_PREFIX=/api

#
# Security
#
API_KEYS=key1-32chars-random,key2-32chars-random
ALLOWED_EXTENSION_IDS=chrome-ext-id-1
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

#
# Optional: Advanced
#
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
LOG_LEVEL=info
```

## Security Testing

### Test Authentication

```bash
# Should fail (no API key)
curl -X POST http://localhost:3001/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Should succeed
curl -X POST http://localhost:3001/api/tournaments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"name":"Test"}'
```

### Test Rate Limiting

```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl http://localhost:3001/api/tournaments
done

# 101st request should be rate limited
```

### Test CORS

```bash
# From unauthorized origin
curl -X GET http://localhost:3001/api/tournaments \
  -H "Origin: https://unauthorized-site.com" \
  -v

# Should see CORS error in response
```

## Monitoring & Logging

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### Recommended Monitoring

**Metrics to track:**
- Response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Request volume
- Database query times
- Memory/CPU usage

**Tools:**
- **Sentry** - Error tracking
- **DataDog** - Full stack monitoring
- **Uptime Robot** - Uptime monitoring
- **Prometheus + Grafana** - Self-hosted metrics

## Incident Response

### If API is compromised:

1. **Immediately:**
   - Rotate all API keys
   - Review access logs
   - Take affected service offline if needed

2. **Investigate:**
   - Check logs for suspicious activity
   - Identify entry point
   - Assess damage

3. **Remediate:**
   - Patch vulnerability
   - Update dependencies
   - Restore from clean backup if needed

4. **Prevent:**
   - Update security procedures
   - Add monitoring for similar attacks
   - Document incident for future reference

## Regular Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check for failed API requests
- [ ] Monitor rate limit hits

### Monthly
- [ ] Update dependencies (`npm audit`)
- [ ] Review API key usage
- [ ] Check SSL certificate expiry
- [ ] Test backup restore procedure

### Quarterly
- [ ] Security audit
- [ ] Review and rotate API keys
- [ ] Update documentation
- [ ] Test disaster recovery plan

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

## Getting Help

- Review logs: `docker-compose logs backend`
- Check health: `curl http://localhost:3001/health`
- Test locally before deploying
- Consult [Setup Guide](../docs/SETUP.md) for configuration help
