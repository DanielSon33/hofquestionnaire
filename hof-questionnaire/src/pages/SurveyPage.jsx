import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function QuestionField({ question, value, onChange }) {
  switch (question.type) {
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Deine Antwort …"
          className="hof-textarea"
        />
      )
    case 'select':
      return (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="hof-select pr-10"
          >
            <option value="">– bitte wählen –</option>
            {(question.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/50">↓</span>
        </div>
      )
    case 'radio':
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt) => (
            <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-full border px-5 py-3 transition font-body text-base ${value === opt ? 'border-ink bg-ink/10' : 'border-black/20 bg-black/5 hover:border-ink/50'}`}>
              <span className={`h-3 w-3 rounded-full border-2 border-ink shrink-0 ${value === opt ? 'bg-ink' : ''}`} />
              <input type="radio" name={question.id} value={opt} checked={value === opt} onChange={() => onChange(question.id, opt)} className="sr-only" />
              {opt}
            </label>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt) => {
            const checked = (value || '').split(',').map(s => s.trim()).includes(opt)
            const toggle = () => {
              const arr = (value || '').split(',').map(s => s.trim()).filter(Boolean)
              const next = checked ? arr.filter(v => v !== opt) : [...arr, opt]
              onChange(question.id, next.join(', '))
            }
            return (
              <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-full border px-5 py-3 transition font-body text-base ${checked ? 'border-ink bg-ink/10' : 'border-black/20 bg-black/5 hover:border-ink/50'}`}>
                <span className={`h-3 w-3 rounded border border-ink shrink-0 ${checked ? 'bg-ink' : ''}`} />
                <input type="checkbox" checked={checked} onChange={toggle} className="sr-only" />
                {opt}
              </label>
            )
          })}
        </div>
      )
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Deine Antwort …"
          className="hof-input"
        />
      )
  }
}

export default function SurveyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: cust, error: cErr } = await supabase
        .from('customers').select('*').eq('slug', slug).single()
      if (cErr || !cust) throw new Error('Fragebogen nicht gefunden.')
      setCustomer(cust)

      const { data: cqData, error: cqErr } = await supabase
        .from('customer_questions')
        .select('question:question_id(id, text, type, options, sort_order)')
        .eq('customer_id', cust.id).eq('is_active', true)
      if (cqErr) throw cqErr

      const activeQs = (cqData || [])
        .map(cq => cq.question).filter(Boolean)
        .sort((a, b) => a.sort_order - b.sort_order)
      setQuestions(activeQs)

      const { data: respData } = await supabase
        .from('responses').select('question_id, value').eq('customer_id', cust.id)
      const map = {}
      ;(respData || []).forEach(r => { map[r.question_id] = r.value ?? '' })
      setAnswers(map)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  const filledCount = questions.filter(q => (answers[q.id] || '').trim()).length
  const progress = questions.length ? Math.round((filledCount / questions.length) * 100) : 0

  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const upserts = questions.map(q => ({
        customer_id: customer.id,
        question_id: q.id,
        value: answers[q.id] ?? '',
        submitted_at: now,
      }))
      const { error: upsertErr } = await supabase
        .from('responses').upsert(upserts, { onConflict: 'customer_id,question_id' })
      if (upsertErr) throw upsertErr

      const { error: fnErr } = await supabase.functions.invoke('send-survey-email', {
        body: { customer_id: customer.id },
      })
      if (fnErr) console.warn('E-Mail Fehler:', fnErr.message)
      navigate(`/survey/${slug}/danke`)
    } catch (err) {
      setError(err.message || 'Fehler beim Absenden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lime">
        <p className="font-mono text-xs tracking-widest uppercase text-ink/50 animate-pulse">Wird geladen …</p>
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lime px-8">
        <div className="text-center">
          <p className="font-display text-6xl font-black uppercase text-ink leading-none mb-4">404</p>
          <p className="font-body text-lg text-ink/60">Fragebogen nicht gefunden.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lime">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="hof-counter">{filledCount} / {questions.length} beantwortet</span>
        <span className="hof-counter">HOF STUDIO</span>
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-0.5 bg-black/10">
        <div
          className="h-full bg-ink transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 pt-24 pb-32 md:px-10">
        {/* Header */}
        <div className="mb-16">
          <p className="hof-label mb-3">00 – Start</p>
          <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight text-ink md:text-7xl">
            {customer?.name}
          </h1>
          <p className="mt-4 font-body text-lg text-ink/70 leading-relaxed">
            Dieser Fragebogen hilft uns, deine Marke zu verstehen. Nimm dir Zeit — es gibt keine falschen Antworten.
          </p>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-14">
          {questions.map((q, idx) => (
            <div key={q.id} className="group">
              <p className="hof-label">
                {String(idx + 1).padStart(2, '0')} — Frage
              </p>
              <p className="font-body text-xl text-ink mb-4 leading-snug md:text-2xl">
                {q.text}
              </p>
              <QuestionField
                question={q}
                value={answers[q.id] ?? ''}
                onChange={handleChange}
              />
            </div>
          ))}

          {error && (
            <p className="rounded-full border border-red-400 bg-red-50 px-5 py-3 text-sm font-mono text-red-700">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button type="submit" disabled={submitting} className="btn-pill-dark text-base px-8 py-4">
              {submitting ? 'Wird gesendet …' : 'Absenden →'}
            </button>
            <p className="mt-4 text-xs font-mono text-ink/40 tracking-wide">
              Deine Daten werden vertraulich behandelt.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
