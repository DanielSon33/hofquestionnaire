import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-start justify-between bg-lime px-6 py-8 md:px-10">
      {/* Top */}
      <div className="flex w-full items-center justify-between">
        <span className="hof-counter">HOF STUDIO</span>
        <span className="hof-counter">404</span>
      </div>

      {/* Center */}
      <div className="max-w-2xl">
        <p className="hof-label mb-4">Nicht gefunden</p>
        <h1 className="font-display text-6xl font-black uppercase leading-none tracking-tight text-ink md:text-8xl">
          Seite nicht<br />vorhanden.
        </h1>
        <p className="mt-8 font-body text-xl text-ink/70 leading-relaxed max-w-md">
          Die Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-10">
          <Link to="/admin" className="btn-pill-dark">
            Zurück zum Admin →
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="w-full flex items-end justify-between">
        <p className="font-mono text-xs text-ink/40 tracking-widest uppercase">
          House of Friends Studio
        </p>
        <a
          href="https://hof-studio.com"
          target="_blank"
          rel="noreferrer"
          className="btn-pill-dark"
        >
          hof-studio.com →
        </a>
      </div>
    </div>
  )
}
