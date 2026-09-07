import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiCreditCard, FiTruck, FiCheckCircle } from 'react-icons/fi'
import { createOrder } from '../../store/slices/orderSlice'
import { clearCart, selectCartItems, selectCartTotal } from '../../store/slices/cartSlice'

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { value: 'razorpay', label: 'Razorpay (UPI / Card)', icon: '💳' },
  { value: 'stripe', label: 'Stripe (International)', icon: '🌐' },
]

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector(selectCartItems)
  const cartTotal = useSelector(selectCartTotal)
  const { userInfo } = useSelector((s) => s.auth)
  const { loading } = useSelector((s) => s.orders)

  const [form, setForm] = useState({
    fullName: userInfo?.name || '',
    phone: userInfo?.phone || '',
    street: userInfo?.address?.street || '',
    city: userInfo?.address?.city || '',
    state: userInfo?.address?.state || '',
    pincode: userInfo?.address?.pincode || '',
    country: userInfo?.address?.country || 'India',
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [step, setStep] = useState(1) // 1: address, 2: payment, 3: review

  const shippingPrice = cartTotal >= 999 ? 0 : 99
  const taxAmount = Math.round(cartTotal * 0.18)
  const totalAmount = cartTotal + shippingPrice + taxAmount

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePlaceOrder = async () => {
    const orderData = {
      orderItems: cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      })),
      shippingAddress: form,
      paymentMethod,
    }

    const result = await dispatch(createOrder(orderData))
    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart())
      navigate(`/order-success/${result.payload._id}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-brown-dark mb-8">Checkout</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Address' },
          { n: 2, label: 'Payment' },
          { n: 3, label: 'Review' },
        ].map(({ n, label }, idx) => (
          <div key={n} className="flex items-center gap-2">
            <button
              onClick={() => n < step && setStep(n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${step >= n ? 'bg-brown text-white' : 'bg-cream-200 text-stone-500'}`}
            >
              {step > n ? <FiCheckCircle className="w-3.5 h-3.5" /> : <span>{n}</span>}
              {label}
            </button>
            {idx < 2 && <div className={`h-0.5 w-8 ${step > n ? 'bg-brown' : 'bg-cream-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-bold text-brown-dark text-lg mb-5 flex items-center gap-2">
                <FiTruck className="w-5 h-5" /> Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleFormChange} className="input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleFormChange} className="input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={handleFormChange} className="input" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Street Address *</label>
                  <input name="street" value={form.street} onChange={handleFormChange} className="input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">City *</label>
                  <input name="city" value={form.city} onChange={handleFormChange} className="input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">State *</label>
                  <input name="state" value={form.state} onChange={handleFormChange} className="input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Country</label>
                  <input name="country" value={form.country} onChange={handleFormChange} className="input" />
                </div>
              </div>
              <button
                onClick={() => {
                  const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode']
                  if (required.every((k) => form[k].trim())) setStep(2)
                  else alert('Please fill all required fields')
                }}
                className="btn-primary mt-6 w-full py-3"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="font-bold text-brown-dark text-lg mb-5 flex items-center gap-2">
                <FiCreditCard className="w-5 h-5" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${paymentMethod === method.value ? 'border-brown bg-primary-50' : 'border-cream-200 hover:border-brown-light'}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="accent-brown"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium text-stone-800">{method.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="font-bold text-brown-dark text-lg mb-5">Review Order</h2>
              <div className="bg-cream-50 rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-stone-800 mb-1">{form.fullName} · {form.phone}</p>
                <p className="text-stone-600">{form.street}, {form.city}, {form.state} - {form.pincode}</p>
              </div>
              <div className="bg-cream-50 rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-stone-800">
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.icon}{' '}
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </p>
              </div>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 text-sm">
                    <img src={item.images?.[0]?.url || ''} alt="" className="w-10 h-10 rounded-lg object-cover bg-cream-100" />
                    <span className="flex-1 text-stone-700 line-clamp-1">{item.title}</span>
                    <span className="text-stone-500 shrink-0">×{item.quantity}</span>
                    <span className="font-semibold text-stone-800 shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 font-bold disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : `Place Order · ₹${totalAmount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-brown-dark mb-3 text-base">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between text-stone-600">
                  <span className="line-clamp-1 flex-1 mr-2">{item.title} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <hr className="border-cream-200 my-2" />
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className={shippingPrice === 0 ? 'text-green-600' : ''}>
                  {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST (18%)</span><span>₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <hr className="border-cream-200" />
              <div className="flex justify-between font-bold text-brown-dark">
                <span>Total</span><span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
