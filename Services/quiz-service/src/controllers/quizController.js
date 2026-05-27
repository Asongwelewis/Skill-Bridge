const supabase                  = require('../supabaseClient');
const { checkAndAwardBadges }   = require('../badges/badgeAwarder');

// GET /api/quizzes/session/:sessionId — get quiz for a session
async function getQuizBySession(req, res) {
  const { sessionId } = req.params;

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('session_id', sessionId)
    .eq('status', 'published')
    .single();

  if (error) return res.status(404).json({ error: 'Quiz not found for this session' });

  // Strip correct answers before sending to client
  const sanitized = {
    ...data,
    quiz_questions: data.quiz_questions.map(({ correct_answer, ...q }) => q)
  };

  res.json(sanitized);
}

// GET /api/quizzes/:quizId — get a quiz by ID
async function getQuiz(req, res) {
  const { quizId } = req.params;

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('id', quizId)
    .single();

  if (error) return res.status(404).json({ error: 'Quiz not found' });

  // Strip correct answers
  const sanitized = {
    ...data,
    quiz_questions: data.quiz_questions.map(({ correct_answer, ...q }) => q)
  };

  res.json(sanitized);
}

// POST /api/quizzes/:quizId/attempt — submit quiz answers
async function submitAttempt(req, res) {
  const { quizId }  = req.params;
  const { answers } = req.body; // [{ question_id, answer_given }]

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }

  // 1. Fetch quiz with correct answers
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found' });

  // 2. Check for existing attempt
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', req.user.id)
    .single();

  if (existing) return res.status(409).json({ error: 'You have already attempted this quiz' });

  // 3. Score the answers
  const questionMap = Object.fromEntries(quiz.quiz_questions.map(q => [q.id, q]));
  let correct = 0;

  const responses = answers.map(({ question_id, answer_given }) => {
    const question  = questionMap[question_id];
    const is_correct = question?.correct_answer === answer_given;
    if (is_correct) correct++;
    return { question_id, answer_given, is_correct };
  });

  const score  = Math.round((correct / quiz.quiz_questions.length) * 100);
  const passed = score >= quiz.passing_score;

  // 4. Save attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id:      quizId,
      user_id:      req.user.id,
      score,
      passed,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (attemptError) return res.status(400).json({ error: attemptError.message });

  // 5. Save individual responses
  const responsesWithAttempt = responses.map(r => ({
    attempt_id:   attempt.id,
    question_id:  r.question_id,
    answer_given: r.answer_given,
    is_correct:   r.is_correct
  }));

  await supabase.from('quiz_responses').insert(responsesWithAttempt);

  // 6. Award XP for passing
  if (passed) {
    await supabase.rpc('increment_xp', { user_id: req.user.id, amount: 100 });
    // 7. Check and award any eligible badges (non-blocking)
    checkAndAwardBadges(req.user.id);
  }

  res.status(201).json({
    attempt_id:     attempt.id,
    score,
    passed,
    correct_count:  correct,
    total_questions: quiz.quiz_questions.length,
    passing_score:  quiz.passing_score,
    responses
  });
}

// GET /api/quizzes/:quizId/result — get attempt result for current user
async function getMyResult(req, res) {
  const { quizId } = req.params;

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, quiz_responses(*, quiz_questions(question_text, correct_answer))')
    .eq('quiz_id', quizId)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'No attempt found for this quiz' });
  res.json(data);
}

module.exports = { getQuizBySession, getQuiz, submitAttempt, getMyResult };