const request = require('supertest');
const app     = require('../src/index');
const CircuitBreaker = require('../src/patterns/CircuitBreaker');

jest.mock('../src/supabaseClient', () => ({
  auth: { getUser: jest.fn() }
}));

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

jest.mock('../src/kafka/consumer', () => ({
  startKafkaConsumer: jest.fn().mockResolvedValue(undefined),
  stopKafkaConsumer:  jest.fn().mockResolvedValue(undefined)
}));

const supabase = require('../src/supabaseClient');
const db       = require('../src/db');

// ── Circuit Breaker unit tests ────────────────────────────────
describe('CircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker({ name: 'test' });
    expect(cb.state).toBe('CLOSED');
  });

  it('executes successfully in CLOSED state', async () => {
    const cb     = new CircuitBreaker({ name: 'test' });
    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');
  });

  it('opens after failure threshold', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 2 });
    for (let i = 0; i < 2; i++) {
      try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
    }
    expect(cb.state).toBe('OPEN');
  });

  it('blocks requests when OPEN', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1 });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
    await expect(cb.execute(async () => 'ok')).rejects.toThrow('OPEN');
  });

  it('returns status object', () => {
    const cb     = new CircuitBreaker({ name: 'TestBreaker' });
    const status = cb.getStatus();
    expect(status).toHaveProperty('state');
    expect(status).toHaveProperty('name', 'TestBreaker');
  });
});

// ── API tests ─────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('notification-service');
  });
});

describe('GET /api/notifications/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns notifications for authenticated user', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } }, error: null
    });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'notif-1', title: 'Test', message: 'Hello', read: false }]
    });
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('Unknown routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});