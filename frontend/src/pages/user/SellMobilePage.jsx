import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiUpload, FiX, FiSmartphone, FiClock, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  fetchDealers,
  createTradeInRequest,
  fetchMyRequests,
  cancelTradeInRequest,
} from '../../store/slices/tradeInSlice'
import { PageLoader } from '../../components/common/Skeletons'

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', desc: 'Like new, no scratches' },
  { value: 'good', label: 'Good', desc: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', desc: 'Visible scratches, works' },
  { value: 'poor', label: 'Poor', desc: 'Major damage or issues' },
]

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-blue',
  rejected: 'badge-red',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

const EMPTY_FORM = {
  brand: '',
  model: '',
  condition: 'good',
  expectedPrice: '',
  description: '',
  dealer: '',
}

export default function SellMobilePage() {
  const dispatch = useDispatch()
  const { dealers, myRequests, submitting, loading } = useSelector((s) => s.tradeIn)

  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [activeTab, setActiveTab] = useState('sell')
  const [detailRequest, setDetailRequest] = useState(null)

  useEffect(() => {
    dispatch(fetchDealers())
    dispatch(fetchMyRequests())
  }, [dispatch])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (imageFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    const valid = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is too large (max 5MB)`); return false }
      return true
    })
    setImageFiles((prev) => [...prev, ...valid])
    const newPreviews = valid.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...newPreviews])
    e.target.value = ''
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.dealer) { toast.error('Please select a dealer'); return }
    if (imageFiles.length === 0) { toast.error('Please upload at least one photo'); return }
    if (!form.brand.trim()) { toast.error('Please enter the brand'); return }
    if (!form.model.trim()) { toast.error('Please enter the model'); return }

    const result = await dispatch(createTradeInRequest({
      fields: {
        dealer: form.dealer,
        brand: form.brand,
        model: form.model,
        condition: form.condition,
        expectedPrice: form.expectedPrice || 0,
        description: form.description,
      },
      images: imageFiles,
    }))

    if (createTradeInRequest.fulfilled.match(result)) {
      toast.success('Trade-in request submitted!')
      setForm(EMPTY_FORM)
      setImageFiles([])
      setImagePreviews([])
      dispatch(fetchMyRequests())
      setActiveTab('submissions')
    } else {
      toast.error(result.payload || 'Failed to submit request')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    const result = await dispatch(cancelTradeInRequest(id))
    if (cancelTradeInRequest.fulfilled.match(result)) {
      toast.success('Request cancelled')
      dispatch(fetchMyRequests())
    } else {
      toast.error(result.payload || 'Failed to cancel')
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/30">
            <FiSmartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sell Old Phone</h1>
            <p className="text-slate-500 text-sm">Upload photos, select a dealer, and get a quote</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-slate-200 w-fit">
        {[
          { key: 'sell', label: 'Sell Phone', icon: FiUpload },
          { key: 'submissions', label: `My Submissions (${myRequests.length})`, icon: FiClock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Sell Form */}
          {activeTab === 'sell' && (
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* Phone Photos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <FiImage className="w-4 h-4 text-indigo-600" /> Phone Photos * <span className="text-slate-400 font-normal">(max 5)</span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 5 && (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                        <FiUpload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Add Photo</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  {imageFiles.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2">Upload clear photos of your old phone (front, back, sides)</p>
                  )}
                </div>

                {/* Phone Details */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Phone Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Brand *</label>
                      <input
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        className="input"
                        placeholder="e.g. Samsung, Apple"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Model *</label>
                      <input
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        className="input"
                        placeholder="e.g. iPhone 14, Galaxy S23"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Condition *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CONDITION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, condition: opt.value })}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            form.condition === opt.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <span className={`text-xs font-semibold block ${form.condition === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Price (₹)</label>
                      <input
                        type="number"
                        value={form.expectedPrice}
                        onChange={(e) => setForm({ ...form, expectedPrice: e.target.value })}
                        className="input"
                        placeholder="e.g. 15000"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Details</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input resize-none"
                      rows={3}
                      placeholder="Any extra info: scratches, accessories, battery health, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar - Dealer Select + Submit */}
              <div className="lg:col-span-1 space-y-5">
                {/* Select Dealer */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-3">Select Dealer *</h3>
                  {dealers.length === 0 ? (
                    <p className="text-slate-400 text-sm">No active dealers available yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dealers.map((d) => (
                        <label
                          key={d._id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            form.dealer === d._id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-100 hover:border-indigo-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="dealer"
                            value={d._id}
                            checked={form.dealer === d._id}
                            onChange={() => setForm({ ...form, dealer: d._id })}
                            className="mt-1 accent-indigo-600"
                          />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${form.dealer === d._id ? 'text-indigo-700' : 'text-slate-800'}`}>
                              {d.dealerInfo?.shopName || d.name}
                            </p>
                            {d.dealerInfo?.city && <p className="text-xs text-slate-500">{d.dealerInfo.city}</p>}
                            {d.dealerInfo?.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.dealerInfo.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-3">Request Summary</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between"><span>Photos</span><span className="font-medium text-slate-800">{imageFiles.length}</span></div>
                    <div className="flex justify-between"><span>Brand</span><span className="font-medium text-slate-800">{form.brand || '—'}</span></div>
                    <div className="flex justify-between"><span>Model</span><span className="font-medium text-slate-800">{form.model || '—'}</span></div>
                    <div className="flex justify-between"><span>Condition</span><span className="font-medium text-slate-800 capitalize">{form.condition}</span></div>
                    <div className="flex justify-between"><span>Expected</span><span className="font-medium text-slate-800">{form.expectedPrice ? `₹${Number(form.expectedPrice).toLocaleString('en-IN')}` : '—'}</span></div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full mt-5 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiUpload className="w-4 h-4" /> Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* My Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                  <FiSmartphone className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No submissions yet</h3>
                  <p className="text-slate-400 text-sm mb-5">Sell your old phone in just a few steps.</p>
                  <button onClick={() => setActiveTab('sell')} className="btn-primary">Sell a Phone</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div key={req._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Images */}
                        <div className="flex gap-2 shrink-0">
                          {req.images?.slice(0, 3).map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {req.images?.length > 3 && (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                              +{req.images.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-slate-800">{req.brand} {req.model}</h3>
                              <p className="text-xs text-slate-500 mt-0.5 capitalize">Condition: {req.condition}</p>
                            </div>
                            <span className={`badge ${STATUS_BADGE[req.status]} capitalize shrink-0`}>{req.status}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Dealer: <strong className="text-slate-700">{req.dealer?.dealerInfo?.shopName || req.dealer?.name || 'N/A'}</strong></span>
                            <span>Expected: <strong className="text-slate-700">₹{(req.expectedPrice || 0).toLocaleString('en-IN')}</strong></span>
                            <span>{formatDate(req.createdAt)}</span>
                          </div>

                          {/* Dealer decision info */}
                          {req.status !== 'pending' && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${req.status === 'approved' || req.status === 'completed' ? 'bg-indigo-50 text-indigo-800' : 'bg-red-50 text-red-700'}`}>
                              {req.status === 'approved' && (
                                <span>Dealer offered: <strong>₹{req.dealerPrice?.toLocaleString('en-IN')}</strong>
                                  {req.dealerNote && <span className="ml-1">— {req.dealerNote}</span>}
                                </span>
                              )}
                              {req.status === 'completed' && (
                                <span>Payment received: <strong className="text-emerald-700">₹{req.dealerPrice?.toLocaleString('en-IN')}</strong> — Phone collected</span>
                              )}
                              {req.status === 'rejected' && (
                                <span>Rejected{req.dealerNote ? <span>: {req.dealerNote}</span> : ''}</span>
                              )}
                              {req.status === 'cancelled' && <span>Cancelled by you</span>}
                            </div>
                          )}
                        </div>

                        {/* Cancel action */}
                        {req.status === 'pending' && (
                          <button onClick={() => handleCancel(req._id)} className="text-red-500 hover:text-red-700 text-xs font-medium self-start shrink-0">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}