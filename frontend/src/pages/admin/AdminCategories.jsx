import { useEffect, useState } from 'react'
import { FiPlus, FiEdit, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

const EMPTY_FORM = { name: '', icon: '', description: '', isActive: true }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories/all')
      setCategories(res.data.data || [])
    } catch { toast.error('Failed to load categories') }
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true) }
  const openEdit = (c) => {
    setForm({ name: c.name, icon: c.icon || '', description: c.description || '', isActive: c.isActive })
    setEditId(c._id)
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, form)
        toast.success('Category updated')
      } else {
        await api.post('/categories', form)
        toast.success('Category created')
      }
      setModal(false)
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brown-dark">Categories</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                {['Icon', 'Name', 'Slug', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No categories found.</td></tr>
              ) : categories.map((c) => (
                <tr key={c._id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 text-2xl">{c.icon || '📦'}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-primary-100 text-stone-500 hover:text-brown transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-500 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h2 className="font-bold text-brown-dark">{editId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModal(false)} className="text-stone-500 hover:text-stone-800">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Category Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Icon (emoji)</label>
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" placeholder="e.g. 📱" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-brown" />
                <label htmlFor="isActive" className="text-sm font-medium text-stone-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
