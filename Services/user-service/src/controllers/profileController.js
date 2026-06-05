const supabase = require('../supabaseClient');
const { getCache, setCache, deleteCache } = require('../cache/redisClient');

const CACHE_TTL = 300; // 5 minutes

// GET /api/users/profiles/:id
async function getProfile(req, res) {
  const { id } = req.params;
  const cacheKey = `profile:${id}`;

  // 1. Check Redis cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return res.json(cached);
  }

  // 2. Cache miss — fetch from Supabase
  console.log(`[Cache MISS] ${cacheKey}`);
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });

  // 3. Store in cache for next request
  await setCache(cacheKey, data, CACHE_TTL);
  res.json(data);
}

// GET /api/users/profiles/me
async function getMyProfile(req, res) {
  const cacheKey = `profile:${req.user.id}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return res.json(cached);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });

  await setCache(cacheKey, data, CACHE_TTL);
  res.json(data);
}

// PUT /api/users/profiles/me
async function updateProfile(req, res) {
  const { username, full_name, bio, avatar_url, timezone, onboarded } = req.body;
  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url, timezone, onboarded')
    .eq('id', req.user.id)
    .single();

  if (existingError) return res.status(404).json({ error: 'Profile not found' });

  const googleAvatar =
    req.user?.user_metadata?.avatar_url ||
    req.user?.user_metadata?.picture ||
    null;

  const updateData = {
    username: username ?? existingProfile?.username ?? req.user?.email?.split('@')[0],
    full_name: full_name ?? existingProfile?.full_name ?? req.user?.user_metadata?.full_name ?? req.user?.user_metadata?.name ?? null,
    bio: bio ?? existingProfile?.bio ?? null,
    avatar_url: avatar_url ?? existingProfile?.avatar_url ?? googleAvatar,
    timezone: timezone ?? existingProfile?.timezone ?? 'UTC',
    onboarded: onboarded ?? existingProfile?.onboarded ?? false,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Invalidate cache on update
  await deleteCache(`profile:${req.user.id}`);
  console.log(`[Cache INVALIDATED] profile:${req.user.id}`);

  res.json(data);
}

// GET /api/users/profiles (list all)
async function listProfiles(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const cacheKey = `profiles:page:${page}:limit:${limit}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return res.json(cached);
  }

  const from = (page - 1) * limit;
  const to   = from + parseInt(limit) - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*, user_skills(*, skills(*))', { count: 'exact' })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });

  const response = { data, total: count, page: parseInt(page), limit: parseInt(limit) };
  await setCache(cacheKey, response, 60); // shorter TTL for lists
  res.json(response);
}

module.exports = { getProfile, getMyProfile, updateProfile, listProfiles };
