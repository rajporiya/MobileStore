import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { FiUser, FiPackage, FiEdit, FiSave } from 'react-icons/fi'
import { fetchMyOrders } from '../../store/slices/orderSlice'
import { updateProfile } from '../../store/slices/authSlice'

const STATUS_COLORS = {
  processing: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-brown',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

export default function ProfilePage() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { userInfo, loading } = useSelector((s) => s.auth)
  const { myOrders } = useSelector((s) => s.orders)

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: userInfo?.name || '',
    phone: userInfo?.phone || '',
    street: userInfo?.address?.street || '',
    city: userInfo?.address?.city || '',
    state: userInfo?.address?.state || '',
    pincode: userInfo?.address?.pincode || '',
    country: userInfo?.address?.country || 'India',
    password: '',
  })

  useEffect(() => {
    dispatch(fetchMyOrders())
  }, [dispatch])

  const handleSave = (e) => {
    e.preventDefault()
    const data = { name: form.name, phone: form.phone, address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode, country: form.country } }
    if (form.password) data.password = form.password
    dispatch(updateProfile(data)).then(() => setEditing(false))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-brown-dark mb-6">My Account</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card p-5 md:col-span-1 h-fit sticky top-24">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-brown rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-2xl font-bold">{userInfo?.name?.[0]?.toUpperCase()}</span>
            </div>
            <p className="font-semibold text-stone-800 text-sm">{userInfo?.name}</p>
            <p className="text-stone-500 text-xs">{userInfo?.email}</p>
          </div>
          <nav className="space-y-1">
            {[{ key: 'profile', label: 'My Profile', icon: FiUser }, { key: 'orders', label: 'My Orders', icon: FiPackage }].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === key ? 'bg-primary-100 text-brown' : 'text-stone-600 hover:bg-cream-100'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-brown-dark text-lg">Profile Information</h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="btn-secondary !py-1.5 !px-3 text-sm flex items-center gap-1.5">
                    <FiEdit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Pincode</label>
                    <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Street Address</label>
                    <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-600 mb-1">New Password (leave blank to keep current)</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" className="input" minLength={6} />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-1.5 disabled:opacity-50">
                      <FiSave className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    ['Name', userInfo?.name],
                    ['Email', userInfo?.email],
                    ['Phone', userInfo?.phone || '—'],
                    ['Role', userInfo?.role],
                    ['Street', userInfo?.address?.street || '—'],
                    ['City', userInfo?.address?.city || '—'],
                    ['State', userInfo?.address?.state || '—'],
                    ['Country', userInfo?.address?.country || 'India'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-stone-400 font-medium mb-0.5">{label}</p>
                      <p className="font-medium text-stone-800">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-bold text-brown-dark text-lg">My Orders ({myOrders.length})</h2>
              {myOrders.length === 0 ? (
                <div className="card p-10 text-center">
                  <FiPackage className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">You haven't placed any orders yet.</p>
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order._id} className="card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Order ID</p>
                        <p className="font-mono text-xs text-stone-700">{order._id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${STATUS_COLORS[order.orderStatus] || 'badge-brown'} capitalize`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.orderItems?.slice(0, 2).map((item) => (
                        <div key={item._id} className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="w-2 h-2 bg-brown-light rounded-full shrink-0" />
                          {item.title} × {item.quantity} — ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                      ))}
                      {order.orderItems?.length > 2 && (
                        <p className="text-xs text-stone-400">+{order.orderItems.length - 2} more items</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="font-bold text-brown-dark">₹{order.totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
