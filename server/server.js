require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const reminderService = require('./services/reminder.service');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/history', require('./routes/history'));
app.use('/api/settings', require('./routes/settings'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));

// Error handler
app.use(errorHandler);

// Start cron job for reminders
reminderService.startCronJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`OppTrack server running on port ${PORT}`));

module.exports = app;
