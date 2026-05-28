const { Kafka }           = require('kafkajs');
const supabase            = require('../supabaseClient');
const GenerateQuizCommand = require('../commands/GenerateQuizCommand');

const kafka = new Kafka({
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

        // 2 & 3. Use GenerateQuizCommand (CQRS command side)
        const command = new GenerateQuizCommand({
          sessionId,
          matchId,
          skillName,
          skillCategory
        });

        await command.execute();

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