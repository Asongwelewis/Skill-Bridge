const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  listSkills,
  createSkill,
  getMySkills,
  addMySkill,
  removeMySkill
} = require('../controllers/skillController');

router.get('/',         listSkills);                      // GET    /api/users/skills (public)
router.post('/',        authenticate, createSkill);        // POST   /api/users/skills
router.get('/me',       authenticate, getMySkills);        // GET    /api/users/skills/me
router.post('/me',      authenticate, addMySkill);         // POST   /api/users/skills/me
router.delete('/me/:id',authenticate, removeMySkill);      // DELETE /api/users/skills/me/:id

module.exports = router;