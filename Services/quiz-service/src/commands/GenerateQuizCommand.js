/**
 * CQRS — Command Side
 * GenerateQuizCommand: creates a quiz and its questions in the database.
 * Called by the Kafka consumer when a session.completed event arrives.
 */
const supabase         = require('../supabaseClient');
const { generateQuiz } = require('../ai/quizGenerator');

class GenerateQuizCommand {
  constructor({ sessionId, matchId, skillName, skillCategory }) {
    this.sessionId     = sessionId;
    this.matchId       = matchId;
    this.skillName     = skillName;
    this.skillCategory = skillCategory;
  }

  async execute() {
    // 1. Generate questions via AI
    console.log(`[GenerateQuizCommand] Generating quiz for skill: ${this.skillName}`);
    const quizData = await generateQuiz(this.skillName, this.skillCategory, 5);

    // 2. Write quiz to database (command side — write only)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        session_id:    this.sessionId,
        title:         quizData.title,
        status:        'published',
        passing_score: 70
      })
      .select()
      .single();

    if (quizError) throw new Error(`Quiz insert failed: ${quizError.message}`);

    // 3. Write questions to database
    const questions = quizData.questions.map((q, index) => ({
      quiz_id:        quiz.id,
      question_text:  q.question_text,
      options:        q.options,
      correct_answer: q.correct_answer,
      order_index:    index
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questions);

    if (questionsError) throw new Error(`Questions insert failed: ${questionsError.message}`);

    console.log(`[GenerateQuizCommand] Quiz ${quiz.id} created with ${questions.length} questions`);
    return quiz;
  }
}

module.exports = GenerateQuizCommand;