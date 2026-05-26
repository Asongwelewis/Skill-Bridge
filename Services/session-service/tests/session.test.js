const request = require('supertest');
const app     = require('../src/index');

// ── Mocks ─────────────────────────────────────────────────────
jest.mock('../src/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: { getUser: jest.fn() }
}));

jest.mock('../src/kafka/producer', () => ({
  startKafkaProducer:      jest.fn().mockResolvedValue(undefined),
  publishSessionCompleted: jest.fn().mockResolvedValue(undefined),
  stopKafkaProducer:       jest.fn().mockResolvedValue(undefined)
}));

const supabase = require('../src/supabaseClient');
const { publishSessionCompleted } = require('../src/kafka/producer');

// ── Health ────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('session-service');
  });
});

// ── Create session ────────────────────────────────────────────
describe('POST /api/sessions', () => {
  beforeEach(() => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-host-1' } }, error: null
    });
  });

  it('returns 400 if match_id is missing', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('match_id is required');
  });

  it('returns 404 if match not found or not accepted', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer valid-token')
      .send({ match_id: 'nonexistent-match' });
    expect(res.status).toBe(404);
  });

  it('returns 403 if user is not a match participant', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id: 'match-1', learner_id: 'other-user', teacher_id: 'another-user', status: 'accepted' },
      error: null
    });

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer valid-token')
      .send({ match_id: 'match-1' });
    expect(res.status).toBe(403);
  });
});

// ── End session ───────────────────────────────────────────────
describe('PATCH /api/sessions/:id/end', () => {
  beforeEach(() => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'host-1' } }, error: null
    });
  });

  it('publishes Kafka event on successful end', async () => {
    const mockSession = {
      id: 'session-1', match_id: 'match-1',
      host_id: 'host-1', status: 'live',
      started_at: new Date(Date.now() - 60000).toISOString()
    };

    // findSession
    supabase.single
      .mockResolvedValueOnce({ data: mockSession, error: null })
      // update session
      .mockResolvedValueOnce({ data: { ...mockSession, status: 'completed', duration_seconds: 60 }, error: null });

    // mock matches update (not single)
    supabase.eq.mockReturnThis();

    const res = await request(app)
      .patch('/api/sessions/session-1/end')
      .set('Authorization', 'Bearer valid-token');

    expect(publishSessionCompleted).toHaveBeenCalled();
  });

  it('returns 400 if session is not live', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id: 'session-1', host_id: 'host-1', status: 'scheduled' },
      error: null
    });

    const res = await request(app)
      .patch('/api/sessions/session-1/end')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Session is not live');
  });
});

// ── 404 ───────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});