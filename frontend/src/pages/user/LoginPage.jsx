import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { loginUser, clearError } from '../../store/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo, loading, error } = useSelector((s) => s.auth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (userInfo) navigate('/')
    return () => dispatch(clearError())
  }, [userInfo, navigate, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(loginUser(form))
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brown rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-brown-dark">Welcome Back</h1>
            <p className="text-stone-500 text-sm mt-1">Sign in to your Mobile_Store account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="input !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-bold disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 bg-cream-50 rounded-xl p-3 text-xs text-stone-600 border border-cream-200">
            <p className="font-semibold text-stone-700 mb-1">Demo Credentials:</p>
            <p>User: demo@mobilestore.com / demo@123</p>
            <p>Admin: admin@mobilestore.com / admin@123</p>
          </div>

          <p className="text-center text-sm text-stone-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brown font-semibold hover:text-brown-dark">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
