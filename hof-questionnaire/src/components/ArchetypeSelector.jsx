import { useState, useEffect } from 'react'

// Preload an image in the background
function preloadImage(src) {
  if (!src) return
  const img = new Image()
  img.src = src
}

export default function ArchetypeSelector({ archetypes, selected, onChange, isDark = false }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // selectedIds is always an array of up to 2 archetype IDs
  const [selectedIds, setSelectedIds] = useState(() => {
    if (!selected) return []
    if (Array.isArray(selected)) return selected
    return selected ? [selected] : []
  })
  const [visible, setVisible] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Sync selected prop (normalize to array)
  useEffect(() => {
    if (!selected) { setSelectedIds([]); return }
    if (Array.isArray(selected)) { setSelectedIds(selected); return }
    setSelectedIds(selected ? [selected] : [])
  }, [selected])

  // Preload adjacent images whenever index changes
  useEffect(() => {
    const prev = archetypes[currentIndex - 1]
    const next = archetypes[currentIndex + 1]
    if (prev?.image) preloadImage(prev.image)
    if (next?.image) preloadImage(next.image)
  }, [currentIndex, archetypes])

  // Reset image state when card changes
  useEffect(() => {
    setImgLoaded(false)
    setImgError(false)
  }, [currentIndex])

  const goTo = (index) => {
    if (index === currentIndex) return
    setVisible(false)
    setTimeout(() => {
      setCurrentIndex(index)
      setVisible(true)
    }, 180)
  }

  const handlePrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1)
  }

  const handleNext = () => {
    if (currentIndex < archetypes.length - 1) goTo(currentIndex + 1)
  }

  const handleSelect = (archetype) => {
    let newIds
    if (selectedIds.includes(archetype.id)) {
      // Deselect
      newIds = selectedIds.filter(id => id !== archetype.id)
    } else if (selectedIds.length < 2) {
      // Add (max 2)
      newIds = [...selectedIds, archetype.id]
    } else {
      // Already 2 selected — do nothing
      return
    }
    setSelectedIds(newIds)
    const selectedArchs = archetypes.filter(a => newIds.includes(a.id))
    onChange(selectedArchs)
  }

  const archetype = archetypes[currentIndex]
  if (!archetype) return null

  const isSelected = selectedIds.includes(archetype.id)
  const isFull = selectedIds.length >= 2 && !isSelected
  const total = archetypes.length
  const num = archetype.number || String(currentIndex + 1).padStart(2, '0')

  const cardBg = isDark ? '#1a1a1a' : '#F5F5F0'
  const textPrimary = isDark ? '#ffffff' : '#0A0A0A'
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,10,0.45)'
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.08)'
  const navBorderClass = isDark
    ? 'border-white/20 text-white/50 hover:border-white/50 hover:text-white'
    : 'border-black/20 text-black/50 hover:border-black/50 hover:text-black'

  // Selection count label
  const selectionLabel = selectedIds.length === 0
    ? null
    : selectedIds.length === 1
      ? '1 von 2 ausgewählt'
      : '2 von 2 ausgewählt'

  return (
    <div className="archetype-fullwrap">
      {/* ── Full-width card ── */}
      <div
        className="archetype-fullcard"
        style={{
          background: cardBg,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Left column */}
        <div className="archetype-fullcard-left">
          <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: textMuted }}>
            {num} / {String(total).padStart(2, '0')}
          </p>

          <h2
            className="font-display font-black uppercase mb-5"
            style={{ fontSize: '4.5rem', lineHeight: 0.85, letterSpacing: 0, color: textPrimary }}
          >
            {archetype.name}
          </h2>

          {archetype.keywords && (
            <div className="flex flex-wrap gap-2 mb-6">
              {archetype.keywords.map(kw => (
                <span key={kw} className="archetype-keyword-pill">{kw}</span>
              ))}
            </div>
          )}

          <p className="font-body mb-6" style={{ fontSize: '1rem', lineHeight: 1.65, color: textPrimary, opacity: 0.75 }}>
            {archetype.description}
          </p>

          <hr style={{ borderColor: dividerColor, marginBottom: '1.25rem' }} />

          {(archetype.fears || archetype.weakness || archetype.famousCharacter) && (
            <div className="archetype-meta-grid mb-6">
              {archetype.fears && (
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: textMuted }}>Ängste</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {archetype.fears.map(f => (
                      <li key={f} className="font-body text-sm mb-1" style={{ color: textPrimary, opacity: 0.7 }}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {archetype.weakness && (
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: textMuted }}>Schwäche</p>
                  <p className="font-body text-sm" style={{ color: textPrimary, opacity: 0.7 }}>{archetype.weakness}</p>
                </div>
              )}
              {(archetype.famousCharacter || archetype.realPerson) && (
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: textMuted }}>Bekannte Beispiele</p>
                  {archetype.famousCharacter && (
                    <p className="font-body text-sm mb-0.5" style={{ color: textPrimary, opacity: 0.7 }}>{archetype.famousCharacter}</p>
                  )}
                  {archetype.realPerson && (
                    <p className="font-body text-sm" style={{ color: textPrimary, opacity: 0.7 }}>{archetype.realPerson}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <hr style={{ borderColor: dividerColor, marginBottom: '1.25rem' }} />

          {archetype.brands && (
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: textMuted }}>Marken</p>
              <p className="font-mono text-sm" style={{ color: textPrimary, opacity: 0.55, letterSpacing: '0.05em' }}>
                {archetype.brands.join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* Right column — image */}
        <div className="archetype-fullcard-right" style={{ background: isDark ? '#2a2a2a' : '#e8e8e2' }}>
          {/* Skeleton shown while loading */}
          {!imgLoaded && !imgError && (
            <div
              className="archetype-fullcard-img-fallback"
              style={{
                position: 'absolute', inset: 0,
                background: isDark ? '#2a2a2a' : '#e2e2dc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span
                className="font-display font-black uppercase"
                style={{ fontSize: '6rem', lineHeight: 0.85, letterSpacing: 0, color: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(10,10,10,0.07)' }}
              >
                {num}
              </span>
            </div>
          )}

          {!imgError && archetype.image ? (
            <img
              key={archetype.image}
              src={archetype.image}
              alt={archetype.name}
              className="archetype-fullcard-img"
              style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : imgError ? (
            <div
              className="archetype-fullcard-img-fallback"
              style={{ background: isDark ? '#2a2a2a' : '#e8e8e2' }}
            >
              <span
                className="font-display font-black uppercase"
                style={{ fontSize: '6rem', lineHeight: 0.85, letterSpacing: 0, color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,10,10,0.1)' }}
              >
                {num}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Navigation row ── */}
      <div className="flex items-center justify-between mt-5 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} disabled={currentIndex === 0} className={`archetype-nav-btn ${navBorderClass}`} aria-label="Vorherige">←</button>
          <span className="font-mono text-sm" style={{ color: textMuted, minWidth: '3.5rem', textAlign: 'center' }}>
            {num} / {String(total).padStart(2, '0')}
          </span>
          <button onClick={handleNext} disabled={currentIndex === archetypes.length - 1} className={`archetype-nav-btn ${navBorderClass}`} aria-label="Nächste">→</button>
        </div>

        <div className="flex items-center gap-3">
          {/* Selection count */}
          {selectionLabel && (
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
              {selectionLabel}
            </span>
          )}
          {/* Select / Deselect button */}
          <button
            onClick={() => handleSelect(archetype)}
            disabled={isFull}
            className={isSelected ? 'btn-pill-dark' : 'btn-pill-light'}
            style={{
              ...(isSelected ? {} : { color: textPrimary, borderColor: isDark ? 'rgba(255,255,255,0.3)' : undefined }),
              ...(isFull ? { opacity: 0.35, cursor: 'not-allowed' } : {}),
            }}
          >
            {isSelected ? '✓ Ausgewählt' : 'Auswählen'}
          </button>
        </div>
      </div>

      {/* ── Dot row ── */}
      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
        {archetypes.map((arch, i) => {
          const dotSelected = selectedIds.includes(arch.id)
          const isCurrent = i === currentIndex
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Archetyp ${i + 1}`}
              style={{
                width: dotSelected ? 8 : 6,
                height: dotSelected ? 8 : 6,
                borderRadius: 9999,
                border: dotSelected ? '2px solid #BAFF99' : 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: dotSelected
                  ? '#BAFF99'
                  : isCurrent
                    ? (isDark ? '#ffffff' : '#0A0A0A')
                    : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(10,10,10,0.2)'),
                transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                boxShadow: dotSelected ? '0 0 0 2px rgba(186,255,153,0.3)' : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
