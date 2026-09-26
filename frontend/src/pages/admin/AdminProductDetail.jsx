import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiEdit,
  FiInbox,
  FiPackage,
  FiStar,
  FiTrash2,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard, DataGrid, DataRow, ListRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import { money, formatDateTime, formatDate, errorMessage, pluralise } from '../../utils/adminUtils'

export default function AdminProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/products/${id}`)
      setProduct(data.data)
    } catch (err) {
      setError(errorMessage(err, 'This phone could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDelete = async () => {
    setBusy(true)
    try {
      await api.delete(`/products/${id}`)
      toast.success('Phone deleted')
      navigate('/admin/products', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, 'Delete failed'))
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Phone details" icon={FiPackage} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminPanelSkeleton className="h-72 lg:col-span-1" />
          <AdminPanelSkeleton className="h-72 lg:col-span-2" />
        </div>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <AdminPageHeader title="Phone details" icon={FiPackage} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Phone not found"
            description={error || 'It may have been deleted.'}
            action={
              <Link to="/admin/products" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" />
                Back to products
              </Link>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={product.title}
        description={`${product.brand} · ${product.category?.name || 'Uncategorised'}`}
        icon={FiPackage}
        actions={
          <>
            <Link to="/admin/products" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link to={`/admin/products/edit/${product._id}`} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiEdit className="w-4 h-4" />
              Edit
            </Link>
            <button onClick={() => setConfirmOpen(true)} className="btn-secondary !px-4 !py-2 text-sm !text-red-600 inline-flex items-center gap-2">
              <FiTrash2 className="w-4 h-4" />
              Delete
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Photos" bodyClassName="p-5">
          {product.images?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {product.images.map((image, index) => (
                <a
                  key={image.url || index}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`block overflow-hidden rounded-xl border border-slate-200 ${
                    index === 0 ? 'col-span-2' : ''
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.title} ${index + 1}`}
                    loading="lazy"
                    className={`w-full object-cover ${index === 0 ? 'h-56' : 'h-28'}`}
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="h-40 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FiPackage className="w-6 h-6" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {product.isFeatured && <AdminStatusBadge value="featured" tone="indigo" label="Featured" dot={false} />}
            <AdminStatusBadge
              value={product.exchangeEnabled ? 'enabled' : 'disabled'}
              tone={product.exchangeEnabled ? 'green' : 'slate'}
              label={product.exchangeEnabled ? 'Exchange allowed' : 'No exchange'}
              dot={false}
            />
            {product.rating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                <FiStar className="w-3 h-3" />
                {product.rating} ({product.numReviews})
              </span>
            )}
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Pricing and stock">
            <DataGrid>
              <DataRow label="Selling price" value={money(product.price)} />
              <DataRow label="Original price" value={product.originalPrice ? money(product.originalPrice) : '—'} />
              <DataRow label="Discount" value={`${product.discountPercent || 0}%`} />
              <DataRow label="Stock on hand" value={pluralise(product.stock, 'unit')} />
              <DataRow label="Category" value={product.category?.name} />
              <DataRow label="Brand" value={product.brand} />
              <DataRow label="Added" value={formatDate(product.createdAt)} />
              <DataRow label="Last updated" value={formatDateTime(product.updatedAt)} />
            </DataGrid>
          </SectionCard>

          <SectionCard title="Description">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </SectionCard>

          {product.specifications?.length > 0 && (
            <SectionCard title="Specifications">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.specifications.map((spec, index) => (
                  <div key={`${spec.key}-${index}`} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg bg-slate-50">
                    <dt className="text-xs font-semibold text-slate-500">{spec.key}</dt>
                    <dd className="text-xs font-semibold text-slate-800 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          )}

          {product.tags?.length > 0 && (
            <SectionCard title="Tags">
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title={`Reviews (${product.reviews?.length || 0})`} bodyClassName="py-2">
            {!product.reviews?.length ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No reviews yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {product.reviews.map((review) => (
                  <ListRow
                    key={review._id}
                    title={review.name}
                    subtitle={review.comment}
                    trailing={
                      <span className="text-xs font-bold text-amber-600 whitespace-nowrap">
                        {review.rating}/5 · {formatDate(review.createdAt)}
                      </span>
                    }
                  />
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmOpen}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this phone?"
        confirmLabel="Delete phone"
        message={`"${product.title}" will be removed from the store permanently. Orders that already contain it keep their record.`}
      />
    </>
  )
}
