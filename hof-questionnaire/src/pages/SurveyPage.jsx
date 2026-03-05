import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import {
  questions as questionDefs,
  archetypes,
  uiStrings,
  sectionLabels,
} from '../lib/questionnaire-data.js'
import ArchetypeSelector from '../components/ArchetypeSelector.jsx'
import ValuesPyramid from '../components/ValuesPyramid.jsx'
import FileUpload from '../components/FileUpload.jsx'

// ─── Theme helpers ─────────────────────────────────────────────────────────────
function getColors(theme) {
  if (theme === 'dark') return {
    bg: '#0A0A0A',
    bgClass: 'bg-black',
    text: 'text-white',
    subtext: 'text-white/50',
    border: 'border-white/20',
    inputBorder: 'border-white/20',
    inputBg: 'bg-white/5',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-white/30',
    inputFocus: 'focus:border-white/40 focus:bg-white/10',
    btnPrimary: 'bg-lime text-ink hover:opacity-80',
    btnSecondary: 'border-white/20 text-white/50 hover:border-white/50 hover:text-white',
    progress: 'bg-lime',
    progressBg: 'bg-white/10',
    counter: 'text-white/30',
    sectionLabel: 'text-white/30',
    isDark: true,
    isLime: false,
  }
  if (theme === 'lime') return {
    bg: '#BAFF99',
    bgClass: 'bg-lime',
    text: 'text-ink',
    subtext: 'text-ink/50',
    border: 'border-ink/20',
    inputBorder: 'border-ink/20',
    inputBg: 'bg-white/60',
    inputText: 'text-ink',
    inputPlaceholder: 'placeholder-ink/40',
    inputFocus: 'focus:border-ink/50 focus:bg-white/80',
    btnPrimary: 'bg-ink text-white hover:opacity-80',
    btnSecondary: 'border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink',
    progress: 'bg-ink',
    progressBg: 'bg-ink/10',
    counter: 'text-ink/40',
    sectionLabel: 'text-ink/40',
    isDark: false,
    isLime: true,
  }
  // light (default)
  return {
    bg: '#FFFFFF',
    bgClass: 'bg-white',
    text: 'text-ink',
    subtext: 'text-ink/50',
    border: 'border-ink/20',
    inputBorder: 'border-ink/20',
    inputBg: 'bg-black/5',
    inputText: 'text-ink',
    inputPlaceholder: 'placeholder-ink/40',
    inputFocus: 'focus:border-ink/50 focus:bg-black/8',
    btnPrimary: 'bg-ink text-white hover:opacity-80',
    btnSecondary: 'border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink',
    progress: 'bg-ink',
    progressBg: 'bg-ink/10',
    counter: 'text-ink/40',
    sectionLabel: 'text-ink/40',
    isDark: false,
    isLime: false,
  }
}

// ─── Auto-growing textarea ─────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, onBlur, placeholder, className }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={4}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
      style={{ overflowY: 'hidden' }}
    />
  )
}

// ─── Field renderer ────────────────────────────────────────────────────────────
function FieldInput({ field, value, onChange, colors, lang }) {
  const label = field.label?.[lang] || field.label?.de || ''
  const placeholder = field.placeholder?.[lang] || field.placeholder?.de || ''

  const baseInput = [
    'w-full rounded-2xl border px-5 py-4 text-base font-body outline-none transition resize-none',
    colors.inputBorder,
    colors.inputBg,
    colors.inputText,
    colors.inputPlaceholder,
    colors.inputFocus,
  ].join(' ')

  if (field.type === 'textarea') {
    return (
      <div>
        {label && (
          <label className={`block text-xs font-mono tracking-widest uppercase mb-2 ${colors.subtext}`}>
            {label}
          </label>
        )}
        <AutoTextarea
          value={value ?? ''}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={placeholder}
          className={baseInput}
        />
      </div>
    )
  }

  if (field.type === 'input') {
    return (
      <div>
        {label && (
          <label className={`block text-xs font-mono tracking-widest uppercase mb-2 ${colors.subtext}`}>
            {label}
          </label>
        )}
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={placeholder}
          className={[baseInput, 'rounded-full px-5 py-3.5'].join(' ')}
        />
      </div>
    )
  }

  return null
}

// ─── Main SurveyPage ───────────────────────────────────────────────────────────
export default function SurveyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // Data state
  const [customer, setCustomer] = useState(null)
  const [dbQuestions, setDbQuestions] = useState({}) // { [key]: dbId }
  const [activeQuestions, setActiveQuestions] = useState(null) // Set of active questionDef keys, null = all
  const [questionOverrides, setQuestionOverrides] = useState({}) // { [key]: { title, description } }
  const [questionNotes, setQuestionNotes] = useState({}) // { [key]: string }
  const [visibleDefs, setVisibleDefs] = useState(questionDefs) // filtered list
  const [answers, setAnswers] = useState({})          // { [fieldKey]: value }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animState, setAnimState] = useState('active')  // "active" | "exit" | "enter"
  const [lang, setLang] = useState('de')

  const animTimeout = useRef(null)

  // ─── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Load customer
      const { data: cust, error: cErr } = await supabase
        .from('customers').select('*').eq('slug', slug).single()
      if (cErr || !cust) throw new Error('Fragebogen nicht gefunden.')
      setCustomer(cust)

      // 2. Load DB questions (key → id + overrides)
      const { data: dbQs, error: qErr } = await supabase
        .from('questions').select('id, key, title_override, description_override')
      if (qErr) throw qErr
      const keyMap = {}
      const overridesMap = {}
      ;(dbQs || []).forEach(q => {
        if (q.key) {
          keyMap[q.key] = q.id
          overridesMap[q.key] = {
            title: q.title_override || null,
            description: q.description_override || null,
          }
        }
      })
      setDbQuestions(keyMap)
      setQuestionOverrides(overridesMap)

      // 3. Load customer_questions (active/inactive + admin notes per customer)
      const { data: cqData } = await supabase
        .from('customer_questions')
        .select('question_id, is_active, admin_note')
        .eq('customer_id', cust.id)

      // Build set of active question keys + notes map
      if (cqData && cqData.length > 0) {
        const idToKey = {}
        Object.entries(keyMap).forEach(([k, id]) => { idToKey[id] = k })
        const activeSet = new Set()
        const notesMap = {}
        cqData.forEach(cq => {
          const key = idToKey[cq.question_id]
          if (key && cq.is_active) activeSet.add(key)
          if (key && cq.admin_note) notesMap[key] = cq.admin_note
        })
        setQuestionNotes(notesMap)
        // Only filter if we actually matched some known questions
        // (avoids empty list when DB has old questions without key values)
        if (activeSet.size > 0) {
          setActiveQuestions(activeSet)
          setVisibleDefs(questionDefs.filter(q => activeSet.has(q.key)))
        } else {
          setActiveQuestions(null)
          setVisibleDefs(questionDefs)
        }
      } else {
        // No customer_questions = show all
        setActiveQuestions(null)
        setVisibleDefs(questionDefs)
      }

      // 4. Load existing responses
      const { data: respData } = await supabase
        .from('responses').select('question_id, value').eq('customer_id', cust.id)

      // Build answers keyed by field key (reverse lookup via keyMap)
      const idToKey = {}
      Object.entries(keyMap).forEach(([k, id]) => { idToKey[id] = k })
      const answerMap = {}
      ;(respData || []).forEach(r => {
        const key = idToKey[r.question_id]
        if (!key) return
        const qDef = questionDefs.find(q => q.key === key)
        const isMultiField = qDef && qDef.fields?.length > 1
        try {
          const parsed = JSON.parse(r.value)
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            if (isMultiField) {
              // Multi-field question: spread sub-fields directly into answerMap
              Object.assign(answerMap, parsed)
            } else {
              // Single-field object (e.g. values-pyramid): store under field key
              const fieldKey = qDef?.fields?.[0]?.key || key
              answerMap[fieldKey] = parsed
            }
            return
          }
        } catch {}
        answerMap[key] = r.value ?? ''
      })
      setAnswers(answerMap)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // ─── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const VISIBLE_TOTAL = visibleDefs.length
  const currentQuestion = visibleDefs[currentIndex]
  // Apply admin overrides to title/description
  const currentOverride = currentQuestion ? (questionOverrides[currentQuestion.key] || {}) : {}
  const colors = getColors(currentQuestion?.theme || 'light')
  const ui = (key) => uiStrings[key]?.[lang] || uiStrings[key]?.de || key
  const sectionLabel = (section) => sectionLabels[section]?.[lang] || sectionLabels[section]?.de || section
  const isFirst = currentIndex === 0
  const isLast = currentIndex === VISIBLE_TOTAL - 1
  const progress = VISIBLE_TOTAL > 0 ? Math.round(((currentIndex + 1) / VISIBLE_TOTAL) * 100) : 0

  const setAnswer = (fieldKey, value) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }))
  }

  // ─── Save admin note to Supabase ─────────────────────────────────────────────
  const saveNote = useCallback(async (questionKey, noteText) => {
    if (!customer) return
    const dbId = dbQuestions[questionKey]
    if (!dbId) return
    try {
      await supabase.from('customer_questions').upsert({
        customer_id: customer.id,
        question_id: dbId,
        admin_note: noteText,
      }, { onConflict: 'customer_id,question_id' })
    } catch (err) {
      console.warn('Note save error:', err)
    }
  }, [customer, dbQuestions])

  // ─── Save current slide answers to Supabase ─────────────────────────────────
  const saveCurrentSlide = useCallback(async (questionDef, answersSnapshot) => {
    if (!customer) return
    const { fields, key: questionKey } = questionDef
    if (!fields || fields.length === 0) return

    // For multi-field questions, store as JSON object under the question key
    // For single-field questions, store the value directly
    try {
      if (fields.length === 1) {
        const field = fields[0]
        const val = answersSnapshot[field.key]
        if (val === undefined) return

        // Serialize objects (markenwerte pyramid)
        const serialized = typeof val === 'object' ? JSON.stringify(val) : (val || '')

        const dbId = dbQuestions[questionKey]
        if (!dbId) return
        await supabase.from('responses').upsert({
          customer_id: customer.id,
          question_id: dbId,
          value: serialized,
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'customer_id,question_id' })
      } else {
        // Multi-field: bundle all sub-fields under the question key
        const multiValue = {}
        fields.forEach(f => {
          if (answersSnapshot[f.key] !== undefined) {
            multiValue[f.key] = answersSnapshot[f.key]
          }
        })
        const dbId = dbQuestions[questionKey]
        if (!dbId) return
        await supabase.from('responses').upsert({
          customer_id: customer.id,
          question_id: dbId,
          value: JSON.stringify(multiValue),
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'customer_id,question_id' })
      }
    } catch (err) {
      console.warn('Save error:', err)
    }
  }, [customer, dbQuestions])

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const navigate_slide = useCallback((nextIndex) => {
    if (animTimeout.current) clearTimeout(animTimeout.current)

    // Save current slide answers in background
    saveCurrentSlide(visibleDefs[currentIndex], answers)

    // Exit animation
    setAnimState('exit')
    animTimeout.current = setTimeout(() => {
      setCurrentIndex(nextIndex)
      setAnimState('enter')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState('active')
        })
      })
    }, 300)
  }, [currentIndex, answers, saveCurrentSlide])

  const handleNext = useCallback(() => {
    if (currentIndex < visibleDefs.length - 1) {
      navigate_slide(currentIndex + 1)
    }
  }, [currentIndex, navigate_slide, visibleDefs.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate_slide(currentIndex - 1)
    }
  }, [currentIndex, navigate_slide])

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customer) return
    setSubmitting(true)
    setError(null)

    // Save current slide first
    await saveCurrentSlide(questionDefs[currentIndex], answers)

    try {
      const now = new Date().toISOString()
      // Upsert all slides
      const upserts = []
      questionDefs.forEach(qDef => {
        const dbId = dbQuestions[qDef.key]
        if (!dbId) return
        if (!qDef.fields || qDef.fields.length === 0) return

        let val
        if (qDef.fields.length === 1) {
          const fVal = answers[qDef.fields[0].key]
          val = typeof fVal === 'object' ? JSON.stringify(fVal || '') : (fVal ?? '')
        } else {
          const multi = {}
          qDef.fields.forEach(f => { multi[f.key] = answers[f.key] ?? '' })
          val = JSON.stringify(multi)
        }
        upserts.push({ customer_id: customer.id, question_id: dbId, value: val, submitted_at: now })
      })

      if (upserts.length > 0) {
        const { error: upsertErr } = await supabase
          .from('responses').upsert(upserts, { onConflict: 'customer_id,question_id' })
        if (upsertErr) throw upsertErr
      }

      // Call edge function (non-blocking)
      supabase.functions.invoke('send-survey-email', { body: { customer_id: customer.id } })
        .catch(e => console.warn('Email fn:', e))

      navigate(`/survey/${slug}/danke`)
    } catch (err) {
      setError(err.message || 'Fehler beim Absenden.')
      setSubmitting(false)
    }
  }

  // ─── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lime">
        <p className="font-mono text-xs tracking-widest uppercase text-ink/40 animate-pulse">
          Wird geladen …
        </p>
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-lime px-8 text-center">
        <p className="font-display text-8xl font-black uppercase text-ink leading-none mb-6">404</p>
        <p className="font-body text-xl text-ink/60">Fragebogen nicht gefunden.</p>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${colors.bgClass}`}
      style={{ backgroundColor: colors.bg }}
    >
      {/* ── Progress bar (top) ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-0.5 ${colors.progressBg}`}>
        <div
          className={`h-full transition-all duration-500 ${colors.progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Fixed top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-5 md:px-10 pointer-events-none">
        <span className={`font-mono text-xs tracking-widest uppercase pointer-events-auto ${colors.counter}`}>
          {currentIndex + 1} {ui('questionOf')} {VISIBLE_TOTAL}
        </span>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'de' ? 'en' : 'de')}
          className={`pointer-events-auto font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded-full border transition ${colors.border} ${colors.subtext} hover:opacity-80`}
        >
          {lang === 'de' ? 'EN' : 'DE'}
        </button>
      </div>

      {/* ── Slide content ── */}
      <div
        className={`question-screen question-${animState}`}
      >
        <div className="mx-auto max-w-2xl px-6 pt-28 pb-40 md:px-10">

          {/* Section label */}
          <p className={`font-mono text-xs tracking-widest uppercase mb-4 ${colors.sectionLabel}`}>
            {sectionLabel(currentQuestion.section)}
          </p>

          {/* Title — admin override takes priority */}
          <h1 className={`font-display text-6xl font-black uppercase leading-none mb-5 md:text-7xl lg:text-8xl ${colors.text}`} style={{letterSpacing: 0}}>
            {currentOverride.title || currentQuestion.title?.[lang] || currentQuestion.title?.de}
          </h1>

          {/* Description — admin override takes priority */}
          {(currentOverride.description || currentQuestion.description) && (
            <p className={`survey-description font-body mb-10 whitespace-pre-wrap ${colors.text}`}>
              {currentOverride.description || currentQuestion.description?.[lang] || currentQuestion.description?.de}
            </p>
          )}

          {/* Fields */}
          <div className="space-y-6">
            {currentQuestion.fields?.map(field => {
              if (field.type === 'archetype') {
                const archList = archetypes[lang] || archetypes.de
                return (
                  <ArchetypeSelector
                    key={field.key}
                    archetypes={archList}
                    selected={answers[field.key] || null}
                    onChange={(arch) => setAnswer(field.key, arch ? arch.id : '')}
                    isDark={colors.isDark}
                    lang={lang}
                  />
                )
              }

              if (field.type === 'file-upload') {
                return (
                  <FileUpload
                    key={field.key}
                    fieldKey={field.key}
                    customerId={customer?.id}
                    value={answers[field.key] || []}
                    onChange={(urls) => setAnswer(field.key, urls)}
                    colors={colors}
                    lang={lang}
                  />
                )
              }

              if (field.type === 'values-pyramid') {
                let pyramidValue = answers[field.key]
                if (typeof pyramidValue === 'string') {
                  try { pyramidValue = JSON.parse(pyramidValue) } catch { pyramidValue = null }
                }
                return (
                  <ValuesPyramid
                    key={field.key}
                    value={pyramidValue || { top: [], bottom: [] }}
                    onChange={(val) => setAnswer(field.key, val)}
                    isDark={colors.isDark}
                    lang={lang}
                    config={field.config || null}
                  />
                )
              }

              return (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={answers[field.key] ?? ''}
                  onChange={setAnswer}
                  colors={colors}
                  lang={lang}
                />
              )
            })}
          </div>

          {/* Admin note — only shown if set in backend, then editable */}
          {questionNotes[currentQuestion.key] != null && (
            <div className="mt-8">
              <p className={`font-mono text-xs tracking-widest uppercase mb-2 ${colors.subtext}`}>Anmerkung</p>
              <AutoTextarea
                value={questionNotes[currentQuestion.key] ?? ''}
                onChange={e => setQuestionNotes(prev => ({ ...prev, [currentQuestion.key]: e.target.value }))}
                onBlur={() => saveNote(currentQuestion.key, questionNotes[currentQuestion.key] ?? '')}
                placeholder="Optionale Anmerkung …"
                className={[
                  'w-full rounded-2xl border px-5 py-4 font-body admin-note-text outline-none transition resize-none whitespace-pre-wrap',
                  colors.inputBorder,
                  colors.inputBg,
                  colors.inputText,
                  colors.inputPlaceholder,
                  colors.inputFocus,
                ].join(' ')}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-6 rounded-full border border-red-500/40 bg-red-950/30 px-5 py-3 text-sm font-mono text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* ── Fixed bottom navigation ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-6 py-6 md:bottom-4 md:right-4 md:left-auto md:p-0 md:!bg-transparent"
        style={{ background: colors.bg }}
      >
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4 md:mx-0 md:max-w-none md:gap-3">
          {/* Back */}
          {!isFirst ? (
            <button
              onClick={handlePrev}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-mono tracking-widest uppercase transition ${colors.btnSecondary}`}
            >
              ← {ui('back')}
            </button>
          ) : (
            <div />
          )}

          {/* Next / Submit */}
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-mono tracking-widest uppercase transition disabled:opacity-40 ${colors.btnPrimary}`}
            >
              {submitting ? ui('submitting') : ui('submit')} →
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-mono tracking-widest uppercase transition ${colors.btnPrimary}`}
            >
              {isFirst ? ui('start') : ui('next')} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
