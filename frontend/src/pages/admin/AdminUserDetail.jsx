import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiHeart,
  FiInbox,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingCart,
  FiUnlock,
  FiUser,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard, DataGrid, DataRow, ListRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import {
  money,
  formatDate,
  formatDateTime,
  errorMessage,
  pluralise,
  shortId,
  ORDER_TONE,
  PAYMENT_TONE,
  ROLE_TONE,
  titleCase,
} from '../../utils/adminUtils'

export default function AdminUserDetail() {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/users/${id}/activity`)
      setActivity(data.data)
    } catch (err) {
      setError(errorMessage(err, 'This account could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const toggleStatus = async () => {
    setBusy(true)
    try {
      const isActive = activity.user.isActive !== false
      const { data } = await api.put(`/users/${id}/status`, { isActive: !isActive })
      setActivity((prev) => ({ ...prev, user: data.data }))
      toast.success(data.message)
      setConfirmOpen(false)
    } catch (err) {
      toast.error(errorMessage(err, 'The account status could not be changed.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Customer" icon={FiUser} />
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
        <AdminPageHeader title="Customer" icon={FiUser} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Account not found"
            description={error || 'It may have been deleted.'}
            action={
              <Link to="/admin/users" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" />
                Back to users
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const { user, orders, tradeIns, summary } = activity
  const isActive = user.isActive !== false
  const address = user.address || {}

  return (
    <>
      <AdminPageHeader
        title={user.name}
        description={user.email}
        icon={FiUser}
        actions={
          <>
            <Link to="/admin/users" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className={`btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2 ${
                isActive ? '!text-red-600' : '!text-emerald-600'
              }`}
            >
              {isActive ? <FiLock className="w-4 h-4" /> : <FiUnlock className="w-4 h-4" />}
              {isActive ? 'Suspend' : 'Restore'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SectionCard title="Profile">
            <div className="flex flex-col items-center text-center pb-2">
              <AdminAvatar name={user.name} src={user.avatar} size="xl" ring />
              <p className="mt-3 text-base font-bold text-slate-900">{user.name}</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                <AdminStatusBadge value={user.role} tone={ROLE_TONE[user.role]} dot={false} />
                <AdminStatusBadge
                  value={isActive ? 'active' : 'suspended'}
                  tone={isActive ? 'green' : 'red'}
                  label={isActive ? 'Active' : 'Suspended'}
                />
              </div>
            </div>

            <ul className="mt-3 space-y-2.5 text-sm">
              {user.email && (
                <li className="flex items-center gap-2.5 text-slate-600">
                  <FiMail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </li>
              )}
              {user.phone && (
                <li className="flex items-center gap-2.5 text-slate-600">
                  <FiPhone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{user.phone}</span>
                </li>
              )}
              {address.street && (
                <li className="flex items-start gap-2.5 text-slate-600">
                  <FiMapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {address.street}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                  </span>
                </li>
              )}
            </ul>
          </SectionCard>

          <SectionCard title="Account">
            <DataGrid>
              <DataRow label="Joined" value={formatDate(user.createdAt)} />
              <DataRow label="Last updated" value={formatDateTime(user.updatedAt)} />
              <DataRow label="Orders placed" value={summary.orderCount} />
              <DataRow label="Trade-ins" value={summary.tradeInCount} />
            </DataGrid>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Lifetime spend', value: money(summary.totalSpent) },
              { label: 'Orders', value: summary.orderCount },
              { label: 'Trade-in requests', value: summary.tradeInCount },
              { label: 'Wishlist items', value: summary.wishlistCount },
            ].map((stat) => (
              <SectionCard key={stat.label} bodyClassName="px-4 py-3.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{stat.value}</p>
              </SectionCard>
            ))}
          </div>

          <SectionCard title={`Order history (${orders.length})`} bodyClassName="py-2">
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">This customer has not ordered yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <ListRow
                    key={order._id}
                    to={`/admin/orders/${order._id}`}
                    icon={FiShoppingCart}
                    title={`#${shortId(order._id)} · ${money(order.totalPrice)}`}
                    subtitle={`${pluralise(order.orderItems?.length || 0, 'line')} · ${formatDate(order.createdAt)}`}
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
                        <AdminStatusBadge value={order.paymentStatus} tone={PAYMENT_TONE[order.paymentStatus]} />
                      </div>
                    }
                  />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={`Trade-in requests (${tradeIns.length})`} bodyClassName="py-2">
            {tradeIns.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No trade-in requests from this customer.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {tradeIns.map((request) => (
                  <ListRow
                    key={request._id}
                    to={`/admin/trade-ins/${request._id}`}
                    icon={FiHeart}
                    title={`${request.brand} ${request.model}`}
                    subtitle={`${titleCase(request.condition)} · ${formatDate(request.createdAt)}`}
                    trailing={<span className="text-xs font-semibold text-slate-700">{request.status}</span>}
                  />
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmOpen}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={toggleStatus}
        title={isActive ? 'Suspend this account?' : 'Restore this account?'}
        confirmLabel={isActive ? 'Suspend account' : 'Restore account'}
        message={
          isActive
            ? `${user.name} will no longer be able to sign in. Their orders and saved details are kept.`
            : `${user.name} will be able to sign in again immediately.`
        }
      />
    </>
  )
}
