const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://skillbridge-redis-master:6379');

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', e => console.error('[Redis] Error:', e.message));

module.exports = redis;
