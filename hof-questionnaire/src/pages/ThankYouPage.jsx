export default function ThankYouPage() {
  return (
    <div className="flex min-h-screen flex-col items-start justify-between bg-lime text-ink px-6 py-8 md:px-10">
      {/* Top */}
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-xs text-ink tracking-widest uppercase">House of Friends Studio</span>
        <span className="hof-counter">ABGESCHLOSSEN</span>
      </div>

      {/* Center */}
      <div className="max-w-2xl">
        <img src="/images/HOF_illu_beer_small.svg" alt="" className="mb-8 w-32 md:w-40" />
        <h1 className="font-display text-6xl font-black uppercase leading-none text-ink md:text-8xl" style={{letterSpacing: 0}}>
          Vielen Dank!
        </h1>
        <p className="survey-description font-body mt-8 max-w-md">
          Euer Input bildet das Fundament für unser gemeinsames Projekt. Wir freuen uns auf den weiteren Austausch. Bei Fragen erreicht Ihr uns jederzeit unter{' '}
          <a href="mailto:hello@hof-studio.com" className="underline underline-offset-4 hover:text-ink">
            hello@hof-studio.com
          </a>
          .
        </p>
      </div>

      {/* Bottom */}
      <div className="w-full flex items-end justify-end">
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
