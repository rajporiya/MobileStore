import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiShoppingCart, FiRepeat, FiDollarSign, FiTrendingUp, FiXCircle,
  FiClock, FiUsers, FiShoppingBag, FiArrowRight, FiPackage
} from 'react-icons/fi'
import { fetchOrderStats } from '../../store/slices/orderSlice'

const money = (n) => `₹${(n || 0).toLocaleString('en-IN')}`
const shortMoney = (n) => {
  const v = n || 0
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`
  return `₹${v}`
}

const SELL_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-slate-200 text-slate-500',
}

const ORDER_BADGE = {
  processing: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

function StatCard({ label, value, sub, icon: Icon, tone }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const { adminStats: s } = useSelector((state) => state.orders)
  const [firstLoad, setFirstLoad] = useState(true)

  useEffect(() => {
    dispatch(fetchOrderStats()).finally(() => setFirstLoad(false))
  }, [dispatch])

  if (firstLoad || !s) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Purchase orders and sell orders are counted separately.
          </p>
        </div>
      </div>

      {/* ---------- Money ---------- */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={money(s.totalIncome)}
          sub="Paid orders, cancelled excluded"
          icon={FiDollarSign}
          tone="emerald"
        />
        <StatCard
          label="Cancelled Order Value"
          value={money(s.cancelledOrderValue)}
          sub={`${s.cancelledOrders} cancelled order${s.cancelledOrders === 1 ? '' : 's'}`}
          icon={FiXCircle}
          tone="red"
        />
        <StatCard
          label="Exchange Value Given"
          value={money(s.totalExchangeValue)}
          sub="Old phones credited to customers"
          icon={FiRepeat}
          tone="violet"
        />
        <StatCard
          label="In Flight Orders"
          value={money(s.pendingOrderValue)}
          sub={`${s.pendingOrders} not yet delivered`}
          icon={FiClock}
          tone="amber"
        />
      </div>

      {/* ---------- The two kinds of order ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Purchase orders */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FiShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Purchase Orders</h2>
                <p className="text-[11px] text-slate-400">New phones customers bought</p>
              </div>
            </div>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Manage <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">Total</p>
              <p className="text-lg font-bold text-slate-900">{s.totalOrders}</p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">In flight</p>
              <p className="text-lg font-bold text-amber-600">{s.pendingOrders}</p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">Cancelled</p>
              <p className="text-lg font-bold text-red-500">{s.cancelledOrders}</p>
            </div>
          </div>

          {s.recentOrders?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {s.recentOrders.map((order) => (
                <div key={order._id} className="px-5 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{order.user?.name || 'Guest'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      #{order._id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  {order.tradeInValue > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      -{shortMoney(order.tradeInValue)} old phone
                    </span>
                  )}
                  <p className="text-sm font-bold text-slate-900 shrink-0">{money(order.totalPrice)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${ORDER_BADGE[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                    {order.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No purchase orders yet.</p>
          )}
        </section>

        {/* Sell orders */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <FiRepeat className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Sell Orders</h2>
                <p className="text-[11px] text-slate-400">Old phones customers sold us</p>
              </div>
            </div>
            <Link to="/admin/exchange" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800">
              Manage <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">Total</p>
              <p className="text-lg font-bold text-slate-900">{s.totalSellOrders}</p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">Needs value</p>
              <p className="text-lg font-bold text-amber-600">{s.sellPending}</p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 font-medium">Approved</p>
              <p className="text-lg font-bold text-violet-600">{s.sellApproved + s.sellCompleted}</p>
            </div>
          </div>

          {s.recentTradeIns?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {s.recentTradeIns.map((req) => (
                <div key={req._id} className="px-5 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {req.brand} {req.model}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {req.user?.name} · {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    {req.exchangeValue > 0 ? `-${money(req.exchangeValue)}` : money(req.expectedPrice)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${SELL_BADGE[req.status] || 'bg-slate-100 text-slate-600'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No sell orders yet.</p>
          )}
        </section>
      </div>

      {/* ---------- Revenue + catalogue ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {s.monthlyRevenue?.length > 0 && (
          <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-indigo-600" /> Income — last 6 months
            </h2>
            <div className="flex items-end gap-3 h-40">
              {s.monthlyRevenue.map((item) => {
                const max = Math.max(...s.monthlyRevenue.map((m) => m.revenue), 1)
                const heightPct = (item.revenue / max) * 100
                return (
                  <div key={`${item._id?.year}-${item._id?.month}`} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-slate-600 font-semibold">{shortMoney(item.revenue)}</span>
                    <div className="w-full bg-slate-100 rounded-t-lg" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                      <div className="w-full h-full bg-indigo-500 rounded-t-lg" />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item._id?.month}/{item._id?.year?.toString().slice(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Shop at a glance</h2>
          {[
            { label: 'Exchange eligible phones', icon: FiPackage, to: '/admin/products' },
            { label: 'Registered customers', icon: FiUsers, to: '/admin/users' },
            { label: 'Active dealers', icon: FiShoppingBag, to: '/admin/dealers' },
          ].map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
              <Icon className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700 font-medium">{label}</span>
              <FiArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300" />
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}
