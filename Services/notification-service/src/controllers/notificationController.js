const db              = require('../db');
const CircuitBreaker  = require('../patterns/CircuitBreaker');

// Circuit breaker for external email service
const emailBreaker = new CircuitBreaker({
  name:             'EmailService',
  failureThreshold: 3,
  successThreshold: 2,
  timeout:          30000
});

// GET /api/notifications/me
async function getMyNotifications(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/notifications/:id/read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE notifications SET read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/notifications/read-all
async function markAllAsRead(req, res) {
  try {
    await db.query(
      `UPDATE notifications SET read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/notifications/send — internal, sends via circuit breaker
async function sendNotification(req, res) {
  const { user_id, type, title, message } = req.body;

  try {
    // 1. Save to notification-db
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, type, title, message]
    );

    // 2. Attempt email via Circuit Breaker (simulated here)
    try {
      await emailBreaker.execute(async () => {
        // In production: call SendGrid/Mailgun API here
        console.log(`[EmailService] Sending "${title}" to user ${user_id}`);
        // Simulate occasional failure for demo
        // throw new Error('Email service unavailable');
      });
    } catch (breakerErr) {
      // Circuit is open — log but don't fail the request
      console.warn(`[CircuitBreaker] Email skipped: ${breakerErr.message}`);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/notifications/circuit-status
async function getCircuitStatus(req, res) {
  res.json(emailBreaker.getStatus());
}

// GET /api/notifications/prefs
async function getPrefs(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM notification_prefs WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0] || { email_enabled: true, in_app_enabled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/notifications/prefs
async function updatePrefs(req, res) {
  const { email_enabled, in_app_enabled } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO notification_prefs (user_id, email_enabled, in_app_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET email_enabled = $2, in_app_enabled = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.id, email_enabled, in_app_enabled]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  getCircuitStatus,
  getPrefs,
  updatePrefs
};