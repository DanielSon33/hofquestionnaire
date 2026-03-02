import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import Spinner from '../ui/Spinner.jsx'
import { Copy, Check, ExternalLink } from 'lucide-react'

// ── Individual question row ──────────────────────────────────
function QuestionRow({ cq, response, onToggle, onValueChange }) {
  const { question } = cq
  const isActive = cq.is_active
  const value = response?.value ?? ''

  const renderInput = () => {
    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onValueChange(question.id, e.target.value)}
            placeholder="Antwort vorausfüllen …"
            disabled={!isActive}
            className="input-base resize-none disabled:opacity-40"
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onValueChange(question.id, e.target.value)}
            disabled={!isActive}
            className="input-base disabled:opacity-40"
          >
            <option value="">– bitte wählen –</option>
            {(question.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(question.id, e.target.value)}
            placeholder="Antwort vorausfüllen …"
            disabled={!isActive}
            className="input-base disabled:opacity-40"
          />
        )
    }
  }

  return (
    <div className={`rounded-xl border p-4 transition ${isActive ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-800 leading-snug">{question.text}</p>
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => onToggle(cq.id, !isActive)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-gray-500">Aktiv</span>
        </label>
      </div>
      {renderInput()}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export default function CustomerDetail({ customer, onClose, showToast }) {
  const [customerQuestions, setCustomerQuestions] = useState([])
  const [responses, setResponses] = useState({}) // { question_id: response_row }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const surveyUrl = `${window.location.origin}/survey/${customer.slug}`

  // Load questions + existing responses
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: cqData } = await supabase
        .from('customer_questions')
        .select('id, is_active, question:question_id(id, text, type, options, sort_order)')
        .eq('customer_id', customer.id)
        .order('question(sort_order)')

      const { data: respData } = await supabase
        .from('responses')
        .select('*')
        .eq('customer_id', customer.id)

      setCustomerQuestions(cqData || [])
      const map = {}
      ;(respData || []).forEach((r) => { map[r.question_id] = r })
      setResponses(map)
    } finally {
      setLoading(false)
    }
  }, [customer.id])

  useEffect(() => { load() }, [load])

  // Toggle question active/inactive
  const handleToggle = async (cqId, newActive) => {
    setCustomerQuestions((prev) =>
      prev.map((cq) => (cq.id === cqId ? { ...cq, is_active: newActive } : cq))
    )
    await supabase.from('customer_questions').update({ is_active: newActive }).eq('id', cqId)
  }

  // Update response value locally
  const handleValueChange = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] || { customer_id: customer.id, question_id: questionId }), value },
    }))
  }

  // Save all responses (upsert)
  const handleSave = async () => {
    setSaving(true)
    try {
      const upserts = Object.values(responses)
        .filter((r) => r.value !== undefined && r.value !== null)
        .map((r) => ({
          customer_id: customer.id,
          question_id: r.question_id,
          value: r.value,
          submitted_at: null, // prefilled, not yet submitted by customer
        }))

      if (upserts.length) {
        const { error } = await supabase
          .from('responses')
          .upsert(upserts, { onConflict: 'customer_id,question_id' })
        if (error) throw error
      }
      showToast('Antworten gespeichert!', 'success')
    } catch (err) {
      showToast(err.message || 'Fehler beim Speichern', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer link */}
      <div className="rounded-xl bg-brand-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
          Kunden-Link
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={surveyUrl}
            className="flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none"
          />
          <button onClick={handleCopy} className="btn-secondary gap-1.5">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
          <a href={surveyUrl} target="_blank" rel="noreferrer" className="btn-secondary">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Questions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Fragen & Vorbelegung
          </h3>
          <span className="text-xs text-gray-400">
            {customerQuestions.filter((cq) => cq.is_active).length} aktiv von {customerQuestions.length}
          </span>
        </div>

        {customerQuestions.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Fragen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {customerQuestions.map((cq) => (
              <QuestionRow
                key={cq.id}
                cq={cq}
                response={responses[cq.question?.id]}
                onToggle={handleToggle}
                onValueChange={handleValueChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button onClick={onClose} className="btn-secondary">Schließen</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving && <Spinner size="sm" />}
          Speichern
        </button>
      </div>
    </div>
  )
}
