import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiGrid, FiShoppingBag, FiTag, FiShoppingCart, FiUsers, FiBriefcase, FiRepeat,
  FiLogOut, FiMenu, FiX, FiChevronRight, FiShield
} from 'react-icons/fi'
import { logout } from '../../store/slices/authSlice'

// Kept in three blocks so "what the customer bought" and "what the customer
// sold us" are never confused with each other.
const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [{ to: '/admin', label: 'Dashboard', icon: FiGrid, end: true }],
  },
  {
    label: 'Orders',
    links: [
      { to: '/admin/orders', label: 'Purchase Orders', icon: FiShoppingCart, hint: 'New phones sold' },
      { to: '/admin/exchange', label: 'Sell Orders', icon: FiRepeat, hint: 'Old phones taken in' },
    ],
  },
  {
    label: 'Catalogue',
    links: [
      { to: '/admin/products', label: 'Products', icon: FiShoppingBag },
      { to: '/admin/categories', label: 'Categories', icon: FiTag },
    ],
  },
  {
    label: 'People',
    links: [
      { to: '/admin/users', label: 'Customers', icon: FiUsers },
      { to: '/admin/dealers', label: 'Dealers', icon: FiBriefcase },
    ],
  },
]

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo } = useSelector((s) => s.auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — deliberately dark slate/indigo so it never reads as the shop front */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-40 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <FiShield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight leading-tight">VoltCart</h1>
              <p className="text-indigo-300 text-[11px] font-semibold tracking-wide uppercase">Admin Console</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.links.map(({ to, label, icon: Icon, end, hint }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    title={hint}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                    <FiChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{userInfo?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userInfo?.name}</p>
              <p className="text-slate-400 text-xs truncate">{userInfo?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:text-red-400 hover:bg-white/5 rounded-xl text-sm transition-colors">
            <FiLogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-indigo-600">
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 truncate">
              Signed in as <span className="font-semibold text-slate-800">{userInfo?.name}</span>
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">
                Admin
              </span>
            </p>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
