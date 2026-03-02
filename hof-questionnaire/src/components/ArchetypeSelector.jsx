import { useRef, useState, useEffect, useCallback } from 'react'
import { archetypeIcons } from '../lib/questionnaire-data'

export default function ArchetypeSelector({ archetypes, selected, onChange, isDark = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedId, setSelectedId] = useState(selected || null)
  const scrollRef = useRef(null)
  const cardRefs = useRef([])

  // Sync selected prop
  useEffect(() => {
    setSelectedId(selected || null)
  }, [selected])

  // Scroll handler to track active card
  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const scrollLeft = container.scrollLeft
    const containerWidth = container.offsetWidth
    let closestIdx = 0
    let closestDist = Infinity
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const viewCenter = scrollLeft + containerWidth / 2
      const dist = Math.abs(cardCenter - viewCenter)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    })
    setActiveIndex(closestIdx)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToCard = (index) => {
    const card = cardRefs.current[index]
    const container = scrollRef.current
    if (!card || !container) return
    const targetScrollLeft = card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2
    container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
    setActiveIndex(index)
  }

  const handleSelect = (archetype) => {
    const newId = selectedId === archetype.id ? null : archetype.id
    setSelectedId(newId)
    onChange(newId ? archetype : null)
  }

  const handlePrev = () => {
    if (activeIndex > 0) scrollToCard(activeIndex - 1)
  }

  const handleNext = () => {
    if (activeIndex < archetypes.length - 1) scrollToCard(activeIndex + 1)
  }

  const borderColor = isDark ? 'border-white/10' : 'border-black/10'
  const textColor = isDark ? 'text-white' : 'text-black'
  const subTextColor = isDark ? 'text-white/50' : 'text-black/50'
  const cardBg = isDark ? 'bg-white/5' : 'bg-black/5'
  const dotColor = isDark ? 'bg-white/30' : 'bg-black/30'
  const dotActiveColor = isDark ? 'bg-white' : 'bg-black'
  const navBtnBase = isDark
    ? 'border-white/20 text-white/50 hover:border-white/50 hover:text-white'
    : 'border-black/20 text-black/50 hover:border-black/50 hover:text-black'

  return (
    <div className="archetype-selector w-full">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="archetype-scroll"
      >
        <div className="archetype-scroll-inner">
          {archetypes.map((archetype, i) => {
            const isActive = i === activeIndex
            const isSelected = selectedId === archetype.id
            const icon = archetypeIcons[archetype.id] || '●'
            return (
              <div
                key={archetype.id}
                ref={el => cardRefs.current[i] = el}
                className={[
                  'archetype-card',
                  isActive ? 'archetype-card-active' : '',
                  isSelected ? 'archetype-card-selected' : '',
                  cardBg,
                  borderColor,
                  textColor,
                ].join(' ')}
                onClick={() => scrollToCard(i)}
              >
                {/* Icon */}
                <div className="archetype-card-icon">
                  <span className="text-4xl">{icon}</span>
                </div>

                {/* Name */}
                <h3 className={`archetype-card-name font-display font-black uppercase leading-tight ${textColor}`}>
                  {archetype.name}
                </h3>

                {/* Tagline */}
                <p className={`archetype-card-tagline font-body italic text-sm ${subTextColor}`}>
                  „{archetype.tagline}"
                </p>

                {/* Description */}
                <p className={`archetype-card-desc font-body text-sm leading-relaxed ${subTextColor}`}>
                  {archetype.description}
                </p>

                {/* Traits */}
                <div className="archetype-card-traits flex flex-wrap gap-1 mt-auto">
                  {archetype.traits.map(trait => (
                    <span
                      key={trait}
                      className={`text-xs font-mono px-2 py-0.5 rounded-full border ${borderColor} ${subTextColor}`}
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                {/* Brands */}
                <p className={`archetype-card-brands text-xs font-mono mt-2 ${subTextColor}`}>
                  {archetype.brands.join(' · ')}
                </p>

                {/* Select button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelect(archetype) }}
                  className={[
                    'archetype-select-btn',
                    isSelected ? 'archetype-select-btn-active' : '',
                  ].join(' ')}
                >
                  {isSelected ? '✓ Ausgewählt' : 'Wählen'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation row */}
      <div className="archetype-nav flex items-center justify-center gap-4 mt-6">
        {/* Prev button */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className={`archetype-nav-btn ${navBtnBase}`}
          aria-label="Vorherige"
        >
          ←
        </button>

        {/* Dot indicators */}
        <div className="archetype-dots flex items-center gap-1.5">
          {archetypes.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className={`archetype-dot ${i === activeIndex ? dotActiveColor : dotColor}`}
              aria-label={`Archetype ${i + 1}`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={activeIndex === archetypes.length - 1}
          className={`archetype-nav-btn ${navBtnBase}`}
          aria-label="Nächste"
        >
          →
        </button>
      </div>

      {/* Selected archetype summary */}
      {selectedId && (() => {
        const sel = archetypes.find(a => a.id === selectedId)
        if (!sel) return null
        return (
          <div className={`archetype-selected-summary mt-6 p-4 rounded-2xl border ${borderColor} ${cardBg}`}>
            <p className={`text-xs font-mono tracking-widest uppercase mb-1 ${subTextColor}`}>
              Dein Archetyp
            </p>
            <p className={`font-display font-black text-2xl uppercase ${textColor}`}>
              {archetypeIcons[sel.id]} {sel.name}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
