const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  getMyProfile,
  updateProfile,
  listProfiles
} = require('../controllers/profileController');

router.get('/',     authenticate, listProfiles);   // GET  /api/users/profiles
router.get('/me',   authenticate, getMyProfile);   // GET  /api/users/profiles/me
router.put('/me',   authenticate, updateProfile);  // PUT  /api/users/profiles/me
router.get('/:id',  getProfile);                   // GET  /api/users/profiles/:id (public)

module.exports = router;