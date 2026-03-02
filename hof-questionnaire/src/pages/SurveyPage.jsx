import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Spinner from '../components/ui/Spinner.jsx'
import { Send } from 'lucide-react'

// ── Single Question Field ────────────────────────────────────
function QuestionField({ question, value, onChange }) {
  const base = 'input-base'

  switch (question.type) {
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Ihre Antwort …"
          className={`${base} resize-none`}
        />
      )
    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          className={base}
        >
          <option value="">– bitte wählen –</option>
          {(question.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    case 'radio':
      return (
        <div className="space-y-2 pt-1">
          {(question.options || []).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(question.id, opt)}
                className="h-4 w-4 text-brand-600"
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-2 pt-1">
          {(question.options || []).map((opt) => {
            const checked = (value || '').split(',').map((s) => s.trim()).includes(opt)
            const toggle = () => {
              const arr = (value || '').split(',').map((s) => s.trim()).filter(Boolean)
              const next = checked ? arr.filter((v) => v !== opt) : [...arr, opt]
              onChange(question.id, next.join(', '))
            }
            return (
              <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={toggle}
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span className="text-sm text-gray-700">{opt}</span>
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
          placeholder="Ihre Antwort …"
          className={base}
        />
      )
  }
}

// ── Main Survey Page ─────────────────────────────────────────
export default function SurveyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [questions, setQuestions] = useState([])  // active questions with responses
  const [answers, setAnswers] = useState({})       // { question_id: value }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Find customer by slug
      const { data: cust, error: cErr } = await supabase
        .from('customers')
        .select('*')
        .eq('slug', slug)
        .single()
      if (cErr || !cust) throw new Error('Fragebogen nicht gefunden.')
      setCustomer(cust)

      // 2. Load active questions for this customer
      const { data: cqData, error: cqErr } = await supabase
        .from('customer_questions')
        .select('question:question_id(id, text, type, options, sort_order)')
        .eq('customer_id', cust.id)
        .eq('is_active', true)
        .order('question(sort_order)')
      if (cqErr) throw cqErr

      const activeQs = (cqData || [])
        .map((cq) => cq.question)
        .filter(Boolean)
        .sort((a, b) => a.sort_order - b.sort_order)
      setQuestions(activeQs)

      // 3. Load existing responses (prefilled or already saved)
      const { data: respData } = await supabase
        .from('responses')
        .select('question_id, value')
        .eq('customer_id', cust.id)

      const map = {}
      ;(respData || []).forEach((r) => { map[r.question_id] = r.value ?? '' })
      setAnswers(map)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Update progress bar
  useEffect(() => {
    if (!questions.length) return
    const filled = questions.filter((q) => (answers[q.id] || '').trim()).length
    setProgress(Math.round((filled / questions.length) * 100))
  }, [answers, questions])

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const upserts = questions.map((q) => ({
        customer_id: customer.id,
        question_id: q.id,
        value: answers[q.id] ?? '',
        submitted_at: now,
      }))

      const { error: upsertErr } = await supabase
        .from('responses')
        .upsert(upserts, { onConflict: 'customer_id,question_id' })
      if (upsertErr) throw upsertErr

      // Trigger Edge Function to send email
      const { error: fnErr } = await supabase.functions.invoke('send-survey-email', {
        body: { customer_id: customer.id },
      })
      // If Edge Function fails we still navigate – email is non-critical
      if (fnErr) console.warn('E-Mail konnte nicht gesendet werden:', fnErr.message)

      navigate(`/survey/${slug}/danke`)
    } catch (err) {
      setError(err.message || 'Fehler beim Absenden. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── States ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm w-full px-8 py-10 text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h1 className="mb-2 text-lg font-semibold text-gray-900">Fragebogen nicht gefunden</h1>
          <p className="text-sm text-gray-500">
            Der Link ist ungültig oder der Fragebogen wurde entfernt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-medium text-brand-700">HOF Studio · Fragebogen</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Willkommen, {customer?.name}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bitte beantworten Sie die folgenden Fragen, damit wir Sie bestmöglich kennenlernen und
            Ihr Projekt individuell gestalten können.
          </p>
          {/* Progress */}
          <div className="mt-5 mx-auto max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
              <span>Fortschritt</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="card px-6 py-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {idx + 1}
                </span>
                <label className="text-sm font-medium text-gray-900 leading-snug">{q.text}</label>
              </div>
              <div className="pl-9">
                <QuestionField
                  question={q}
                  value={answers[q.id] ?? ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          ))}

          {error && (
            <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-base"
          >
            {submitting ? (
              <>
                <Spinner size="sm" />
                Wird gesendet …
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Fragebogen absenden
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Ihre Daten werden vertraulich behandelt und ausschließlich für Ihr Projekt verwendet.
          </p>
        </form>
      </main>
    </div>
  )
}
