import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiCheck,
  FiEye,
  FiInbox,
  FiRefreshCw,
  FiRepeat,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import {
  fetchAllTradeInRequests,
  approveTradeInRequest,
  rejectTradeInRequest,
  deleteTradeInRequest,
} from '../../store/slices/tradeInSlice'
import { fetchOrderStats } from '../../store/slices/orderSlice'

import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminFilterBar from '../../components/admin/ui/AdminFilterBar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminModal from '../../components/admin/ui/AdminModal'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import {
  money,
  formatDate,
  errorMessage,
  pluralise,
  toDateInput,
  titleCase,
  TRADE_IN_TONE,
} from '../../utils/adminUtils'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
]

const EMPTY_FILTERS = { search: '', status: '', from: '', to: '' }

export default function AdminTradeIns() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { allRequests, adminList, loading, error } = useSelector((s) => s.tradeIn)
  const { adminStats } = useSelector((s) => s.orders)
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    from: toDateInput(searchParams.get('dateFrom')),
    to: toDateInput(searchParams.get('dateTo')),
  }))
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  const [modal, setModal] = useState(null) // 'approve' | 'reject'
  const [selected, setSelected] = useState(null)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const isFiltered = useMemo(
    () => Object.entries(filters).some(([key, val]) => val !== EMPTY_FILTERS[key]),
    [filters]
  )

  useEffect(() => {
    const next = { page: page > 1 ? page : undefined }
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== EMPTY_FILTERS[key]) next[key] = val
    })
    setSearchParams(next, { replace: true })
  }, [filters, page, setSearchParams])

  useEffect(() => {
    dispatch(fetchAllTradeInRequests({ ...filters, page }))
  }, [dispatch, filters, page])

  useEffect(() => {
    if (!adminStats) dispatch(fetchOrderStats())
  }, [dispatch, adminStats])

  const setFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
    setPage(1)
  }

  const openApprove = (request) => {
    setSelected(request)
    setValue(request.dealerPrice || request.expectedPrice || '')
    setNote(request.dealerNote || '')
    setModal('approve')
  }

  const openReject = (request) => {
    setSelected(request)
    setNote('')
    setModal('reject')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    setNote('')
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
      dispatch(fetchAllTradeInRequests({ ...filters, page }))
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
      dispatch(fetchAllTradeInRequests({ ...filters, page }))
    } else {
      toast.error(result.payload || 'Failed to reject')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    const result = await dispatch(deleteTradeInRequest(deleting._id))
    if (deleteTradeInRequest.fulfilled.match(result)) {
      toast.success('Request deleted')
      setDeleting(null)
      dispatch(fetchAllTradeInRequests({ ...filters, page }))
    } else {
      toast.error(result.payload || 'Failed to delete')
    }
    setDeleteBusy(false)
  }

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'phone', label: 'Old phone' },
    { key: 'condition', label: 'Condition' },
    { key: 'value', label: 'Exchange value' },
    { key: 'order', label: 'Linked order' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Trade-in"
        description={
          loading ? 'Loading requests…' : `${pluralise(adminList.total, 'request')} in the current view`
        }
        icon={FiRefreshCw}
        actions={
          <>
            <Link to="/admin/orders" className="btn-secondary !px-4 !py-2 text-sm">
              Purchase orders
            </Link>
            <button
              onClick={() => dispatch(fetchAllTradeInRequests({ ...filters, page }))}
              className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </>
        }
      />

      {adminStats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Trade-ins', value: adminStats.totalSellOrders },
            { label: 'Awaiting a value', value: adminStats.sellPending, tone: 'text-amber-600' },
            { label: 'Approved value', value: money(adminStats.totalSellValue), tone: 'text-violet-600' },
            { label: 'Credited to orders', value: money(adminStats.totalExchangeValue), tone: 'text-emerald-600' },
          ].map(({ label, value: v, tone }) => (
            <SectionCard key={label} bodyClassName="px-4 py-3.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-bold mt-1 ${tone || 'text-slate-900'}`}>{v}</p>
            </SectionCard>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {STATUS_TABS.map(({ key, label }) => {
          const count = key ? adminList.byStatus?.[key] : undefined
          const active = filters.status === key
          return (
            <button
              key={key}
              onClick={() => setFilter('status', key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all inline-flex items-center gap-2 ${
                active
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AdminFilterBar
        isFiltered={isFiltered}
        resultCount={adminList.total}
        onReset={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
      >
        <AdminSearchInput
          value={filters.search}
          onChange={(val) => setFilter('search', val)}
          placeholder="Search brand, model, customer or dealer note"
          className="grow"
        />
        <AdminDateRange
          label="Requested between"
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
        isEmpty={allRequests.length === 0}
        onRetry={() => dispatch(fetchAllTradeInRequests({ ...filters, page }))}
        emptyIcon={FiInbox}
        emptyTitle={isFiltered ? 'No request matches these filters' : 'No trade-in requests yet'}
        emptyDescription={
          isFiltered ? 'Try a different keyword or clear the filters.' : 'Customer submissions appear here for you to value.'
        }
        emptyAction={
          isFiltered && (
            <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }} className="btn-secondary !px-4 !py-2 text-sm">
              Reset filters
            </button>
          )
        }
        footer={
          <AdminPagination
            page={adminList.page}
            pages={adminList.pages}
            total={adminList.total}
            onChange={setPage}
            itemLabel="requests"
          />
        }
      >
        {(keyOf) =>
          allRequests.map((request) => {
            const canDecide = request.status === 'pending' || request.status === 'approved'
            return (
              <tr key={keyOf(request)} className="hover:bg-slate-50 align-top">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{request.user?.name || 'Guest'}</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{request.user?.email}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(request.createdAt)}</p>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex gap-1 shrink-0">
                      {request.images?.length > 0 ? (
                        request.images.slice(0, 2).map((image, i) => (
                          <a
                            key={image.url || i}
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90"
                          >
                            <img src={image.url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base">📱</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/trade-ins/${request._id}`}
                        className="block text-sm font-semibold text-slate-800 hover:text-indigo-600 whitespace-nowrap"
                      >
                        {request.brand} {request.model}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        via {request.dealer?.dealerInfo?.shopName || request.dealer?.name || 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-slate-400">expects {money(request.expectedPrice)}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {titleCase(request.condition)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {request.exchangeValue > 0 ? (
                    <>
                      <p className="text-sm font-bold text-emerald-600">{money(request.exchangeValue)}</p>
                      {request.approvedBy?.name && (
                        <p className="text-[11px] text-slate-400">by {request.approvedBy.name}</p>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Unquoted</span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {request.linkedOrder ? (
                    <Link to={`/admin/orders/${request.linkedOrder._id}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                      #{String(request.linkedOrder._id).slice(-8).toUpperCase()}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <AdminStatusBadge value={request.status} tone={TRADE_IN_TONE[request.status]} />
                </td>

                <td className="px-4 py-3">
                  <AdminActionMenu
                    items={[
                      { label: 'View details', icon: FiEye, onClick: () => navigate(`/admin/trade-ins/${request._id}`) },
                      ...(canDecide
                        ? [
                            {
                              label: request.status === 'approved' ? 'Update value' : 'Approve & set value',
                              icon: FiCheck,
                              onClick: () => openApprove(request),
                            },
                            { label: 'Reject', icon: FiX, danger: true, onClick: () => openReject(request) },
                          ]
                        : []),
                      {
                        label: request.linkedOrder ? 'Delete (linked to an order)' : 'Delete',
                        icon: FiTrash2,
                        danger: true,
                        disabled: Boolean(request.linkedOrder),
                        onClick: () => setDeleting(request),
                      },
                    ]}
                  />
                </td>
              </tr>
            )
          })
        }
      </AdminTable>

      <AdminModal
        open={modal === 'approve'}
        onClose={closeModal}
        title={selected?.status === 'approved' ? 'Update exchange value' : 'Approve trade-in'}
        description={selected ? `${selected.brand} ${selected.model} · ${selected.user?.name || 'Customer'}` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleApprove} disabled={saving} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Saving…' : 'Approve & set value'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <dl className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Condition</dt>
                <dd className="font-semibold text-slate-800">{titleCase(selected.condition)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Customer expects</dt>
                <dd className="font-semibold text-slate-800">{money(selected.expectedPrice)}</dd>
              </div>
              {selected.linkedOrder && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Linked order</dt>
                  <dd className="font-semibold text-slate-800">
                    #{String(selected.linkedOrder._id).slice(-8).toUpperCase()} · {money(selected.linkedOrder.totalPrice)}
                  </dd>
                </div>
              )}
            </dl>

            <div>
              <label htmlFor="tradein-value" className="block text-xs font-bold text-slate-600 mb-1.5">
                Old phone value (₹) *
              </label>
              <input
                id="tradein-value"
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input"
                placeholder={`Customer expects ${money(selected.expectedPrice)}`}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Deducted from the new phone price at checkout.</p>
            </div>

            <div>
              <label htmlFor="tradein-note" className="block text-xs font-bold text-slate-600 mb-1.5">
                Note to customer
              </label>
              <textarea
                id="tradein-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input resize-none"
                placeholder="e.g. Condition verified, bring the phone and ID at delivery"
              />
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={modal === 'reject'}
        onClose={closeModal}
        title="Reject trade-in"
        description={selected ? `${selected.brand} ${selected.model} · ${selected.user?.name || 'Customer'}` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={saving}
              className="btn-danger !px-4 !py-2 text-sm inline-flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Rejecting…' : 'Reject exchange'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            {selected.linkedOrder && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">
                This old phone is linked to order #{String(selected.linkedOrder._id).slice(-8).toUpperCase()}. Rejecting it
                restores the new phone price to {money((selected.linkedOrder.totalPrice || 0) + (selected.exchangeValue || 0))}.
              </p>
            )}
            <div>
              <label htmlFor="reject-note" className="block text-xs font-bold text-slate-600 mb-1.5">
                Reason (optional)
              </label>
              <textarea
                id="reject-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input resize-none"
                placeholder="e.g. Does not meet our exchange criteria"
              />
            </div>
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this trade-in request?"
        confirmLabel="Delete request"
        message={
          deleting
            ? `The ${deleting.brand} ${deleting.model} request from ${deleting.user?.name || 'this customer'} will be removed permanently.`
            : ''
        }
      />

      {error && !loading && (
        <p className="mt-3 text-xs text-red-500 text-center">{errorMessage({ message: error })}</p>
      )}

      <p className="mt-3 text-xs text-slate-400 text-center">
        Approving sets the credit that is deducted from the customer&apos;s new phone. Cancelling the linked order releases it.
      </p>
    </>
  )
}
