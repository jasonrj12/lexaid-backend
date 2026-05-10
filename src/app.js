require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app = express();

// ── Security middleware ───────────────────────────────────────
app.use(helmet());

// Support multiple origins: CLIENT_URL can be comma-separated
// e.g. "http://localhost:5173,https://lexaidlk.netlify.app"
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));  // trim spaces and trailing slashes

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl, mobile apps)
    if (!origin) return callback(null, true);

    const normalised = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalised)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    // Return null (not an Error) so Express doesn't crash — browser will see CORS failure
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,  // some older browsers choke on 204
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options('/{*path}', cors(corsOptions));


// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Static uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const caseRoutes          = require('./routes/cases');
const messageRoutes       = require('./routes/messages');
const lawyerRoutes        = require('./routes/lawyers');
const adminRoutes         = require('./routes/admin');
const libraryRoutes       = require('./routes/library');
const notificationRoutes  = require('./routes/notifications');
const aiRoutes            = require('./routes/ai');

app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/cases',         caseRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/lawyers',       lawyerRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/library',       libraryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai',            aiRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
});

module.exports = app;
