const { v4: uuidv4 }             = require('uuid');
const supabase                   = require('../supabaseClient');
const { publishSessionCompleted } = require('../kafka/producer');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Generate a unique WebRTC room ID.
 * In production this would call a signalling server (e.g. Livekit, Daily.co).
 * For this project we generate a UUID-based token.
 */
function generateRoomId() {
  return `sb-room-${uuidv4()}`;
}

/**
 * Verify the requesting user is a participant of the given match.
 */
async function isMatchParticipant(matchId, userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('learner_id, teacher_id')
    .eq('id', matchId)
    .single();

  if (error || !data) return false;
  return data.learner_id === userId || data.teacher_id === userId;
}

// ── Controllers ───────────────────────────────────────────────

// POST /api/sessions — schedule a new session from an accepted match
async function createSession(req, res) {
  const { match_id, scheduled_at } = req.body;

  if (!match_id) {
    return res.status(400).json({ error: 'match_id is required' });
  }

  // Verify match exists and is accepted
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', match_id)
    .eq('status', 'accepted')
    .single();

  if (matchError || !match) {
    return res.status(404).json({ error: 'Accepted match not found' });
  }

  // Verify requester is part of this match
  if (match.learner_id !== req.user.id && match.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to create session for this match' });
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      match_id,
      host_id:       req.user.id,
      status:        'scheduled',
      webrtc_room_id: generateRoomId(),
      scheduled_at:  scheduled_at || null
    })
    .select(`
      *,
      matches(
        skill_id,
        learner:profiles!matches_learner_id_fkey(id, username, avatar_url),
        teacher:profiles!matches_teacher_id_fkey(id, username, avatar_url)
      )
    `)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// GET /api/sessions/me — get all sessions for authenticated user
async function getMySessions(req, res) {
  const { status } = req.query;

  // Get match IDs where user is learner or teacher
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .or(`learner_id.eq.${req.user.id},teacher_id.eq.${req.user.id}`);

  if (matchError) return res.status(500).json({ error: matchError.message });

  const matchIds = (matches || []).map(m => m.id);
  if (matchIds.length === 0) return res.json([]);

  let query = supabase
    .from('sessions')
    .select(`
      *,
      matches(
        skill_id, skills(name),
        learner:profiles!matches_learner_id_fkey(id, username, avatar_url),
        teacher:profiles!matches_teacher_id_fkey(id, username, avatar_url)
      )
    `)
    .in('match_id', matchIds)
    .order('scheduled_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET /api/sessions/:id — get a single session
async function getSession(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      matches(
        skill_id, skills(name),
        learner:profiles!matches_learner_id_fkey(id, username, avatar_url),
        teacher:profiles!matches_teacher_id_fkey(id, username, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Session not found' });

  // Verify participant
  const participant = await isMatchParticipant(data.match_id, req.user.id);
  if (!participant) return res.status(403).json({ error: 'Not authorized' });

  res.json(data);
}

// PATCH /api/sessions/:id/start — mark session as live
async function startSession(req, res) {
  const { id } = req.params;

  const { data: session, error: findError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !session) return res.status(404).json({ error: 'Session not found' });
  if (session.host_id !== req.user.id) return res.status(403).json({ error: 'Only the host can start a session' });
  if (session.status !== 'scheduled') return res.status(400).json({ error: 'Session is not in scheduled state' });

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'live', started_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// PATCH /api/sessions/:id/end — mark session as completed + publish Kafka event
async function endSession(req, res) {
  const { id } = req.params;

  const { data: session, error: findError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !session) return res.status(404).json({ error: 'Session not found' });
  if (session.host_id !== req.user.id) return res.status(403).json({ error: 'Only the host can end a session' });
  if (session.status !== 'live') return res.status(400).json({ error: 'Session is not live' });

  const endedAt    = new Date();
  const startedAt  = new Date(session.started_at);
  const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status:           'completed',
      ended_at:         endedAt.toISOString(),
      duration_seconds: durationSeconds
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Mark match as completed
  await supabase
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', session.match_id);

  // 🔔 Publish Kafka event → Quiz Service will auto-generate a quiz
  await publishSessionCompleted(data);

  res.json(data);
}

// DELETE /api/sessions/:id — cancel a scheduled session
async function cancelSession(req, res) {
  const { id } = req.params;

  const { data: session, error: findError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !session) return res.status(404).json({ error: 'Session not found' });
  if (session.host_id !== req.user.id) return res.status(403).json({ error: 'Only the host can cancel' });
  if (session.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed session' });

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { createSession, getMySessions, getSession, startSession, endSession, cancelSession };