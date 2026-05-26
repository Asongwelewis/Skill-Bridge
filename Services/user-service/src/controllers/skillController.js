const supabase = require('../supabaseClient');

// GET /api/users/skills — list all skills in the catalog
async function listSkills(req, res) {
  const { category } = req.query;

  let query = supabase.from('skills').select('*').order('name');
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/users/skills — add a skill to catalog
async function createSkill(req, res) {
  const { name, category, description } = req.body;

  const { data, error } = await supabase
    .from('skills')
    .insert({ name, category, description })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// GET /api/users/skills/me — get current user's skills
async function getMySkills(req, res) {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*, skills(*)')
    .eq('user_id', req.user.id)
    .eq('is_active', true);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/users/skills/me — add skill to user's profile
async function addMySkill(req, res) {
  const { skill_id, role, proficiency_level } = req.body;

  const { data, error } = await supabase
    .from('user_skills')
    .insert({ user_id: req.user.id, skill_id, role, proficiency_level })
    .select('*, skills(*)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/users/skills/me/:id — remove a skill from user's profile
async function removeMySkill(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from('user_skills')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Skill removed successfully' });
}

module.exports = { listSkills, createSkill, getMySkills, addMySkill, removeMySkill };