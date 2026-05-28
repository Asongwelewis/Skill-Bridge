/**
 * CQRS — Query Side
 * GetQuizQuery: fetches quiz data for display.
 * Strips correct answers before returning (security).
 */
const supabase = require('../supabaseClient');

class GetQuizQuery {
  constructor({ quizId, sessionId }) {
    this.quizId    = quizId;
    this.sessionId = sessionId;
  }

  async execute() {
    let query = supabase
      .from('quizzes')
      .select('*, quiz_questions(*)');

    if (this.quizId) {
      query = query.eq('id', this.quizId);
    } else if (this.sessionId) {
      query = query.eq('session_id', this.sessionId).eq('status', 'published');
    } else {
      throw new Error('quizId or sessionId required');
    }

    const { data, error } = await query.single();
    if (error) throw new Error('Quiz not found');

    // Query side never exposes correct answers
    return {
      ...data,
      quiz_questions: data.quiz_questions.map(
        ({ correct_answer, ...q }) => q
      )
    };
  }
}

module.exports = GetQuizQuery;