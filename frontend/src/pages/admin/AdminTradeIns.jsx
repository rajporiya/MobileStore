import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiXCircle, FiTrash2, FiRefreshCw, FiRepeat } from 'react-icons/fi'
import {
  fetchAllTradeInRequests,
  approveTradeInRequest,
  rejectTradeInRequest,
  deleteTradeInRequest,
} from '../../store/slices/tradeInSlice'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-blue',
  completed: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-red',
}

const CONDITION_LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' }

const money = (n) => `₹${(n || 0).toLocaleString('en-IN')}`

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminTradeIns() {
  const dispatch = useDispatch()
  const { allRequests, loading } = useSelector((s) => s.tradeIn)

  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null) // 'approve' | 'reject' | null
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchAllTradeInRequests(statusFilter))
  }, [dispatch, statusFilter])

  const openApprove = (req) => {
    setSelected(req)
    setValue(req.dealerPrice || req.expectedPrice || '')
    setNote(req.dealerNote || '')
    setModal('approve')
  }

  const openReject = (req) => {
    setSelected(req)
    setNote('')
    setModal('reject')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
  }

  const handleApprove = async () => {
    if (!value || Number(value) <= 0) {
      toast.error('Enter the old phone value')
      return
    }
    setSaving(true)
    const result = await dispatch(
      approveTradeInRequest({ id: selected._id, dealerPrice: Number(value), note })
    )
    if (approveTradeInRequest.fulfilled.match(result)) {
      toast.success(`Exchange allowed — ${money(Number(value))} deducted from the new phone`)
      closeModal()
    } else {
      toast.error(result.payload || 'Failed to approve')
    }
    setSaving(false)
  }

  const handleReject = async () => {
    setSaving(true)
    const result = await dispatch(rejectTradeInRequest({ id: selected._id, note }))
    if (rejectTradeInRequest.fulfilled.match(result)) {
      toast.success('Exchange rejected')
      closeModal()
    } else {
      toast.error(result.payload || 'Failed to reject')
    }
    setSaving(false)
  }

  const handleDelete = async (req) => {
    if (!confirm(`Delete the ${req.brand} ${req.model} request?`)) return
    const result = await dispatch(deleteTradeInRequest(req._id))
    if (deleteTradeInRequest.fulfilled.match(result)) {
      toast.success('Request deleted')
    } else {
      toast.error(result.payload || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Exchange Old Phone</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Approve an old phone and set its value — it is deducted from the new phone at checkout
          </p>
        </div>
        <button
          onClick={() => dispatch(fetchAllTradeInRequests(statusFilter))}
          className="btn-secondary flex items-center gap-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Customer', 'Old Phone', 'Condition', 'Expected', 'Exchange Value', 'Linked Order', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : allRequests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No exchange requests found.</td></tr>
              ) : allRequests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{req.user?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{req.user?.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(req.createdAt)}</p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="flex gap-1 shrink-0">
                        {req.images?.length > 0 ? (
                          req.images.slice(0, 2).map((img, i) => (
                            <a key={i} href={img.url} target="_blank" rel="noreferrer"
                              className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base">📱</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 whitespace-nowrap">{req.brand} {req.model}</p>
                        <p className="text-xs text-slate-400">via {req.dealer?.dealerInfo?.shopName || req.dealer?.name || '—'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600 capitalize whitespace-nowrap">
                    {CONDITION_LABELS[req.condition] || req.condition}
                  </td>

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{money(req.expectedPrice)}</td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {req.exchangeValue > 0 ? (
                      <span className="font-semibold text-emerald-600">-{money(req.exchangeValue)}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                    {req.approvedBy?.name && (
                      <p className="text-xs text-slate-400">by {req.approvedBy.name}</p>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {req.linkedOrder ? (
                      <div>
                        <p className="font-mono text-xs text-slate-600">{req.linkedOrder._id?.slice(-8)}</p>
                        <p className="text-xs font-semibold text-slate-700">{money(req.linkedOrder.totalPrice)}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[req.status] || 'badge-yellow'} capitalize`}>
                      {req.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {(req.status === 'pending' || req.status === 'approved') && (
                        <>
                          <button
                            onClick={() => openApprove(req)}
                            title={req.status === 'approved' ? 'Update value' : 'Allow exchange'}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReject(req)}
                            title="Reject"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(req)}
                        disabled={!!req.linkedOrder}
                        title={req.linkedOrder ? 'Cancel the exchange on the order first' : 'Delete'}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
      </div>

      {/* Approve / value modal */}
      {modal === 'approve' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FiRepeat className="w-4 h-4 text-indigo-600" />
                {selected.status === 'approved' ? 'Update Value' : 'Allow Exchange'} — {selected.brand} {selected.model}
              </h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-800">
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-400">Customer:</span> <strong className="text-slate-800">{selected.user?.name}</strong></p>
                <p><span className="text-slate-400">Condition:</span> <strong className="text-slate-800 capitalize">{CONDITION_LABELS[selected.condition] || selected.condition}</strong></p>
                <p><span className="text-slate-400">Customer expects:</span> <strong className="text-slate-800">{money(selected.expectedPrice)}</strong></p>
                {selected.linkedOrder && (
                  <p>
                    <span className="text-slate-400">Linked order:</span>{' '}
                    <strong className="font-mono text-slate-800">{selected.linkedOrder._id?.slice(-8)}</strong>{' '}
                    <span className="text-slate-400">(currently {money(selected.linkedOrder.totalPrice)})</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Old Phone Value (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input"
                  placeholder={`Customer expects ${money(selected.expectedPrice)}`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This amount is deducted from the new phone price at checkout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note to Customer</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input resize-none"
                  placeholder="e.g. Condition verified, bring the phone and ID at delivery"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Allow Exchange'}
                </button>
                <button onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {modal === 'reject' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Reject — {selected.brand} {selected.model}</h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-800">
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selected.linkedOrder && (
                <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">
                  This old phone is linked to order {selected.linkedOrder._id?.slice(-8)}. Rejecting it
                  restores the new phone price to {money(
                    (selected.linkedOrder.totalPrice || 0) + (selected.exchangeValue || 0)
                  )}.
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (optional)</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input resize-none"
                  placeholder="e.g. Does not meet our exchange criteria"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Rejecting...' : 'Reject Exchange'}
                </button>
                <button onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
