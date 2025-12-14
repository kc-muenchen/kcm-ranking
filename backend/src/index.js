import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import tournamentsRouter from './routes/tournaments.js';
import playersRouter from './routes/players.js';
import statsRouter from './routes/stats.js';
import aliasesRouter from './routes/aliases.js';
import bettingRouter from './routes/betting.js';
import { requireApiKey } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration - allow frontend and browser extensions
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, health checks, direct API access)
    // This is safe because write operations require API keys
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    // Allow all chrome-extension origins (browser extensions)
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    // Check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For localhost development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - disabled in development
const apiLimiter = process.env.NODE_ENV === 'development' 
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // 200 requests per 15 minutes (increased for read operations)
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

const writeLimiter = process.env.NODE_ENV === 'development'
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // 50 write operations per 15 minutes (increased)
      message: 'Too many write requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes - apply general rate limiting to all routes
app.use(`${API_PREFIX}/`, apiLimiter);

// Read-only routes (no authentication required, only general rate limiting)
app.use(`${API_PREFIX}/players`, playersRouter);
app.use(`${API_PREFIX}/stats`, statsRouter);
app.use(`${API_PREFIX}/tournaments`, tournamentsRouter);

// Aliases routes - GET requests are read-only, POST/PUT/DELETE require auth
// We'll handle write operations in the route handlers
app.use(`${API_PREFIX}/aliases`, aliasesRouter);

// Betting routes
app.use(`${API_PREFIX}/betting`, bettingRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack }) // Only in development
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KCM Ranking API server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}${API_PREFIX}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

