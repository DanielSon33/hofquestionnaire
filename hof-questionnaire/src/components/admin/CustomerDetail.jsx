import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { questions as questionDefs, sectionLabels } from '../../lib/questionnaire-data.js'
import Spinner from '../ui/Spinner.jsx'

const BASE_URL = window.location.origin

// ─── Inline editable field ──────────────────────────────────────────────────
function EditableText({ value, onChange, multiline = false, placeholder = '' }) {
  const cls = 'w-full bg-transparent border-b border-white/10 focus:border-lime/50 outline-none text-white py-1 transition font-body text-sm'
  if (multiline) {
    return (
      <textarea
        rows={2}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${cls} resize-none`}
      />
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  )
}

// ─── Pyramid values display (read-only) ─────────────────────────────────────
function PyramidDisplay({ value }) {
  const data = (() => {
    if (!value) return null
    if (typeof value === 'object' && !Array.isArray(value)) return value
    try { return JSON.parse(value) } catch { return null }
  })()

  const top = data?.top || []
  const bottom = data?.bottom || []

  if (!top.length && !bottom.length) {
    return <p className="text-white/25 text-xs font-mono italic">Keine Werte eingetragen.</p>
  }

  const TagList = ({ tags, accentClass }) => (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span key={i} className={`rounded-full px-3 py-1 font-mono text-xs ${accentClass}`}>{t}</span>
      ))}
    </div>
  )

  return (
    <div className="space-y-2 mt-1">
      {top.length > 0 && (
        <div>
          <p className="text-white/25 text-[10px] font-mono uppercase tracking-widest mb-1">Kernwerte / Tonalitäten</p>
          <TagList tags={top} accentClass="bg-lime/15 text-lime border border-lime/30" />
        </div>
      )}
      {bottom.length > 0 && (
        <div>
          <p className="text-white/25 text-[10px] font-mono uppercase tracking-widest mb-1">Unterstützende Werte</p>
          <TagList tags={bottom} accentClass="bg-white/10 text-white/60 border border-white/20" />
        </div>
      )}
    </div>
  )
}

// ─── Uploaded files viewer ──────────────────────────────────────────────────
function UploadedFiles({ value }) {
  const files = (() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try { return JSON.parse(value) } catch { return [] }
  })()

  if (!files.length) {
    return <p className="text-white/25 text-xs font-mono italic">Keine Dateien hochgeladen.</p>
  }

  return (
    <div className="space-y-2 mt-1">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
          <span className="text-white/40 font-mono text-xs">↓</span>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-white truncate">{f.name}</p>
          </div>
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full border border-white/20 px-3 py-1 font-mono text-xs text-lime hover:border-lime transition"
          >
            Öffnen →
          </a>
        </div>
      ))}
    </div>
  )
}

// ─── Pre-fill field ─────────────────────────────────────────────────────────
function PreFillField({ field, value, onChange, lang = 'de' }) {
  const cls = 'hof-input-dark'
  const placeholder = field.placeholder?.[lang] || field.placeholder?.de || 'Vorgabe …'

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={2}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${cls} rounded-2xl resize-none`}
      />
    )
  }
  if (field.type === 'file-upload') {
    return <UploadedFiles value={value} />
  }
  if (field.type === 'archetype') {
    return (
      <p className="text-white/30 text-xs font-mono italic">
        (Vorgabe nicht möglich für diesen Feldtyp)
      </p>
    )
  }
  if (field.type === 'values-pyramid') {
    return <PyramidDisplay value={value} />
  }
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  )
}

export default function CustomerDetail({ customer, onClose, showToast }) {
  // dbMap: { [questionKey]: { id, title_override, description_override } }
  const [dbMap, setDbMap] = useState({})
  // active: { [questionKey]: boolean }
  const [active, setActive] = useState({})
  // prefill: { [fieldKey]: value }
  const [prefill, setPrefill] = useState({})
  // overrides: { [questionKey]: { title, description } }
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const surveyUrl = `${BASE_URL}/survey/${customer.slug}`

  const load = useCallback(async () => {
    setLoading(true)

    // 1. Load DB questions (by key)
    const { data: dbQs } = await supabase
      .from('questions').select('id, key, title_override, description_override')
    const map = {}
    ;(dbQs || []).forEach(q => { if (q.key) map[q.key] = q })
    setDbMap(map)

    // 2. Load customer_questions (which are active)
    const { data: cqData } = await supabase
      .from('customer_questions')
      .select('question_id, is_active')
      .eq('customer_id', customer.id)

    // Build active map by key
    const activeMap = {}
    questionDefs.forEach(qDef => {
      const dbQ = map[qDef.key]
      if (dbQ) {
        const cq = (cqData || []).find(c => c.question_id === dbQ.id)
        // Default: active (true) if no record exists
        activeMap[qDef.key] = cq ? cq.is_active : true
      } else {
        activeMap[qDef.key] = true
      }
    })
    setActive(activeMap)

    // 3. Load existing responses
    const { data: respData } = await supabase
      .from('responses')
      .select('question_id, value')
      .eq('customer_id', customer.id)

    // Build prefill map: question_id → value, then expand multi-field JSON
    const idToKey = {}
    Object.entries(map).forEach(([k, q]) => { idToKey[q.id] = k })
    const prefillMap = {}
    ;(respData || []).forEach(r => {
      const qKey = idToKey[r.question_id]
      if (!qKey) return
      const qDef = questionDefs.find(q => q.key === qKey)
      const isMultiField = qDef && (qDef.fields?.length ?? 0) > 1
      try {
        const parsed = JSON.parse(r.value)
        if (Array.isArray(parsed)) {
          // Array = file-upload or similar — store under question key
          prefillMap[qKey] = parsed
          return
        }
        if (typeof parsed === 'object' && parsed !== null) {
          if (isMultiField) {
            // Multi-field question (e.g. intro) — expand into individual field keys
            Object.assign(prefillMap, parsed)
          } else {
            // Single-field object (e.g. values-pyramid) — store under the field key
            const fieldKey = qDef?.fields?.[0]?.key || qKey
            prefillMap[fieldKey] = parsed
          }
          return
        }
      } catch {}
      prefillMap[qKey] = r.value ?? ''
    })
    setPrefill(prefillMap)

    // 4. Load overrides
    const overrideMap = {}
    ;(dbQs || []).forEach(q => {
      if (q.key) overrideMap[q.key] = {
        title: q.title_override || '',
        description: q.description_override || '',
      }
    })
    setOverrides(overrideMap)

    setLoading(false)
  }, [customer.id])

  useEffect(() => { load() }, [load])

  // ─── Toggle question active ────────────────────────────────────────────────
  const handleToggle = async (qKey) => {
    const dbQ = dbMap[qKey]
    if (!dbQ) return
    const next = !active[qKey]
    setActive(prev => ({ ...prev, [qKey]: next }))

    const { data: existing } = await supabase
      .from('customer_questions')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('question_id', dbQ.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('customer_questions')
        .update({ is_active: next })
        .eq('id', existing.id)
    } else {
      await supabase.from('customer_questions')
        .insert({ customer_id: customer.id, question_id: dbQ.id, is_active: next })
    }
  }

  // ─── Update override ──────────────────────────────────────────────────────
  const handleOverride = (qKey, field, value) => {
    setOverrides(prev => ({
      ...prev,
      [qKey]: { ...(prev[qKey] || {}), [field]: value },
    }))
  }

  // ─── Update prefill ───────────────────────────────────────────────────────
  const handlePrefillChange = (fieldKey, value) => {
    setPrefill(prev => ({ ...prev, [fieldKey]: value }))
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()

      // 1. Save overrides to DB questions table
      for (const qDef of questionDefs) {
        const dbQ = dbMap[qDef.key]
        if (!dbQ) continue
        const ov = overrides[qDef.key] || {}
        await supabase.from('questions').update({
          title_override: ov.title || null,
          description_override: ov.description || null,
        }).eq('id', dbQ.id)
      }

      // 2. Save prefill responses
      const upserts = []
      for (const qDef of questionDefs) {
        if (!active[qDef.key]) continue
        const dbQ = dbMap[qDef.key]
        if (!dbQ) continue

        if (qDef.fields?.length > 1) {
          // Multi-field: store as JSON
          const multi = {}
          qDef.fields.forEach(f => {
            if (prefill[f.key] !== undefined) multi[f.key] = prefill[f.key]
          })
          if (Object.keys(multi).length > 0) {
            upserts.push({ customer_id: customer.id, question_id: dbQ.id, value: JSON.stringify(multi) })
          }
        } else if (qDef.fields?.length === 1) {
          const fKey = qDef.fields[0].key
          if (prefill[fKey] !== undefined && prefill[fKey] !== '') {
            upserts.push({ customer_id: customer.id, question_id: dbQ.id, value: prefill[fKey] })
          }
        }
      }

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('responses')
          .upsert(upserts, { onConflict: 'customer_id,question_id' })
        if (error) throw error
      }

      showToast('Gespeichert ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(surveyUrl)
    showToast('Link kopiert!')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner light /></div>
  }

  return (
    <div className="space-y-8">
      {/* ── Survey link ─── */}
      <div>
        <p className="hof-label-dark mb-2">Fragebogen-Link</p>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <code className="flex-1 truncate font-mono text-xs text-lime">{surveyUrl}</code>
          <button onClick={copyLink} className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 font-mono text-xs text-white/60 hover:border-lime hover:text-lime transition">
            Kopieren
          </button>
          <a href={surveyUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 font-mono text-xs text-white/60 hover:border-lime hover:text-lime transition">
            Öffnen →
          </a>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* ── Questions ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="hof-label-dark">Fragen & Vorgaben</p>
          <p className="text-white/30 text-xs font-mono">Titel/Beschreibung sind editierbar</p>
        </div>

        <div className="space-y-4">
          {questionDefs.map((qDef, idx) => {
            const isActive = !!active[qDef.key]
            const ov = overrides[qDef.key] || {}
            const defaultTitle = qDef.title?.de || qDef.title || ''
            const defaultDesc = qDef.description?.de || qDef.description || ''
            const sectionLabel = sectionLabels[qDef.section]?.de || qDef.section

            return (
              <div
                key={qDef.key}
                className={`rounded-2xl border p-5 transition ${isActive ? 'border-white/15 bg-white/5' : 'border-white/5 opacity-40'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(qDef.key)}
                    className={`mt-1 h-5 w-9 shrink-0 rounded-full border-2 transition relative ${isActive ? 'border-lime bg-lime/20' : 'border-white/20 bg-transparent'}`}
                    title={isActive ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${isActive ? 'left-4 bg-lime' : 'left-0.5 bg-white/30'}`} />
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Section + index */}
                    <p className="font-mono text-xs text-white/25 mb-2">
                      {String(idx + 1).padStart(2, '0')} — {sectionLabel}
                      {qDef.theme && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                          qDef.theme === 'dark' ? 'bg-white/10 text-white/40' :
                          qDef.theme === 'lime' ? 'bg-lime/20 text-lime' :
                          'bg-white/5 text-white/30'
                        }`}>{qDef.theme}</span>
                      )}
                    </p>

                    {/* Editable title */}
                    <div className="mb-1">
                      <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1">Titel</p>
                      <EditableText
                        value={ov.title !== undefined ? ov.title : ''}
                        onChange={v => handleOverride(qDef.key, 'title', v)}
                        placeholder={defaultTitle}
                      />
                      {!ov.title && (
                        <p className="text-white/20 text-xs font-mono mt-0.5 italic">{defaultTitle}</p>
                      )}
                    </div>

                    {/* Editable description */}
                    <div className="mb-3">
                      <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1 mt-2">Beschreibung</p>
                      <EditableText
                        value={ov.description !== undefined ? ov.description : ''}
                        onChange={v => handleOverride(qDef.key, 'description', v)}
                        placeholder={defaultDesc || 'Beschreibung …'}
                        multiline
                      />
                      {!ov.description && defaultDesc && (
                        <p className="text-white/20 text-xs font-mono mt-0.5 italic line-clamp-1">{defaultDesc}</p>
                      )}
                    </div>

                    {/* Pre-fill fields */}
                    {isActive && qDef.fields?.map(field => (
                      <div key={field.key} className="mb-2">
                        <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1">
                          Vorbefüllung: {field.label?.de || field.key}
                        </p>
                        <PreFillField
                          field={field}
                          value={prefill[field.key] ?? ''}
                          onChange={v => handlePrefillChange(field.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Save ─── */}
      <div className="flex gap-3 pt-2 border-t border-white/10 sticky bottom-0 bg-ink pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-pill-lime">
          {saving ? <Spinner light /> : 'Speichern →'}
        </button>
        <button onClick={onClose} className="btn-pill-ghost">Schließen</button>
      </div>
    </div>
  )
}
