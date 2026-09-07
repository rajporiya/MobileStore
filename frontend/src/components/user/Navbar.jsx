import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage
} from 'react-icons/fi'
import { logout } from '../../store/slices/authSlice'
import { selectCartCount } from '../../store/slices/cartSlice'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  return (
    <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brown rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="text-lg font-bold text-brown-dark hidden sm:block">Mobile_Store</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-stone-600 hover:text-brown font-medium text-sm transition-colors">Home</Link>
            <Link to="/products" className="text-stone-600 hover:text-brown font-medium text-sm transition-colors">Products</Link>
            <Link to="/products?featured=true" className="text-stone-600 hover:text-brown font-medium text-sm transition-colors">Featured</Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-cream-100 rounded-xl px-3 py-2 gap-2 w-64">
            <FiSearch className="text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search phones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full text-stone-700 placeholder-stone-400"
            />
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/wishlist" className="relative p-2 text-stone-600 hover:text-brown hover:bg-cream-100 rounded-xl transition-all">
              <FiHeart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="relative p-2 text-stone-600 hover:text-brown hover:bg-cream-100 rounded-xl transition-all">
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brown text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {userInfo ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-2 text-stone-600 hover:text-brown hover:bg-cream-100 rounded-xl transition-all"
                >
                  <div className="w-7 h-7 bg-brown rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{userInfo.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-stone-700">{userInfo.name?.split(' ')[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-cream-200 py-2 z-50">
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-cream-50 transition-colors">
                      <FiUser className="w-4 h-4" /> My Profile
                    </Link>
                    <Link to="/profile?tab=orders" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-cream-50 transition-colors">
                      <FiPackage className="w-4 h-4" /> My Orders
                    </Link>
                    {userInfo.role === 'admin' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brown hover:bg-cream-50 transition-colors font-medium">
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-cream-200" />
                    <button
                      onClick={() => { dispatch(logout()); setProfileOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <FiLogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary !py-1.5 !px-3 text-sm hidden sm:flex items-center gap-1">
                <FiUser className="w-3.5 h-3.5" /> Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-stone-600 hover:bg-cream-100 rounded-xl transition-all"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch} className="flex items-center bg-cream-100 rounded-xl px-3 py-2 gap-2">
              <FiSearch className="text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search phones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full text-stone-700 placeholder-stone-400"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {[['/', 'Home'], ['/products', 'Products'], ['/products?featured=true', 'Featured']].map(([to, label]) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-stone-700 hover:bg-cream-100 rounded-xl text-sm font-medium">
                  {label}
                </Link>
              ))}
              {!userInfo && (
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-brown hover:bg-cream-100 rounded-xl text-sm font-medium">
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
