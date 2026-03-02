import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import Spinner from '../ui/Spinner.jsx'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export default function CustomerForm({ onSaved, onClose }) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim()) {
      setError('Bitte Name und E-Mail ausfüllen.')
      return
    }

    setLoading(true)
    try {
      // Build a unique slug
      const baseSlug = slugify(form.name)
      const rand = Math.random().toString(36).slice(2, 7)
      const slug = `${baseSlug}-${rand}`

      // Insert customer
      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .insert({ name: form.name.trim(), email: form.email.trim(), slug })
        .select()
        .single()

      if (custErr) throw custErr

      // Load all questions and create customer_questions rows (all active by default)
      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('id, default_active')
      if (qErr) throw qErr

      if (questions?.length) {
        const cqRows = questions.map((q) => ({
          customer_id: customer.id,
          question_id: q.id,
          is_active: q.default_active,
        }))
        const { error: cqErr } = await supabase.from('customer_questions').insert(cqRows)
        if (cqErr) throw cqErr
      }

      onSaved(customer)
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handle}
          placeholder="Max Mustermann / Musterhaus GmbH"
          className="input-base"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">E-Mail *</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handle}
          placeholder="max@beispiel.de"
          className="input-base"
          required
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          Abbrechen
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Spinner size="sm" />}
          Kunde anlegen
        </button>
      </div>
    </form>
  )
}
