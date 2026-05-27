const fetch = require('node-fetch');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

async function generateQuiz(skillName, skillCategory, numQuestions = 5) {
  const prompt = `You are an expert educator creating a multiple-choice quiz.

Generate a ${numQuestions}-question quiz for someone who just completed a peer learning session on "${skillName}" (category: ${skillCategory}).

Rules:
- Questions should test practical understanding, not just definitions
- Each question must have exactly 4 options (A, B, C, D)
- One correct answer per question
- Difficulty should be beginner to intermediate level
- Questions should be clear and unambiguous

Respond ONLY with a valid JSON object, no markdown, no explanation, exactly this structure:
{
  "title": "Quiz: ${skillName} Fundamentals",
  "questions": [
    {
      "question_text": "Question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }
  ]
}`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  2000
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${err}`);
  }

  const data   = await response.json();
  const raw    = data.choices[0].message.content.trim();
  const clean  = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  if (!parsed.title || !Array.isArray(parsed.questions)) {
    throw new Error('AI returned invalid quiz structure');
  }

  return parsed;
}

module.exports = { generateQuiz };