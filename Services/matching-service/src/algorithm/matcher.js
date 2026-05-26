/**
 * SkillBridge Matching Algorithm
 *
 * Scoring breakdown (total 100 points):
 *  - Skill match (required):     base 60 pts
 *  - Proficiency gap (sweet spot): up to 20 pts  (teacher level - learner level = 1-2 is ideal)
 *  - Timezone proximity:           up to 20 pts  (same timezone = full points)
 */

/**
 * Calculate match score between a learner and a teacher for a specific skill.
 * @param {Object} learnerSkill  - user_skill row for the learner
 * @param {Object} teacherSkill  - user_skill row for the teacher
 * @param {Object} learner       - profile row for the learner
 * @param {Object} teacher       - profile row for the teacher
 * @returns {number}             - score 0-100
 */
function calculateMatchScore(learnerSkill, teacherSkill, learner, teacher) {
  let score = 60; // base: skill match confirmed

  // ── Proficiency gap score (0-20) ─────────────────────────
  // Ideal: teacher is 1-2 levels above learner
  const gap = teacherSkill.proficiency_level - learnerSkill.proficiency_level;
  if (gap >= 1 && gap <= 2) {
    score += 20;          // perfect gap
  } else if (gap === 3) {
    score += 10;          // teacher too advanced but still ok
  } else if (gap >= 4) {
    score += 5;           // very large gap, harder to teach
  } else if (gap <= 0) {
    score += 0;           // teacher not more advanced than learner
  }

  // ── Timezone proximity score (0-20) ──────────────────────
  if (learner.timezone && teacher.timezone) {
    if (learner.timezone === teacher.timezone) {
      score += 20;        // same timezone
    } else {
      // Partial score for same region prefix e.g. "Africa/Lagos" vs "Africa/Douala"
      const learnerRegion = learner.timezone.split('/')[0];
      const teacherRegion = teacher.timezone.split('/')[0];
      if (learnerRegion === teacherRegion) score += 10;
    }
  }

  return Math.min(score, 100);
}

/**
 * Find all possible matches for a given learner.
 * @param {string} learnerId        - UUID of the learner
 * @param {Array}  learnerSkills    - user_skills rows for the learner (role=learn or both)
 * @param {Array}  allTeacherSkills - all user_skills rows where role=teach or both
 * @param {Array}  profiles         - all profile rows
 * @param {Array}  existingMatches  - already existing match rows to avoid duplicates
 * @returns {Array}                 - sorted candidate matches [{learnerId, teacherId, skillId, score}]
 */
function findMatches(learnerId, learnerSkills, allTeacherSkills, profiles, existingMatches) {
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
  const learner    = profileMap[learnerId];
  if (!learner) return [];

  // Skills the learner wants to learn
  const learnSkills = learnerSkills.filter(
    s => (s.role === 'learn' || s.role === 'both') && s.user_id === learnerId
  );

  // Existing match keys to avoid duplicates
  const existingKeys = new Set(
    existingMatches.map(m => `${m.learner_id}-${m.teacher_id}-${m.skill_id}`)
  );

  const candidates = [];

  for (const learnerSkill of learnSkills) {
    // Find teachers who can teach this skill
    const matchingTeachers = allTeacherSkills.filter(
      ts =>
        ts.skill_id === learnerSkill.skill_id &&
        ts.user_id  !== learnerId &&
        (ts.role === 'teach' || ts.role === 'both') &&
        ts.is_active
    );

    for (const teacherSkill of matchingTeachers) {
      const key = `${learnerId}-${teacherSkill.user_id}-${learnerSkill.skill_id}`;
      if (existingKeys.has(key)) continue; // skip already matched pairs

      const teacher = profileMap[teacherSkill.user_id];
      if (!teacher) continue;

      const score = calculateMatchScore(learnerSkill, teacherSkill, learner, teacher);

      // Only suggest matches above minimum threshold
      if (score >= 60) {
        candidates.push({
          learner_id:  learnerId,
          teacher_id:  teacherSkill.user_id,
          skill_id:    learnerSkill.skill_id,
          match_score: score
        });
      }
    }
  }

  // Sort best matches first
  return candidates.sort((a, b) => b.match_score - a.match_score);
}

module.exports = { calculateMatchScore, findMatches };