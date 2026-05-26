const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  runMatchingForUser,
  getUserMatches,
  getMyMatches,
  updateMatchStatus
} = require('../controllers/matchController');

// POST /api/matching/run/:userId   — trigger matching algorithm for a user
router.post('/run/:userId',         authenticate, runMatchingForUser);

// GET  /api/matching/matches/me    — get my matches (must be before /:userId)
router.get('/matches/me',           authenticate, getMyMatches);

// GET  /api/matching/matches/:userId — get matches for any user
router.get('/matches/:userId',      authenticate, getUserMatches);

// PATCH /api/matching/matches/:matchId — accept or decline a match
router.patch('/matches/:matchId',   authenticate, updateMatchStatus);

module.exports = router;