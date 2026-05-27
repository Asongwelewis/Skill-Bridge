const request  = require('supertest');
const app      = require('../src/index');
const { generateQuiz } = require('../src/ai/quizGenerator');

// ── Mocks ─────────────────────────────────────────────────────
jest.mock('../src/supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn().mockResolvedValue({ error: null }),
  auth: { getUser: jest.fn() }
}));

jest.mock('../src/kafka/consumer', () => ({
  startKafkaConsumer: jest.fn().mockResolvedValue(undefined),
  stopKafkaConsumer:  jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/ai/quizGenerator', () => ({
  generateQuiz: jest.fn()
}));

jest.mock('../src/badges/badgeAwarder', () => ({
  checkAndAwardBadges: jest.fn().mockResolvedValue(undefined)
}));

const supabase = require('../src/supabaseClient');

// ── Health ─────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('quiz-service');
  });
});

// ── Quiz Generator Unit Tests ─────────────────────────────────
describe('generateQuiz (mocked)', () => {
  it('returns a valid quiz structure', async () => {
    generateQuiz.mockResolvedValueOnce({
      title: 'Quiz: JavaScript Fundamentals',
      questions: [
        {
          question_text:  'What does typeof null return?',
          options:        ['null', 'object', 'undefined', 'string'],
          correct_answer: 'object'
        },
        {
          question_text:  'Which method adds to end of array?',
          options:        ['push', 'pop', 'shift', 'unshift'],
          correct_answer: 'push'
        }
      ]
    });

    const result = await generateQuiz('JavaScript', 'Programming', 2);
    expect(result.title).toBe('Quiz: JavaScript Fundamentals');
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]).toHaveProperty('correct_answer');
  });
});

// ── Submit attempt ────────────────────────────────────────────
describe('POST /api/quizzes/:quizId/attempt', () => {
  beforeEach(() => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null
    });
  });

  it('returns 400 when answers array is missing', async () => {
    const res = await request(app)
      .post('/api/quizzes/quiz-1/attempt')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('answers array is required');
  });

  it('returns 404 when quiz not found', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const res = await request(app)
      .post('/api/quizzes/bad-quiz/attempt')
      .set('Authorization', 'Bearer valid-token')
      .send({ answers: [{ question_id: 'q1', answer_given: 'A' }] });
    expect(res.status).toBe(404);
  });

  it('returns 409 when attempt already exists', async () => {
    // getQuiz
    supabase.single
      .mockResolvedValueOnce({
        data: {
          id: 'quiz-1', passing_score: 70,
          quiz_questions: [{ id: 'q1', correct_answer: 'object' }]
        },
        error: null
      })
      // existing attempt check
      .mockResolvedValueOnce({ data: { id: 'existing-attempt' }, error: null });

    const res = await request(app)
      .post('/api/quizzes/quiz-1/attempt')
      .set('Authorization', 'Bearer valid-token')
      .send({ answers: [{ question_id: 'q1', answer_given: 'object' }] });
    expect(res.status).toBe(409);
  });

  it('scores answers correctly and returns result', async () => {
    // getQuiz
    supabase.single
      .mockResolvedValueOnce({
        data: {
          id: 'quiz-1', passing_score: 70,
          quiz_questions: [
            { id: 'q1', correct_answer: 'object' },
            { id: 'q2', correct_answer: 'push' }
          ]
        },
        error: null
      })
      // no existing attempt
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      // save attempt
      .mockResolvedValueOnce({
        data: { id: 'attempt-1', score: 100, passed: true },
        error: null
      });

    const res = await request(app)
      .post('/api/quizzes/quiz-1/attempt')
      .set('Authorization', 'Bearer valid-token')
      .send({
        answers: [
          { question_id: 'q1', answer_given: 'object' },
          { question_id: 'q2', answer_given: 'push' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(100);
    expect(res.body.passed).toBe(true);
    expect(res.body.correct_count).toBe(2);
  });
});

// ── 404 ───────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});