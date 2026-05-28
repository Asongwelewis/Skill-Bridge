/**
 * CQRS — Command Side
 * SubmitAttemptCommand: scores answers and writes attempt + responses.
 */
const supabase                = require('../supabaseClient');
const { checkAndAwardBadges } = require('../badges/badgeAwarder');

class SubmitAttemptCommand {
  constructor({ quizId, userId, answers }) {
    this.quizId  = quizId;
    this.userId  = userId;
    this.answers = answers; // [{ question_id, answer_given }]
  }

  async execute() {
    // 1. Fetch quiz with correct answers (needed for scoring)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', this.quizId)
      .single();

    if (quizError || !quiz) throw new Error('Quiz not found');

    // 2. Check for existing attempt
    const { data: existing } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', this.quizId)
      .eq('user_id', this.userId)
      .single();

    if (existing) throw new Error('ALREADY_ATTEMPTED');

    // 3. Score answers (command logic)
    const questionMap = Object.fromEntries(
      quiz.quiz_questions.map(q => [q.id, q])
    );

    let correct = 0;
    const responses = this.answers.map(({ question_id, answer_given }) => {
      const question   = questionMap[question_id];
      const is_correct = question?.correct_answer === answer_given;
      if (is_correct) correct++;
      return { question_id, answer_given, is_correct };
    });

    const score  = Math.round((correct / quiz.quiz_questions.length) * 100);
    const passed = score >= quiz.passing_score;

    // 4. Write attempt to database
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id:      this.quizId,
        user_id:      this.userId,
        score,
        passed,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) throw new Error(attemptError.message);

    // 5. Write responses to database
    await supabase.from('quiz_responses').insert(
      responses.map(r => ({
        attempt_id:   attempt.id,
        question_id:  r.question_id,
        answer_given: r.answer_given,
        is_correct:   r.is_correct
      }))
    );

    // 6. Award XP and check badges if passed
    if (passed) {
      await supabase.rpc('increment_xp', { user_id: this.userId, amount: 100 });
      checkAndAwardBadges(this.userId); // non-blocking
    }

    return {
      attempt_id:      attempt.id,
      score,
      passed,
      correct_count:   correct,
      total_questions: quiz.quiz_questions.length,
      passing_score:   quiz.passing_score,
      responses
    };
  }
}

module.exports = SubmitAttemptCommand;