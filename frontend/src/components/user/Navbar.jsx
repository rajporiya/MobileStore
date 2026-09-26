import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage, FiSmartphone, FiBriefcase
} from 'react-icons/fi'
import { logout } from '../../store/slices/authSlice'
import { selectCartCount } from '../../store/slices/cartSlice'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/products?featured=true', label: 'Featured' },
]

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo } = useSelector((s) => s.auth)
  const cartCount = useSelector(selectCartCount)
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setMobileOpen(false)
    }
  }

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    const params = new URLSearchParams(location.search)
    if (to.includes('featured')) return location.pathname === '/products' && params.get('featured') === 'true'
    if (to === '/products') return location.pathname === '/products' && params.get('featured') !== 'true'
    return location.pathname.startsWith(to.split('?')[0])
  }

  // Only shoppers sell an old phone — staff work on the requests customers send.
  const canSellPhone = userInfo?.role === 'user'

  return (
    <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30">
              <span className="text-white text-sm font-extrabold tracking-tight">V</span>
            </div>
            <span className="text-lg font-extrabold text-gradient hidden sm:block">VoltCart</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3.5 py-2 relative text-sm font-medium rounded-lg transition-colors ${
                  isActive(to) ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </Link>
            ))}
            {canSellPhone && (
              <Link
                to="/sell-mobile"
                className={`px-3.5 py-2 flex items-center gap-1.5 text-sm font-semibold rounded-lg transition-all ${
                  isActive('/sell-mobile')
                    ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md'
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <FiSmartphone className="w-3.5 h-3.5" /> Sell Old Phone
              </Link>
            )}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 gap-2 w-64 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:bg-white transition-all">
            <FiSearch className="text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search phones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400"
            />
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/wishlist" className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <FiHeart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {userInfo ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-1.5 pl-2 pr-2.5 text-slate-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">{userInfo.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">{userInfo.name?.split(' ')[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <FiUser className="w-4 h-4" /> My Profile
                    </Link>
                    <Link to="/profile?tab=orders" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <FiPackage className="w-4 h-4" /> My Orders
                    </Link>
                    {canSellPhone && (
                      <Link to="/sell-mobile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                        <FiSmartphone className="w-4 h-4" /> Sell Old Phone
                      </Link>
                    )}
                    {userInfo.role === 'dealer' && (
                      <Link to="/dealer" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">
                        <FiBriefcase className="w-4 h-4" /> Dealer Panel
                      </Link>
                    )}
                    {userInfo.role === 'admin' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => { dispatch(logout()); setProfileOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <FiLogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary !py-1.5 !px-3.5 text-sm hidden sm:flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" /> Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-5 space-y-3 animate-[fadeIn_0.2s_ease]">
            <form onSubmit={handleSearch} className="flex items-center bg-slate-100 rounded-full px-4 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:bg-white transition-all">
              <FiSearch className="text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search phones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                  {label}
                </Link>
              ))}
              {canSellPhone && (
                <Link to="/sell-mobile" onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2">
                  <FiSmartphone className="w-4 h-4" /> Sell Old Phone
                </Link>
              )}
              {!userInfo && (
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  Login / Register
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}