/**
 * Repository Pattern — Session Service
 *
 * Decouples database access from business logic.
 * The controller calls the repository; the repository
 * handles all SQL — making the DB swappable without
 * touching business logic.
 */
const supabase = require('../supabaseClient');
const { v4: uuidv4 } = require('uuid');
const redis = require('../redis');

class SessionRepository {

  /**
   * Find a session by ID
   */
  async findById(id) {
    const cached = await redis.get(`session:${id}`);
    if (cached) return JSON.parse(cached);

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

    if (error) throw new Error(error.message);
    if (data) await redis.setex(`session:${id}`, 300, JSON.stringify(data)); // 5 min TTL
    return data;
  }

  /**
   * Find all sessions for a user (as learner or teacher)
   */
  async findByUserId(userId, status = null) {
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .or(`learner_id.eq.${userId},teacher_id.eq.${userId}`);

    if (matchError) throw new Error(matchError.message);
    const matchIds = (matches || []).map(m => m.id);
    if (matchIds.length === 0) return [];

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
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Create a new session
   */
  async create({ match_id, host_id, scheduled_at }) {
    const webrtc_room_id = `sb-room-${uuidv4()}`;

    const { data, error } = await supabase
      .from('sessions')
      .insert({ match_id, host_id, status: 'scheduled', webrtc_room_id, scheduled_at })
      .select(`
        *,
        matches(
          skill_id,
          learner:profiles!matches_learner_id_fkey(id, username, avatar_url),
          teacher:profiles!matches_teacher_id_fkey(id, username, avatar_url)
        )
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update session status
   */
  async updateStatus(id, status, extraFields = {}) {
    await redis.del(`session:${id}`);

    const { data, error } = await supabase
      .from('sessions')
      .update({ status, ...extraFields })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Find accepted match and verify user is participant
   */
  async findAcceptedMatch(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('status', 'accepted')
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Mark match as completed
   */
  async completeMatch(matchId) {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', matchId);

    if (error) throw new Error(error.message);
  }
}

module.exports = new SessionRepository();