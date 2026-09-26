import { useEffect, useRef, useState } from 'react'
import { FiUpload, FiX, FiImage, FiPlus, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

const EMPTY_FORM = {
  title: '', brand: '', price: '', originalPrice: '', stock: '',
  category: '', description: '', isFeatured: false, exchangeEnabled: false,
  imageUrls: '', tags: '', specifications: '',
}

export const MAX_IMAGES = 5
const MAX_BYTES = 5 * 1024 * 1024

const toForm = (p) => ({
  title: p.title ?? '',
  brand: p.brand ?? '',
  price: p.price ?? '',
  originalPrice: p.originalPrice ?? '',
  stock: p.stock ?? 0,
  category: p.category?._id || p.category || '',
  description: p.description ?? '',
  isFeatured: !!p.isFeatured,
  exchangeEnabled: !!p.exchangeEnabled,
  imageUrls: '',
  tags: p.tags?.join(', ') ?? '',
  specifications: p.specifications?.map((s) => `${s.key}:${s.value}`).join('\n') ?? '',
})

const parseSpecLines = (raw) =>
  raw
    .split('\n')
    .map((line) => {
      const [key, ...rest] = line.split(':')
      return key.trim() && rest.length ? { key: key.trim(), value: rest.join(':').trim() } : null
    })
    .filter(Boolean)

/**
 * Add / edit form for a phone. Pass `product` to edit, omit it to create.
 * Calls onSaved(createdOrUpdatedProduct) once the API confirms.
 */
export default function ProductForm({ product, onSaved, onCancel, className = '' }) {
  const isEdit = !!product
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(() => (product ? toForm(product) : EMPTY_FORM))
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState(() => product?.images || [])
  const [saving, setSaving] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const previewsRef = useRef(imagePreviews)
  previewsRef.current = imagePreviews

  useEffect(() => {
    api
      .get('/categories/all')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => () => {
    previewsRef.current.forEach((src) => URL.revokeObjectURL(src))
  }, [])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    const room = MAX_IMAGES - existingImages.length - imageFiles.length
    if (room <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }

    const valid = files.slice(0, room).filter((f) => {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is too large (max 5MB)`)
        return false
      }
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

  const handleCreateCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const res = await api.post('/categories', { name, icon: '📱' })
      setCategories((prev) => [...prev, res.data.data])
      set('category', res.data.data._id)
      setNewCategory('')
      setCreatingCategory(false)
      toast.success(`Category "${name}" created`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create category')
    }
  }

  const reset = () => {
    imagePreviews.forEach((src) => URL.revokeObjectURL(src))
    setForm(EMPTY_FORM)
    setImageFiles([])
    setImagePreviews([])
    setExistingImages([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.category) {
      toast.error('Pick a category first')
      return
    }

    const fields = {
      title: form.title.trim(),
      brand: form.brand.trim(),
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || undefined,
      stock: Number(form.stock),
      category: form.category,
      description: form.description.trim(),
      isFeatured: form.isFeatured,
      exchangeEnabled: form.exchangeEnabled,
      imageUrls: [
        ...existingImages.map((i) => i.url),
        ...form.imageUrls.split(',').map((s) => s.trim()),
      ].filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      specifications: JSON.stringify(parseSpecLines(form.specifications)),
    }

    if (!Number.isFinite(fields.price) || fields.price < 0) {
      toast.error('Enter a valid phone value')
      return
    }
    if (!Number.isFinite(fields.stock) || fields.stock < 0) {
      toast.error('Enter a valid stock quantity')
      return
    }

    setSaving(true)
    try {
      let res
      if (imageFiles.length > 0) {
        // Multer owns the "images" field once files are attached, so the kept
        // and typed URLs travel separately as imageUrls.
        const formData = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
          if (value !== undefined && value !== '') formData.append(key, value)
        })
        imageFiles.forEach((file) => formData.append('images', file))
        res = isEdit
          ? await api.put(`/products/${product._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        res = isEdit
          ? await api.put(`/products/${product._id}`, fields)
          : await api.post('/products', fields)
      }

      toast.success(isEdit ? 'Phone updated' : 'Phone added to the store')
      reset()
      onSaved?.(res.data?.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const stagedCount = existingImages.length + imageFiles.length

  return (
    <form onSubmit={handleSubmit} className={`grid sm:grid-cols-2 gap-4 ${className}`}>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Name *</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="input"
          placeholder="e.g. VoltCart Ultra 5G"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Brand *</label>
        <input
          value={form.brand}
          onChange={(e) => set('brand', e.target.value)}
          className="input"
          placeholder="e.g. VoltCart"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Category *</label>
        <div className="flex gap-2">
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="input"
            required
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setCreatingCategory((v) => !v)}
            title="Create a new category"
            className="shrink-0 w-11 rounded-xl border border-slate-200 text-stone-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <FiPlus className="w-4 h-4 mx-auto" />
          </button>
        </div>
        {creatingCategory && (
          <div className="flex gap-2 mt-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
              className="input !py-2"
              placeholder="New category name"
            />
            <button type="button" onClick={handleCreateCategory} className="btn-primary !px-3 !py-2 shrink-0">
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}
        {categories.length === 0 && !creatingCategory && (
          <p className="text-[11px] text-amber-600 mt-1">
            No categories yet — use the + button to create the first one.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Value (₹) *</label>
        <input
          type="number"
          min="0"
          value={form.price}
          onChange={(e) => set('price', e.target.value)}
          className="input"
          placeholder="e.g. 40000"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Original Value (₹)</label>
        <input
          type="number"
          min="0"
          value={form.originalPrice}
          onChange={(e) => set('originalPrice', e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Stock *</label>
        <input
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => set('stock', e.target.value)}
          className="input"
          required
        />
      </div>

      <div className="flex items-center gap-4 pt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm font-medium text-stone-700">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer" title="Customers may exchange an old phone for this one">
          <input
            type="checkbox"
            checked={form.exchangeEnabled}
            onChange={(e) => set('exchangeEnabled', e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm font-medium text-stone-700">Exchange allowed</span>
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">Description *</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="input resize-none"
          placeholder="Camera, display, battery, box contents..."
          required
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">
          Phone Photos ({stagedCount}/{MAX_IMAGES})
        </label>
        <label
          className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            stagedCount >= MAX_IMAGES
              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <FiUpload className="w-4 h-4 text-stone-400" />
          <span className="text-sm text-stone-600 font-medium">
            {stagedCount >= MAX_IMAGES ? `Maximum ${MAX_IMAGES} photos reached` : 'Click to upload photos'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={stagedCount >= MAX_IMAGES}
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {stagedCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {existingImages.map((img, i) => (
              <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">saved</span>
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imagePreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-300">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[9px] text-center py-0.5">new</span>
                <button
                  type="button"
                  onClick={() => removeStagedImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
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
        <input
          value={form.imageUrls}
          onChange={(e) => set('imageUrls', e.target.value)}
          className="input mt-1"
          placeholder="https://... (comma separated)"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">Tags (comma-separated)</label>
        <input
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          className="input"
          placeholder="5G, 120Hz, AMOLED"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">
          Specifications (one per line: Name:Value)
        </label>
        <textarea
          rows={4}
          value={form.specifications}
          onChange={(e) => set('specifications', e.target.value)}
          className="input font-mono text-xs resize-none"
          placeholder={'RAM:8GB\nStorage:256GB\nBattery:5000mAh'}
        />
      </div>

      <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Update Phone' : 'Add Phone'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
      </div>
    </form>
  )
}
