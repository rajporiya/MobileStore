import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi'
import api from '../../services/api'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-brown-dark mb-2">Order Placed Successfully!</h1>
        <p className="text-stone-500">Thank you for your purchase. We'll notify you when your order ships.</p>
      </div>

      {order && (
        <div className="card p-6 space-y-5">
          {/* Order meta */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-stone-400 font-medium">Order ID</p>
              <p className="font-mono text-sm text-stone-700 break-all">{order._id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400 font-medium">Date</p>
              <p className="text-sm font-medium text-stone-700">
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <hr className="border-cream-200" />

          {/* Items */}
          <div>
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <FiPackage className="w-4 h-4 text-brown" /> Order Items
            </h3>
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover border border-cream-200"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/48x48?text=📱' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.title}</p>
                    <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-brown-dark whitespace-nowrap">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-cream-200" />

          {/* Price breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>{order.shippingPrice === 0 ? <span className="text-green-600 font-medium">Free</span> : `₹${order.shippingPrice}`}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST (18%)</span>
              <span>₹{order.taxPrice?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-brown-dark font-bold text-base border-t border-cream-200 pt-2 mt-1">
              <span>Total</span>
              <span>₹{order.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <hr className="border-cream-200" />

          {/* Shipping address */}
          {order.shippingAddress && (
            <div>
              <p className="text-xs text-stone-400 font-medium mb-1">Delivery Address</p>
              <p className="text-sm text-stone-700">
                {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode, order.shippingAddress.country]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs text-stone-400 font-medium mb-1">Payment Method</p>
            <p className="text-sm font-medium text-stone-700 capitalize">{order.paymentMethod}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link to="/" className="btn-secondary flex-1 text-center">
          Continue Shopping
        </Link>
        <Link to="/profile?tab=orders" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          View My Orders <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
