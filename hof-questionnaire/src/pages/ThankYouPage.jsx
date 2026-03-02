import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function ThankYouPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="card w-full max-w-md px-8 py-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Vielen Dank!</h1>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          Ihr Fragebogen wurde erfolgreich übermittelt.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Wir melden uns so schnell wie möglich bei Ihnen. Bei Fragen erreichen Sie uns jederzeit
          unter{' '}
          <a href="mailto:hallo@hof-studio.com" className="text-brand-600 hover:underline">
            hallo@hof-studio.com
          </a>
          .
        </p>
        <div className="mt-8 h-px w-full bg-gray-100" />
        <p className="mt-6 text-xs text-gray-400">
          HOF Studio · Wir freuen uns auf die Zusammenarbeit
        </p>
      </div>
    </div>
  )
}
