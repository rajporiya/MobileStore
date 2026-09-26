import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiSearch, FiXCircle, FiRotateCcw, FiRefreshCw, FiInbox, FiRepeat } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { fetchAllOrders, updateOrderStatus, fetchOrderStats } from '../../store/slices/orderSlice'

const STATUS_BADGE = {
  processing: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const NEXT_STATUS = ['processing', 'confirmed', 'shipped', 'delivered']
const money = (n) => `₹${(n || 0).toLocaleString('en-IN')}`
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminOrders() {
  const dispatch = useDispatch()
  const { allOrders, total, pages, loading, adminStats } = useSelector((s) => s.orders)

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = (p = page, s = status) => {
    dispatch(fetchAllOrders({ page: p, limit: 10, ...(s ? { status: s } : {}) }))
  }

  useEffect(() => {
    load(1, status)
    dispatch(fetchOrderStats())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const changePage = (p) => {
    setPage(p)
    load(p, status)
  }

  const applySearch = (e) => {
    e.preventDefault()
    const q = search.trim().toLowerCase()
    if (!q) return
    const order = allOrders.find(
      (o) =>
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o._id.toLowerCase().includes(q) ||
        o.orderItems?.some((i) => i.title.toLowerCase().includes(q))
    )
    if (!order) {
      toast.error('No order on this page matches — try another status tab')
      return
    }
    setStatus('')
    toast.success(`Matched ${order.user?.name || order._id.slice(-8)}`)
  }

  const confirmCancel = async () => {
    setBusy(true)
    const result = await dispatch(
      updateOrderStatus({ id: cancelling._id, orderStatus: 'cancelled', reason: reason.trim() })
    )
    setBusy(false)
    if (updateOrderStatus.fulfilled.match(result)) {
      setCancelling(null)
      setReason('')
      load()
      dispatch(fetchOrderStats())
    }
  }

  const restore = async (order) => {
    const result = await dispatch(
      updateOrderStatus({ id: order._id, orderStatus: 'processing', wasCancelled: true })
    )
    if (updateOrderStatus.fulfilled.match(result)) {
      load()
      dispatch(fetchOrderStats())
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FiShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              New phones customers bought. Old phones they traded in are under{' '}
              <Link to="/admin/exchange" className="text-violet-600 font-semibold hover:underline">Sell Orders</Link>.
            </p>
          </div>
        </div>
        <button onClick={() => { load(); dispatch(fetchOrderStats()) }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Money strip */}
      {adminStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Income', value: money(adminStats.totalIncome), tone: 'text-emerald-600' },
            { label: 'Orders', value: adminStats.totalOrders, tone: 'text-slate-900' },
            { label: 'In Flight', value: adminStats.pendingOrders, tone: 'text-amber-600' },
            { label: 'Cancelled Value', value: money(adminStats.cancelledOrderValue), tone: 'text-red-500' },
          ].map(({ label, value, tone }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-500">{label}</p>
              <p className={`text-lg font-bold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(({ key, label }) => {
            const count =
              key === '' ? adminStats?.totalOrders : adminStats?.ordersByStatus?.find((o) => o._id === key)?.count
            return (
              <button
                key={key}
                onClick={() => { setStatus(key); setPage(1) }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  status === key
                    ? key === 'cancelled' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {label}
                {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
              </button>
            )
          })}
        </div>

        <form onSubmit={applySearch} className="ml-auto flex items-center gap-2">
          <div className="relative">
            <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, order id, phone…"
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
            />
          </div>
          <button type="submit" className="px-3 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-colors">
            Find
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Order', 'Customer', 'Date', 'Items', 'Old Phone Credit', 'Total', 'Payment', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : allOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <FiInbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No purchase orders{status ? ` with status "${status}"` : ''}.</p>
                  </td>
                </tr>
              ) : allOrders.map((order) => {
                const isCancelled = order.orderStatus === 'cancelled'
                return (
                  <tr key={order._id} className={`hover:bg-slate-50 align-top ${isCancelled ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      #{order._id.slice(-8)}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 whitespace-nowrap">{order.user?.name || 'Guest'}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{order.user?.email}</p>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>

                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">{order.orderItems?.length} item(s)</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {order.orderItems?.map((i) => i.title).join(', ')}
                      </p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.tradeInValue > 0 ? (
                        <div>
                          <p className="font-bold text-emerald-600">-{money(order.tradeInValue)}</p>
                          <p className="text-[11px] text-slate-500">{order.tradeIn?.brand} {order.tradeIn?.model}</p>
                        </div>
                      ) : order.tradeIn?.request ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <FiRepeat className="w-3 h-3" /> awaiting value
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className={`font-bold ${isCancelled ? 'text-red-500 line-through' : 'text-slate-900'}`}>
                        {money(order.totalPrice)}
                      </p>
                      {isCancelled && order.cancelReason && (
                        <p className="text-[11px] text-slate-400 italic max-w-[140px] truncate" title={order.cancelReason}>
                          {order.cancelReason}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700'
                          : order.paymentStatus === 'refunded' ? 'bg-slate-200 text-slate-600'
                            : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full capitalize whitespace-nowrap ${STATUS_BADGE[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {isCancelled ? (
                        <button
                          onClick={() => restore(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                        >
                          <FiRotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => dispatch(updateOrderStatus({ id: order._id, orderStatus: e.target.value, wasCancelled: false }))}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 capitalize"
                          >
                            {NEXT_STATUS.map((s) => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => { setCancelling(order); setReason('') }}
                            title="Cancel order"
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2 justify-between">
            <p className="text-xs text-slate-500">{total} orders</p>
            <div className="flex gap-1.5">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => changePage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold ${p === page ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {cancelling && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <FiXCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Cancel this order?</h2>
                <p className="text-[11px] text-slate-500 font-mono">#{cancelling._id.slice(-8)}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-400">Customer:</span> <strong className="text-slate-800">{cancelling.user?.name}</strong></p>
                <p><span className="text-slate-400">Order value:</span> <strong className="text-slate-800">{money(cancelling.totalPrice)}</strong></p>
                {cancelling.tradeInValue > 0 && (
                  <p>
                    <span className="text-slate-400">Exchange credit:</span>{' '}
                    <strong className="text-emerald-600">-{money(cancelling.tradeInValue)}</strong>{' '}
                    <span className="text-slate-400">goes back to the customer's old phone</span>
                  </p>
                )}
              </div>

              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                <li>Stock for every item goes back on sale</li>
                <li>Any old phone handed in is released for reuse</li>
                <li>Counted under "Cancelled Order Value", never as income</li>
                <li>You can restore the order later if this was a mistake</li>
              </ul>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (optional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. customer changed their mind"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmCancel}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {busy ? 'Cancelling...' : 'Yes, cancel order'}
                </button>
                <button
                  onClick={() => setCancelling(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Keep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
