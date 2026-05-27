const supabase = require('../supabaseClient');

/**
 * Check and award eligible badges to a user after a quiz attempt.
 * Called automatically when a user passes a quiz.
 */
async function checkAndAwardBadges(userId) {
  try {
    // Fetch all badge definitions
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*');
    if (badgesError) throw badgesError;

    // Fetch already awarded badges for this user
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const awardedIds = new Set((userBadges || []).map(b => b.badge_id));

    for (const badge of badges) {
      if (awardedIds.has(badge.id)) continue; // already earned

      const threshold = badge.criteria_value?.threshold || 0;
      let earned = false;

      switch (badge.criteria_type) {
        case 'sessions_completed': {
          // Count completed sessions the user participated in
          const { count } = await supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .or(`host_id.eq.${userId}`);
          earned = (count || 0) >= threshold;
          break;
        }

        case 'quiz_passed': {
          const { count } = await supabase
            .from('quiz_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('passed', true);
          earned = (count || 0) >= threshold;
          break;
        }

        case 'xp_threshold': {
          const { data: profile } = await supabase
            .from('profiles')
            .select('xp_points')
            .eq('id', userId)
            .single();
          earned = (profile?.xp_points || 0) >= threshold;
          break;
        }

        case 'skills_taught': {
          const { count } = await supabase
            .from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', userId)
            .eq('status', 'completed');
          earned = (count || 0) >= threshold;
          break;
        }

        case 'skills_learned': {
          const { count } = await supabase
            .from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('learner_id', userId)
            .eq('status', 'completed');
          earned = (count || 0) >= threshold;
          break;
        }
      }

      if (earned) {
        await supabase.from('user_badges').insert({
          user_id:        userId,
          badge_id:       badge.id,
          awarded_reason: `Automatically awarded: ${badge.name}`
        });

        // Award XP for earning badge
        await supabase.rpc('increment_xp', { user_id: userId, amount: 50 });

        console.log(`Badge awarded: ${badge.name} → user ${userId}`);
      }
    }
  } catch (err) {
    // Badge awarding is non-critical — log but don't fail the request
    console.error('Badge check error:', err.message);
  }
}

module.exports = { checkAndAwardBadges };