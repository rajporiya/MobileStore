import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiArrowRight,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'

import { fetchAdminDashboard, setDashboardRange } from '../../store/slices/adminSlice'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import StatCard from '../../components/admin/ui/StatCard'
import RevenueChart from '../../components/admin/ui/RevenueChart'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import { SectionCard, ListRow } from '../../components/admin/ui/AdminPanels'
import { AdminStatSkeleton, AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import {
  money,
  shortId,
  timeAgo,
  errorMessage,
  pluralise,
  ORDER_TONE,
  PAYMENT_TONE,
  TRADE_IN_TONE,
} from '../../utils/adminUtils'

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
  { value: '180d', label: '6 months' },
  { value: '365d', label: '1 year' },
]

function StatusBreakdown({ title, byStatus, toneMap, to }) {
  const entries = Object.entries(byStatus || {}).filter(([, count]) => count > 0)

  return (
    <SectionCard title={title} action={<Link to={to} className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>} bodyClassName="p-5">
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No records in this period.</p>
      ) : (
        <ul className="space-y-2.5">
          {entries
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <li key={status} className="flex items-center gap-3">
                <AdminStatusBadge value={status} tone={toneMap[status]} />
                <div className="grow h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${Math.max(6, (count / entries[0][1]) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
              </li>
            ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const { dashboard, dashboardLoading, dashboardError, dashboardRange } = useSelector((state) => state.admin)

  useEffect(() => {
    if (!dashboard) dispatch(fetchAdminDashboard(dashboardRange))
  }, [dispatch, dashboardRange, dashboard])

  const retry = () => dispatch(fetchAdminDashboard(dashboardRange))

  if (dashboardError && !dashboard) {
    return (
      <>
        <AdminPageHeader title="Dashboard" description="Store performance at a glance" icon={FiTrendingUp} />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <AdminEmptyState
            icon={FiAlertTriangle}
            title="The dashboard could not load"
            description={dashboardError}
            action={
              <button onClick={retry} className="btn-secondary !px-4 !py-2 text-sm">
                Try again
              </button>
            }
          />
        </div>
      </>
    )
  }

  const totals = dashboard?.totals
  const lowStock = dashboard?.lowStockProducts || []
  const recentOrders = dashboard?.recentOrders || []
  const recentUsers = dashboard?.recentUsers || []
  const bestSellers = dashboard?.bestSellers || []
  const recentDealers = dashboard?.recentDealers || []
  const recentTradeIns = dashboard?.recentTradeIns || []
  const activeRangeLabel = RANGES.find((r) => r.value === dashboardRange)?.label
  const bucket = dashboard && Number(String(dashboard.range).replace('d', '')) <= 90 ? 'day' : 'month'

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Store performance, payments and anything that needs a decision"
        icon={FiTrendingUp}
        actions={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
            {RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => dispatch(setDashboardRange(range.value))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  dashboardRange === range.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      {dashboardLoading && !dashboard ? (
        <AdminStatSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={money(totals?.revenue)}
            icon={FiTrendingUp}
            tone="green"
            onClick={() => document.getElementById('revenue-panel')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <StatCard label="Orders" value={totals?.orders ?? 0} icon={FiShoppingCart} tone="indigo" to="/admin/orders" />
          <StatCard label="Customers" value={totals?.users ?? 0} icon={FiUsers} tone="sky" to="/admin/users" />
          <StatCard label="Live phones" value={totals?.products ?? 0} icon={FiPackage} tone="violet" to="/admin/products" />
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <StatCard
          label="Open order value"
          value={money(totals?.pendingOrderValue)}
          icon={FiShoppingCart}
          tone="amber"
          to="/admin/orders?status=processing"
        />
        <StatCard
          label="Dealers"
          value={totals?.dealers ?? 0}
          hint={`${totals?.activeDealers ?? 0} active`}
          icon={FiUserCheck}
          tone="violet"
          to="/admin/dealers"
        />
        <StatCard
          label="Trade-in value"
          value={money(totals?.tradeInValue)}
          icon={FiRefreshCw}
          tone="green"
          to="/admin/trade-ins"
        />
        <StatCard
          label="Low stock"
          value={totals?.lowStock ?? 0}
          hint={`${totals?.outOfStock ?? 0} out of stock`}
          icon={FiAlertTriangle}
          tone={totals?.lowStock ? 'red' : 'slate'}
          to="/admin/products?availability=low"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <SectionCard
          title="Revenue trend"
          subtitle={`Paid, non-cancelled orders · ${activeRangeLabel}`}
          className="xl:col-span-2"
          bodyClassName="p-5"
        >
          <div id="revenue-panel">
            {dashboardLoading && !dashboard ? (
              <AdminPanelSkeleton className="h-64" />
            ) : (
              <RevenueChart data={dashboard?.revenueSeries || []} valueKey="revenue" labelKey={bucket} />
            )}
          </div>
        </SectionCard>

        <SectionCard title="This period" subtitle="Movement inside the selected range" bodyClassName="p-5">
          {dashboardLoading && !dashboard ? (
            <AdminPanelSkeleton className="h-64" />
          ) : (
            <ul className="space-y-3">
              {[
                { label: 'New orders', value: pluralise(totals?.ordersInRange ?? 0, 'order'), to: '/admin/orders' },
                { label: 'New customers', value: pluralise(totals?.newUsersInRange ?? 0, 'sign-up'), to: '/admin/users' },
                { label: 'In flight', value: pluralise(dashboard?.inFlight ?? 0, 'order'), to: '/admin/orders?status=processing' },
                { label: 'Delivered', value: pluralise(dashboard?.completed ?? 0, 'order'), to: '/admin/orders?status=delivered' },
                { label: 'Trade-in requests', value: pluralise(totals?.tradeIns ?? 0, 'request'), to: '/admin/trade-ins' },
                { label: 'Awaiting a value', value: pluralise(totals?.pendingTradeIns ?? 0, 'request'), to: '/admin/trade-ins?status=pending' },
                {
                  label: 'Cancelled',
                  value: `${pluralise(totals?.cancelledOrders ?? 0, 'order')} · ${money(totals?.cancelledOrderValue)}`,
                  to: '/admin/orders?status=cancelled',
                },
                {
                  label: 'Trade-in credit given',
                  value: money(totals?.exchangeCredit),
                  to: '/admin/trade-ins?status=completed',
                },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <Link to={row.to} className="text-sm font-bold text-slate-900 hover:text-indigo-600 text-right">
                    {row.value}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <StatusBreakdown title="Order status" byStatus={dashboard?.ordersByStatus} toneMap={ORDER_TONE} to="/admin/orders" />
        <StatusBreakdown title="Payment status" byStatus={dashboard?.paymentsByStatus} toneMap={PAYMENT_TONE} to="/admin/payments" />
        <StatusBreakdown title="Trade-in status" byStatus={dashboard?.tradeInsByStatus} toneMap={TRADE_IN_TONE} to="/admin/trade-ins" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <SectionCard
          title="Recent orders"
          action={<Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No orders in this period.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <ListRow
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  icon={FiShoppingCart}
                  title={`#${shortId(order._id)} · ${money(order.totalPrice)}`}
                  subtitle={`${order.user?.name || 'Guest'} · ${timeAgo(order.createdAt)}`}
                  trailing={<AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />}
                />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Low stock"
          subtitle="Three or fewer units left"
          action={<Link to="/admin/products?availability=low" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : lowStock.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Every phone is comfortably stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {lowStock.map((product) => (
                <ListRow
                  key={product._id}
                  to={`/admin/products/${product._id}`}
                  title={product.title}
                  subtitle={`${money(product.price)} · ${pluralise(product.stock, 'unit')} left`}
                  trailing={
                    <span className="text-xs font-bold text-red-600">{product.stock}</span>
                  }
                />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Best sellers"
          subtitle="By units sold"
          action={<Link to="/admin/products" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : bestSellers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No sales recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {bestSellers.map((product) => (
                <ListRow
                  key={product._id}
                  to={`/admin/products/${product._id}`}
                  title={product.title}
                  subtitle={`${money(product.price)} · ${pluralise(product.sold, 'sold')}`}
                  trailing={
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      {pluralise(product.sold, 'unit')}
                      <FiArrowRight className="w-3 h-3" />
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Newest customers"
          action={<Link to="/admin/users" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : recentUsers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No sign-ups in this period.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentUsers.map((user) => (
                <ListRow
                  key={user._id}
                  to={`/admin/users/${user._id}`}
                  title={user.name}
                  subtitle={user.email}
                  trailing={<span className="text-[11px] text-slate-400">{timeAgo(user.createdAt)}</span>}
                />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Trade-ins awaiting review"
          action={<Link to="/admin/trade-ins?status=pending" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : recentTradeIns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No trade-in requests in this period.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentTradeIns.map((request) => (
                <ListRow
                  key={request._id}
                  to={`/admin/trade-ins/${request._id}`}
                  title={`${request.brand} ${request.model}`}
                  subtitle={`${request.user?.name || 'Customer'} · ${timeAgo(request.createdAt)}`}
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-slate-800">
                        {request.dealerPrice ? money(request.dealerPrice) : 'Unquoted'}
                      </span>
                      <AdminStatusBadge value={request.status} tone={TRADE_IN_TONE[request.status]} />
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Newest dealers"
          action={<Link to="/admin/dealers" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          bodyClassName="py-2"
        >
          {dashboardLoading && !dashboard ? (
            <div className="p-5"><AdminPanelSkeleton className="h-48" /></div>
          ) : recentDealers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No dealer accounts yet.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentDealers.map((dealer) => (
                <ListRow
                  key={dealer._id}
                  to={`/admin/dealers/${dealer._id}`}
                  icon={null}
                  title={dealer.dealerInfo?.shopName || dealer.name}
                  subtitle={dealer.email}
                  trailing={<AdminAvatar name={dealer.name} src={dealer.avatar} size="xs" />}
                />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {dashboardError && dashboard && (
        <p className="mt-4 text-xs text-slate-400 text-center">{errorMessage({ message: dashboardError })} — showing the last successful load.</p>
      )}
    </>
  )
}
