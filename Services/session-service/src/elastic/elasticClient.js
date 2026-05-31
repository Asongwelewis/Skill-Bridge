const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node:  process.env.ELASTIC_URL || 'https://elasticsearch-master:9200',
  auth: {
    username: 'elastic',
    password:  process.env.ELASTIC_PASSWORD || 'n5ulqqPvt2bZki98'
  },
  tls: { rejectUnauthorized: false } // self-signed cert
});

client.ping()
  .then(() => console.log('Elasticsearch connected'))
  .catch(err => console.error('Elasticsearch connection failed:', err.message));

/**
 * Index a session transcript after session completes
 */
async function indexTranscript(session) {
  try {
    await client.index({
      index:    'session_transcripts',
      id:       session.id,
      document: {
        sessionId:  session.id,
        userId:     session.host_id,
        skillTopic: session.skill_topic || 'General',
        transcript: session.transcript  || '',
        createdAt:  new Date()
      }
    });
    console.log(`[Elastic] Indexed transcript for session ${session.id}`);
  } catch (err) {
    // Non-critical — log but don't fail the request
    console.error('[Elastic] Index error:', err.message);
  }
}

/**
 * Search session transcripts by keyword
 */
async function searchTranscripts(query, userId = null) {
  try {
    const must = [{ match: { transcript: query } }];
    if (userId) must.push({ term: { userId } });

    const result = await client.search({
      index: 'session_transcripts',
      query: { bool: { must } },
      highlight: {
        fields: { transcript: { fragment_size: 150, number_of_fragments: 1 } }
      }
    });

    return result.hits.hits.map(h => ({
      sessionId:  h._source.sessionId,
      skillTopic: h._source.skillTopic,
      createdAt:  h._source.createdAt,
      highlight:  h.highlight?.transcript?.[0] || ''
    }));
  } catch (err) {
    console.error('[Elastic] Search error:', err.message);
    return null; // null signals graceful degradation
  }
}

module.exports = { indexTranscript, searchTranscripts };