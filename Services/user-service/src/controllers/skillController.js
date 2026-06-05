const supabase = require('../supabaseClient');
const { deleteCache } = require('../cache/redisClient');

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
  const { skill_id, skill_name, category, role, proficiency_level } = req.body;

  const validRoles = ['teach', 'learn', 'both'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'role must be teach, learn, or both' });
  }

  let finalSkillId = skill_id;

  if (!finalSkillId && skill_name) {
    const skillLookup = await supabase
      .from('skills')
      .select('id')
      .ilike('name', skill_name.trim())
      .limit(1);

    if (skillLookup.error) return res.status(400).json({ error: skillLookup.error.message });

    const existingSkill = skillLookup.data?.[0];
    if (existingSkill) {
      finalSkillId = existingSkill.id;
    } else {
      const { data: newSkill, error: skillError } = await supabase
        .from('skills')
        .insert({ name: skill_name.trim(), category: category || 'General' })
        .select('id')
        .single();

      if (skillError) return res.status(400).json({ error: skillError.message });
      finalSkillId = newSkill.id;
    }
  }

  if (!finalSkillId) {
    return res.status(400).json({ error: 'skill_id or skill_name is required' });
  }

  const { data: existingSkillLink, error: existingLinkError } = await supabase
    .from('user_skills')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('skill_id', finalSkillId)
    .eq('is_active', true)
    .maybeSingle();

  if (existingLinkError) return res.status(400).json({ error: existingLinkError.message });
  if (existingSkillLink) {
    return res.status(409).json({ error: 'You already have this skill in your profile' });
  }

  const { data, error } = await supabase
    .from('user_skills')
    .insert({
      user_id: req.user.id,
      skill_id: finalSkillId,
      role,
      proficiency_level: proficiency_level || 3,
      is_active: true
    })
    .select('*, skills(*)')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Safety net: adding a skill means the user has effectively completed
  // onboarding. Best-effort — never block the skill response on this.
  try {
    await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', req.user.id);
    await deleteCache(`profile:${req.user.id}`);
  } catch (_) { /* non-fatal */ }

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
