import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import tournamentsRouter from './routes/tournaments.js';
import playersRouter from './routes/players.js';
import statsRouter from './routes/stats.js';
import aliasesRouter from './routes/aliases.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// CORS configuration - allow frontend and browser extensions
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or browser extensions)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    // Allow chrome-extension:// origins (browser extensions)
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    // Allow listed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For localhost development, allow all origins
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(`${API_PREFIX}/tournaments`, tournamentsRouter);
app.use(`${API_PREFIX}/players`, playersRouter);
app.use(`${API_PREFIX}/stats`, statsRouter);
app.use(`${API_PREFIX}/aliases`, aliasesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KCM Ranking API server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}${API_PREFIX}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

