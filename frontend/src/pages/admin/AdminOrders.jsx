import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiEye, FiShoppingCart } from 'react-icons/fi'

import api from '../../services/api'
import { ADMIN_BUTTONS, cx } from '../../components/admin/adminTheme'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminTableToolbar from '../../components/admin/ui/AdminTableToolbar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminStatCard from '../../components/admin/ui/AdminStatCard'
import { AdminErrorState } from '../../components/admin/ui/AdminEmptyState'
import { AdminCardSkeleton } from '../../components/admin/ui/AdminSkeletons'
import {
  money,
  formatDate,
  timeAgo,
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
  const [statsError, setStatsError] = useState(null)
  const [statsAttempt, setStatsAttempt] = useState(0)

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
    let active = true
    setStatsLoading(true)
    setStatsError(null)
    api
      .get('/orders/stats')
      .then(({ data }) => {
        if (!active) return
        setStats(data.data || data)
      })
      .catch((err) => {
        if (!active) return
        setStats(null)
        setStatsError(errorMessage(err, 'Order totals could not be loaded.'))
      })
      .finally(() => {
        if (active) setStatsLoading(false)
      })
    return () => {
      active = false
    }
  }, [statsAttempt])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // The stats endpoint returns the per-status counts as an array of rows.
  const statusCount = (status) => stats?.ordersByStatus?.find((row) => row._id === status)?.count ?? 0

  const columns = [
    { key: 'order', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
    { key: 'actions', label: '', className: 'w-14' },
  ]

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Manage customer orders"
        eyebrow="Sales"
        meta={
          <>
            <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] text-slate-500 ring-1 ring-inset ring-slate-200">
              Revenue{' '}
              <span className="font-semibold tabular-nums text-slate-800">
                {stats ? money(stats.totalRevenue) : '—'}
              </span>
            </span>
            <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] text-slate-500 ring-1 ring-inset ring-slate-200">
              In view{' '}
              <span className="font-semibold tabular-nums text-slate-800">
                {loading && !orders.length ? '—' : total}
              </span>{' '}
              {total === 1 ? 'order' : 'orders'}
            </span>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statsLoading && !stats ? (
          <AdminCardSkeleton count={4} className="col-span-2 xl:col-span-4" />
        ) : (
          <>
            <AdminStatCard
              label="Total Orders"
              value={stats ? stats.totalOrders : 0}
              icon={FiShoppingCart}
              tone="indigo"
              hint="All time"
            />
            <AdminStatCard
              label="Awaiting Fulfilment"
              value={stats ? stats.pendingOrders : 0}
              tone="amber"
              hint="Processing, confirmed or shipped"
            />
            <AdminStatCard
              label="Delivered"
              value={stats ? statusCount('delivered') : 0}
              tone="green"
              hint="All time"
            />
            <AdminStatCard
              label="Cancelled"
              value={stats ? statusCount('cancelled') : 0}
              tone="red"
              hint={stats ? `${money(stats.cancelledOrderValue)} written off` : 'All time'}
            />
          </>
        )}
      </div>

      <AdminTableToolbar
        onReset={resetFilters}
        isFiltered={isFiltered}
        resultCount={total}
        resultLabel="matching"
        className="mb-4"
      >
        <AdminSearchInput
          label="Search"
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
      </AdminTableToolbar>

      {statsError && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white">
          <AdminErrorState compact message={statsError} onRetry={() => setStatsAttempt((n) => n + 1)} />
        </div>
      )}

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
            <button type="button" onClick={resetFilters} className={ADMIN_BUTTONS.secondary}>
              Reset filters
            </button>
          )
        }
        minWidth="min-w-[1040px]"
        rowKey={(row) => row._id}
        footer={<AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="orders" />}
      >
        {(keyOf) =>
          orders.map((order) => {
            const lines = order.orderItems?.length || 0
            const units = (order.orderItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
            return (
              <tr
                key={keyOf(order)}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] text-slate-600">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    className="text-[13px] font-semibold tabular-nums text-indigo-600 hover:underline"
                  >
                    #{shortId(order._id)}
                  </Link>
                  {order.tradeInValue > 0 && (
                    <span className="mt-0.5 block text-[11px] font-medium text-slate-400">
                      −{money(order.tradeInValue)} trade-in
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 align-middle text-[13px] text-slate-600">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <AdminAvatar name={order.user?.name} size="xs" />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/users/${order.user?._id}`}
                        className="block max-w-[170px] truncate text-[13px] font-semibold text-slate-800 hover:text-indigo-600"
                      >
                        {order.user?.name || 'Guest'}
                      </Link>
                      <p className="max-w-[170px] truncate text-[11px] text-slate-500">{order.user?.email || '—'}</p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] text-slate-600">
                  {pluralise(units, 'item')}
                  {lines > 1 && <span className="mt-0.5 block text-[11px] text-slate-400">{lines} lines</span>}
                </td>

                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] font-bold tabular-nums text-slate-900">
                  {money(order.totalPrice)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] text-slate-600">
                  <AdminStatusBadge value={order.paymentStatus} tone={PAYMENT_TONE[order.paymentStatus]} />
                </td>

                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] text-slate-600">
                  <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
                </td>

                <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] text-slate-600">
                  {formatDate(order.createdAt)}
                  <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(order.createdAt)}</span>
                </td>

                <td className="px-4 py-3 align-middle text-[13px] text-slate-600">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    title="View order"
                    aria-label={`View order ${shortId(order._id)}`}
                    className={cx(
                      'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                      'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    )}
                  >
                    <FiEye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            )
          })
        }
      </AdminTable>

      <p className="mt-3 text-center text-[12px] text-slate-400">
        Status changes made on an order screen also release or re-take stock automatically.
      </p>
    </>
  )
}
