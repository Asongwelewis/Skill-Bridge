const GenerateQuizCommand = require('../commands/GenerateQuizCommand');
const SubmitAttemptCommand = require('../commands/SubmitAttemptCommand');
const GetQuizQuery         = require('../queries/GetQuizQuery');
const GetResultQuery       = require('../queries/GetResultQuery');
const supabase             = require('../supabaseClient');

// GET /api/quizzes/session/:sessionId
async function getQuizBySession(req, res) {
  try {
    const query  = new GetQuizQuery({ sessionId: req.params.sessionId });
    const result = await query.execute();
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// GET /api/quizzes/:quizId
async function getQuiz(req, res) {
  try {
    const query  = new GetQuizQuery({ quizId: req.params.quizId });
    const result = await query.execute();
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// POST /api/quizzes/:quizId/attempt
async function submitAttempt(req, res) {
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }

  try {
    const command = new SubmitAttemptCommand({
      quizId:  req.params.quizId,
      userId:  req.user.id,
      answers
    });
    const result = await command.execute();
    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'ALREADY_ATTEMPTED') {
      return res.status(409).json({ error: 'You have already attempted this quiz' });
    }
    if (err.message === 'Quiz not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

// GET /api/quizzes/:quizId/result
async function getMyResult(req, res) {
  try {
    const query  = new GetResultQuery({
      quizId: req.params.quizId,
      userId: req.user.id
    });
    const result = await query.execute();
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = { getQuizBySession, getQuiz, submitAttempt, getMyResult };