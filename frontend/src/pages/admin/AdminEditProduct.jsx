import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiEdit, FiInbox, FiPackage } from 'react-icons/fi'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import ProductForm from '../../components/admin/ProductForm'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { errorMessage } from '../../utils/adminUtils'

export default function AdminEditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (!cancelled) setProduct(data.data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'This phone could not be loaded.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Edit phone" icon={FiEdit} />
        <AdminPanelSkeleton className="h-96" />
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <AdminPageHeader title="Edit phone" icon={FiEdit} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Phone not found"
            description={error || 'It may have been deleted.'}
            action={
              <button onClick={() => navigate('/admin/products')} className="btn-secondary !px-4 !py-2 text-sm">
                Back to products
              </button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={`Edit ${product.title}`}
        description="Changes go live on the storefront as soon as you save"
        icon={FiPackage}
      />
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <ProductForm
          product={product}
          onCancel={() => navigate('/admin/products')}
          onSaved={() => navigate(`/admin/products/${id}`)}
        />
      </div>
    </>
  )
}
