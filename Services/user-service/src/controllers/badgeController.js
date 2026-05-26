const supabase = require('../supabaseClient');

// GET /api/users/badges — list all badge definitions
async function listBadges(req, res) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('created_at');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET /api/users/badges/me — get badges earned by current user
async function getMyBadges(req, res) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', req.user.id)
    .order('awarded_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET /api/users/badges/:userId — get badges for any user (public)
async function getUserBadges(req, res) {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/users/badges/award — award a badge (internal, called by quiz service)
async function awardBadge(req, res) {
  const { user_id, badge_id, awarded_reason } = req.body;

  // Check badge criteria met
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badge_id)
    .single();

  if (badgeError) return res.status(404).json({ error: 'Badge not found' });

  const { data, error } = await supabase
    .from('user_badges')
    .insert({ user_id, badge_id, awarded_reason })
    .select('*, badges(*)')
    .single();

  if (error) {
    // unique constraint means badge already awarded
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Badge already awarded to this user' });
    }
    return res.status(400).json({ error: error.message });
  }

  // Award XP points for earning a badge
  await supabase.rpc('increment_xp', { user_id, amount: 50 });

  res.status(201).json(data);
}

module.exports = { listBadges, getMyBadges, getUserBadges, awardBadge };