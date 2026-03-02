import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import Modal from '../components/ui/Modal.jsx'
import Toast from '../components/ui/Toast.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import CustomerForm from '../components/admin/CustomerForm.jsx'
import CustomerDetail from '../components/admin/CustomerDetail.jsx'
import { Plus, Users, Settings, Search, ChevronRight, Mail, Trash2 } from 'lucide-react'

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
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const handleCustomerSaved = (customer) => {
    setShowCreate(false)
    loadCustomers()
    setSelectedCustomer(customer)
    showToast(`Kunde "${customer.name}" wurde angelegt.`)
  }

  const handleDelete = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`Kunden "${name}" wirklich löschen? Alle Antworten werden ebenfalls gelöscht.`)) return
    setDeletingId(id)
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) showToast(error.message, 'error')
    else {
      showToast(`Kunde "${name}" gelöscht.`)
      loadCustomers()
    }
    setDeletingId(null)
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">HOF Studio</h1>
              <p className="text-xs text-gray-500">Fragebogen Admin</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Neuer Kunde
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <Users className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-gray-500">Kunden gesamt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & List */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Kunden suchen …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {search ? 'Kein Kunde gefunden.' : 'Noch keine Kunden angelegt.'}
              </p>
              {!search && (
                <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
                  <Plus className="h-4 w-4" />
                  Ersten Kunden anlegen
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="group flex cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-gray-50"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{c.email}</span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                  {/* Slug badge */}
                  <code className="hidden shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500 sm:block">
                    {c.slug}
                  </code>
                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(e, c.id, c.name)}
                    disabled={deletingId === c.id}
                    className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    {deletingId === c.id ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-brand-500" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Neuen Kunden anlegen" onClose={() => setShowCreate(false)}>
          <CustomerForm onSaved={handleCustomerSaved} onClose={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <Modal
          title={`${selectedCustomer.name}`}
          size="lg"
          onClose={() => setSelectedCustomer(null)}
        >
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
