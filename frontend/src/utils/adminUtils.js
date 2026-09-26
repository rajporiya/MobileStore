// Shared formatting + status vocabulary for every admin screen, so an order
// badge, a trade-in badge and a payment badge never drift apart.

export const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// Compact form for chart axes and dense stat cards.
export const shortMoney = (value) => {
  const n = Number(value || 0)
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${n}`
}

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

// "3 days ago" style stamps for feeds and tables.
export const timeAgo = (value) => {
  if (!value) return '—'
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    const amount = Math.floor(seconds / size)
    if (amount >= 1) return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`
  }
  return 'just now'
}

export const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?'

export const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : '—')

export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`

// The model enums are the source of truth; these lists only mirror them for the
// filter dropdowns, so a status the backend does not have can never be sent.
export const ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
export const PAYMENT_METHODS = ['razorpay', 'stripe', 'cod']
export const TRADE_IN_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled']
export const USER_ROLES = ['user', 'dealer', 'admin']
export const DEVICE_CONDITIONS = ['excellent', 'good', 'fair', 'poor']

// One shared colour language: green = good, amber = needs attention,
// red = failed, blue = in progress, slate = neutral/inactive.
const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

export const toneClass = (tone) => TONES[tone] || TONES.slate

export const ORDER_TONE = {
  processing: 'amber',
  confirmed: 'blue',
  shipped: 'indigo',
  delivered: 'green',
  cancelled: 'red',
}

export const PAYMENT_TONE = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
  refunded: 'slate',
}

export const TRADE_IN_TONE = {
  pending: 'amber',
  approved: 'violet',
  completed: 'green',
  rejected: 'red',
  cancelled: 'slate',
}

export const ROLE_TONE = {
  admin: 'indigo',
  dealer: 'violet',
  user: 'slate',
}

export const CONDITION_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export const PAYMENT_METHOD_LABELS = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  cod: 'Cash on Delivery',
}

export const titleCase = (value) =>
  String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

// Normalises anything thrown by axios into one readable sentence. Never shows
// a stack trace or a raw server message that could leak internals.
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message ||
  (err?.code === 'ERR_NETWORK'
    ? 'Cannot reach the server. Check that the backend is running.'
    : err?.message) ||
  fallback

// YYYY-MM-DD for <input type="date"> query params.
export const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
