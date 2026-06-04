require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const { startKafkaProducer } = require('./kafka/producer');
const supabaseClient = require('./supabaseClient');

const sessionRoutes = require('./routes/sessions');

const app  = express();
const PORT = process.env.PORT || 3003;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  const diag = typeof supabaseClient.getSupabaseDiagnostics === 'function'
    ? supabaseClient.getSupabaseDiagnostics()
    : {
        supabaseUrl: process.env.SUPABASE_URL || null,
        hasSupabaseSecret: Boolean(process.env.SUPABASE_SECRET_KEY)
      };

  res.json({
    status: 'ok',
    service: 'session-service',
    timestamp: new Date().toISOString(),
    supabase: diag
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/sessions', sessionRoutes);

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
app.listen(PORT, async () => {
  console.log(`Session Service running on port ${PORT}`);
  try {
    await startKafkaProducer();
    console.log('Kafka producer connected');
  } catch (err) {
    console.error('Kafka producer failed to start:', err.message);
  }
});

module.exports = app;