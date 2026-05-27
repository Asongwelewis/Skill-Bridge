const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getQuizBySession,
  getQuiz,
  submitAttempt,
  getMyResult
} = require('../controllers/quizController');

// GET  /api/quizzes/session/:sessionId   — get quiz for a session
router.get('/session/:sessionId',   authenticate, getQuizBySession);

// GET  /api/quizzes/:quizId              — get a quiz
router.get('/:quizId',              authenticate, getQuiz);

// POST /api/quizzes/:quizId/attempt      — submit answers
router.post('/:quizId/attempt',     authenticate, submitAttempt);

// GET  /api/quizzes/:quizId/result       — get my result
router.get('/:quizId/result',       authenticate, getMyResult);

module.exports = router;