import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi'

import { fetchAdminDashboard, setDashboardRange } from '../../store/slices/adminSlice'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminStatCard from '../../components/admin/ui/AdminStatCard'
import { AdminAreaChart, AdminBarChart, AdminDonutChart } from '../../components/admin/ui/AdminCharts'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminTable from '../../components/admin/ui/AdminTable'
import { SectionCard, ViewAllLink } from '../../components/admin/ui/AdminPanels'
import { AdminDashboardSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminErrorState } from '../../components/admin/ui/AdminEmptyState'
import { ADMIN_BUTTONS } from '../../components/admin/adminTheme'
import {
  errorMessage,
  formatDate,
  money,
  percentChange,
  pluralise,
  rangeLabel,
  ROLE_TONE,
  ORDER_TONE,
  PAYMENT_TONE,
  shortId,
  timeAgo,
} from '../../utils/adminUtils'

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
  { value: '180d', label: '6 months' },
  { value: '365d', label: '1 year' },
]

// Chart colours come from the admin token set, not the storefront palette.
const SEGMENT_COLORS = {
  processing: '#d97706',
  confirmed: '#0284c7',
  shipped: '#4f46e5',
  delivered: '#059669',
  cancelled: '#dc2626',
}

/** Compact right-aligned numeric cell. */
const Num = ({ children, className = '' }) => (
  <span className={`block text-[13px] font-semibold tabular-nums text-slate-900 ${className}`}>{children}</span>
)

function RangeSwitch({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => onChange(range.value)}
          aria-pressed={value === range.value}
          className={`rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
            value === range.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const { dashboard, dashboardLoading, dashboardError, dashboardRange } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchAdminDashboard(dashboardRange))
  }, [dispatch, dashboardRange])

  const retry = () => dispatch(fetchAdminDashboard(dashboardRange))

  const totals = dashboard?.totals
  const previous = dashboard?.previous
  const range = dashboard?.range || dashboardRange

  // The series is keyed by day up to 90 days and by month beyond that, because
  // 365 daily points on a 700px axis is a solid line, not a trend.
  const bucket = Number(String(range).replace('d', '')) <= 90 ? 'day' : 'month'
  const series = dashboard?.revenueSeries || []

  // Charts label buckets as "12 Mar" / "Mar", so the raw ISO key is formatted once
  // here instead of at every call site.
  const chartSeries = useMemo(
    () =>
      series.map((point) => {
        const date = new Date(point.date)
        return {
          ...point,
          label: new Intl.DateTimeFormat('en-IN', bucket === 'day' ? { day: 'numeric', month: 'short' } : { month: 'short' }).format(date),
        }
      }),
    [series, bucket]
  )

  const orderSegments = useMemo(
    () =>
      Object.entries(dashboard?.ordersByStatus || {}).map(([status, value]) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value,
        color: SEGMENT_COLORS[status] || '#64748b',
      })),
    [dashboard]
  )

  const paymentSegments = useMemo(
    () =>
      Object.entries(dashboard?.paymentsByStatus || {}).map(([status, value]) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value,
        color:
          { paid: '#059669', pending: '#d97706', failed: '#dc2626', refunded: '#64748b' }[status] || '#64748b',
      })),
    [dashboard]
  )

  const orderColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'products', label: 'Products' },
    { key: 'amount', label: 'Amount' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
    { key: 'actions', label: '', className: 'w-14' },
  ]

  if (dashboardError && !dashboard) {
    return (
      <>
        <AdminPageHeader title="Dashboard" description="Overview of your store performance" />
        <div className="rounded-xl border border-slate-200 bg-white">
          <AdminErrorState message={errorMessage({ message: dashboardError })} onRetry={retry} />
        </div>
      </>
    )
  }

  if (dashboardLoading && !dashboard) {
    return (
      <>
        <AdminPageHeader title="Dashboard" description="Overview of your store performance" />
        <AdminDashboardSkeleton />
      </>
    )
  }

  const recentOrders = dashboard?.recentOrders || []
  const recentUsers = dashboard?.recentUsers || []
  const bestSellers = dashboard?.bestSellers || []
  const lowStock = dashboard?.lowStockProducts || []

  const comparison = rangeLabel(range, 'previous')

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store performance"
        actions={<RangeSwitch value={dashboardRange} onChange={(value) => dispatch(setDashboardRange(value))} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Revenue"
          value={money(totals?.rangeRevenue)}
          icon={FiTrendingUp}
          tone="green"
          delta={percentChange(totals?.rangeRevenue, previous?.revenue)}
          deltaLabel={`vs ${comparison}`}
          spark={chartSeries}
          sparkValueKey="revenue"
        />
        <AdminStatCard
          label="Total Orders"
          value={totals?.orders ?? 0}
          icon={FiShoppingCart}
          tone="indigo"
          delta={percentChange(totals?.ordersInRange, previous?.orders)}
          deltaLabel={`${pluralise(totals?.ordersInRange ?? 0, 'order')} vs ${comparison}`}
          spark={chartSeries}
          sparkValueKey="orders"
          to="/admin/orders"
        />
        <AdminStatCard
          label="Total Users"
          value={totals?.users ?? 0}
          icon={FiUsers}
          tone="sky"
          delta={percentChange(totals?.newUsersInRange, previous?.users)}
          deltaLabel={`${pluralise(totals?.newUsersInRange ?? 0, 'new')} vs ${comparison}`}
          to="/admin/users"
        />
        <AdminStatCard
          label="Total Products"
          value={totals?.products ?? 0}
          icon={FiPackage}
          tone="violet"
          delta={percentChange(totals?.newProductsInRange, previous?.products)}
          deltaLabel={`${pluralise(totals?.newProductsInRange ?? 0, 'added')} vs ${comparison}`}
          to="/admin/products"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Revenue Overview"
          subtitle={`Paid, non-cancelled orders · ${rangeLabel(range, 'long')}`}
          className="xl:col-span-2"
          action={<span className="text-[13px] font-bold tabular-nums text-slate-900">{money(totals?.rangeRevenue)}</span>}
        >
          <AdminAreaChart
            data={chartSeries}
            valueKey="revenue"
            labelKey="label"
            height="h-[248px]"
            ariaLabel={`Revenue over the ${rangeLabel(range, 'long')}`}
            emptyMessage="No paid revenue in this period."
          />
        </SectionCard>

        <SectionCard
          title="Orders Overview"
          subtitle="Orders placed per day"
          action={
            <span className="text-[13px] font-bold tabular-nums text-slate-900">{totals?.ordersInRange ?? 0} in range</span>
          }
        >
          <AdminBarChart
            data={chartSeries}
            valueKey="orders"
            labelKey="label"
            color="#4f46e5"
            height="h-[248px]"
            ariaLabel={`Orders placed over the ${rangeLabel(range, 'long')}`}
            emptyMessage="No orders in this period."
          />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Order Status"
          subtitle="Every order by pipeline state"
          action={<ViewAllLink to="/admin/orders" />}
        >
          <AdminDonutChart data={orderSegments} centerLabel="orders" ariaLabel="Orders by status" />
        </SectionCard>

        <SectionCard
          title="Payment Status"
          subtitle="Collection outcome across all orders"
          action={<ViewAllLink to="/admin/payments" />}
        >
          <AdminDonutChart data={paymentSegments} centerLabel="payments" ariaLabel="Payments by status" />
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Recent Orders"
          subtitle="Latest activity across the store"
          action={<ViewAllLink to="/admin/orders" />}
          bodyClassName=""
        >
          <AdminTable
            columns={orderColumns}
            isEmpty={recentOrders.length === 0}
            emptyIcon={FiShoppingCart}
            emptyTitle="No orders yet"
            emptyDescription="Orders appear here as soon as a customer checks out."
            minWidth="min-w-[900px]"
            rowKey={(row) => row._id}
          >
            {(keyOf) =>
              recentOrders.map((order) => {
                const units = (order.orderItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
                return (
                  <tr key={keyOf(order)} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-[13px] font-semibold tabular-nums text-indigo-600 hover:underline"
                      >
                        #{shortId(order._id)}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <AdminAvatar name={order.user?.name} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">{order.user?.name || 'Guest'}</p>
                          <p className="truncate text-[11px] text-slate-500">{order.user?.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{pluralise(units, 'item')}</td>

                    <td className="px-4 py-3">
                      <Num>{money(order.totalPrice)}</Num>
                      {order.tradeInValue > 0 && (
                        <span className="block text-[11px] text-slate-400">−{money(order.tradeInValue)} trade-in</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <AdminStatusBadge value={order.paymentStatus} tone={PAYMENT_TONE[order.paymentStatus]} />
                    </td>

                    <td className="px-4 py-3">
                      <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{timeAgo(order.createdAt)}</td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        aria-label={`View order ${shortId(order._id)}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            }
          </AdminTable>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Recent Users"
          subtitle="Newest registered customers"
          action={<ViewAllLink to="/admin/users" />}
          bodyClassName="p-0"
        >
          {recentUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-slate-400">No sign-ups yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentUsers.map((user) => (
                <li key={user._id}>
                  <Link to={`/admin/users/${user._id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                    <AdminAvatar name={user.name} src={user.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{user.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                    </div>
                    <AdminStatusBadge
                      value={user.role}
                      tone={ROLE_TONE[user.role]}
                      size="xs"
                      label={user.role}
                    />
                    <span className="hidden w-24 shrink-0 text-right text-[11px] text-slate-400 sm:block">
                      {formatDate(user.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Best Selling Products"
          subtitle="Ranked by units sold"
          action={<ViewAllLink to="/admin/products" />}
          bodyClassName=""
        >
          <AdminTable
            columns={[
              { key: 'product', label: 'Product' },
              { key: 'category', label: 'Category' },
              { key: 'price', label: 'Price' },
              { key: 'sold', label: 'Sold' },
              { key: 'revenue', label: 'Revenue' },
            ]}
            isEmpty={bestSellers.length === 0}
            emptyIcon={FiPackage}
            emptyTitle="No sales recorded yet"
            emptyDescription="Best sellers appear once orders start coming through."
            minWidth="min-w-[560px]"
            rowKey={(row) => row._id}
          >
            {(keyOf) =>
              bestSellers.map((product) => (
                <tr key={keyOf(product)} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <FiPackage className="h-4 w-4" />
                        </span>
                      )}
                      <Link
                        to={`/admin/products/${product._id}`}
                        className="truncate text-[13px] font-medium text-slate-800 hover:text-indigo-600"
                      >
                        {product.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{product.category || '—'}</td>
                  <td className="px-4 py-3">
                    <Num>{money(product.price)}</Num>
                  </td>
                  <td className="px-4 py-3">
                    <Num className="text-indigo-600">{product.sold}</Num>
                  </td>
                  <td className="px-4 py-3">
                    <Num>{money(product.revenue)}</Num>
                  </td>
                </tr>
              ))
            }
          </AdminTable>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Low Stock"
          subtitle="Three or fewer units remaining"
          action={<ViewAllLink to="/admin/products?availability=low" />}
          bodyClassName="p-0"
        >
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-slate-400">Every phone is comfortably stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((product) => (
                <li key={product._id}>
                  <Link to={`/admin/products/${product._id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        product.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <FiAlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{product.title}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {product.category?.name || 'Uncategorised'} · {money(product.price)}
                      </p>
                    </div>
                    <span
                      className={`text-[13px] font-bold tabular-nums ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}
                    >
                      {product.stock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Needs Attention"
          subtitle="Operational backlog worth clearing today"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-slate-100">
            {[
              {
                icon: FiShoppingCart,
                tone: 'bg-amber-50 text-amber-600',
                label: 'Orders awaiting fulfilment',
                value: dashboard?.inFlight ?? 0,
                to: '/admin/orders?status=processing',
              },
              {
                icon: FiRefreshCw,
                tone: 'bg-indigo-50 text-indigo-600',
                label: 'Trade-in requests to value',
                value: totals?.pendingTradeIns ?? 0,
                to: '/admin/trade-ins?status=pending',
              },
              {
                icon: FiAlertTriangle,
                tone: 'bg-red-50 text-red-600',
                label: 'Payments that failed',
                value: dashboard?.paymentsByStatus?.failed ?? 0,
                to: '/admin/payments?status=failed',
              },
              {
                icon: FiAlertTriangle,
                tone: 'bg-red-50 text-red-600',
                label: 'Orders cancelled',
                value: totals?.cancelledOrders ?? 0,
                to: '/admin/orders?status=cancelled',
              },
            ].map((row) => (
              <li key={row.label}>
                <Link to={row.to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.tone}`}>
                    <row.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-700">{row.label}</span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-slate-900">{row.value}</span>
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-3 bg-slate-50/70 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                <FiUserPlus className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-700">New sign-ups in range</span>
              <span className="shrink-0 text-[13px] font-bold tabular-nums text-slate-900">{totals?.newUsersInRange ?? 0}</span>
            </li>
            <li className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FiPackage className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-700">
                <Link to="/admin/products/add" className={ADMIN_BUTTONS.ghost}>
                  Add a product
                </Link>
              </span>
            </li>
          </ul>
        </SectionCard>
      </div>

      {dashboardError && dashboard && (
        <p className="mt-4 text-center text-[12px] text-slate-400">
          {errorMessage({ message: dashboardError })} — showing the last successful load.
        </p>
      )}
    </>
  )
}
