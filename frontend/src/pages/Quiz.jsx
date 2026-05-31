import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Brain, CheckCircle, XCircle, Award, ArrowRight, Trophy } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
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
  const { isDark } = useTheme()

  const [quiz,       setQuiz]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [answers,    setAnswers]    = useState({})
  const [submitted,  setSubmitted]  = useState(false)
  const [result,     setResult]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [current,    setCurrent]    = useState(0)

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
    if (Object.keys(answers).length < questions.length)
      return toast.error('Please answer all questions first')
    setSubmitting(true)
    try {
      let data
      try {
        const res = await quizApi.submitQuiz(sessionId, answers)
        data = res.data
      } catch {
        let correct = 0
        questions.forEach(q => { if (answers[q.id] === q.correct) correct++ })
        const score = Math.round((correct / questions.length) * 100)
        data = { score, correct, total: questions.length, passed: score >= 60, badge: score >= 80 ? 'Quiz Master' : null }
      }
      setResult(data)
      setSubmitted(true)
      if (data.passed) toast.success('🎉 Quiz passed! Badge awarded!')
      else toast.error('Quiz failed. Keep practising!')
    } finally { setSubmitting(false) }
  }

  const bg     = isDark ? '#09091a' : '#f3f4ff'
  const surface = isDark ? 'rgba(15,14,26,0.92)' : '#fff'
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(79,70,229,0.12)'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading quiz…</p>
      </div>
    </div>
  )

  const questions = quiz?.questions || []
  const answered  = Object.keys(answers).length

  /* ── Result screen ── */
  if (submitted && result) {
    const passed = result.passed || result.score >= 60
    return (
      <div className="min-h-screen flex items-center justify-center p-6 theme-transition animate-fade-in"
        style={{ background: bg, color: 'var(--text)' }}>
        <div className="max-w-md w-full text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop-in
            ${passed ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
            {passed
              ? <Trophy size={40} className="text-emerald-400" />
              : <XCircle size={40} className="text-red-400" />}
          </div>

          <h1 className="text-3xl font-bold mb-2 animate-slide-up delay-100">
            {passed ? 'Excellent Work!' : 'Keep Practising!'}
          </h1>
          <p className="mb-8 animate-slide-up delay-150" style={{ color: 'var(--text-muted)' }}>
            {passed
              ? 'You passed the quiz and earned a badge!'
              : `You scored ${result.score}%. You need 60% to pass.`}
          </p>

          {/* Score ring */}
          <div className="relative w-36 h-36 mx-auto mb-8 animate-scale-in delay-200">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={passed ? '#10B981' : '#ef4444'} strokeWidth="3"
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
            <div className="mb-6 p-4 rounded-2xl flex items-center justify-center gap-3 animate-pop-in delay-300"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Award size={24} className="text-amber-400" />
              <div className="text-left">
                <p className="text-amber-400 font-semibold text-sm">Badge Earned!</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.badge}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 animate-slide-up delay-400">
            <button onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              Dashboard
            </button>
            <button onClick={() => navigate('/profile')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
                transition-all hover:-translate-y-0.5">
              View Profile <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]

  /* ── Quiz screen ── */
  return (
    <div className="min-h-screen flex flex-col theme-transition" style={{ background: bg, color: 'var(--text)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between animate-slide-down"
        style={{ background: surface, borderBottom: `1px solid ${borderC}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Brain size={15} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{quiz?.title || 'Knowledge Check'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{answered} of {questions.length} answered</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* Question pills */}
          <div className="flex gap-2 justify-center mb-8 flex-wrap animate-fade-in">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: i === current
                    ? '#4F46E5'
                    : answers[questions[i]?.id] !== undefined
                      ? 'rgba(16,185,129,0.15)'
                      : 'var(--surface)',
                  color: i === current ? '#fff' : answers[questions[i]?.id] !== undefined ? '#34d399' : 'var(--text-muted)',
                  border: i === current
                    ? 'none'
                    : answers[questions[i]?.id] !== undefined
                      ? '1px solid rgba(16,185,129,0.3)'
                      : '1px solid var(--border)',
                  boxShadow: i === current ? '0 4px 12px rgba(79,70,229,0.35)' : 'none',
                }}>
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question card */}
          {q && (
            <div key={current} className="rounded-3xl p-8 animate-scale-in"
              style={{ background: surface, border: `1px solid ${borderC}`, boxShadow: 'var(--card-shadow)' }}>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5"
                style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#818CF8' }}>
                Question {current + 1} of {questions.length}
              </span>

              <p className="text-xl font-semibold mb-8 leading-relaxed">{q.question}</p>

              <div className="space-y-3">
                {q.options?.map((option, idx) => {
                  const selected = answers[q.id] === idx
                  return (
                    <button key={idx} onClick={() => handleAnswer(q.id, idx)}
                      className="w-full text-left p-4 rounded-2xl flex items-center gap-4 group
                        transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: selected ? 'rgba(79,70,229,0.12)' : 'var(--surface-3)',
                        border: `1px solid ${selected ? 'rgba(79,70,229,0.45)' : 'var(--border)'}`,
                        boxShadow: selected ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
                      }}>
                      <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: selected ? '#4F46E5' : 'var(--border-2)',
                          background: selected ? '#4F46E5' : 'transparent',
                        }}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: selected ? 'var(--text)' : 'var(--text-muted)' }}>
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-30"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  ← Previous
                </button>

                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white
                      text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/25">
                    Next →
                  </button>
                ) : (
                  <button onClick={handleSubmit}
                    disabled={submitting || answered < questions.length}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                      transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    style={{
                      background: answered < questions.length ? 'var(--surface-3)' : 'rgba(16,185,129,0.85)',
                      color: answered < questions.length ? 'var(--text-muted)' : '#fff',
                      boxShadow: answered >= questions.length ? '0 4px 16px rgba(16,185,129,0.3)' : 'none',
                    }}>
                    <CheckCircle size={15} />
                    {submitting ? 'Submitting…' : 'Submit Quiz'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
