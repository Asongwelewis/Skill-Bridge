import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Brain, CheckCircle, XCircle, Award, ArrowRight, Trophy, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { quizApi } from '../lib/api'
import toast from 'react-hot-toast'

const DEMO_QUIZ = {
  _id: 'demo',
  title: 'Session Knowledge Check',
  questions: [
    { id: 'q1', question: 'What is the primary purpose of SkillBridge?', options: ['Entertainment', 'Peer skill exchange', 'Competition', 'Social media'], correct: 1 },
    { id: 'q2', question: 'Which technology powers the video sessions?', options: ['YouTube Live', 'WebRTC', 'Flash Player', 'Bluetooth'], correct: 1 },
    { id: 'q3', question: 'What do you earn when you pass a quiz?', options: ['Money', 'Badges and XP', 'Certificates only', 'Nothing'], correct: 1 },
    { id: 'q4', question: 'How does SkillBridge match users?', options: ['Randomly', 'By location', 'Based on complementary skills', 'By age'], correct: 2 },
    { id: 'q5', question: 'What score do you need to pass a quiz?', options: ['40%', '50%', '60%', '80%'], correct: 2 },
  ],
}

export default function Quiz() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    quizApi.getQuiz(sessionId)
      .then(res => setQuiz(res.data?.quiz || res.data))
      .catch(() => setQuiz(DEMO_QUIZ))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleAnswer = (questionId, idx) => {
    if (submitted) return
    setAnswers(a => ({ ...a, [questionId]: idx }))
  }

  const handleSubmit = async () => {
    const questions = quiz?.questions || []
    if (Object.keys(answers).length < questions.length) {
      return toast.error('Please answer all questions first')
    }

    setSubmitting(true)
    try {
      let data
      try {
        const res = await quizApi.submitQuiz(sessionId, answers)
        data = res.data
      } catch {
        let correct = 0
        questions.forEach(q => {
          if (answers[q.id] === q.correct) correct++
        })
        const score = Math.round((correct / questions.length) * 100)
        data = { score, correct, total: questions.length, passed: score >= 60, badge: score >= 80 ? 'Quiz Master' : null }
      }

      setResult(data)
      setSubmitted(true)
      if (data.passed) toast.success('🎉 Quiz passed! Badge awarded!')
      else toast.error('Quiz failed. Keep practising!')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-transition" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="glass-panel card-3d px-6 py-5 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading quiz…</p>
        </div>
      </div>
    )
  }

  const questions = quiz?.questions || []
  const answered = Object.keys(answers).length

  if (submitted && result) {
    const passed = result.passed || result.score >= 60
    return (
      <div className="min-h-screen theme-transition animate-fade-in" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="relative mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 70%)' }} />
            <div className="absolute right-0 top-20 h-64 w-64 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.14) 0%, transparent 70%)', animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 glass-panel card-3d p-6 md:p-8 text-center">
            <div className={`w-24 h-24 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
              {passed ? <Trophy size={40} className="text-emerald-300" /> : <XCircle size={40} className="text-red-300" />}
            </div>

            <div className="glass-chip inline-flex mb-4">
              <Sparkles size={12} />
              Quiz results
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold mb-2">
              {passed ? 'Excellent work!' : 'Keep practising!'}
            </h1>
            <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              {passed
                ? 'You passed the quiz and earned a badge.'
                : `You scored ${result.score}%. You need 60% to pass.`}
            </p>

            <div className="relative w-36 h-36 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke={passed ? '#10B981' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${result.score || 0} 100`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold">{result.score || 0}%</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {result.correct}/{result.total || questions.length}
                </p>
              </div>
            </div>

            {passed && result.badge && (
              <div className="mb-6 glass-panel p-4 rounded-[1.5rem] flex items-center justify-center gap-3">
                <Award size={24} className="text-amber-300" />
                <div className="text-left">
                  <p className="text-amber-300 font-semibold text-sm">Badge earned!</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.badge}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="workspace-button justify-center py-3 text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="workspace-button justify-center py-3 text-sm"
                style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}
              >
                View Profile
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const progress = questions.length ? (answered / questions.length) * 100 : 0

  return (
    <div className="min-h-screen theme-transition" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full blur-3xl animate-float"
            style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.14) 0%, transparent 70%)' }} />
          <div className="absolute right-0 top-20 h-64 w-64 rounded-full blur-3xl animate-float"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', animationDelay: '1s' }} />
        </div>

        <header className="glass-panel card-3d relative overflow-hidden px-5 md:px-6 py-4 md:py-5 mb-5">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-[1rem_1.25rem_1rem_1.25rem] bg-indigo-500/20 border border-white/10 flex items-center justify-center">
                <Brain size={18} className="text-indigo-300" />
              </div>
              <div>
                <div className="glass-chip inline-flex mb-2">
                  <Sparkles size={12} />
                  Knowledge check
                </div>
                <p className="text-lg md:text-xl font-semibold leading-tight">{quiz?.title || 'Quiz'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {answered} of {questions.length} answered
                </p>
              </div>
            </div>

            <div className="w-full lg:w-64">
              <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-subtle)' }}>
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {questions.map((_, i) => {
            const answeredQuestion = answers[questions[i]?.id] !== undefined
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-10 h-10 rounded-[1rem_1.25rem_1rem_1.25rem] text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: i === current
                    ? 'rgba(99,102,241,0.26)'
                    : answeredQuestion
                      ? 'rgba(16,185,129,0.14)'
                      : 'rgba(255,255,255,0.08)',
                  color: i === current
                    ? '#fff'
                    : answeredQuestion
                      ? '#34d399'
                      : 'var(--text-muted)',
                  border: i === current
                    ? '1px solid rgba(129,140,248,0.35)'
                    : answeredQuestion
                      ? '1px solid rgba(16,185,129,0.25)'
                      : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {q && (
          <div className="glass-panel card-3d p-6 md:p-8 max-w-3xl mx-auto">
            <span className="glass-chip mb-5 inline-flex">
              Question {current + 1} of {questions.length}
            </span>

            <p className="text-xl md:text-2xl font-semibold mb-8 leading-relaxed">
              {q.question}
            </p>

            <div className="space-y-3">
              {q.options?.map((option, idx) => {
                const selected = answers[q.id] === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(q.id, idx)}
                    className="w-full text-left p-4 rounded-[1.25rem] flex items-center gap-4 group transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: selected ? 'rgba(79,70,229,0.14)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${selected ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.12)'}`,
                      boxShadow: selected ? '0 0 0 3px rgba(79,70,229,0.10)' : 'none',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: selected ? '#4F46E5' : 'rgba(255,255,255,0.20)',
                        background: selected ? '#4F46E5' : 'transparent',
                      }}
                    >
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium" style={{ color: selected ? 'var(--text)' : 'var(--text-muted)' }}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between items-center mt-8 gap-3">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="workspace-button text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                  className="workspace-button text-sm"
                  style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || answered < questions.length}
                  className="workspace-button text-sm"
                  style={{
                    background: answered < questions.length ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.85)',
                    borderColor: answered < questions.length ? 'rgba(255,255,255,0.12)' : 'rgba(16,185,129,0.30)',
                    color: answered < questions.length ? 'var(--text-muted)' : '#fff',
                  }}
                >
                  <CheckCircle size={15} />
                  {submitting ? 'Submitting…' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
