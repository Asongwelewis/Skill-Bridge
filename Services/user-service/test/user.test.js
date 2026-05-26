const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  listBadges,
  getMyBadges,
  getUserBadges,
  awardBadge
} = require('../controllers/badgeController');

router.get('/',            listBadges);                  // GET  /api/users/badges (public)
router.get('/me',          authenticate, getMyBadges);   // GET  /api/users/badges/me
router.post('/award',      authenticate, awardBadge);    // POST /api/users/badges/award
router.get('/:userId',     getUserBadges);               // GET  /api/users/badges/:userId (public)

module.exports = router;