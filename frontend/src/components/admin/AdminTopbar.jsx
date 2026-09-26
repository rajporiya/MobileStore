import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiPlus, FiSearch, FiSettings, FiUser } from 'react-icons/fi'

import { cx } from './adminTheme'
import AdminAvatar from './ui/AdminAvatar'
import AdminDropdown, { AdminDropdownDivider, AdminDropdownItem } from './ui/AdminDropdown'
import { pluralise } from '../../utils/adminUtils'

/**
 * Attention feed built from data the dashboard already returns. No notification
 * records exist in the database, so nothing here is stored or invented.
 */
function NotificationMenu({ dashboard, loading }) {
  const notices = useMemo(() => {
    if (!dashboard) return []
    const list = []
    const awaiting = (dashboard.ordersByStatus?.processing || 0) + (dashboard.ordersByStatus?.confirmed || 0)
    if (awaiting) {
      list.push({
        key: 'orders',
        title: pluralise(awaiting, 'order') + ' awaiting fulfilment',
        to: '/admin/orders?status=processing',
        dot: 'bg-amber-500',
      })
    }
    if (dashboard.tradeInsByStatus?.pending) {
      list.push({
        key: 'trade-ins',
        title: pluralise(dashboard.tradeInsByStatus.pending, 'trade-in request') + ' to review',
        to: '/admin/trade-ins?status=pending',
        dot: 'bg-indigo-500',
      })
    }
    if (dashboard.paymentsByStatus?.failed) {
      list.push({
        key: 'payments',
        title: pluralise(dashboard.paymentsByStatus.failed, 'payment') + ' failed',
        to: '/admin/payments?status=failed',
        dot: 'bg-red-500',
      })
    }
    if (dashboard.lowStockProducts?.length) {
      list.push({
        key: 'stock',
        title: pluralise(dashboard.lowStockProducts.length, 'phone') + ' low on stock',
        to: '/admin/products?availability=low',
        dot: 'bg-red-500',
      })
    }
    return list
  }, [dashboard])

  return (
    <AdminDropdown
      width="w-80"
      header={
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-slate-900">Notifications</p>
          {notices.length > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">{notices.length}</span>
          )}
        </div>
      }
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Notifications${notices.length ? ` (${notices.length} unread)` : ''}`}
          aria-expanded={open}
          className={cx(
            'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            open
              ? 'border-slate-300 bg-slate-100 text-slate-800'
              : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          )}
        >
          <FiBell className="h-[18px] w-[18px]" />
          {notices.length > 0 && (
            <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {notices.length}
            </span>
          )}
        </button>
      )}
    >
      {loading && notices.length === 0 ? (
        <p className="px-2.5 py-6 text-center text-[13px] text-slate-400">Loading…</p>
      ) : notices.length === 0 ? (
        <p className="px-2.5 py-6 text-center text-[13px] text-slate-400">Nothing needs attention right now.</p>
      ) : (
        <>
          {notices.map((notice) => (
            <Link
              key={notice.key}
              to={notice.to}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', notice.dot)} />
              <span className="min-w-0 flex-1">{notice.title}</span>
            </Link>
          ))}
          <AdminDropdownDivider />
          <Link
            to="/admin/notifications"
            className="block rounded-md px-2.5 py-2 text-center text-[12px] font-semibold text-indigo-600 transition-colors hover:bg-slate-50"
          >
            Open notification centre
          </Link>
        </>
      )}
    </AdminDropdown>
  )
}

function AccountMenu({ user, onLogout }) {
  return (
    <AdminDropdown
      width="w-60"
      header={
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{user?.name || 'Administrator'}</p>
          <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
        </div>
      }
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Account menu"
          aria-expanded={open}
          className={cx(
            'flex items-center gap-2 rounded-lg border py-1 pl-1 pr-2 transition-colors',
            open ? 'border-slate-300 bg-slate-100' : 'border-transparent hover:bg-slate-100'
          )}
        >
          <AdminAvatar name={user?.name} src={user?.avatar} size="sm" />
          <span className="hidden max-w-[110px] truncate text-[13px] font-semibold text-slate-700 sm:block">
            {user?.name?.split(' ')[0] || 'Admin'}
          </span>
          <FiChevronDown className={cx('hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block', open && 'rotate-180')} />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <Link
            to="/admin/settings?tab=profile"
            onClick={close}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiUser className="h-4 w-4 text-slate-400" />
            Profile
          </Link>
          <Link
            to="/admin/settings"
            onClick={close}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiSettingsInline />
            Settings
          </Link>
          <AdminDropdownDivider />
          <AdminDropdownItem icon={FiLogOut} label="Logout" danger onClick={() => { close(); onLogout() }} />
        </>
      )}
    </AdminDropdown>
  )
}

function FiSettingsInline() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

/**
 * Admin topbar. Deliberately not the storefront navbar: a breadcrumb on the
 * left, then search, notifications and the account menu on the right.
 */
export default function AdminTopbar({ user, dashboard, dashboardLoading, breadcrumb, onOpenDrawer, onLogout, onOpenSearch }) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 flex-1 md:block">{breadcrumb}</div>
        <div className="min-w-0 flex-1 md:hidden" />

        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:bg-white lg:flex"
        >
          <FiSearch className="h-4 w-4 shrink-0" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Ctrl K</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <FiSearch className="h-[18px] w-[18px]" />
        </button>

        <Link
          to="/admin/products/add"
          className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:inline-flex"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add Product
        </Link>

        <NotificationMenu dashboard={dashboard} loading={dashboardLoading} />
        <AccountMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}
