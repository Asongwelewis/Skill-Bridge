const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  getCircuitStatus,
  getPrefs,
  updatePrefs
} = require('../controllers/notificationController');

router.get('/',                authenticate, getMyNotifications);
router.patch('/read-all',      authenticate, markAllAsRead);
router.patch('/:id/read',      authenticate, markAsRead);
router.post('/send',           authenticate, sendNotification);
router.get('/circuit-status',  authenticate, getCircuitStatus);
router.get('/prefs',           authenticate, getPrefs);
router.put('/prefs',           authenticate, updatePrefs);

module.exports = router;