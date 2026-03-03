import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError('E-Mail oder Passwort falsch.')
      setLoading(false)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6">
      {/* Logo */}
      <div className="mb-12 text-center">
        <p className="font-mono text-xs tracking-widest uppercase text-white/30 mb-2">Admin</p>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">
          HOF STUDIO
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="font-display text-xl font-black uppercase text-white mb-6">
          Anmelden
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-mono text-xs tracking-widest uppercase text-white/40 mb-1.5">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="deine@email.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm text-white placeholder-white/20 outline-none focus:border-lime focus:bg-white/10 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-mono text-xs tracking-widest uppercase text-white/40 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm text-white placeholder-white/20 outline-none focus:border-lime focus:bg-white/10 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-mono text-xs text-red-400">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-pill-lime w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Einloggen …
              </span>
            ) : (
              'Einloggen →'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 font-mono text-xs text-white/20">
        House of Friends Studio
      </p>
    </div>
  )
}
