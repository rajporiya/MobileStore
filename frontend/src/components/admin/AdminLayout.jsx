import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiX,
} from 'react-icons/fi'

import { logout } from '../../store/slices/authSlice'
import { fetchAdminDashboard } from '../../store/slices/adminSlice'
import api from '../../services/api'
import { ADMIN_NAV, findNavItem, isNavActive } from './adminNav'
import AdminAvatar from './ui/AdminAvatar'
import AdminConfirmDialog from './ui/AdminConfirmDialog'
import { shortId, pluralise, money } from '../../utils/adminUtils'

/**
 * Global search runs real queries against the three searchable admin
 * collections and groups the hits, so it never invents results.
 */
function GlobalSearch({ onClose }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState({ products: [], orders: [], users: [] })
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const firstRender = useRef(true)
  const pathname = location.pathname

  // `onClose` is recreated on every parent render, so it is deliberately left
  // out of this dependency list — only a real navigation should dismiss it.
  useEffect(() => onClose(), [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return undefined
    }
    const query = term.trim()
    if (query.length < 2) {
      setResults({ products: [], orders: [], users: [] })
      return undefined
    }

    setSearching(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const [products, orders, users] = await Promise.all([
          api.get('/products', { params: { search: query, limit: 4 }, signal: controller.signal }),
          api.get('/orders', { params: { search: query, limit: 4 }, signal: controller.signal }),
          api.get('/users', { params: { search: query, limit: 4, role: 'user' }, signal: controller.signal }),
        ])
        setResults({
          products: products.data.data || [],
          orders: orders.data.data || [],
          users: users.data.data || [],
        })
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          setResults({ products: [], orders: [], users: [] })
        }
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  const groups = [
    { key: 'products', label: 'Products', to: `/admin/products?search=${encodeURIComponent(term)}`, rows: results.products, render: (p) => `${p.title} · ${money(p.price)}` },
    { key: 'orders', label: 'Orders', to: `/admin/orders?search=${encodeURIComponent(term)}`, rows: results.orders, render: (o) => `#${shortId(o._id)} · ${money(o.totalPrice)}` },
    { key: 'users', label: 'Users', to: `/admin/users?search=${encodeURIComponent(term)}`, rows: results.users, render: (u) => `${u.name} · ${u.email}` },
  ].filter((group) => group.rows.length > 0)

  const go = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="w-full max-w-lg">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products, orders and users…"
          className="w-full pl-9 pr-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl
            focus:outline-none focus:border-slate-400 focus:bg-white"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
        )}
      </div>

      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider px-1 pt-3">
        {term.trim().length < 2 ? 'Type at least 2 characters' : searching ? 'Searching…' : 'Results'}
      </p>

      <div className="mt-1 space-y-3">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{group.label}</span>
              <button onClick={() => go(group.to)} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                See all
              </button>
            </div>
            {group.rows.map((row) => (
              <button
                key={row._id}
                onClick={() =>
                  go(
                    group.key === 'products'
                      ? `/admin/products/${row._id}`
                      : group.key === 'orders'
                        ? `/admin/orders/${row._id}`
                        : `/admin/users/${row._id}`
                  )
                }
                className="w-full text-left px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 truncate"
              >
                {group.render(row)}
              </button>
            ))}
          </div>
        ))}

        {term.trim().length >= 2 && !searching && groups.length === 0 && (
          <p className="px-1 py-4 text-sm text-slate-400">No matches for “{term.trim()}”.</p>
        )}
      </div>
    </div>
  )
}

/**
 * Attention feed built from live data the dashboard already returns — pending
 * trade-ins, low stock and failed payments. No stored notification records
 * exist, so nothing is invented or persisted.
 */
function AdminNotificationsButton({ dashboard, loading }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const items = useMemo(() => {
    if (!dashboard) return []
    const notices = []
    const pending = (dashboard.ordersByStatus?.processing || 0) + (dashboard.ordersByStatus?.confirmed || 0)
    if (pending) {
      notices.push({ key: 'pending-orders', title: `${pluralise(pending, 'order')} awaiting processing`, to: '/admin/orders?status=processing', tone: 'text-amber-600 bg-amber-50' })
    }
    const lowStock = dashboard.lowStockProducts?.length || 0
    if (lowStock) {
      notices.push({ key: 'low-stock', title: `${pluralise(lowStock, 'phone')} low on stock`, to: '/admin/products?availability=low', tone: 'text-red-600 bg-red-50' })
    }
    const failed = dashboard.paymentsByStatus?.failed
    if (failed) {
      notices.push({ key: 'failed-payments', title: `${pluralise(failed, 'payment')} failed`, to: '/admin/payments?status=failed', tone: 'text-red-600 bg-red-50' })
    }
    const tradeIns = dashboard.tradeInsByStatus?.pending
    if (tradeIns) {
      notices.push({ key: 'pending-tradeins', title: `${pluralise(tradeIns, 'trade-in request')} to review`, to: '/admin/trade-ins?status=pending', tone: 'text-violet-600 bg-violet-50' })
    }
    return notices
  }, [dashboard])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${items.length ? ` (${items.length})` : ''}`}
        className="relative w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center"
      >
        <FiBell className="w-[18px] h-[18px]" />
        {items.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden z-40">
          <p className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            Needs attention
          </p>
          {loading ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">Nothing needs attention right now.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {items.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.tone.split(' ').find((c) => c.startsWith('bg-')) || 'bg-slate-300'}`} />
                    <span className="text-sm text-slate-700 grow">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-semibold text-indigo-600 border-t border-slate-100 hover:bg-slate-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  )
}

function SidebarContent({ collapsed, onNavigate, onToggleCollapse }) {
  return (
    <>
      <div className={`flex items-center gap-2.5 h-16 border-b border-slate-800/60 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <FiShoppingBag className="w-[18px] h-[18px] text-white" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">VoltCart</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {ADMIN_NAV.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.section}</p>
            )}
            {collapsed && <div className="h-px bg-slate-800 mx-2 mb-2" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => {
                      // Aliases must light up the renamed item too, so the active
                      // state is computed rather than taken from NavLink.
                      const active = isActive || isNavActive(item, window.location.pathname)
                      return `group relative flex items-center gap-3 rounded-xl text-sm font-semibold
                        transition-colors ${collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2.5'}
                        ${active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
                    }}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-lg bg-slate-900
                        text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100
                        transition-opacity z-50 shadow-lg">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/60 p-2.5">
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold text-slate-300
            hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2.5'}`}
          title={collapsed ? 'Expand sidebar' : undefined}
        >
          {collapsed ? <FiChevronRight className="w-[18px] h-[18px]" /> : <FiChevronLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebar') === 'collapsed')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.userInfo)
  const { dashboard, dashboardLoading, dashboardRange } = useSelector((state) => state.admin)

  const profileRef = useRef(null)
  const current = findNavItem(location.pathname)

  useEffect(() => {
    localStorage.setItem('adminSidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    dispatch(fetchAdminDashboard(dashboardRange))
  }, [dispatch, dashboardRange])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setProfileOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!profileOpen) return undefined
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [profileOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 350))
      dispatch(logout())
      navigate('/admin/login', { replace: true })
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-64'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-30 bg-slate-900 flex-col
          transition-[width] duration-300 ${sidebarWidth}`}
      >
        <SidebarContent
          collapsed={collapsed}
          onNavigate={() => {}}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="relative w-72 max-w-[80%] h-full bg-slate-900 flex flex-col shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center"
            >
              <FiX className="w-4 h-4" />
            </button>
            <SidebarContent
              collapsed={false}
              onNavigate={() => setDrawerOpen(false)}
              onToggleCollapse={() => {}}
            />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            <div className="min-w-0 grow">
              <p className="text-sm font-bold text-slate-900 truncate">{current?.label || 'Admin'}</p>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                VoltCart control centre
              </p>
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-slate-100
                text-slate-400 hover:bg-slate-200 text-sm transition-colors"
            >
              <FiSearch className="w-4 h-4" />
              <span className="pr-8">Search…</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-semibold text-slate-500 border border-slate-200">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="md:hidden w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            >
              <FiSearch className="w-[18px] h-[18px]" />
            </button>

            <Link
              to="/admin/products/add"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900
                text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Add phone
            </Link>

            <AdminNotificationsButton dashboard={dashboard} loading={dashboardLoading} />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100"
              >
                <AdminAvatar name={user?.name} src={user?.avatar} size="sm" />
                <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[90px] truncate">
                  {user?.name?.split(' ')[0] || 'Admin'}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FiSettings className="w-4 h-4" />
                      Account settings
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        setLogoutOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} aria-hidden="true" />
          <div className="relative w-full rounded-2xl bg-white shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
            <GlobalSearch onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        busy={loggingOut}
        danger={false}
        title="Log out of the admin panel?"
        confirmLabel="Log out"
        message="You will need to sign in with an admin account to come back."
      />
    </div>
  )
}
