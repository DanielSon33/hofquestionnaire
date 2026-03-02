import { useEffect } from 'react'

export default function Modal({ title, children, onClose, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative w-full ${widths[size]} rounded-2xl bg-ink border border-white/10 shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-black uppercase tracking-tight text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 font-mono text-xs text-white/30 hover:bg-white/10 hover:text-white transition"
          >
            ESC
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  )
}
