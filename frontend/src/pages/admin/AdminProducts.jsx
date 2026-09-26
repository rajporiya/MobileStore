import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiEdit, FiEye, FiPackage, FiPlus, FiRepeat, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import { ADMIN_BUTTONS, cx } from '../../components/admin/adminTheme'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable, { Td } from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminTableToolbar from '../../components/admin/ui/AdminTableToolbar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import AdminModal from '../../components/admin/ui/AdminModal'
import { DataGrid, DataRow, SectionCard } from '../../components/admin/ui/AdminPanels'
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

const ROW = 'border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70'
const CHECKBOX = 'h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40'

// Stock is the only signal the products endpoint returns for availability, so the
// status column is derived from it rather than stored on the document.
const STOCK_STATUS = (stock) => {
  const count = Number(stock) || 0
  if (count === 0) return 'out'
  if (count <= 3) return 'low'
  return 'active'
}

const STATUS_TONE = { active: 'green', low: 'amber', out: 'red' }
const STATUS_LABEL = { active: 'Active', low: 'Low stock', out: 'Out of stock' }
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

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
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

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
      // A new page of rows invalidates whatever was ticked on the old one.
      setSelectedIds([])
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
    setStatusFilter('')
    setPage(1)
  }

  // Status is not a server-side query param, so it narrows the rows already loaded.
  const visibleProducts = useMemo(
    () => (statusFilter ? products.filter((p) => STOCK_STATUS(p.stock) === statusFilter) : products),
    [products, statusFilter]
  )

  const pageIds = useMemo(() => visibleProducts.map((p) => p._id), [visibleProducts])
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))

  const toggleRow = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))

  const toggleAll = () => setSelectedIds((prev) => (pageIds.length > 0 && pageIds.every((id) => prev.includes(id)) ? [] : pageIds))

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

  const filtering = isFiltered || Boolean(statusFilter)

  const columns = [
    { key: 'product', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', className: 'text-right' },
    { key: 'stock', label: 'Stock', className: 'text-right' },
    { key: 'status', label: 'Status' },
    { key: 'updated', label: 'Updated' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Products"
        eyebrow="Catalog"
        description="Manage your store inventory"
        meta={
          <span className="text-[12px] text-slate-500">
            {loading ? 'Loading the catalogue…' : `${pluralise(total, 'product')} in the store`}
          </span>
        }
        actions={
          <Link to="/admin/products/add" className={ADMIN_BUTTONS.primary}>
            <FiPlus className="h-4 w-4" aria-hidden="true" />
            Add Product
          </Link>
        }
      />

      <AdminTableToolbar
        isFiltered={filtering}
        resultCount={total}
        resultLabel="matching"
        onReset={resetFilters}
        className="mb-4"
      >
        <AdminSearchInput
          label="Search"
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Title, brand or description"
          className="grow"
        />
        <AdminSelect
          label="Category"
          value={filters.category}
          onChange={(value) => setFilter('category', value)}
          allLabel="All categories"
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          className="w-full sm:w-48"
        />
        <AdminSelect
          label="Stock"
          value={filters.availability}
          onChange={(value) => setFilter('availability', value)}
          allLabel="Any stock level"
          options={AVAILABILITY}
          className="w-full sm:w-40"
        />
        <AdminSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel="Any status"
          options={STATUS_OPTIONS}
          className="w-full sm:w-40"
        />
        <AdminSelect
          label="Sort"
          value={filters.sort}
          onChange={(value) => setFilter('sort', value)}
          showAll={false}
          options={SORTS}
          className="w-full sm:w-44"
        />
        <AdminSearchInput
          label="Brand"
          value={filters.brand}
          onChange={(value) => setFilter('brand', value)}
          placeholder="Brand"
          delay={500}
          className="w-full sm:w-36"
        />
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
      </AdminTableToolbar>

      {selectedIds.length > 0 && (
        <SectionCard className="mb-3" bodyClassName="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <p className="text-[13px] text-slate-600">
            <span className="font-semibold text-slate-900 tabular-nums">{selectedIds.length}</span> selected on this
            page
          </p>
          <button type="button" className={ADMIN_BUTTONS.ghost} onClick={() => setSelectedIds([])}>
            <FiX className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        </SectionCard>
      )}

      <AdminTable
        columns={columns}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        allSelected={allSelected}
        minWidth="min-w-[1080px]"
        loading={loading}
        error={error}
        isEmpty={visibleProducts.length === 0}
        onRetry={() => fetchProducts(page)}
        emptyIcon={FiPackage}
        emptyTitle={filtering ? 'No product matches these filters' : 'No products yet'}
        emptyDescription={
          filtering
            ? 'Try widening the search or clearing a filter.'
            : 'Add your first product to start selling.'
        }
        emptyAction={
          filtering ? (
            <button type="button" className={ADMIN_BUTTONS.secondary} onClick={resetFilters}>
              Reset filters
            </button>
          ) : (
            <Link to="/admin/products/add" className={ADMIN_BUTTONS.primary}>
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              Add your first product
            </Link>
          )
        }
        footer={<AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="products" />}
      >
        {(keyOf, ids, toggle) =>
          visibleProducts.map((product) => {
            const status = STOCK_STATUS(product.stock)
            return (
              <tr key={keyOf(product)} className={ROW}>
                <Td>
                  <input
                    type="checkbox"
                    checked={ids.includes(product._id)}
                    onChange={() => toggle?.(product._id)}
                    aria-label={`Select ${product.title}`}
                    className={CHECKBOX}
                  />
                </Td>

                <Td>
                  <div className="flex items-center gap-3">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                        <FiPackage className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Link
                          to={`/admin/products/${product._id}`}
                          className="truncate text-[13px] font-semibold text-slate-800 transition-colors hover:text-indigo-600"
                        >
                          {product.title}
                        </Link>
                        {product.isFeatured && (
                          <AdminStatusBadge value="featured" tone="indigo" label="Featured" dot={false} size="xs" />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">{product.brand || '—'}</p>
                    </div>
                  </div>
                </Td>

                <Td>
                  <span className="font-mono text-[12px] text-slate-500">{product.sku || '—'}</span>
                </Td>

                <Td className="whitespace-nowrap">{product.category?.name || '—'}</Td>

                <Td className="whitespace-nowrap text-right">
                  <span className="font-semibold text-slate-900 tabular-nums">{money(product.price)}</span>
                  {product.originalPrice > product.price && (
                    <span className="ml-1.5 text-[11px] text-slate-400 line-through tabular-nums">
                      {money(product.originalPrice)}
                    </span>
                  )}
                </Td>

                <Td className="text-right">
                  <span className={cx('font-semibold tabular-nums', product.stock ? 'text-slate-900' : 'text-slate-400')}>
                    {product.stock}
                  </span>
                </Td>

                <Td>
                  <AdminStatusBadge value={status} tone={STATUS_TONE[status]} label={STATUS_LABEL[status]} />
                </Td>

                <Td className="whitespace-nowrap text-[12px] text-slate-500">{formatDate(product.updatedAt)}</Td>

                <Td>
                  <AdminActionMenu
                    label={`Actions for ${product.title}`}
                    items={[
                      { label: 'View details', icon: FiEye, onClick: () => setViewing(product) },
                      { label: 'Edit', icon: FiEdit, onClick: () => setEditing(product) },
                      {
                        label: product.exchangeEnabled ? 'Disable exchange' : 'Allow exchange',
                        icon: FiRepeat,
                        description: toggling === product._id ? 'Saving…' : undefined,
                        disabled: toggling === product._id,
                        onClick: () => handleToggleExchange(product),
                      },
                      { label: 'Delete', icon: FiTrash2, danger: true, onClick: () => setDeleting(product) },
                    ]}
                  />
                </Td>
              </tr>
            )
          })
        }
      </AdminTable>

      <AdminModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.title}` : 'Edit product'}
        description="Saved changes appear in the storefront immediately."
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
        title={viewing?.title || 'Product'}
        description={viewing ? `${viewing.brand || '—'} · ${viewing.category?.name || 'Uncategorised'}` : ''}
        size="lg"
        footer={
          <>
            <button type="button" className={ADMIN_BUTTONS.secondary} onClick={() => setViewing(null)}>
              Close
            </button>
            <Link to={`/admin/products/${viewing?._id}`} className={ADMIN_BUTTONS.primary}>
              <FiEye className="h-4 w-4" aria-hidden="true" />
              Open full details
            </Link>
          </>
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex gap-4">
              {viewing.images?.[0]?.url ? (
                <img
                  src={viewing.images[0].url}
                  alt={viewing.title}
                  className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                  <FiPackage className="h-6 w-6" aria-hidden="true" />
                </span>
              )}
              <div className="grow">
                <DataGrid>
                  <DataRow label="Price" value={money(viewing.price)} />
                  <DataRow label="Stock" value={pluralise(viewing.stock, 'unit')} />
                  <DataRow label="SKU" value={viewing.sku} mono />
                  <DataRow label="Rating" value={`${viewing.rating} (${pluralise(viewing.numReviews, 'review')})`} />
                  <DataRow label="Exchange" value={viewing.exchangeEnabled ? 'Allowed' : 'Not allowed'} />
                  <DataRow label="Updated" value={formatDate(viewing.updatedAt)} />
                </DataGrid>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-600">{viewing.description}</p>
            </div>

            {viewing.specifications?.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Specifications</p>
                <DataGrid>
                  {viewing.specifications.map((spec, index) => (
                    <DataRow key={`${spec.key}-${index}`} label={spec.key} value={spec.value} />
                  ))}
                </DataGrid>
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
        title="Delete this product?"
        confirmLabel="Delete product"
        message={
          deleting
            ? `"${deleting.title}" will be removed from the store permanently. Orders that already contain it keep their record.`
            : ''
        }
      />
    </>
  )
}
