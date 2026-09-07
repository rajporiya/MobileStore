import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiGrid, FiShoppingBag, FiTag, FiShoppingCart, FiUsers,
  FiLogOut, FiMenu, FiX, FiChevronRight
} from 'react-icons/fi'
import { logout } from '../../store/slices/authSlice'

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiShoppingBag },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
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
    <div className="min-h-screen bg-cream-50 flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-brown-dark z-40 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">MobileStore</h1>
            <p className="text-stone-400 text-xs">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive ? 'bg-brown text-white' : 'text-stone-300 hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              <FiChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 bg-brown-light rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{userInfo?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userInfo?.name}</p>
              <p className="text-stone-400 text-xs truncate">{userInfo?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-stone-300 hover:text-red-400 hover:bg-white/5 rounded-xl text-sm transition-colors">
            <FiLogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-stone-600 hover:text-brown">
            <FiMenu className="w-5 h-5" />
          </button>
          <span className="text-sm text-stone-500">Welcome back, <span className="font-semibold text-stone-800">{userInfo?.name}</span></span>
        </header>

        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
