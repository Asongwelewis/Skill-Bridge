require('dotenv').config();
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');
const { startKafkaConsumer } = require('./kafka/consumer');

const notificationRoutes = require('./routes/notifications');

const app  = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  try {
    await startKafkaConsumer();
    console.log('Kafka consumer started');
  } catch (err) {
    console.error('Kafka consumer failed:', err.message);
  }
});

module.exports = app;