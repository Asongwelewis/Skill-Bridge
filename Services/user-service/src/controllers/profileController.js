const supabase = require('../supabaseClient');

// GET /api/users/profiles/:id
async function getProfile(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
}

// GET /api/users/profiles/me
async function getMyProfile(req, res) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
}

// PUT /api/users/profiles/me
async function updateProfile(req, res) {
  const { username, full_name, bio, avatar_url, timezone } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .update({ username, full_name, bio, avatar_url, timezone })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// GET /api/users/profiles (list all — used by matching service)
async function listProfiles(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const from = (page - 1) * limit;
  const to   = from + parseInt(limit) - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))', { count: 'exact' })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
}

module.exports = { getProfile, getMyProfile, updateProfile, listProfiles };