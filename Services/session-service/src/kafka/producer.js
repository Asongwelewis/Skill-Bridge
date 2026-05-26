const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'session-service',
  brokers:  [process.env.KAFKA_BROKER || 'skillbridge-kafka:9092']
});

const producer = kafka.producer();
let connected  = false;

async function startKafkaProducer() {
  await producer.connect();
  connected = true;
}

/**
 * Publish a session.completed event so the Quiz Service
 * can automatically generate a post-session quiz.
 */
async function publishSessionCompleted(session) {
  if (!connected) {
    console.warn('Kafka producer not connected — skipping event');
    return;
  }

  await producer.send({
    topic: 'session.completed',
    messages: [
      {
        key:   session.id,
        value: JSON.stringify({
          sessionId:       session.id,
          matchId:         session.match_id,
          hostId:          session.host_id,
          durationSeconds: session.duration_seconds,
          completedAt:     new Date().toISOString()
        })
      }
    ]
  });

  console.log(`Kafka: session.completed published for session ${session.id}`);
}

async function stopKafkaProducer() {
  await producer.disconnect();
  connected = false;
}

module.exports = { startKafkaProducer, publishSessionCompleted, stopKafkaProducer };