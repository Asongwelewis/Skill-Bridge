const request = require('supertest');
const app     = require('../src/index');
const { calculateMatchScore, findMatches } = require('../src/algorithm/matcher');

// ── Mock supabase ─────────────────────────────────────────────
jest.mock('../src/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: { getUser: jest.fn() }
}));

// ── Mock kafka consumer ───────────────────────────────────────
jest.mock('../src/kafka/consumer', () => ({
  startKafkaConsumer: jest.fn().mockResolvedValue(undefined)
}));

// ═══════════════════════════════════════════════════════════════
// Algorithm unit tests
// ═══════════════════════════════════════════════════════════════
describe('calculateMatchScore', () => {
  const learner = { id: 'l1', timezone: 'Africa/Douala' };
  const teacher = { id: 't1', timezone: 'Africa/Douala' };

  it('gives 100 for perfect match (gap=1, same timezone)', () => {
    const learnerSkill = { proficiency_level: 2 };
    const teacherSkill = { proficiency_level: 3 };
    const score = calculateMatchScore(learnerSkill, teacherSkill, learner, teacher);
    expect(score).toBe(100); // 60 base + 20 proficiency + 20 timezone
  });

  it('gives 80 for perfect proficiency gap but different timezone', () => {
    const learnerSkill = { proficiency_level: 1 };
    const teacherSkill = { proficiency_level: 2 };
    const score = calculateMatchScore(
      learnerSkill, teacherSkill,
      { ...learner, timezone: 'America/New_York' },
      { ...teacher, timezone: 'Europe/London' }
    );
    expect(score).toBe(80); // 60 + 20 + 0
  });

  it('gives 60 base when teacher is same level as learner', () => {
    const learnerSkill = { proficiency_level: 3 };
    const teacherSkill = { proficiency_level: 3 };
    const score = calculateMatchScore(learnerSkill, teacherSkill,
      { timezone: null }, { timezone: null });
    expect(score).toBe(60); // 60 + 0 + 0
  });

  it('gives partial timezone score for same region', () => {
    const learnerSkill = { proficiency_level: 1 };
    const teacherSkill = { proficiency_level: 3 };
    const score = calculateMatchScore(
      learnerSkill, teacherSkill,
      { timezone: 'Africa/Lagos' },
      { timezone: 'Africa/Nairobi' }
    );
    expect(score).toBe(80); // 60 + 10 gap + 10 region
  });

  it('never exceeds 100', () => {
    const learnerSkill = { proficiency_level: 1 };
    const teacherSkill = { proficiency_level: 2 };
    const score = calculateMatchScore(learnerSkill, teacherSkill, learner, teacher);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('findMatches', () => {
  const profiles = [
    { id: 'learner-1', timezone: 'Africa/Douala' },
    { id: 'teacher-1', timezone: 'Africa/Douala' },
    { id: 'teacher-2', timezone: 'America/New_York' }
  ];

  const allUserSkills = [
    { id: 's1', user_id: 'learner-1', skill_id: 'skill-js', role: 'learn', proficiency_level: 1, is_active: true },
    { id: 's2', user_id: 'teacher-1', skill_id: 'skill-js', role: 'teach', proficiency_level: 3, is_active: true },
    { id: 's3', user_id: 'teacher-2', skill_id: 'skill-js', role: 'teach', proficiency_level: 2, is_active: true }
  ];

  it('returns candidates sorted by score descending', () => {
    const candidates = findMatches('learner-1', allUserSkills, allUserSkills, profiles, []);
    expect(candidates.length).toBe(2);
    expect(candidates[0].match_score).toBeGreaterThanOrEqual(candidates[1].match_score);
  });

  it('does not match user with themselves', () => {
    const candidates = findMatches('learner-1', allUserSkills, allUserSkills, profiles, []);
    candidates.forEach(c => {
      expect(c.teacher_id).not.toBe('learner-1');
    });
  });

  it('skips existing matches', () => {
    const existing = [{ learner_id: 'learner-1', teacher_id: 'teacher-1', skill_id: 'skill-js' }];
    const candidates = findMatches('learner-1', allUserSkills, allUserSkills, profiles, existing);
    expect(candidates.length).toBe(1);
    expect(candidates[0].teacher_id).toBe('teacher-2');
  });

  it('returns empty array for unknown user', () => {
    const candidates = findMatches('unknown-user', allUserSkills, allUserSkills, profiles, []);
    expect(candidates).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// API route tests
// ═══════════════════════════════════════════════════════════════
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('matching-service');
  });
});

describe('Unknown routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});