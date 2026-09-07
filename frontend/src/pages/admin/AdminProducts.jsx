import { useEffect, useState } from 'react'
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

const EMPTY_FORM = {
  title: '', brand: '', price: '', originalPrice: '', stock: '',
  category: '', description: '', isFeatured: false,
  images: '', tags: '',
  specifications: '',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchProducts = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/products?page=${p}&limit=10`)
      setProducts(res.data.data?.products || [])
      setPages(res.data.data?.pages || 1)
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all')
      setCategories(res.data.data || [])
    } catch {}
  }

  useEffect(() => { fetchProducts(); fetchCategories() }, [])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true) }
  const openEdit = (p) => {
    setForm({
      title: p.title, brand: p.brand, price: p.price,
      originalPrice: p.originalPrice || '', stock: p.stock,
      category: p.category?._id || p.category || '',
      description: p.description, isFeatured: p.isFeatured,
      images: p.images?.join(', ') || '',
      tags: p.tags?.join(', ') || '',
      specifications: p.specifications?.map((s) => `${s.name}:${s.value}`).join('\n') || '',
    })
    setEditId(p._id)
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title, brand: form.brand, price: Number(form.price),
        originalPrice: Number(form.originalPrice) || undefined,
        stock: Number(form.stock), category: form.category,
        description: form.description, isFeatured: form.isFeatured,
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        specifications: form.specifications.split('\n')
          .map((line) => { const [n, ...v] = line.split(':'); return n && v.length ? { name: n.trim(), value: v.join(':').trim() } : null })
          .filter(Boolean),
      }
      if (editId) {
        await api.put(`/products/${editId}`, payload)
        toast.success('Product updated')
      } else {
        await api.post('/products', payload)
        toast.success('Product created')
      }
      setModal(false)
      fetchProducts(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted')
      fetchProducts(page)
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brown-dark">Products</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                {['Image', 'Title', 'Brand', 'Price', 'Stock', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">No products found.</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <img src={p.images?.[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-cream-200"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=📱' }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800 max-w-[180px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-stone-600">{p.brand}</td>
                  <td className="px-4 py-3 font-semibold text-brown-dark">₹{p.price?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-stone-600">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.isFeatured ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiX className="w-4 h-4 text-stone-300" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-primary-100 text-stone-500 hover:text-brown transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-500 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-cream-200 flex items-center gap-2 justify-end">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => { setPage(p); fetchProducts(p) }}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? 'bg-brown text-white' : 'bg-cream-100 text-stone-600 hover:bg-cream-200'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h2 className="font-bold text-brown-dark">{editId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModal(false)} className="text-stone-500 hover:text-stone-800">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Brand *</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" required>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Price (₹) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Original Price (₹)</label>
                <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Stock *</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" required />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 accent-brown" />
                <label htmlFor="featured" className="text-sm font-medium text-stone-700">Featured Product</label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Image URLs (comma-separated)</label>
                <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Specifications (one per line: Name:Value)</label>
                <textarea rows={4} value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} className="input font-mono text-xs resize-none" placeholder={'RAM:8GB\nStorage:256GB\nBattery:5000mAh'} />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
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
