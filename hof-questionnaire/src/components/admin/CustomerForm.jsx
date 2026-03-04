import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import Spinner from '../ui/Spinner.jsx'

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CustomerForm({ onSaved, onClose }) {
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const computedSlug = slugOverride.trim() || slugify(name)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const slug = computedSlug
    if (!slug) { setError('Name darf nicht leer sein.'); setLoading(false); return }

    const { data: customer, error: insertErr } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        contact_name: contactName.trim() || null,
        email: email.trim() || null,
        slug,
      })
      .select()
      .single()

    if (insertErr) {
      setError(insertErr.message)
      setLoading(false)
      return
    }

    // Assign all existing questions to this customer
    const { data: allQs } = await supabase.from('questions').select('id')
    if (allQs?.length) {
      const rows = allQs.map((q) => ({
        customer_id: customer.id,
        question_id: q.id,
        is_active: true,
      }))
      await supabase.from('customer_questions').insert(rows)
    }

    setLoading(false)
    onSaved(customer)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="hof-label-dark">Unternehmen</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Unternehmensname …"
          className="hof-input-dark"
        />
      </div>

      <div>
        <label className="hof-label-dark">
          Ansprechpartner
          <span className="ml-2 text-white/30 normal-case font-sans tracking-normal font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Vor- und Nachname …"
          className="hof-input-dark"
        />
      </div>

      <div>
        <label className="hof-label-dark">
          E-Mail
          <span className="ml-2 text-white/30 normal-case font-sans tracking-normal font-normal">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kunde@beispiel.de"
          className="hof-input-dark"
        />
      </div>

      <div>
        <label className="hof-label-dark">
          Slug
          <span className="ml-2 text-white/30 normal-case font-sans tracking-normal font-normal">(optional — wird auto-generiert)</span>
        </label>
        <input
          type="text"
          value={slugOverride}
          onChange={(e) => setSlugOverride(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder={computedSlug || 'kunden-slug'}
          className="hof-input-dark"
        />
        {computedSlug && (
          <p className="mt-2 font-mono text-xs text-white/30">
            /survey/<span className="text-lime">{computedSlug}</span>
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-full border border-red-500/40 bg-red-950/60 px-5 py-3 font-mono text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn-pill-lime"
        >
          {loading ? <Spinner light /> : 'Anlegen →'}
        </button>
        <button type="button" onClick={onClose} className="btn-pill-ghost">
          Abbrechen
        </button>
      </div>
    </form>
  )
}
