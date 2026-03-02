export default function Spinner({ light = false }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${light ? 'text-lime' : 'text-ink'}`}
      aria-label="Lädt …"
    />
  )
}
