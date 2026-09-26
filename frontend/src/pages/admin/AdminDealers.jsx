import { useEffect, useState } from 'react'
import { FiPlus, FiEdit, FiX, FiBriefcase, FiPower } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function AdminDealers() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ email: '', shopName: '', city: '' })
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ shopName: '', description: '', city: '' })
  const [saving, setSaving] = useState(false)

  const fetchDealers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/dealers')
      setDealers(res.data.data || [])
    } catch { toast.error('Failed to load dealers') }
    setLoading(false)
  }

  useEffect(() => { fetchDealers() }, [])

  const handlePromote = async (e) => {
    e.preventDefault()
    if (!form.email.trim()) { toast.error('Enter an email'); return }
    setSaving(true)
    try {
      await api.post('/users/dealers', form)
      toast.success(`${form.email} promoted to dealer`)
      setModal(false)
      setForm({ email: '', shopName: '', city: '' })
      fetchDealers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to promote user')
    }
    setSaving(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/users/dealers/${editModal._id}`, editForm)
      toast.success('Dealer updated')
      setEditModal(null)
      fetchDealers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
    setSaving(false)
  }

  const handleToggleActive = async (dealer) => {
    try {
      await api.put(`/users/dealers/${dealer._id}`, {
        isActive: !dealer.dealerInfo?.isActive,
      })
      toast.success(dealer.dealerInfo?.isActive ? 'Dealer deactivated' : 'Dealer activated')
      fetchDealers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const openEdit = (dealer) => {
    setEditModal(dealer)
    setEditForm({
      shopName: dealer.dealerInfo?.shopName || '',
      description: dealer.dealerInfo?.description || '',
      city: dealer.dealerInfo?.city || '',
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dealers</h1>
          <p className="text-slate-500 text-xs mt-0.5">{dealers.length} total dealers</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Dealer
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Shop Name', 'Email', 'City', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : dealers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No dealers yet.</td></tr>
              ) : dealers.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <FiBriefcase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{d.dealerInfo?.shopName || d.name}</p>
                        <p className="text-xs text-slate-400">{d.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.email}</td>
                  <td className="px-4 py-3 text-slate-600">{d.dealerInfo?.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${d.dealerInfo?.isActive ? 'badge-green' : 'badge-red'}`}>
                      {d.dealerInfo?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleActive(d)}
                        className={`p-1.5 rounded-lg transition-colors ${d.dealerInfo?.isActive ? 'hover:bg-red-50 text-slate-500 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'}`}
                        title={d.dealerInfo?.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <FiPower className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dealer Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Promote User to Dealer</h2>
              <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-800"><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePromote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">User Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="user@example.com" required />
                <p className="text-[11px] text-slate-400 mt-1">The user must already have an account in the system</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Shop Name</label>
                <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="input" placeholder="e.g. Mobile Hub" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="e.g. Mumbai" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Promoting...' : 'Promote to Dealer'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dealer Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Edit Dealer — {editModal.name}</h2>
              <button onClick={() => setEditModal(null)} className="text-slate-500 hover:text-slate-800"><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Shop Name</label>
                <input value={editForm.shopName} onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Update'}</button>
                <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}