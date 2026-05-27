const { Kafka }        = require('kafkajs');
const supabase         = require('../supabaseClient');
const { generateQuiz } = require('../ai/quizGenerator');

const kafka    = new Kafka({
  clientId: 'quiz-service',
  brokers:  [process.env.KAFKA_BROKER || 'skillbridge-kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'quiz-group' });

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'session.completed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log('Kafka: session.completed received', event);

        const { sessionId, matchId } = event;

        // 1. Get the skill that was taught in this session
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('skill_id, skills(name, category)')
          .eq('id', matchId)
          .single();

        if (matchError || !match) {
          console.error('Could not find match for session:', matchId);
          return;
        }

        const skillName     = match.skills.name;
        const skillCategory = match.skills.category;

        // 2. Call Claude AI to generate quiz questions
        console.log(`Generating AI quiz for skill: ${skillName}`);
        const quizData = await generateQuiz(skillName, skillCategory, 5);

        // 3. Save quiz to database
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            session_id:    sessionId,
            title:         quizData.title,
            status:        'published',
            passing_score: 70
          })
          .select()
          .single();

        if (quizError) throw new Error(quizError.message);

        // 4. Save questions
        const questions = quizData.questions.map((q, index) => ({
          quiz_id:        quiz.id,
          question_text:  q.question_text,
          options:        q.options,
          correct_answer: q.correct_answer,
          order_index:    index
        }));

        await supabase.from('quiz_questions').insert(questions);

        console.log(`Quiz created: ${quiz.id} with ${questions.length} questions for session ${sessionId}`);

      } catch (err) {
        console.error('Quiz generation error:', err.message);
      }
    }
  });
}

async function stopKafkaConsumer() {
  await consumer.disconnect();
}

module.exports = { startKafkaConsumer, stopKafkaConsumer };