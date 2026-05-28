/**
 * Redis Client — User Service
 * Used for caching frequently read data (profiles, skills)
 * to reduce Supabase load and handle 1000+ req/sec
 */
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://skillbridge-redis-master:6379'
});

client.on('error',   (err) => console.error('Redis error:', err.message));
client.on('connect', ()    => console.log('Redis connected'));

// Connect immediately
client.connect().catch(err => {
  console.error('Redis connection failed:', err.message);
});

/**
 * Get cached value
 */
async function getCache(key) {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err.message);
    return null; // fail silently — fall through to DB
  }
}

/**
 * Set cached value with TTL in seconds
 */
async function setCache(key, value, ttlSeconds = 300) {
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err.message);
    // fail silently — caching is non-critical
  }
}

/**
 * Delete cached value (call on profile update)
 */
async function deleteCache(key) {
  try {
    await client.del(key);
  } catch (err) {
    console.error('Redis del error:', err.message);
  }
}

module.exports = { getCache, setCache, deleteCache };