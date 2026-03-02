import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors =
    type === 'error'
      ? 'border-red-500/40 bg-red-950/80 text-red-300'
      : 'border-lime/30 bg-ink text-lime'

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-full border px-5 py-3 shadow-2xl backdrop-blur-sm transition ${colors}`}
    >
      <span className="font-mono text-xs tracking-widest uppercase">{message}</span>
      <button
        onClick={onClose}
        className="font-mono text-xs opacity-50 hover:opacity-100 transition"
      >
        ✕
      </button>
    </div>
  )
}
