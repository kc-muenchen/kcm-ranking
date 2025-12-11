# Backend Dockerfile for KCM Ranking API

FROM node:20-alpine AS base

WORKDIR /app

# Install OpenSSL and other required dependencies for Prisma
RUN apk add --no-cache openssl1.1-compat libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \  
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start server
CMD ["npm", "start"]

