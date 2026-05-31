const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createSession,
  getMySessions,
  getSession,
  startSession,
  endSession,
  cancelSession
} = require('../controllers/sessionController');

// POST   /api/sessions              — schedule a new session
router.post('/',              authenticate, createSession);

// GET    /api/sessions/me           — get my sessions
router.get('/me',             authenticate, getMySessions);

// GET    /api/sessions/:id          — get a single session
router.get('/:id',            authenticate, getSession);

// PATCH  /api/sessions/:id/start    — go live
router.patch('/:id/start',    authenticate, startSession);

// PATCH  /api/sessions/:id/end      — end + trigger quiz
router.patch('/:id/end',      authenticate, endSession);

// DELETE /api/sessions/:id          — cancel
router.delete('/:id',         authenticate, cancelSession);

const { searchTranscripts } = require('../elastic/elasticClient');

// GET /api/sessions/search?q=python
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const results = await searchTranscripts(q, req.user.id);

  if (results === null) {
    return res.status(503).json({ error: 'Search temporarily unavailable' });
  }

  res.json({ query: q, count: results.length, results });
});
module.exports = router;