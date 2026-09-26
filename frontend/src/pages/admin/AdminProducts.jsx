import { useEffect, useState } from 'react'
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiUpload, FiRepeat, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

const EMPTY_FORM = {
  title: '', brand: '', price: '', originalPrice: '', stock: '',
  category: '', description: '', isFeatured: false,
  images: '', tags: '', specifications: '',
}

const MAX_IMAGES = 5
const MAX_BYTES = 5 * 1024 * 1024

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchProducts = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/products?page=${p}&limit=10`)
      setProducts(res.data.data || [])
      setPages(res.data.pages || 1)
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

  const resetForm = () => {
    imagePreviews.forEach((src) => URL.revokeObjectURL(src))
    setForm(EMPTY_FORM)
    setImageFiles([])
    setImagePreviews([])
    setExistingImages([])
    setEditId(null)
  }

  const openAdd = () => { resetForm(); setModal(true) }

  const openEdit = (p) => {
    resetForm()
    setForm({
      title: p.title, brand: p.brand, price: p.price,
      originalPrice: p.originalPrice || '', stock: p.stock,
      category: p.category?._id || p.category || '',
      description: p.description, isFeatured: p.isFeatured,
      images: '',
      tags: p.tags?.join(', ') || '',
      specifications: p.specifications?.map((s) => `${s.key}:${s.value}`).join('\n') || '',
    })
    setExistingImages(p.images || [])
    setEditId(p._id)
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    resetForm()
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    const room = MAX_IMAGES - existingImages.length - imageFiles.length
    if (room <= 0) { toast.error(`Maximum ${MAX_IMAGES} images allowed`); return }

    const valid = files
      .slice(0, room)
      .filter((f) => {
        if (f.size > MAX_BYTES) { toast.error(`${f.name} is too large (max 5MB)`); return false }
        return true
      })

    if (files.length > room) toast.error(`Only ${room} more image(s) allowed`)
    setImageFiles((prev) => [...prev, ...valid])
    setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeStagedImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const specifications = form.specifications
      .split('\n')
      .map((line) => {
        const [key, ...rest] = line.split(':')
        return key && rest.length ? { key: key.trim(), value: rest.join(':').trim() } : null
      })
      .filter(Boolean)

    const fields = {
      title: form.title,
      brand: form.brand,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || undefined,
      stock: Number(form.stock),
      category: form.category,
      description: form.description,
      isFeatured: form.isFeatured,
      exchangeEnabled: editId ? undefined : false,
      imageUrls: [...existingImages.map((i) => i.url), ...form.images.split(',').map((s) => s.trim())].filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      specifications: JSON.stringify(specifications),
    }

    setSaving(true)
    try {
      if (imageFiles.length > 0) {
        // Multer owns the "images" field once files are attached, so the
        // existing/typed URLs travel separately as imageUrls.
        const formData = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
          if (value !== undefined && value !== '') formData.append(key, value)
        })
        imageFiles.forEach((file) => formData.append('images', file))
        const res = editId
          ? await api.put(`/products/${editId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success(editId ? 'Phone updated' : 'Phone added')
        if (res.data?.data) setProducts((prev) => prev.map((p) => (p._id === res.data.data._id ? res.data.data : p)))
      } else {
        if (editId) {
          const res = await api.put(`/products/${editId}`, fields)
          toast.success('Phone updated')
          setProducts((prev) => prev.map((p) => (p._id === res.data.data._id ? res.data.data : p)))
        } else {
          await api.post('/products', fields)
          toast.success('Phone added')
        }
      }
      closeModal()
      fetchProducts(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleToggleExchange = async (p) => {
    setToggling(p._id)
    try {
      const res = await api.put(`/products/${p._id}/exchange`, { exchangeEnabled: !p.exchangeEnabled })
      setProducts((prev) => prev.map((x) => (x._id === p._id ? res.data.data : x)))
      toast.success(res.data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update exchange')
    }
    setToggling(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this phone?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Phone deleted')
      fetchProducts(page)
    } catch { toast.error('Delete failed') }
  }

  const stagedCount = existingImages.length + imageFiles.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brown-dark">Phones</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Phone
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                {['Image', 'Title', 'Brand', 'Price', 'Stock', 'Featured', 'Exchange', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">No phones yet. Click "Add Phone".</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <img src={p.images?.[0]?.url} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-cream-200"
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
                    <button
                      onClick={() => handleToggleExchange(p)}
                      disabled={toggling === p._id}
                      title={p.exchangeEnabled ? 'Customers can exchange an old phone for this — click to turn off' : 'Click to allow exchange of an old phone'}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50
                        ${p.exchangeEnabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-cream-100 text-stone-400 hover:bg-cream-200'}`}
                    >
                      <FiRepeat className="w-3.5 h-3.5" />
                      {toggling === p._id ? '...' : p.exchangeEnabled ? 'Allowed' : 'Not allowed'}
                    </button>
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

      {/* Add / Edit Phone Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h2 className="font-bold text-brown-dark">{editId ? 'Edit Phone' : 'Add Phone'}</h2>
              <button onClick={closeModal} className="text-stone-500 hover:text-stone-800">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Name *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. VoltCart Ultra 5G" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Brand *</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" placeholder="e.g. VoltCart" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" required>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Value (₹) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="e.g. 40000" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Original Value (₹)</label>
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
                <label className="block text-xs font-semibold text-stone-600 mb-1">Description *</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" placeholder="Camera, display, battery, box contents..." required />
              </div>

              {/* Photos */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Phone Photos ({stagedCount}/{MAX_IMAGES})
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-cream-300 rounded-xl cursor-pointer hover:border-brown hover:bg-cream-50 transition-colors">
                  <FiUpload className="w-4 h-4 text-stone-400" />
                  <span className="text-sm text-stone-600 font-medium">Click to upload photos</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>

                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-cream-200 group">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">saved</span>
                        <button type="button" onClick={() => removeExistingImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-300">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[9px] text-center py-0.5">new</span>
                        <button type="button" onClick={() => removeStagedImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  <FiImage className="w-3.5 h-3.5" /> or paste image URLs
                </label>
                <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input mt-1" placeholder="https://... (comma separated)" />
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
                  {saving ? 'Saving...' : editId ? 'Update Phone' : 'Add Phone'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
