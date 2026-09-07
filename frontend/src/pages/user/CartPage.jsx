import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { removeFromCart, updateQuantity, selectCartItems, selectCartTotal } from '../../store/slices/cartSlice'

export default function CartPage() {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const cartTotal = useSelector(selectCartTotal)

  const shippingPrice = cartTotal >= 999 ? 0 : 99
  const taxAmount = Math.round(cartTotal * 0.18)
  const totalAmount = cartTotal + shippingPrice + taxAmount

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FiShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
        <p className="text-stone-500 mb-6">Add some awesome phones to your cart!</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-brown-dark mb-6">Shopping Cart ({cartItems.length})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4">
              <Link to={`/products/${item._id}`}>
                <img
                  src={item.images?.[0]?.url || 'https://placehold.co/100x100/faf3e8/8B5E3C?text=Phone'}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-xl bg-cream-100"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item._id}`}>
                  <h3 className="font-semibold text-stone-800 hover:text-brown transition-colors text-sm leading-snug mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-xs text-brown-light font-medium mb-2">{item.brand}</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-brown-dark text-lg">₹{item.price?.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-cream-100 rounded-xl p-1">
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-stone-700 hover:bg-cream-200 transition-colors"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-stone-700 hover:bg-cream-200 transition-colors"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item._id))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-brown-dark text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({cartItems.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span className="font-medium">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className={`font-medium ${shippingPrice === 0 ? 'text-green-600' : ''}`}>
                  {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST (18%)</span>
                <span className="font-medium">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <hr className="border-cream-200" />
              <div className="flex justify-between font-bold text-brown-dark text-base">
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {shippingPrice > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mt-3">
                Add ₹{(999 - cartTotal).toLocaleString('en-IN')} more for free shipping!
              </p>
            )}
            <Link to="/checkout" className="btn-primary w-full text-center block mt-5 py-3 font-bold">
              Proceed to Checkout
            </Link>
            <Link to="/products" className="text-center block mt-3 text-sm text-brown hover:text-brown-dark font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
