import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-600">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Seite nicht gefunden</h1>
        <p className="mt-2 text-sm text-gray-500">Die aufgerufene URL existiert nicht.</p>
        <Link to="/admin" className="btn-primary mt-6 inline-flex">
          Zurück zum Admin
        </Link>
      </div>
    </div>
  )
}
