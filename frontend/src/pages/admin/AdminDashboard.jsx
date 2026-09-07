import { useEffect, useState } from 'react'
import { FiShoppingBag, FiShoppingCart, FiUsers, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import api from '../../services/api'

const STATUS_COLORS = {
  processing: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-brown',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const STAT_CARDS = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: FiShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: FiShoppingCart, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: FiUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-brown-dark">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-stone-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly revenue */}
      {stats?.monthlyRevenue?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-brown" /> Monthly Revenue (Last 6 Months)
          </h2>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlyRevenue.map((item) => {
              const max = Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)
              const heightPct = (item.revenue / max) * 100
              return (
                <div key={`${item._id?.year}-${item._id?.month}`} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-stone-500 font-medium">₹{(item.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full bg-primary-100 rounded-t-lg" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                    <div className="w-full h-full bg-brown rounded-t-lg opacity-80" />
                  </div>
                  <span className="text-xs text-stone-400">{item._id?.month}/{item._id?.year?.toString().slice(2)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent orders */}
      {stats?.recentOrders?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-200">
            <h2 className="font-semibold text-stone-700">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">{order._id.slice(-8)}</td>
                    <td className="px-4 py-3 text-stone-700">{order.user?.name || 'Guest'}</td>
                    <td className="px-4 py-3 text-stone-600">{order.orderItems?.length}</td>
                    <td className="px-4 py-3 font-semibold text-brown-dark">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[order.orderStatus] || 'badge-brown'} capitalize`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
