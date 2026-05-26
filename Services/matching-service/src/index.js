require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const { startKafkaConsumer } = require('./kafka/consumer');

const matchRoutes = require('./routes/matches');

const app  = express();
const PORT = process.env.PORT || 3002;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'matching-service', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/matching', matchRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start server + Kafka consumer ────────────────────────────
app.listen(PORT, async () => {
  console.log(`Matching Service running on port ${PORT}`);
  try {
    await startKafkaConsumer();
    console.log('Kafka consumer started');
  } catch (err) {
    console.error('Kafka consumer failed to start:', err.message);
  }
});

module.exports = app;