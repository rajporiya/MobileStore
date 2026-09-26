import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiInbox, FiRefreshCw, FiUser, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminModal from '../../components/admin/ui/AdminModal'
import { SectionCard, DataGrid, DataRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import {
  money,
  formatDate,
  formatDateTime,
  errorMessage,
  pluralise,
  shortId,
  titleCase,
  TRADE_IN_TONE,
} from '../../utils/adminUtils'

export default function AdminTradeInDetail() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/tradein/${id}`)
      setRequest(data.data)
      setValue(data.data.dealerPrice || data.data.expectedPrice || '')
      setNote(data.data.dealerNote || '')
    } catch (err) {
      setError(errorMessage(err, 'This trade-in request could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (path, body, successMessage) => {
    setSaving(true)
    try {
      const { data } = await api.put(`/tradein/${id}/${path}`, body)
      setRequest(data.data)
      setNote(data.data.dealerNote || '')
      toast.success(successMessage)
      setModal(null)
    } catch (err) {
      toast.error(errorMessage(err, 'The request could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Trade-in request" icon={FiRefreshCw} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminPanelSkeleton className="h-72" />
          <AdminPanelSkeleton className="h-72 lg:col-span-2" />
        </div>
      </>
    )
  }

  if (error || !request) {
    return (
      <>
        <AdminPageHeader title="Trade-in request" icon={FiRefreshCw} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Request not found"
            description={error || 'It may have been deleted.'}
            action={
              <Link to="/admin/trade-ins" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" />
                Back to trade-ins
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const canDecide = request.status === 'pending' || request.status === 'approved'

  return (
    <>
      <AdminPageHeader
        title={`${request.brand} ${request.model}`}
        description={`Submitted ${formatDateTime(request.createdAt)}`}
        icon={FiRefreshCw}
        actions={
          <>
            <Link to="/admin/trade-ins" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Link>
            {canDecide && (
              <>
                <button
                  onClick={() => setModal('reject')}
                  disabled={saving}
                  className="btn-secondary !px-4 !py-2 text-sm !text-red-600 inline-flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setModal('approve')}
                  disabled={saving}
                  className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  {request.status === 'approved' ? 'Update value' : 'Approve & set value'}
                </button>
              </>
            )}
            {request.status === 'approved' && !request.linkedOrder && (
              <button
                onClick={() => runAction('complete', undefined, 'Trade-in marked complete')}
                disabled={saving}
                className="btn-secondary !px-4 !py-2 text-sm"
              >
                Mark complete
              </button>
            )}
          </>
        }
      />

      <div className="mb-4">
        <AdminStatusBadge value={request.status} tone={TRADE_IN_TONE[request.status]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SectionCard title="Photos" bodyClassName="p-5">
            {request.images?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {request.images.map((image, index) => (
                  <a
                    key={image.url || index}
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img src={image.url} alt={`Old phone ${index + 1}`} className="w-full h-28 object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="h-32 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">📱</div>
            )}
          </SectionCard>

          <SectionCard title="Customer">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0">
                <FiUser className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <Link to={`/admin/users/${request.user?._id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600 block truncate">
                  {request.user?.name || 'Unknown'}
                </Link>
                <p className="text-xs text-slate-500 truncate">{request.user?.email}</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Old phone">
            <DataGrid cols={3}>
              <DataRow label="Brand" value={request.brand} />
              <DataRow label="Model" value={request.model} />
              <DataRow label="Condition" value={titleCase(request.condition)} />
              <DataRow label="Submitted" value={formatDate(request.createdAt)} />
              <DataRow label="Decision made" value={request.decisionAt ? formatDate(request.decisionAt) : 'Not yet'} />
              <DataRow label="Photos" value={pluralise(request.images?.length || 0, 'photo')} />
            </DataGrid>
            {request.description && (
              <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Customer description
                </span>
                {request.description}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Valuation">
            <DataGrid>
              <DataRow label="Customer expected" value={money(request.expectedPrice)} />
              <DataRow
                label="Approved value"
                value={request.exchangeValue > 0 ? money(request.exchangeValue) : 'Not approved yet'}
              />
              <DataRow label="Dealer price" value={request.dealerPrice ? money(request.dealerPrice) : 'Unquoted'} />
              <DataRow label="Approved by" value={request.approvedBy?.name} />
              <DataRow label="Dealer" value={request.dealer?.dealerInfo?.shopName || request.dealer?.name} />
              <DataRow label="Submitted" value={formatDate(request.createdAt)} />
            </DataGrid>
            {request.dealerNote && (
              <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Note to customer
                </span>
                {request.dealerNote}
              </p>
            )}
          </SectionCard>

          {request.linkedOrder && (
            <SectionCard
              title="Linked purchase order"
              action={
                <Link to={`/admin/orders/${request.linkedOrder._id}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                  Open order
                </Link>
              }
            >
              <DataGrid>
                <DataRow label="Order" value={`#${shortId(request.linkedOrder._id)}`} mono />
                <DataRow label="Order total" value={money(request.linkedOrder.totalPrice)} />
                <DataRow label="Order status" value={request.linkedOrder.orderStatus} />
                <DataRow label="Credit applied" value={money(request.exchangeValue)} />
              </DataGrid>
            </SectionCard>
          )}
        </div>
      </div>

      <AdminModal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        title={request.status === 'approved' ? 'Update exchange value' : 'Approve trade-in'}
        description={`${request.brand} ${request.model}`}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => runAction('approve', { dealerPrice: Number(value), note }, 'Trade-in approved')}
              disabled={saving || !value || Number(value) <= 0}
              className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Saving…' : 'Approve & set value'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="detail-value" className="block text-xs font-bold text-slate-600 mb-1.5">
              Old phone value (₹) *
            </label>
            <input
              id="detail-value"
              type="number"
              min="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input"
              placeholder={`Customer expects ${money(request.expectedPrice)}`}
            />
          </div>
          <div>
            <label htmlFor="detail-note" className="block text-xs font-bold text-slate-600 mb-1.5">
              Note to customer
            </label>
            <textarea
              id="detail-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input resize-none"
            />
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title="Reject trade-in"
        description={`${request.brand} ${request.model}`}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => runAction('reject', { note }, 'Trade-in rejected')}
              disabled={saving}
              className="btn-danger !px-4 !py-2 text-sm inline-flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Rejecting…' : 'Reject exchange'}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="detail-reject-note" className="block text-xs font-bold text-slate-600 mb-1.5">
            Reason (optional)
          </label>
          <textarea
            id="detail-reject-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input resize-none"
            placeholder="e.g. Does not meet our exchange criteria"
          />
        </div>
      </AdminModal>
    </>
  )
}
