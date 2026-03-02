import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const isSuccess = type === 'success'
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-xl max-w-sm animate-in slide-in-from-bottom-4">
      {isSuccess
        ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
        : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
      <p className="text-sm text-gray-700 leading-snug">{message}</p>
      <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
