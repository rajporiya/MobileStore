import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiEye, FiShoppingCart } from 'react-icons/fi'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminFilterBar from '../../components/admin/ui/AdminFilterBar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import {
  money,
  formatDate,
  shortId,
  errorMessage,
  pluralise,
  toDateInput,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_TONE,
  PAYMENT_TONE,
} from '../../utils/adminUtils'

const PER_PAGE = 20
const EMPTY_FILTERS = { search: '', status: '', paymentStatus: '', from: '', to: '' }

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
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

  const fetchOrders = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/orders', {
        params: {
          page: targetPage,
          limit: PER_PAGE,
          search: filters.search || undefined,
          status: filters.status || undefined,
          paymentStatus: filters.paymentStatus || undefined,
          dateFrom: filters.from || undefined,
          dateTo: filters.to || undefined,
        },
      })
      setOrders(data.data || [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(errorMessage(err, 'The order list could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrders(page)
  }, [fetchOrders, page])

  useEffect(() => {
    setStatsLoading(true)
    api
      .get('/orders/stats')
      .then(({ data }) => setStats(data.data || data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // The stats endpoint returns the per-status counts as an array of rows.
  const statusCount = (status) => stats?.ordersByStatus?.find((row) => row._id === status)?.count ?? 0

  const columns = [
    { key: 'order', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Placed' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description={loading ? 'Loading orders…' : `${pluralise(total, 'order')} match the current view`}
        icon={FiShoppingCart}
        actions={
          <Link to="/admin/payments" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            View payments
          </Link>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Revenue', value: stats ? money(stats.totalRevenue) : '—' },
          { label: 'Orders', value: stats ? stats.totalOrders : '—' },
          { label: 'Awaiting action', value: stats ? stats.pendingOrders : '—' },
          { label: 'Delivered', value: stats ? statusCount('delivered') : '—' },
        ].map((stat) => (
          <SectionCard key={stat.label} bodyClassName="px-4 py-3.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {statsLoading && !stats ? <span className="inline-block h-5 w-16 bg-slate-100 rounded animate-pulse" /> : stat.value}
            </p>
          </SectionCard>
        ))}
      </div>

      <AdminFilterBar isFiltered={isFiltered} resultCount={total} onReset={() => { setFilters(EMPTY_FILTERS); setPage(1) }}>
        <AdminSearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Order id, customer, phone or item"
          className="grow"
        />
        <AdminSelect
          label="Order status"
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          allLabel="All statuses"
          options={ORDER_STATUSES}
          className="w-full sm:w-44"
        />
        <AdminSelect
          label="Payment status"
          value={filters.paymentStatus}
          onChange={(value) => setFilter('paymentStatus', value)}
          allLabel="All payments"
          options={PAYMENT_STATUSES}
          className="w-full sm:w-44"
        />
        <AdminDateRange
          label="Placed between"
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
        isEmpty={orders.length === 0}
        onRetry={() => fetchOrders(page)}
        emptyIcon={FiShoppingCart}
        emptyTitle={isFiltered ? 'No order matches these filters' : 'No orders yet'}
        emptyDescription={isFiltered ? 'Try clearing the status or payment filter.' : 'Orders will appear here as customers check out.'}
        emptyAction={
          isFiltered && (
            <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }} className="btn-secondary !px-4 !py-2 text-sm">
              Reset filters
            </button>
          )
        }
        footer={<AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="orders" />}
      >
        {(keyOf) =>
          orders.map((order) => (
            <tr key={keyOf(order)} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link to={`/admin/orders/${order._id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600">
                  #{shortId(order._id)}
                </Link>
                {order.tradeInValue > 0 && (
                  <p className="text-[11px] text-violet-600 font-semibold">Trade-in −{money(order.tradeInValue)}</p>
                )}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AdminAvatar name={order.user?.name} size="xs" />
                  <div className="min-w-0">
                    <Link to={`/admin/users/${order.user?._id}`} className="block text-sm font-semibold text-slate-700 hover:text-indigo-600 truncate max-w-[160px]">
                      {order.user?.name || 'Unknown'}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{order.user?.email}</p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                {pluralise(order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0, 'item')}
              </td>

              <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">{money(order.totalPrice)}</td>

              <td className="px-4 py-3 whitespace-nowrap">
                <AdminStatusBadge
                  value={order.paymentStatus}
                  tone={PAYMENT_TONE[order.paymentStatus]}
                  label={order.paymentStatus}
                />
              </td>

              <td className="px-4 py-3">
                <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
              </td>

              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>

              <td className="px-4 py-3">
                <Link
                  to={`/admin/orders/${order._id}`}
                  title="View order"
                  className="inline-flex p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <FiEye className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))
        }
      </AdminTable>

      <p className="mt-3 text-xs text-slate-400 text-center">
        Status changes made on an order screen also release or re-take stock automatically.
      </p>
    </>
  )
}
