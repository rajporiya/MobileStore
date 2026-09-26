import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiCreditCard,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
} from 'react-icons/fi'

import { fetchAdminDashboard } from '../../store/slices/adminSlice'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import { pluralise, errorMessage } from '../../utils/adminUtils'

const TONE = {
  amber: { wrap: 'bg-amber-50', icon: 'bg-amber-100 text-amber-700', label: 'Needs action' },
  red: { wrap: 'bg-red-50', icon: 'bg-red-100 text-red-700', label: 'Needs action' },
  violet: { wrap: 'bg-violet-50', icon: 'bg-violet-100 text-violet-700', label: 'Needs review' },
  slate: { wrap: 'bg-slate-50', icon: 'bg-slate-100 text-slate-600', label: 'For your awareness' },
}

/**
 * There is no notification store in the backend, so this screen does not
 * pretend to be a message history. It is a live, derived action list built
 * from the dashboard aggregate, with a link into the screen where each item is
 * resolved. Nothing here is stored or marked read.
 */
export default function AdminNotifications() {
  const dispatch = useDispatch()
  const { dashboard, dashboardLoading, dashboardError } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchAdminDashboard('30d'))
  }, [dispatch])

  const groups = useMemo(() => {
    if (!dashboard) return []
    const notices = []

    const lowStock = dashboard.lowStockProducts || []
    if (lowStock.length) {
      notices.push({
        key: 'low-stock',
        tone: 'red',
        icon: FiAlertTriangle,
        title: `${pluralise(lowStock.length, 'phone')} low or out of stock`,
        body: lowStock
          .slice(0, 4)
          .map((p) => `${p.title} — ${p.stock} left`)
          .join(' · '),
        to: '/admin/products?availability=low',
        cta: 'Restock phones',
      })
    }

    const failedPayments = dashboard.paymentsByStatus?.failed || 0
    if (failedPayments) {
      notices.push({
        key: 'failed-payments',
        tone: 'red',
        icon: FiCreditCard,
        title: `${pluralise(failedPayments, 'payment')} failed`,
        body: 'These orders were never charged. Ask the customer to retry payment or switch to cash on delivery.',
        to: '/admin/payments?status=failed',
        cta: 'Review payments',
      })
    }

    const pendingTradeIns = dashboard.tradeInsByStatus?.pending || 0
    if (pendingTradeIns) {
      notices.push({
        key: 'pending-tradeins',
        tone: 'violet',
        icon: FiRefreshCw,
        title: `${pluralise(pendingTradeIns, 'trade-in request')} waiting for a value`,
        body: 'Customers are quoted the expected amount until you set the real value.',
        to: '/admin/trade-ins?status=pending',
        cta: 'Value trade-ins',
      })
    }

    const openOrders = (dashboard.ordersByStatus?.processing || 0) + (dashboard.ordersByStatus?.confirmed || 0)
    if (openOrders) {
      notices.push({
        key: 'open-orders',
        tone: 'amber',
        icon: FiShoppingCart,
        title: `${pluralise(openOrders, 'order')} not yet shipped`,
        body: 'Confirm, then mark as shipped so the customer can track it.',
        to: '/admin/orders?status=confirmed',
        cta: 'Open orders',
      })
    }

    const outOfStock = dashboard.totals?.outOfStock || 0
    if (outOfStock) {
      notices.push({
        key: 'out-of-stock',
        tone: 'slate',
        icon: FiPackage,
        title: `${pluralise(outOfStock, 'phone')} out of stock`,
        body: 'These still appear in the storefront but cannot be bought.',
        to: '/admin/products?availability=out',
        cta: 'View phones',
      })
    }

    if (dashboard.totals?.suspendedUsers) {
      notices.push({
        key: 'suspended-users',
        tone: 'slate',
        icon: FiCheck,
        title: `${pluralise(dashboard.totals.suspendedUsers, 'account')} suspended`,
        body: 'Suspended accounts cannot sign in. Restore one from its detail page if it was a mistake.',
        to: '/admin/users?status=suspended',
        cta: 'Review accounts',
      })
    }

    if (dashboard.totals?.inactiveDealers) {
      notices.push({
        key: 'inactive-dealers',
        tone: 'slate',
        icon: FiCheck,
        title: `${pluralise(dashboard.totals.inactiveDealers, 'dealer')} deactivated`,
        body: 'Deactivated dealers are hidden from the dealer list but keep their history.',
        to: '/admin/dealers?status=inactive',
        cta: 'Review dealers',
      })
    }

    return notices
  }, [dashboard])

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description="Live items that need a decision, derived from your store data"
        icon={FiBell}
        actions={
          <button
            onClick={() => dispatch(fetchAdminDashboard('30d'))}
            className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {dashboardError && (
        <p className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          {errorMessage({ message: dashboardError })}
        </p>
      )}

      {dashboardLoading && !dashboard ? (
        <div className="space-y-3">
          <AdminPanelSkeleton className="h-24" />
          <AdminPanelSkeleton className="h-24" />
          <AdminPanelSkeleton className="h-24" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiCheck}
            title="Nothing needs your attention"
            description="No low stock, failed payments or unquoted trade-ins right now."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map((group) => {
            const tone = TONE[group.tone]
            return (
              <SectionCard key={group.key} bodyClassName="p-5">
                <div className="flex gap-4">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                    <group.icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 grow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{group.title}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          {tone.label}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{group.body}</p>
                    <Link
                      to={group.to}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {group.cta}
                    </Link>
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400 text-center">
        VoltCart does not store notifications. This page recomputes from live order, payment, trade-in and stock data
        every time it loads, so it never shows a stale or invented alert.
      </p>
    </>
  )
}
