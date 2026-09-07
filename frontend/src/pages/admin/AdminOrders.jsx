import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchAllOrders, updateOrderStatus } from '../../store/slices/orderSlice'

const STATUS_COLORS = {
  processing: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-brown',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

const ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const dispatch = useDispatch()
  const { allOrders, loading } = useSelector((s) => s.orders)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    dispatch(fetchAllOrders())
  }, [dispatch])

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId)
    const result = await dispatch(updateOrderStatus({ orderId, status }))
    if (updateOrderStatus.fulfilled.match(result)) {
      toast.success('Order status updated')
    } else {
      toast.error('Update failed')
    }
    setUpdating(null)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-brown-dark">Orders</h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'Update Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : allOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">No orders found.</td></tr>
              ) : allOrders.map((order) => (
                <tr key={order._id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-600">{order._id.slice(-10)}</td>
                  <td className="px-4 py-3 text-stone-700">{order.user?.name || 'Guest'}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">{order.orderItems?.length}</td>
                  <td className="px-4 py-3 font-semibold text-brown-dark whitespace-nowrap">
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-green' : order.paymentStatus === 'failed' ? 'badge-red' : 'badge-yellow'} capitalize`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[order.orderStatus] || 'badge-brown'} capitalize`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={updating === order._id}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="text-xs border border-cream-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brown-light disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
