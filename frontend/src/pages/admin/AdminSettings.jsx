import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiAlertTriangle,
  FiInfo,
  FiLock,
  FiSettings,
  FiUser,
} from 'react-icons/fi'

import { updateProfile, logout } from '../../store/slices/authSlice'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import { errorMessage, ROLE_TONE, titleCase } from '../../utils/adminUtils'

const ADDRESS_FIELDS = [
  { key: 'street', label: 'Street', span: 'sm:col-span-2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
]

export default function AdminSettings() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.userInfo)
  const { loading } = useSelector((state) => state.auth)

  const [profile, setProfile] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '', confirm: '' })
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setProfile({
      name: user.name || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      pincode: user.address?.pincode || '',
    })
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await dispatch(
        updateProfile({
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          address: {
            street: profile.street.trim(),
            city: profile.city.trim(),
            state: profile.state.trim(),
            pincode: profile.pincode.trim(),
          },
        })
      ).unwrap()
    } catch (err) {
      toast.error(errorMessage(err, 'Your profile could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (passwords.password !== passwords.confirm) {
      toast.error('The new passwords do not match')
      return
    }
    setSaving(true)
    try {
      await dispatch(
        updateProfile({ currentPassword: passwords.currentPassword, password: passwords.password })
      ).unwrap()
      setPasswords({ currentPassword: '', password: '', confirm: '' })
      setPasswordOpen(false)
    } catch (err) {
      toast.error(errorMessage(err, 'Your password could not be changed.'))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/admin/login', { replace: true })
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Your admin account, security and what this panel can change"
        icon={FiSettings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SectionCard title="Your account">
            <div className="flex flex-col items-center text-center pb-2">
              <AdminAvatar name={user?.name} src={user?.avatar} size="xl" ring />
              <p className="mt-3 text-base font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="mt-2">
                <AdminStatusBadge value={user?.role} tone={ROLE_TONE[user?.role]} label={titleCase(user?.role)} dot={false} />
              </div>
            </div>

            <button onClick={() => setLogoutOpen(true)} className="mt-4 w-full px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors">
              Log out
            </button>
          </SectionCard>

          <SectionCard title="Session">
            <p className="text-xs text-slate-500 leading-relaxed">
              You are signed in with a token stored in this browser. Logging out clears it immediately.
            </p>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Profile" subtitle="Shown to your team and on the records you touch">
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-name" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Full name
                  </label>
                  <input
                    id="settings-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="settings-phone" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="settings-phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <p className="text-xs font-bold text-slate-600">Address</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ADDRESS_FIELDS.map((field) => (
                  <div key={field.key} className={field.span}>
                    <label htmlFor={`settings-${field.key}`} className="block text-xs font-bold text-slate-600 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      id={`settings-${field.key}`}
                      value={profile[field.key]}
                      onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                      className="input"
                    />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5 shrink-0" />
                Email and role are managed in the database and cannot be edited here.
              </p>

              <div className="flex justify-end">
                <button type="submit" disabled={saving || loading} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Password" subtitle="Requires your current password to confirm">
            <button
              onClick={() => setPasswordOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
            >
              <FiLock className="w-4 h-4" />
              {passwordOpen ? 'Hide password form' : 'Change password'}
            </button>

            {passwordOpen && (
              <form onSubmit={savePassword} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="input"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-bold text-slate-600 mb-1.5">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={passwords.password}
                      onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                      className="input"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-600 mb-1.5">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="input"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                    {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                    {saving ? 'Saving…' : 'Change password'}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>

          <SectionCard title="What this panel can change">
            <ul className="space-y-2.5 text-sm text-slate-600">
              {[
                { ok: true, text: 'Phones, categories, prices, stock, photos and specifications' },
                { ok: true, text: 'Order status, payment review and trade-in valuations' },
                { ok: true, text: 'Customer accounts, and suspending or restoring them' },
                { ok: true, text: 'Dealer shops, their activation and their assigned trade-ins' },
                { ok: false, text: 'Store-wide settings such as shipping rules, tax rates or store name — no API exists for these yet' },
                { ok: false, text: 'Refunds. A refund is recorded by the payment gateway; VoltCart only stores the refunded status' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {item.ok ? '✓' : '–'}
                  </span>
                  <span className={item.ok ? '' : 'text-slate-400'}>{item.text}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Quick links">
            <ul className="space-y-2 text-sm">
              {[
                { to: '/admin/products/add', label: 'Add a phone to the catalogue' },
                { to: '/admin/categories', label: 'Manage categories' },
                { to: '/admin/trade-ins?status=pending', label: 'Value pending trade-ins' },
                { to: '/admin/orders?status=processing', label: 'Move orders along' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors">
                    <FiUser className="w-4 h-4 text-slate-400 shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <p className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
            <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Changing your name or password signs you out of nothing, but remember your new password — you will need it on
            your next sign-in.
          </p>
        </div>
      </div>

      <AdminConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        danger={false}
        title="Log out of the admin panel?"
        confirmLabel="Log out"
        message="You will need to sign in with an admin account to come back."
      />
    </>
  )
}
