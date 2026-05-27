const { Kafka }   = require('kafkajs');
const db          = require('../db');

const kafka    = new Kafka({
  clientId: 'notification-service',
  brokers:  [process.env.KAFKA_BROKER || 'skillbridge-kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topics: ['session.completed', 'match.found', 'quiz.completed'],
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Kafka [${topic}]:`, event);

        let notification = null;

        if (topic === 'session.completed') {
          notification = {
            user_id: event.hostId,
            type:    'session_completed',
            title:   'Session Completed',
            message: `Your session has ended. Duration: ${Math.floor(event.durationSeconds / 60)} minutes.`
          };
        } else if (topic === 'match.found') {
          notification = {
            user_id: event.learnerId,
            type:    'match_found',
            title:   'New Match Found!',
            message: `You have been matched with a teacher for ${event.skillName}.`
          };
        } else if (topic === 'quiz.completed') {
          notification = {
            user_id: event.userId,
            type:    'quiz_completed',
            title:   'Quiz Results Ready',
            message: `You scored ${event.score}% on your quiz. ${event.passed ? 'Congratulations!' : 'Keep practicing!'}`
          };
        }

        if (notification) {
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, $2, $3, $4)`,
            [notification.user_id, notification.type, notification.title, notification.message]
          );
          console.log(`Notification saved for user ${notification.user_id}`);
        }
      } catch (err) {
        console.error('Notification consumer error:', err.message);
      }
    }
  });
}

async function stopKafkaConsumer() {
  await consumer.disconnect();
}

module.exports = { startKafkaConsumer, stopKafkaConsumer };