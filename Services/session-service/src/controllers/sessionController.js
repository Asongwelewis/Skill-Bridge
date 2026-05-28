const SessionRepository            = require('../repositories/SessionRepository');
const { publishSessionCompleted }  = require('../kafka/producer');

// POST /api/sessions
async function createSession(req, res) {
  const { match_id, scheduled_at } = req.body;
  if (!match_id) return res.status(400).json({ error: 'match_id is required' });

  const match = await SessionRepository.findAcceptedMatch(match_id);
  if (!match) return res.status(404).json({ error: 'Accepted match not found' });

  if (match.learner_id !== req.user.id && match.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to create session for this match' });
  }

  try {
    const session = await SessionRepository.create({
      match_id, host_id: req.user.id, scheduled_at
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// GET /api/sessions/me
async function getMySessions(req, res) {
  try {
    const { status } = req.query;
    const sessions = await SessionRepository.findByUserId(req.user.id, status);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/sessions/:id
async function getSession(req, res) {
  try {
    const session = await SessionRepository.findById(req.params.id);
    res.json(session);
  } catch (err) {
    res.status(404).json({ error: 'Session not found' });
  }
}

// PATCH /api/sessions/:id/start
async function startSession(req, res) {
  try {
    const session = await SessionRepository.findById(req.params.id);
    if (session.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can start a session' });
    }
    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Session is not in scheduled state' });
    }
    const updated = await SessionRepository.updateStatus(
      req.params.id, 'live', { started_at: new Date().toISOString() }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /api/sessions/:id/end
async function endSession(req, res) {
  try {
    const session = await SessionRepository.findById(req.params.id);
    if (session.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can end a session' });
    }
    if (session.status !== 'live') {
      return res.status(400).json({ error: 'Session is not live' });
    }

    const endedAt        = new Date();
    const startedAt      = new Date(session.started_at);
    const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

    const updated = await SessionRepository.updateStatus(
      req.params.id, 'completed', {
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds
      }
    );

    await SessionRepository.completeMatch(session.match_id);
    await publishSessionCompleted(updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /api/sessions/:id
async function cancelSession(req, res) {
  try {
    const session = await SessionRepository.findById(req.params.id);
    if (session.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can cancel' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed session' });
    }
    const updated = await SessionRepository.updateStatus(req.params.id, 'cancelled');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { createSession, getMySessions, getSession, startSession, endSession, cancelSession };