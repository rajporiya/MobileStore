import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle, FiXCircle, FiSmartphone, FiClock, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  fetchDealerRequests,
  fetchDealerStats,
  approveTradeInRequest,
  rejectTradeInRequest,
  completeTradeInRequest,
} from '../../store/slices/tradeInSlice'
import { PageLoader } from '../../components/common/Skeletons'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'completed', label: 'Completed' },
]

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-blue',
  rejected: 'badge-red',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

const STAT_CARDS = [
  { key: 'total', label: 'Total', color: 'from-slate-500 to-slate-600' },
  { key: 'pending', label: 'Pending', color: 'from-amber-500 to-orange-500' },
  { key: 'approved', label: 'Approved', color: 'from-blue-500 to-indigo-500' },
  { key: 'completed', label: 'Completed', color: 'from-emerald-500 to-teal-500' },
]

const CONDITION_LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' }

export default function DealerRequestsPage() {
  const dispatch = useDispatch()
  const { dealerRequests, dealerStats, loading } = useSelector((s) => s.tradeIn)

  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null) // 'approve' | 'reject' | null
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchDealerStats())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchDealerRequests(statusFilter))
  }, [dispatch, statusFilter])

  const openApprove = (req) => {
    setSelected(req)
    setPrice(req.expectedPrice || '')
    setNote('')
    setModal('approve')
  }

  const openReject = (req) => {
    setSelected(req)
    setNote('')
    setModal('reject')
  }

  const handleApprove = async () => {
    if (!price || Number(price) <= 0) {
      toast.error('Enter a valid offer price')
      return
    }
    setActionLoading(true)
    const result = await dispatch(approveTradeInRequest({ id: selected._id, dealerPrice: Number(price), note }))
    if (approveTradeInRequest.fulfilled.match(result)) {
      toast.success(`Offer of ₹${Number(price).toLocaleString('en-IN')} sent to user`)
      setModal(null)
      setSelected(null)
      dispatch(fetchDealerStats())
    } else {
      toast.error(result.payload || 'Failed to approve')
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    setActionLoading(true)
    const result = await dispatch(rejectTradeInRequest({ id: selected._id, note }))
    if (rejectTradeInRequest.fulfilled.match(result)) {
      toast.success('Request rejected')
      setModal(null)
      setSelected(null)
      dispatch(fetchDealerStats())
    } else {
      toast.error(result.payload || 'Failed to reject')
    }
    setActionLoading(false)
  }

  const handleComplete = async (id) => {
    if (!confirm('Confirm you have paid the user and collected the phone?')) return
    const result = await dispatch(completeTradeInRequest(id))
    if (completeTradeInRequest.fulfilled.match(result)) {
      toast.success('Trade-in completed — payment recorded')
      dispatch(fetchDealerStats())
    } else {
      toast.error(result.payload || 'Failed to complete')
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trade-in Requests</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review, approve or reject old phone buy requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-md`}>
              <FiSmartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{dealerStats[key] ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === key
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <PageLoader />
      ) : dealerRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <FiClock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No requests found</h3>
          <p className="text-slate-400 text-sm">New trade-in requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dealerRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Images */}
                <div className="flex gap-2 md:w-64 shrink-0">
                  {req.images?.length > 0 ? (
                    req.images.slice(0, 3).map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noreferrer"
                        className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">📱</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{req.brand} {req.model}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span>Condition: <strong className="text-slate-700 capitalize">{CONDITION_LABELS[req.condition] || req.condition}</strong></span>
                        <span>Expected: <strong className="text-slate-700">₹{(req.expectedPrice || 0).toLocaleString('en-IN')}</strong></span>
                        <span>Posted: {formatDate(req.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[req.status]} capitalize shrink-0`}>{req.status}</span>
                  </div>

                  {req.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{req.description}</p>
                  )}

                  {/* User */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 bg-slate-50 rounded-xl p-3 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <FiStar className="w-3.5 h-3.5 text-indigo-500" /> {req.user?.name}
                    </span>
                    <span className="text-slate-500">{req.user?.email}</span>
                    {req.user?.phone && <span className="text-slate-500">📞 {req.user.phone}</span>}
                    {req.user?.address?.city && <span className="text-slate-500">📍 {req.user.address.city}</span>}
                  </div>

                  {/* Dealer decision info */}
                  {(req.status === 'approved' || req.status === 'completed') && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <strong>Your offer: ₹{req.dealerPrice?.toLocaleString('en-IN')}</strong>
                      {req.dealerNote && <span> — {req.dealerNote}</span>}
                    </div>
                  )}
                  {req.status === 'rejected' && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      Rejected{req.dealerNote ? <span>: {req.dealerNote}</span> : ''}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 md:w-36 shrink-0">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => openApprove(req)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95">
                        <FiCheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => openReject(req)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-red-300 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors active:scale-95">
                        <FiXCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <button onClick={() => handleComplete(req._id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95">
                      <FiCheckCircle className="w-4 h-4" /> Paid & Collected
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {modal === 'approve' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Approve: {selected.brand} {selected.model}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-800">
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Offer Price (₹) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  placeholder={`User expects ₹${(selected.expectedPrice || 0).toLocaleString('en-IN')}`}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note to User</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="e.g. Condition verified, offer valid for 3 days"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleApprove} disabled={actionLoading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Approve & Send Offer'}
                </button>
                <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modal === 'reject' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Reject: {selected.brand} {selected.model}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-800">
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="e.g. Does not meet our buy-back criteria"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleReject} disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50">
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reject Request'}
                </button>
                <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}