import { useState, useRef } from 'react'

const MAX_TOP = 5
const MAX_BOTTOM = 5

export default function ValuesPyramid({ value, onChange, isDark = false, lang = 'de', config = null }) {
  const maxTop = config?.maxTop ?? MAX_TOP
  const maxBottom = config?.maxBottom ?? MAX_BOTTOM
  const hideBottom = config?.hideBottom ?? false

  const [topValues, setTopValues] = useState(value?.top || [])
  const [bottomValues, setBottomValues] = useState(value?.bottom || [])
  const [topInput, setTopInput] = useState('')
  const [bottomInput, setBottomInput] = useState('')
  const topInputRef = useRef(null)
  const bottomInputRef = useRef(null)

  const defaultLabels = lang === 'de'
    ? { top: 'Kernwerte', bottom: 'Unterstützende Werte', topHint: `Max. ${maxTop}`, bottomHint: `Max. ${maxBottom}`, addTop: 'Kernwert hinzufügen', addBottom: 'Wert hinzufügen', placeholder: 'Wert eingeben…' }
    : { top: 'Core Values', bottom: 'Supporting Values', topHint: `Max. ${maxTop}`, bottomHint: `Max. ${maxBottom}`, addTop: 'Add core value', addBottom: 'Add value', placeholder: 'Enter value…' }

  const labels = config?.labels?.[lang]
    ? { ...defaultLabels, ...config.labels[lang] }
    : defaultLabels

  const emit = (newTop, newBottom) => {
    onChange({ top: newTop, bottom: newBottom })
  }

  const addTopValue = () => {
    const trimmed = topInput.trim()
    if (!trimmed || topValues.length >= maxTop) return
    const next = [...topValues, trimmed]
    setTopValues(next)
    setTopInput('')
    emit(next, bottomValues)
    topInputRef.current?.focus()
  }

  const addBottomValue = () => {
    const trimmed = bottomInput.trim()
    if (!trimmed || bottomValues.length >= maxBottom) return
    const next = [...bottomValues, trimmed]
    setBottomValues(next)
    setBottomInput('')
    emit(topValues, next)
    bottomInputRef.current?.focus()
  }

  const removeTopValue = (index) => {
    const next = topValues.filter((_, i) => i !== index)
    setTopValues(next)
    emit(next, bottomValues)
  }

  const removeBottomValue = (index) => {
    const next = bottomValues.filter((_, i) => i !== index)
    setBottomValues(next)
    emit(topValues, next)
  }

  const textColor = isDark ? 'text-white' : 'text-black'
  const subTextColor = isDark ? 'text-white/50' : 'text-black/50'
  const borderColor = isDark ? 'border-white/20' : 'border-black/20'
  const inputBg = isDark ? 'bg-white/5 placeholder-white/30 text-white focus:border-white/40' : 'bg-black/5 placeholder-black/30 text-black focus:border-black/40'

  return (
    <div className="pyramid-container">
      {/* Pyramid visual */}
      <div className="pyramid-visual">
        {/* Top tier */}
        <div className="pyramid-top-tier">
          <div className="pyramid-tier-label">
            <span className={`text-xs font-mono tracking-widest uppercase ${subTextColor}`}>
              {labels.top} <span className="opacity-50">({topValues.length}/{maxTop})</span>
            </span>
          </div>
          <div className="pyramid-top-shape">
            {topValues.length === 0 ? (
              <span className={`text-sm font-body italic ${subTextColor}`}>—</span>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {topValues.map((val, i) => (
                  <button
                    key={i}
                    onClick={() => removeTopValue(i)}
                    className="value-tag value-tag-top"
                    title="Entfernen"
                  >
                    {val} <span className="value-tag-remove">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!hideBottom && (
          <>
            {/* Pyramid divider */}
            <div className={`pyramid-divider ${isDark ? 'border-white/20' : 'border-black/20'}`} />

            {/* Bottom tier */}
            <div className="pyramid-bottom-tier">
              <div className="pyramid-tier-label">
                <span className={`text-xs font-mono tracking-widest uppercase ${subTextColor}`}>
                  {labels.bottom} <span className="opacity-50">({bottomValues.length}/{maxBottom})</span>
                </span>
              </div>
              <div className="pyramid-bottom-shape">
                {bottomValues.length === 0 ? (
                  <span className={`text-sm font-body italic ${subTextColor}`}>—</span>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    {bottomValues.map((val, i) => (
                      <button
                        key={i}
                        onClick={() => removeBottomValue(i)}
                        className="value-tag value-tag-bottom"
                        title="Entfernen"
                      >
                        {val} <span className="value-tag-remove">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input row for top values */}
      <div className="pyramid-input-row mt-6">
        <label className={`block text-xs font-mono tracking-widest uppercase mb-2 ${subTextColor}`}>
          {labels.addTop}
        </label>
        <div className="flex gap-2">
          <input
            ref={topInputRef}
            type="text"
            value={topInput}
            onChange={e => setTopInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopValue() } }}
            placeholder={labels.placeholder}
            disabled={topValues.length >= maxTop}
            className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-body outline-none transition ${borderColor} ${inputBg} disabled:opacity-30`}
          />
          <button
            onClick={addTopValue}
            disabled={!topInput.trim() || topValues.length >= maxTop}
            className={`pyramid-add-btn ${isDark ? 'pyramid-add-btn-dark' : 'pyramid-add-btn-light'}`}
          >
            +
          </button>
        </div>
      </div>

      {/* Input row for bottom values */}
      {!hideBottom && <div className="pyramid-input-row mt-4">
        <label className={`block text-xs font-mono tracking-widest uppercase mb-2 ${subTextColor}`}>
          {labels.addBottom}
        </label>
        <div className="flex gap-2">
          <input
            ref={bottomInputRef}
            type="text"
            value={bottomInput}
            onChange={e => setBottomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBottomValue() } }}
            placeholder={labels.placeholder}
            disabled={bottomValues.length >= maxBottom}
            className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-body outline-none transition ${borderColor} ${inputBg} disabled:opacity-30`}
          />
          <button
            onClick={addBottomValue}
            disabled={!bottomInput.trim() || bottomValues.length >= maxBottom}
            className={`pyramid-add-btn ${isDark ? 'pyramid-add-btn-dark' : 'pyramid-add-btn-light'}`}
          >
            +
          </button>
        </div>
      </div>}
    </div>
  )
}
