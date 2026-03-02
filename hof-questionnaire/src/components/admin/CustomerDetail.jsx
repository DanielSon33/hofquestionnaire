import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import Spinner from '../ui/Spinner.jsx'

const BASE_URL = window.location.origin

function PreFillField({ question, value, onChange }) {
  const cls = 'hof-input-dark'
  switch (question.type) {
    case 'textarea':
      return (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Vorgabe …"
          className={`${cls} rounded-2xl`}
        />
      )
    case 'select':
      return (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            className={`${cls} appearance-none pr-10`}
          >
            <option value="">– keine Vorgabe –</option>
            {(question.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">↓</span>
        </div>
      )
    case 'radio':
    case 'checkbox':
      return (
        <div className="flex flex-wrap gap-2">
          {(question.options || []).map((opt) => {
            const active = (value || '').split(',').map(s => s.trim()).includes(opt)
            const toggle = () => {
              if (question.type === 'radio') {
                onChange(question.id, active ? '' : opt)
              } else {
                const arr = (value || '').split(',').map(s => s.trim()).filter(Boolean)
                const next = active ? arr.filter(v => v !== opt) : [...arr, opt]
                onChange(question.id, next.join(', '))
              }
            }
            return (
              <button
                key={opt}
                type="button"
                onClick={toggle}
                className={`rounded-full border px-4 py-1.5 font-mono text-xs tracking-wide transition ${active ? 'border-lime bg-lime/10 text-lime' : 'border-white/20 text-white/50 hover:border-white/40'}`}
              >
                {opt}
              </button>
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
          placeholder="Vorgabe …"
          className={cls}
        />
      )
  }
}

export default function CustomerDetail({ customer, onClose, showToast }) {
  const [questions, setQuestions] = useState([])
  const [active, setActive] = useState({})
  const [prefill, setPrefill] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const surveyUrl = `${BASE_URL}/survey/${customer.slug}`

  const load = useCallback(async () => {
    setLoading(true)

    const { data: allQs } = await supabase
      .from('questions').select('*').order('sort_order')

    const { data: cqData } = await supabase
      .from('customer_questions')
      .select('question_id, is_active')
      .eq('customer_id', customer.id)

    const { data: respData } = await supabase
      .from('responses')
      .select('question_id, value')
      .eq('customer_id', customer.id)

    const activeMap = {}
    ;(cqData || []).forEach(cq => { activeMap[cq.question_id] = cq.is_active })

    const prefillMap = {}
    ;(respData || []).forEach(r => { prefillMap[r.question_id] = r.value ?? '' })

    setQuestions(allQs || [])
    setActive(activeMap)
    setPrefill(prefillMap)
    setLoading(false)
  }, [customer.id])

  useEffect(() => { load() }, [load])

  const handleToggle = async (questionId) => {
    const next = !active[questionId]
    setActive(prev => ({ ...prev, [questionId]: next }))

    const { data: existing } = await supabase
      .from('customer_questions')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('question_id', questionId)
      .maybeSingle()

    if (existing) {
      await supabase.from('customer_questions')
        .update({ is_active: next })
        .eq('id', existing.id)
    } else {
      await supabase.from('customer_questions')
        .insert({ customer_id: customer.id, question_id: questionId, is_active: next })
    }
  }

  const handlePrefillChange = (questionId, value) => {
    setPrefill(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const now = new Date().toISOString()
    const activeQIds = questions.filter(q => active[q.id]).map(q => q.id)

    const upserts = activeQIds.map(qid => ({
      customer_id: customer.id,
      question_id: qid,
      value: prefill[qid] ?? '',
      submitted_at: now,
    }))

    if (upserts.length) {
      const { error } = await supabase
        .from('responses')
        .upsert(upserts, { onConflict: 'customer_id,question_id' })
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
    }

    showToast('Vorgaben gespeichert.')
    setSaving(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(surveyUrl)
    showToast('Link kopiert!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner light />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Survey link */}
      <div>
        <p className="hof-label-dark mb-2">Fragebogen-Link</p>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <code className="flex-1 truncate font-mono text-xs text-lime">{surveyUrl}</code>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 font-mono text-xs text-white/60 hover:border-lime hover:text-lime transition"
          >
            Kopieren
          </button>
          <a
            href={surveyUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 font-mono text-xs text-white/60 hover:border-lime hover:text-lime transition"
          >
            Öffnen →
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Questions */}
      <div>
        <p className="hof-label-dark mb-4">Fragen &amp; Vorgaben</p>
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isActive = !!active[q.id]
            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 transition ${isActive ? 'border-white/15 bg-white/5' : 'border-white/5 opacity-40'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(q.id)}
                    className={`mt-0.5 h-5 w-9 shrink-0 rounded-full border-2 transition relative ${isActive ? 'border-lime bg-lime/20' : 'border-white/20 bg-transparent'}`}
                    title={isActive ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${isActive ? 'left-4 bg-lime' : 'left-0.5 bg-white/30'}`}
                    />
                  </button>

                  {/* Question text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white/30 mb-1">
                      {String(idx + 1).padStart(2, '0')} — {q.type}
                    </p>
                    <p className="font-body text-white text-base leading-snug mb-3">{q.text}</p>

                    {/* Pre-fill */}
                    {isActive && (
                      <PreFillField
                        question={q}
                        value={prefill[q.id] ?? ''}
                        onChange={handlePrefillChange}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 pt-2 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-pill-lime"
        >
          {saving ? <Spinner light /> : 'Vorgaben speichern →'}
        </button>
        <button onClick={onClose} className="btn-pill-ghost">
          Schließen
        </button>
      </div>
    </div>
  )
}
