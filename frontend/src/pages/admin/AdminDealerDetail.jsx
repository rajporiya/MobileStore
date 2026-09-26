import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiBriefcase, FiEdit, FiInbox, FiMail, FiMapPin, FiPhone, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminModal from '../../components/admin/ui/AdminModal'
import { SectionCard, DataGrid, DataRow, ListRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import {
  money,
  formatDate,
  formatDateTime,
  errorMessage,
  pluralise,
  TRADE_IN_TONE,
} from '../../utils/adminUtils'

export default function AdminDealerDetail() {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ shopName: '', description: '', city: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/users/dealers/${id}/activity`)
      setActivity(data.data)
      setForm({
        shopName: data.data.dealer.dealerInfo?.shopName || '',
        description: data.data.dealer.dealerInfo?.description || '',
        city: data.data.dealer.dealerInfo?.city || '',
      })
    } catch (err) {
      setError(errorMessage(err, 'This dealer could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/users/dealers/${id}`, form)
      setActivity((prev) => ({ ...prev, dealer: data.data }))
      toast.success('Dealer updated')
      setEditOpen(false)
    } catch (err) {
      toast.error(errorMessage(err, 'The dealer could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Dealer" icon={FiBriefcase} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminPanelSkeleton className="h-72" />
          <AdminPanelSkeleton className="h-72 lg:col-span-2" />
        </div>
      </>
    )
  }

  if (error || !activity) {
    return (
      <>
        <AdminPageHeader title="Dealer" icon={FiBriefcase} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Dealer not found"
            description={error || 'This account is not a dealer.'}
            action={
              <Link to="/admin/dealers" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" />
                Back to dealers
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const { dealer, tradeIns, summary } = activity
  const isActive = dealer.dealerInfo?.isActive
  const byStatus = summary.byStatus || {}

  return (
    <>
      <AdminPageHeader
        title={dealer.dealerInfo?.shopName || dealer.name}
        description={`${dealer.name} · joined ${formatDate(dealer.createdAt)}`}
        icon={FiBriefcase}
        actions={
          <>
            <Link to="/admin/dealers" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button onClick={() => setEditOpen(true)} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiEdit className="w-4 h-4" />
              Edit details
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SectionCard title="Shop">
            <div className="flex flex-col items-center text-center pb-2">
              <AdminAvatar name={dealer.dealerInfo?.shopName || dealer.name} src={dealer.avatar} size="xl" ring />
              <p className="mt-3 text-base font-bold text-slate-900">{dealer.dealerInfo?.shopName || dealer.name}</p>
              <p className="text-xs text-slate-500">Owner: {dealer.name}</p>
              <div className="mt-2">
                <AdminStatusBadge
                  value={isActive ? 'active' : 'inactive'}
                  tone={isActive ? 'green' : 'slate'}
                  label={isActive ? 'Active dealer' : 'Inactive dealer'}
                />
              </div>
            </div>

            <ul className="mt-3 space-y-2.5 text-sm">
              {dealer.email && (
                <li className="flex items-center gap-2.5 text-slate-600">
                  <FiMail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{dealer.email}</span>
                </li>
              )}
              {dealer.phone && (
                <li className="flex items-center gap-2.5 text-slate-600">
                  <FiPhone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{dealer.phone}</span>
                </li>
              )}
              {dealer.dealerInfo?.city && (
                <li className="flex items-center gap-2.5 text-slate-600">
                  <FiMapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{dealer.dealerInfo.city}</span>
                </li>
              )}
            </ul>

            {dealer.dealerInfo?.description && (
              <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                {dealer.dealerInfo.description}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Account">
            <DataGrid>
              <DataRow label="Role" value="Dealer" />
              <DataRow label="Trade-ins handled" value={summary.totalRequests} />
              <DataRow label="Joined" value={formatDate(dealer.createdAt)} />
              <DataRow label="Updated" value={formatDateTime(dealer.updatedAt)} />
            </DataGrid>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total requests', value: summary.totalRequests },
              { label: 'Pending', value: byStatus.pending || 0 },
              { label: 'Approved', value: byStatus.approved || 0 },
              { label: 'Value handled', value: money(summary.totalValued) },
            ].map((stat) => (
              <SectionCard key={stat.label} bodyClassName="px-4 py-3.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{stat.value}</p>
              </SectionCard>
            ))}
          </div>

          <SectionCard title={`Trade-ins assigned to this dealer (${tradeIns.length})`} bodyClassName="py-2">
            {tradeIns.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">
                No trade-ins have been assigned to this dealer yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {tradeIns.map((request) => (
                  <ListRow
                    key={request._id}
                    to={`/admin/trade-ins/${request._id}`}
                    icon={FiRefreshCw}
                    title={`${request.brand} ${request.model}`}
                    subtitle={`${request.user?.name || 'Customer'} · ${formatDate(request.createdAt)}`}
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-slate-800">
                          {request.dealerPrice ? money(request.dealerPrice) : 'Unquoted'}
                        </span>
                        <AdminStatusBadge value={request.status} tone={TRADE_IN_TONE[request.status]} />
                      </div>
                    }
                  />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="How this dealer works">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <FiRefreshCw className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  Trade-ins are routed to a dealer from the trade-in screen, then quoted by that dealer. The quoted price becomes the customer&apos;s credit.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <FiRefreshCw className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  Requests move <span className="font-semibold">pending → approved → completed</span>. Cancelling a linked order releases the credit automatically.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <FiBriefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  Deactivating a dealer hides them from the dealer list but keeps every completed trade-in on record.
                </span>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <AdminModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit shop details"
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="dealer-shop-name" className="block text-xs font-bold text-slate-600 mb-1.5">
              Shop name
            </label>
            <input
              id="dealer-shop-name"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="dealer-shop-city" className="block text-xs font-bold text-slate-600 mb-1.5">
              City
            </label>
            <input
              id="dealer-shop-city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="dealer-shop-description" className="block text-xs font-bold text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              id="dealer-shop-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
            />
          </div>
        </div>
      </AdminModal>
    </>
  )
}
