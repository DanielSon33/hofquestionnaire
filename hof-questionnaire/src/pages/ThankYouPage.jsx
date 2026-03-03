export default function ThankYouPage() {
  return (
    <div className="flex min-h-screen flex-col items-start justify-between bg-lime px-6 py-8 md:px-10">
      {/* Top */}
      <div className="flex w-full items-center justify-between">
        <span className="hof-counter">HOF STUDIO</span>
        <span className="hof-counter">ABGESCHLOSSEN</span>
      </div>

      {/* Center */}
      <div className="max-w-2xl">
        <p className="hof-label mb-4">Danke</p>
        <h1 className="font-display text-6xl font-black uppercase leading-none text-ink md:text-8xl" style={{letterSpacing: 0}}>
          Fragebogen<br />eingegangen.
        </h1>
        <p className="mt-8 font-body text-xl text-ink/70 leading-relaxed max-w-md">
          Wir melden uns so schnell wie möglich bei dir. Bei Fragen erreichst du uns unter{' '}
          <a href="mailto:hello@hof-studio.com" className="underline underline-offset-4 hover:text-ink">
            hello@hof-studio.com
          </a>
          .
        </p>
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
