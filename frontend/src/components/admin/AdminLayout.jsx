import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { logout } from '../../store/slices/authSlice'
import { fetchAdminDashboard } from '../../store/slices/adminSlice'
import { findNavItem } from './adminNav'
import AdminBreadcrumb from './AdminBreadcrumb'
import AdminCommandSearch from './AdminCommandSearch'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import AdminConfirmDialog from './ui/AdminConfirmDialog'
import { cx } from './adminTheme'

const STORAGE_KEY = 'adminSidebar'

/**
 * Admin shell: fixed dark sidebar + white topbar + content column.
 *
 * Completely independent of the customer layout — no Navbar, no Footer, no
 * storefront background. Only the shell lives here; every page renders inside
 * the Outlet and owns its own content.
 */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'collapsed')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const user = useSelector((state) => state.auth.userInfo)
  const { dashboard, dashboardLoading, dashboardRange } = useSelector((state) => state.admin)

  const navItem = findNavItem(location.pathname)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    dispatch(fetchAdminDashboard(dashboardRange))
  }, [dispatch, dashboardRange])

  // Any navigation closes the mobile drawer, including one triggered from it.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // The drawer must not leave the page scrollable behind it.
  useEffect(() => {
    if (!drawerOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/admin/login', { replace: true })
  }

  const breadcrumb = <AdminBreadcrumb items={[{ label: navItem?.label || 'Dashboard' }]} />

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onLogout={() => setLogoutOpen(true)}
          onNavigate={() => {}}
        />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
            <AdminSidebar
              variant="drawer"
              collapsed={false}
              onLogout={() => {
                setDrawerOpen(false)
                setLogoutOpen(true)
              }}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-60')}>
        <AdminTopbar
          user={user}
          dashboard={dashboard}
          dashboardLoading={dashboardLoading}
          breadcrumb={breadcrumb}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onLogout={() => setLogoutOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)} aria-hidden="true" />
          <div className="relative max-h-[80vh] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <AdminCommandSearch onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        danger={false}
        title="Log out of the admin panel?"
        confirmLabel="Log out"
        message="You will need to sign in with an admin account to return."
      />
    </div>
  )
}
