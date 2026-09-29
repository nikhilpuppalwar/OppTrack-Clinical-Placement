require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const reminderService = require('./services/reminder.service');
const gmailCron = require('./services/gmailCron.service');

// Connect to database
connectDB();

const app = express();

// CORS configuration supporting Vercel, Render, Chrome Extensions, and local development
const allowedOrigins = [
  'https://opp-track-clinical-placement.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/+$/, '')) : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/+$/, '')) : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`] : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and Chrome extensions
    if (!origin || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '');
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      if (
        allowedOrigins.includes(cleanOrigin) ||
        hostname === 'vercel.app' ||
        hostname.endsWith('.vercel.app') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch {}
    // Reject unknown origins explicitly
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Strict limiter for sensitive auth endpoints (10 requests / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts from this IP. Please try again after 15 minutes.' },
});

// General API limiter (200 requests / 15 min per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// Apply general limiter to all API routes
app.use('/api/', generalLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes — auth endpoints get stricter rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', require('./routes/auth'));

app.use('/api/profile', require('./routes/profile'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/history', require('./routes/history'));
app.use('/api/form-history', require('./routes/formHistory'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/google', require('./routes/google'));
app.use('/api/gmail', require('./routes/gmail'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/tester-requests', require('./routes/tester'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));

// Error handler
app.use(errorHandler);

// Start cron jobs
reminderService.startCronJob();
gmailCron.startCronJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`OppTrack server running on port ${PORT}`));

module.exports = app;
