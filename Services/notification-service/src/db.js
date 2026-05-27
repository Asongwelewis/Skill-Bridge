const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.NOTIFICATION_DB_HOST     || 'notification-db',
  port:     parseInt(process.env.NOTIFICATION_DB_PORT || '5432'),
  database: process.env.NOTIFICATION_DB_NAME     || 'notificationdb',
  user:     process.env.NOTIFICATION_DB_USER     || 'notification_user',
  password: process.env.NOTIFICATION_DB_PASSWORD || 'notification_pass_2026'
});

pool.on('error', (err) => {
  console.error('notification-db pool error:', err.message);
});

module.exports = pool;