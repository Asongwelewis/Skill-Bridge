/**
 * CQRS — Query Side
 * GetResultQuery: fetches a user's attempt result including
 * correct answers (shown after submission).
 */
const supabase = require('../supabaseClient');

class GetResultQuery {
  constructor({ quizId, userId }) {
    this.quizId = quizId;
    this.userId = userId;
  }

  async execute() {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quiz_responses(*, quiz_questions(question_text, correct_answer))')
      .eq('quiz_id', this.quizId)
      .eq('user_id', this.userId)
      .single();

    if (error) throw new Error('No attempt found for this quiz');
    return data;
  }
}

module.exports = GetResultQuery;