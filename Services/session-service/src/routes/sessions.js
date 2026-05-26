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

module.exports = router;