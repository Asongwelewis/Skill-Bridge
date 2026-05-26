const { Kafka } = require('kafkajs');
const supabase   = require('../supabaseClient');
const { findMatches } = require('../algorithm/matcher');

const kafka = new Kafka({
  clientId: 'matching-service',
  brokers:  [process.env.KAFKA_BROKER || 'skillbridge-kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'matching-group' });

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user.skill.updated', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Kafka event received: ${topic}`, event);

        if (event.userId) {
          // Auto-run matching when a user updates their skills
          const [
            { data: profiles },
            { data: allUserSkills },
            { data: existingMatches }
          ] = await Promise.all([
            supabase.from('profiles').select('id, timezone'),
            supabase.from('user_skills').select('*').eq('is_active', true),
            supabase.from('matches').select('learner_id, teacher_id, skill_id')
              .or(`learner_id.eq.${event.userId},teacher_id.eq.${event.userId}`)
          ]);

          const candidates = findMatches(
            event.userId,
            allUserSkills || [],
            allUserSkills || [],
            profiles      || [],
            existingMatches || []
          );

          if (candidates.length > 0) {
            await supabase.from('matches').insert(candidates.slice(0, 5));
            console.log(`Auto-matched ${candidates.length} candidates for user ${event.userId}`);
          }
        }
      } catch (err) {
        console.error('Kafka consumer error:', err.message);
      }
    }
  });
}

async function stopKafkaConsumer() {
  await consumer.disconnect();
}

module.exports = { startKafkaConsumer, stopKafkaConsumer };