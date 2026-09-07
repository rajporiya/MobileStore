import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { requestRegistrationOtp, verifyRegistrationOtp, clearError } from '../../store/slices/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo, loading, error } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (userInfo) navigate('/')
    return () => dispatch(clearError())
  }, [userInfo, navigate, dispatch])

  const requestOtp = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match')
      return
    }
    setLocalError('')
    const result = await dispatch(requestRegistrationOtp({ name: form.name, email: form.email, password: form.password }))
    if (requestRegistrationOtp.fulfilled.match(result)) setOtpSent(true)
  }

  const verifyOtp = (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Enter the 6-digit verification code')
      return
    }
    setLocalError('')
    dispatch(verifyRegistrationOtp({ email: form.email, otp }))
  }

  const message = error || localError
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md"><div className="card p-8">
        <div className="text-center mb-8"><div className="w-14 h-14 bg-brown rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-white text-2xl font-bold">M</span></div><h1 className="text-2xl font-bold text-brown-dark">{otpSent ? 'Verify your email' : 'Create Account'}</h1><p className="text-stone-500 text-sm mt-1">{otpSent ? `We sent a code to ${form.email}` : 'Join Mobile Store today'}</p></div>
        {message && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{message}</div>}
        {!otpSent ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div><label className="block text-xs font-semibold text-stone-600 mb-1.5">Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required className="input" /></div>
            <div><label className="block text-xs font-semibold text-stone-600 mb-1.5">Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required className="input" /></div>
            <div><label className="block text-xs font-semibold text-stone-600 mb-1.5">Password</label><div className="relative"><input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" minLength={6} required className="input !pr-10" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">{showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}</button></div></div>
            <div><label className="block text-xs font-semibold text-stone-600 mb-1.5">Confirm Password</label><input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat your password" required className="input" /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-bold disabled:opacity-50">{loading ? 'Sending code...' : 'Send Verification Code'}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4"><div><label className="block text-xs font-semibold text-stone-600 mb-1.5">6-digit verification code</label><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" required className="input text-center tracking-[0.5em] font-semibold" /></div><button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-bold disabled:opacity-50">{loading ? 'Verifying...' : 'Verify & Create Account'}</button><button type="button" onClick={() => { dispatch(clearError()); setOtpSent(false); setOtp('') }} className="btn-secondary w-full">Use a different email</button></form>
        )}
        <p className="text-center text-sm text-stone-500 mt-5">Already have an account? <Link to="/login" className="text-brown font-semibold hover:text-brown-dark">Sign in</Link></p>
      </div></div>
    </div>
  )
}
