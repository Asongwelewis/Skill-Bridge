const supabase        = require('../supabaseClient');
const { findMatches } = require('../algorithm/matcher');
const redis           = require('../redis');

// POST /api/matching/run/:userId — run matching for a specific user
async function runMatchingForUser(req, res) {
  const { userId } = req.params;

  try {
    // 1. Fetch all needed data in parallel
    const [
      { data: profiles,      error: profilesError },
      { data: allUserSkills, error: skillsError },
      { data: existingMatches, error: matchesError }
    ] = await Promise.all([
      supabase.from('profiles').select('id, timezone, xp_points'),
      supabase.from('user_skills').select('*').eq('is_active', true),
      supabase.from('matches').select('learner_id, teacher_id, skill_id')
        .or(`learner_id.eq.${userId},teacher_id.eq.${userId}`)
    ]);

    if (profilesError) throw new Error(profilesError.message);
    if (skillsError)   throw new Error(skillsError.message);
    if (matchesError)  throw new Error(matchesError.message);

    // 2. Run the matching algorithm
    const candidates = findMatches(
      userId,
      allUserSkills,
      allUserSkills,
      profiles,
      existingMatches || []
    );

    if (candidates.length === 0) {
      return res.json({ message: 'No new matches found', matches: [] });
    }

    // 3. Insert top 5 matches into the database
    const topCandidates = candidates.slice(0, 5);
    const { data: newMatches, error: insertError } = await supabase
      .from('matches')
      .insert(topCandidates)
      .select('*, skills(name, category)');

    if (insertError) throw new Error(insertError.message);

    res.status(201).json({
      message: `Found ${newMatches.length} new matches`,
      matches: newMatches
    });

  } catch (err) {
    console.error('Matching error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/matching/matches/:userId — get all matches for a user
async function getUserMatches(req, res) {
  const { userId } = req.params;
  const { status } = req.query;

  let query = supabase
    .from('matches')
    .select('*, skills(name, category)')
    .or(`learner_id.eq.${userId},teacher_id.eq.${userId}`)
    .order('match_score', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET /api/matching/matches/me — get matches for authenticated user
async function getMyMatches(req, res) {
  const { status } = req.query;
  const cacheKey = `matches:${req.user.id}:${status || 'all'}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.json({ matches: JSON.parse(cached), fromCache: true });

  let query = supabase
    .from('matches')
    .select(`
      *,
      skills(name, category),
      learner:profiles!matches_learner_id_fkey(id, username, avatar_url),
      teacher:profiles!matches_teacher_id_fkey(id, username, avatar_url)
    `)
    .or(`learner_id.eq.${req.user.id},teacher_id.eq.${req.user.id}`)
    .order('matched_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
  res.json({ matches: data });
}

// PATCH /api/matching/matches/:matchId — accept or decline a match
async function updateMatchStatus(req, res) {
  const { matchId } = req.params;
  const { status }  = req.body;

  const validStatuses = ['accepted', 'declined'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be accepted or declined' });
  }

  // Verify user is part of this match
  const { data: match, error: findError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (findError || !match) return res.status(404).json({ error: 'Match not found' });

  if (match.learner_id !== req.user.id && match.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this match' });
  }

  const { data, error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Invalidate cached match lists for both participants
  await Promise.all([
    redis.del(`matches:${match.learner_id}:all`),
    redis.del(`matches:${match.learner_id}:${status}`),
    redis.del(`matches:${match.teacher_id}:all`),
    redis.del(`matches:${match.teacher_id}:${status}`),
  ]);

  res.json(data);
}

module.exports = { runMatchingForUser, getUserMatches, getMyMatches, updateMatchStatus };