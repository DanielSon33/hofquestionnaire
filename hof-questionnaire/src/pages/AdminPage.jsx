import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import Modal from '../components/ui/Modal.jsx'
import Toast from '../components/ui/Toast.jsx'
import CustomerForm from '../components/admin/CustomerForm.jsx'
import CustomerDetail from '../components/admin/CustomerDetail.jsx'

export default function AdminPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [toast, setToast] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const handleCustomerSaved = (customer) => {
    setShowCreate(false)
    loadCustomers()
    setSelectedCustomer(customer)
    showToast(`Kunde "${customer.name}" angelegt.`)
  }

  const handleDelete = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`"${name}" wirklich löschen?`)) return
    setDeletingId(id)
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) showToast(error.message, 'error')
    else { showToast(`"${name}" gelöscht.`); loadCustomers() }
    setDeletingId(null)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <div className="min-h-screen bg-ink text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-white/40">Admin</p>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
              HOF STUDIO
            </h1>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-pill-light text-white border-white/30 hover:bg-white hover:text-ink">
            + Neuer Kunde
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 md:px-10">
        {/* Stats row */}
        <div className="mb-8 flex items-center gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-white/40">Kunden</p>
            <p className="font-display text-4xl font-black text-lime">{customers.length}</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-white/40">Aktiv</p>
            <p className="font-display text-4xl font-black text-white">{customers.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            placeholder="Kunden suchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-sans text-white placeholder-white/30 outline-none focus:border-lime focus:bg-white/10 transition"
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="py-16 text-center font-mono text-xs tracking-widest uppercase text-white/30 animate-pulse">
            Wird geladen …
          </p>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-5xl font-black uppercase text-white/10 mb-4">LEER</p>
            <p className="font-body text-white/40 mb-6">
              {search ? 'Kein Kunde gefunden.' : 'Noch keine Kunden angelegt.'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)} className="btn-pill-light border-white/30 text-white hover:bg-white hover:text-ink">
                + Ersten Kunden anlegen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="group flex cursor-pointer items-center gap-4 rounded-xl border border-transparent px-4 py-4 transition hover:border-white/10 hover:bg-white/5"
              >
                {/* Index */}
                <span className="w-8 shrink-0 font-mono text-xs text-white/20">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-black font-display text-ink">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-white truncate">{c.name}</p>
                  <p className="font-mono text-xs text-white/40 truncate">{c.email}</p>
                </div>
                {/* Slug */}
                <code className="hidden shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/50 sm:block">
                  {c.slug}
                </code>
                {/* Date */}
                <span className="hidden shrink-0 font-mono text-xs text-white/30 md:block">
                  {formatDate(c.created_at)}
                </span>
                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, c.id, c.name)}
                  disabled={deletingId === c.id}
                  className="shrink-0 rounded-full px-3 py-1 font-mono text-xs text-white/20 opacity-0 transition hover:bg-red-900/40 hover:text-red-400 group-hover:opacity-100"
                >
                  ✕
                </button>
                {/* Arrow */}
                <span className="shrink-0 font-mono text-white/20 group-hover:text-lime transition">→</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreate && (
        <Modal title="Neuer Kunde" onClose={() => setShowCreate(false)}>
          <CustomerForm onSaved={handleCustomerSaved} onClose={() => setShowCreate(false)} />
        </Modal>
      )}
      {selectedCustomer && (
        <Modal title={selectedCustomer.name} size="lg" onClose={() => setSelectedCustomer(null)}>
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            showToast={showToast}
          />
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
