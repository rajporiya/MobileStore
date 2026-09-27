import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiCreditCard, FiTruck, FiCheckCircle, FiRepeat } from 'react-icons/fi'
import { createOrder, markOrderPaid } from '../../store/slices/orderSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { clearCart, selectCartItems, selectCartTotal } from '../../store/slices/cartSlice'
import { fetchMyRequests } from '../../store/slices/tradeInSlice'

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { value: 'razorpay', label: 'Razorpay (UPI / Card)', icon: '💳' },
  { value: 'stripe', label: 'Stripe (International)', icon: '🌐' },
]

const STEPS = [
  { n: 1, label: 'Address' },
  { n: 2, label: 'Payment' },
  { n: 3, label: 'Exchange' },
  { n: 4, label: 'Review' },
]

const CONDITION_LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' }

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector(selectCartItems)
  const cartTotal = useSelector(selectCartTotal)
  const { userInfo } = useSelector((s) => s.auth)
  const { loading } = useSelector((s) => s.orders)
  const { myRequests } = useSelector((s) => s.tradeIn)

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
  const [step, setStep] = useState(1) // 1: address, 2: payment, 3: exchange, 4: review
  const [tradeInId, setTradeInId] = useState('')

  useEffect(() => {
    dispatch(fetchMyRequests())
  }, [dispatch])

  const shippingPrice = cartTotal >= 999 ? 0 : 99
  const taxAmount = Math.round(cartTotal * 0.18)

  // Only old phones the admin has not turned down and that are not already
  // spoken for by another order can back this purchase.
  const exchangeable = myRequests.filter(
    (r) => !r.linkedOrder && (r.status === 'approved' || r.status === 'pending')
  )
  // Every phone in the cart must allow exchange, otherwise no old phone can be applied.
  const cartAllowsExchange = cartItems.length > 0 && cartItems.every((item) => item.exchangeEnabled)
  const selectedTradeIn = cartAllowsExchange
    ? exchangeable.find((r) => r._id === tradeInId) || null
    : null
  const exchangeValue = selectedTradeIn?.exchangeValue ?? 0

  const totalAmount = Math.max(0, cartTotal + shippingPrice + taxAmount - exchangeValue)

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const openRazorpayCheckout = (rzpOrder, order) =>
    new Promise((resolve) => {
      const options = {
        key: rzpOrder.key,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'VoltCart',
        description: `Order ${order._id}`,
        order_id: rzpOrder.id,
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => resolve({ status: 'dismissed' }),
        },
        handler: (response) => resolve(response),
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    })

  const handlePlaceOrder = async () => {
    const orderData = {
      orderItems: cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      })),
      shippingAddress: form,
      paymentMethod,
      tradeInRequestId: selectedTradeIn?._id || undefined,
    }

    // Razorpay: create the DB order first, then open Razorpay test/live checkout
    // before navigating away, so payment is collected and verified up front.
    if (paymentMethod === 'razorpay') {
      let order
      try {
        const result = await dispatch(createOrder(orderData))
        if (!createOrder.fulfilled.match(result)) return
        order = result.payload
      } catch {
        return
      }

      let rzpOrder
      try {
        const { data } = await api.post('/payment/razorpay', { amount: order.totalPrice })
        rzpOrder = data.data
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not start Razorpay payment')
        return
      }

      const payment = await openRazorpayCheckout(rzpOrder, order)
      if (payment.status === 'dismissed') {
        toast.error('Payment cancelled')
        return
      }

      try {
        // Server-side signature check, then record the payment on the order.
        await api.post('/payment/razorpay/verify', payment)
        await dispatch(
          markOrderPaid({
            id: order._id,
            paymentResult: {
              id: payment.razorpay_payment_id,
              status: 'completed',
              update_time: new Date().toISOString(),
            },
          })
        )
        dispatch(clearCart())
        navigate(`/order-success/${order._id}`)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Payment verification failed')
      }
      return
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
        {STEPS.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center gap-2">
            <button
              onClick={() => n < step && setStep(n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${step >= n ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'bg-slate-200 text-slate-500'}`}
            >
              {step > n ? <FiCheckCircle className="w-3.5 h-3.5" /> : <span>{n}</span>}
              {label}
            </button>
            {idx < STEPS.length - 1 && <div className={`h-0.5 w-8 ${step > n ? 'bg-brown' : 'bg-cream-200'}`} />}
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
                <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Continue to Exchange</button>
              </div>
            </div>
          )}

          {/* Step 3: Exchange */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="font-bold text-brown-dark text-lg mb-1 flex items-center gap-2">
                <FiRepeat className="w-5 h-5" /> Exchange Your Old Phone
              </h2>
              <p className="text-sm text-stone-500 mb-5">
                Hand over an old phone and its value is deducted from the new phone price.
              </p>

              {exchangeable.length === 0 ? (
                <div className="bg-cream-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-stone-600 mb-3">You have no old phone ready for exchange.</p>
                  <Link to="/sell-mobile" className="btn-secondary inline-block">Sell an Old Phone</Link>
                </div>
              ) : !cartAllowsExchange ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Exchange is not available on this cart</p>
                  <p className="text-sm text-amber-800">
                    {cartItems.filter((i) => !i.exchangeEnabled).map((i) => i.title).join(', ')}{' '}
                    {cartItems.filter((i) => !i.exchangeEnabled).length === 1 ? 'does' : 'do'} not allow exchange.
                    Remove {cartItems.filter((i) => !i.exchangeEnabled).length === 1 ? 'it' : 'them'} to exchange your old phone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${!selectedTradeIn ? 'border-brown bg-primary-50' : 'border-cream-200 hover:border-brown-light'}`}
                  >
                    <input
                      type="radio"
                      name="tradein"
                      checked={!selectedTradeIn}
                      onChange={() => setTradeInId('')}
                      className="accent-brown"
                    />
                    <span className="font-medium text-stone-800">No exchange — pay full price</span>
                  </label>

                  {exchangeable.map((req) => {
                    const value = req.exchangeValue ?? 0
                    const isSelected = tradeInId === req._id
                    return (
                      <label
                        key={req._id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-brown bg-primary-50' : 'border-cream-200 hover:border-brown-light'}`}
                      >
                        <input
                          type="radio"
                          name="tradein"
                          checked={isSelected}
                          onChange={() => setTradeInId(req._id)}
                          className="accent-brown mt-1"
                        />
                        {req.images?.[0] ? (
                          <img src={req.images[0].url} alt="" className="w-12 h-12 rounded-lg object-cover bg-cream-100 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-cream-100 flex items-center justify-center text-xl shrink-0">📱</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800">{req.brand} {req.model}</p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Condition: {CONDITION_LABELS[req.condition] || req.condition}
                          </p>
                          {value > 0 ? (
                            <p className="text-xs font-semibold text-emerald-600 mt-1">
                              -{value.toLocaleString('en-IN')} off your new phone
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1">
                              Awaiting admin approval — no deduction yet
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">Back</button>
                <button onClick={() => setStep(4)} className="btn-primary flex-1 py-3">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
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
              {selectedTradeIn && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-sm">
                  <p className="font-semibold text-emerald-800 flex items-center gap-2">
                    <FiRepeat className="w-4 h-4" />
                    Exchanging {selectedTradeIn.brand} {selectedTradeIn.model}
                  </p>
                  {exchangeValue > 0 ? (
                    <p className="text-emerald-700 mt-1">
                      -{exchangeValue.toLocaleString('en-IN')} deducted from the new phone price. Hand the old
                      phone over at delivery.
                    </p>
                  ) : (
                    <p className="text-emerald-700 mt-1">
                      Our admin will value this phone. The amount is deducted from your order total once
                      approved.
                    </p>
                  )}
                </div>
              )}
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
                <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-3">Back</button>
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
              {selectedTradeIn && (
                <div className="flex justify-between text-emerald-600">
                  <span className="line-clamp-1 flex-1 mr-2">
                    Exchange: {selectedTradeIn.brand} {selectedTradeIn.model}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {exchangeValue > 0 ? `-₹${exchangeValue.toLocaleString('en-IN')}` : 'pending'}
                  </span>
                </div>
              )}
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
