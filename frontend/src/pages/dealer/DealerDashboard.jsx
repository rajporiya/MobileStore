import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiSmartphone, FiClock, FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi'
import { fetchDealerStats } from '../../store/slices/tradeInSlice'

const STAT_CARDS = [
  { key: 'pending', label: 'Pending Requests', icon: FiClock, color: 'from-amber-500 to-orange-500' },
  { key: 'approved', label: 'Approved Offers', icon: FiCheckCircle, color: 'from-blue-500 to-indigo-500' },
  { key: 'completed', label: 'Completed Deals', icon: FiPackage, color: 'from-emerald-500 to-teal-500' },
  { key: 'total', label: 'Total Requests', icon: FiSmartphone, color: 'from-indigo-500 to-violet-500' },
]

export default function DealerDashboard() {
  const dispatch = useDispatch()
  const { dealerStats, loading } = useSelector((s) => s.tradeIn)

  useEffect(() => {
    dispatch(fetchDealerStats())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of your trade-in business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            {loading ? (
              <div className="h-8 w-12 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">{dealerStats[key] ?? 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <h2 className="text-xl font-bold relative">You have {dealerStats.pending ?? 0} pending request{dealerStats.pending === 1 ? '' : 's'}</h2>
        <p className="text-indigo-100 text-sm mt-1 relative">Review and respond quickly to close more deals.</p>
        <Link to="/dealer/requests" className="inline-flex items-center gap-2 mt-4 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors relative">
          Go to Requests <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}