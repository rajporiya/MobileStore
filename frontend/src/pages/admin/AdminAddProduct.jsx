import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiPlus, FiList } from 'react-icons/fi'
import ProductForm from '../../components/admin/ProductForm'

export default function AdminAddProduct() {
  const [saved, setSaved] = useState(null)

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Add Phone</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fill this in and the phone goes live on the store front immediately.
        </p>
      </div>

      {saved && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium min-w-0">
            <span className="font-semibold">{saved.title}</span> is live on the store.
          </p>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setSaved(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add another
            </button>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <FiList className="w-3.5 h-3.5" /> All phones
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <ProductForm onSaved={(product) => setSaved(product)} />
      </div>
    </div>
  )
}
