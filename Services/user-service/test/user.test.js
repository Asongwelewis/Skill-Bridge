const request = require('supertest');
const app     = require('../src/index');

jest.mock('../src/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn()
  },
  rpc: jest.fn()
}));

const supabase = require('../src/supabaseClient');

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('user-service');
  });
});

describe('GET /api/users/profiles/:id', () => {
  it('returns a profile by id', async () => {
    const mockProfile = { id: 'user-1', username: 'testuser', full_name: 'Test User' };
    supabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });

    const res = await request(app).get('/api/users/profiles/user-1');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('returns 404 if profile not found', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const res = await request(app).get('/api/users/profiles/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/skills', () => {
  it('returns list of skills', async () => {
    const mockSkills = [
      { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
      { id: 'skill-2', name: 'Python',     category: 'Programming' }
    ];
    supabase.order.mockResolvedValueOnce({ data: mockSkills, error: null });

    const res = await request(app).get('/api/users/skills');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('JavaScript');
  });

  it('returns 500 on database error', async () => {
    supabase.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const res = await request(app).get('/api/users/skills');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/users/badges', () => {
  it('returns all badge definitions', async () => {
    const mockBadges = [
      { id: 'badge-1', name: 'First Session', criteria_type: 'sessions_completed' }
    ];
    supabase.order.mockResolvedValueOnce({ data: mockBadges, error: null });

    const res = await request(app).get('/api/users/badges');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('First Session');
  });
});

describe('Unknown routes', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});