require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const profileRoutes = require('./routes/profiles');
const skillRoutes   = require('./routes/skills');
const badgeRoutes   = require('./routes/badges');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/users/profiles', profileRoutes);
app.use('/api/users/skills',   skillRoutes);
app.use('/api/users/badges',   badgeRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

module.exports = app;

module.exports = app; // for testing