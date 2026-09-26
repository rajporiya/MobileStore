import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiRepeat, FiSearch, FiPackage,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import ProductForm from '../../components/admin/ProductForm'

const PER_PAGE = 20

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchProducts = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/products?page=${p}&limit=${PER_PAGE}&sort=newest`)
      setProducts(res.data.data || [])
      setPages(res.data.pages || 1)
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load phones')
    }
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.title, p.brand, p.category?.name].some((v) => v?.toLowerCase().includes(q))
    )
  }, [products, search])

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
    setDeleting(id)
    try {
      await api.delete(`/products/${id}`)
      toast.success('Phone deleted')
      if (products.length === 1 && page > 1) setPage(page - 1)
      else fetchProducts(page)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All Phones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${total} phone${total === 1 ? '' : 's'} in the store`}
          </p>
        </div>
        <Link to="/admin/add-phone" className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Phone
        </Link>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input !pl-9"
          placeholder="Search this page by name, brand, category"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Image', 'Phone', 'Brand', 'Category', 'Value', 'Stock', 'Featured', 'Exchange', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <FiPackage className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-stone-500 text-sm font-medium">
                      {search ? 'No phone matches your search.' : 'No phones yet.'}
                    </p>
                    {!search && (
                      <Link to="/admin/add-phone" className="btn-primary inline-flex items-center gap-2 mt-4">
                        <FiPlus className="w-4 h-4" /> Add your first phone
                      </Link>
                    )}
                  </td>
                </tr>
              ) : visible.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <img
                      src={p.images?.[0]?.url}
                      alt={p.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      onError={(e) => { e.target.style.visibility = 'hidden' }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{p.brand}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                    {p.category?.name || '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    ₹{p.price?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.isFeatured
                      ? <FiCheck className="w-4 h-4 text-green-500" />
                      : <FiX className="w-4 h-4 text-stone-300" />}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleExchange(p)}
                      disabled={toggling === p._id}
                      title={p.exchangeEnabled
                        ? 'Customers can exchange an old phone for this — click to turn off'
                        : 'Click to allow exchange of an old phone'}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        p.exchangeEnabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-stone-400 hover:bg-slate-200'
                      }`}
                    >
                      <FiRepeat className="w-3.5 h-3.5" />
                      {toggling === p._id ? '...' : p.exchangeEnabled ? 'Allowed' : 'Not allowed'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(p)}
                        title="Edit phone"
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.title}"? This cannot be undone.`)) handleDelete(p._id)
                        }}
                        disabled={deleting === p._id}
                        title="Delete phone"
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
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
          <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2 justify-end">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); fetchProducts(p) }}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  p === page ? 'bg-slate-900 text-white' : 'bg-slate-100 text-stone-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Phone Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-900">Edit Phone</h2>
              <button onClick={() => setEditing(null)} className="text-stone-500 hover:text-stone-800">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ProductForm
                product={editing}
                onCancel={() => setEditing(null)}
                onSaved={() => { setEditing(null); fetchProducts(page) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
