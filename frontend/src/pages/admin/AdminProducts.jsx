import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FiEdit,
  FiEye,
  FiPackage,
  FiPlus,
  FiRepeat,
  FiTrash2,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminFilterBar from '../../components/admin/ui/AdminFilterBar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import AdminModal from '../../components/admin/ui/AdminModal'
import ProductForm from '../../components/admin/ProductForm'
import { money, formatDate, errorMessage, pluralise, toDateInput } from '../../utils/adminUtils'

const PER_PAGE = 20

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
]

const AVAILABILITY = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

const EMPTY_FILTERS = { search: '', category: '', brand: '', sort: 'newest', availability: '', from: '', to: '' }

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [toggling, setToggling] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewing, setViewing] = useState(null)

  // Filters live in the URL so a filtered list can be linked and survives reload.
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'newest',
    availability: searchParams.get('availability') || '',
    from: toDateInput(searchParams.get('dateFrom')),
    to: toDateInput(searchParams.get('dateTo')),
  }))

  const isFiltered = useMemo(
    () => Object.entries(filters).some(([key, value]) => value !== EMPTY_FILTERS[key]),
    [filters]
  )

  useEffect(() => {
    const next = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== EMPTY_FILTERS[key]) next[key] = value
    })
    setSearchParams(next, { replace: true })
  }, [filters, setSearchParams])

  const fetchProducts = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/products', {
        params: {
          page: targetPage,
          limit: PER_PAGE,
          search: filters.search || undefined,
          category: filters.category || undefined,
          brand: filters.brand || undefined,
          sort: filters.sort || undefined,
          availability: filters.availability || undefined,
          dateFrom: filters.from || undefined,
          dateTo: filters.to || undefined,
        },
      })
      setProducts(data.data || [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(errorMessage(err, 'The phone list could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProducts(page)
  }, [fetchProducts, page])

  useEffect(() => {
    api
      .get('/categories/all')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]))
  }, [])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const patchProduct = (id, updated) =>
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, ...updated } : p)))

  const handleToggleExchange = async (product) => {
    setToggling(product._id)
    try {
      const { data } = await api.put(`/products/${product._id}/exchange`, {
        exchangeEnabled: !product.exchangeEnabled,
      })
      patchProduct(product._id, data.data)
      toast.success(data.message)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update exchange for this phone.'))
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.delete(`/products/${deleting._id}`)
      toast.success(`"${deleting.title}" deleted`)
      setDeleting(null)
      // Stepping back a page avoids landing on an empty final page.
      if (products.length === 1 && page > 1) setPage(page - 1)
      else fetchProducts(page)
    } catch (err) {
      toast.error(errorMessage(err, 'Delete failed'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns = [
    { key: 'product', label: 'Phone' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'flags', label: 'Flags' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={loading ? 'Loading the catalogue…' : `${pluralise(total, 'phone')} in the store`}
        icon={FiPackage}
        actions={
          <Link to="/admin/products/add" className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Add phone
          </Link>
        }
      />

      <AdminFilterBar
        isFiltered={isFiltered}
        resultCount={total}
        onReset={resetFilters}
      >
        <AdminSearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by title, brand or description"
          className="grow"
        />
        <AdminSelect
          label="Category"
          value={filters.category}
          onChange={(value) => setFilter('category', value)}
          allLabel="All categories"
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          className="w-full sm:w-44"
        />
        <AdminSelect label="Sort" value={filters.sort} onChange={(value) => setFilter('sort', value)} showAll={false} options={SORTS} className="w-full sm:w-44" />
        <AdminSelect
          label="Availability"
          value={filters.availability}
          onChange={(value) => setFilter('availability', value)}
          allLabel="Any stock level"
          options={AVAILABILITY}
          className="w-full sm:w-40"
        />
        <AdminSearchInput value={filters.brand} onChange={(value) => setFilter('brand', value)} placeholder="Brand" delay={500} className="w-full sm:w-40" />
        <AdminDateRange
          label="Added between"
          from={filters.from}
          to={filters.to}
          onChange={({ from, to }) => {
            setFilters((prev) => ({ ...prev, from, to }))
            setPage(1)
          }}
          className="w-full sm:w-72"
        />
      </AdminFilterBar>

      <AdminTable
        columns={columns}
        loading={loading}
        error={error}
        isEmpty={products.length === 0}
        onRetry={() => fetchProducts(page)}
        emptyIcon={FiPackage}
        emptyTitle={isFiltered ? 'No phone matches these filters' : 'No phones yet'}
        emptyDescription={
          isFiltered ? 'Try widening the search or clearing a filter.' : 'Add your first phone to start selling.'
        }
        emptyAction={
          isFiltered ? (
            <button onClick={resetFilters} className="btn-secondary !px-4 !py-2 text-sm">
              Reset filters
            </button>
          ) : (
            <Link to="/admin/products/add" className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Add your first phone
            </Link>
          )
        }
        footer={
          <AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="phones" />
        }
      >
        {(keyOf) =>
          products.map((product) => (
            <tr key={keyOf(product)} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      loading="lazy"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <span className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FiPackage className="w-4 h-4 text-slate-400" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link
                      to={`/admin/products/${product._id}`}
                      className="block text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate max-w-[220px]"
                    >
                      {product.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                      {product.brand} · added {formatDate(product.createdAt)}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {product.category?.name || '—'}
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-sm font-bold text-slate-900">{money(product.price)}</p>
                {product.originalPrice > product.price && (
                  <p className="text-[11px] text-slate-400 line-through">{money(product.originalPrice)}</p>
                )}
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`text-sm font-bold ${
                    product.stock === 0 ? 'text-red-600' : product.stock <= 3 ? 'text-amber-600' : 'text-slate-700'
                  }`}
                >
                  {product.stock}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.isFeatured && <AdminStatusBadge value="featured" tone="indigo" label="Featured" dot={false} />}
                  <button
                    onClick={() => handleToggleExchange(product)}
                    disabled={toggling === product._id}
                    title={product.exchangeEnabled ? 'Exchange is allowed — click to turn off' : 'Click to allow trade-in for this phone'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset
                      transition-colors disabled:opacity-50 ${
                        product.exchangeEnabled
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 ring-slate-500/20 hover:bg-slate-200'
                      }`}
                  >
                    <FiRepeat className="w-3 h-3" />
                    {toggling === product._id ? 'Saving…' : product.exchangeEnabled ? 'Exchange' : 'No exchange'}
                  </button>
                </div>
              </td>

              <td className="px-4 py-3">
                <AdminActionMenu
                  items={[
                    { label: 'View details', icon: FiEye, onClick: () => setViewing(product) },
                    { label: 'Edit', icon: FiEdit, onClick: () => setEditing(product) },
                    { label: 'Delete', icon: FiTrash2, danger: true, onClick: () => setDeleting(product) },
                  ]}
                />
              </td>
            </tr>
          ))
        }
      </AdminTable>

      <AdminModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.title}` : 'Edit phone'}
        size="xl"
      >
        {editing && (
          <ProductForm
            product={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              fetchProducts(page)
            }}
          />
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.title || 'Phone'}
        description={viewing ? `${viewing.brand} · ${viewing.category?.name || 'Uncategorised'}` : ''}
        size="lg"
        footer={
          <>
            <button className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setViewing(null)}>
              Close
            </button>
            <Link
              to={`/admin/products/${viewing?._id}`}
              className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2"
            >
              <FiEye className="w-4 h-4" />
              Open full details
            </Link>
          </>
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex gap-4">
              {viewing.images?.[0]?.url && (
                <img src={viewing.images[0].url} alt={viewing.title} className="w-24 h-24 rounded-xl object-cover border border-slate-200" />
              )}
              <dl className="grid grid-cols-2 gap-3 grow">
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price</dt>
                  <dd className="text-sm font-bold text-slate-900">{money(viewing.price)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock</dt>
                  <dd className="text-sm font-bold text-slate-900">{viewing.stock}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating</dt>
                  <dd className="text-sm font-semibold text-slate-800">
                    {viewing.rating} ({viewing.numReviews})
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exchange</dt>
                  <dd className="text-sm font-semibold text-slate-800">{viewing.exchangeEnabled ? 'Allowed' : 'Not allowed'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{viewing.description}</p>
            </div>

            {viewing.specifications?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specifications</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewing.specifications.map((spec, i) => (
                    <div key={`${spec.key}-${i}`} className="flex justify-between gap-4 px-3 py-2 rounded-lg bg-slate-50">
                      <dt className="text-xs font-semibold text-slate-500">{spec.key}</dt>
                      <dd className="text-xs font-semibold text-slate-800 text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this phone?"
        confirmLabel="Delete phone"
        message={
          deleting
            ? `"${deleting.title}" will be removed from the store permanently. Orders that already contain it keep their record.`
            : ''
        }
      />
    </>
  )
}
