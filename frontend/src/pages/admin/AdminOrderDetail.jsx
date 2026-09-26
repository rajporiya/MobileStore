import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiCheck,
  FiInbox,
  FiMapPin,
  FiRefreshCw,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard, DataGrid, DataRow, ListRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminEmptyState } from '../../components/admin/ui/AdminEmptyState'
import {
  money,
  formatDateTime,
  errorMessage,
  pluralise,
  shortId,
  ORDER_TONE,
  PAYMENT_TONE,
  PAYMENT_METHOD_LABELS,
} from '../../utils/adminUtils'

// The happy path, plus the one branch that needs a decision from the admin.
const NEXT_STATUS = {
  processing: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/orders/${id}`)
      setOrder(data.data)
    } catch (err) {
      setError(errorMessage(err, 'This order could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = async (orderStatus, reason) => {
    setSaving(true)
    try {
      const { data } = await api.put(`/orders/${id}/status`, { orderStatus, reason })
      setOrder(data.data)
      toast.success(`Order marked ${orderStatus}`)
    } catch (err) {
      toast.error(errorMessage(err, 'The order status could not be updated.'))
    } finally {
      setSaving(false)
      setCancelOpen(false)
      setCancelReason('')
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Order" icon={FiShoppingCart} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminPanelSkeleton className="h-80 lg:col-span-2" />
          <AdminPanelSkeleton className="h-80" />
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <AdminPageHeader title="Order" icon={FiShoppingCart} />
        <div className="bg-white rounded-2xl border border-slate-200">
          <AdminEmptyState
            icon={FiInbox}
            title="Order not found"
            description={error || 'Check the link, or the order may have been removed.'}
            action={
              <Link to="/admin/orders" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" />
                Back to orders
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const nextStatus = NEXT_STATUS[order.orderStatus]
  const isCancelled = order.orderStatus === 'cancelled'
  const address = order.shippingAddress || {}

  return (
    <>
      <AdminPageHeader
        title={`Order #${shortId(order._id)}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        icon={FiShoppingCart}
        actions={
          <Link to="/admin/orders" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            <FiArrowLeft className="w-4 h-4" />
            Back
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
        <AdminStatusBadge
          value={order.paymentStatus}
          tone={PAYMENT_TONE[order.paymentStatus]}
          label={`Payment ${order.paymentStatus}`}
        />
        <AdminStatusBadge
          value={order.paymentMethod}
          tone="slate"
          label={PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
          dot={false}
        />

        <div className="grow" />

        {!isCancelled && nextStatus && (
          <button
            onClick={() => changeStatus(nextStatus)}
            disabled={saving}
            className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2"
          >
            <FiTruck className="w-4 h-4" />
            Mark {nextStatus}
          </button>
        )}

        {!isCancelled && (
          <button
            onClick={() => setCancelOpen(true)}
            disabled={saving}
            className="btn-secondary !px-4 !py-2 text-sm !text-red-600 inline-flex items-center gap-2"
          >
            Cancel order
          </button>
        )}

        {isCancelled && (
          <button
            onClick={() => changeStatus('processing')}
            disabled={saving}
            className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Restore order
          </button>
        )}
      </div>

      {isCancelled && order.cancelReason && (
        <p className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          Cancelled {formatDateTime(order.cancelledAt)} — {order.cancelReason}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title={`Items (${order.orderItems?.length || 0})`} bodyClassName="p-0">
            <ul className="divide-y divide-slate-100">
              {(order.orderItems || []).map((item) => (
                <ListRow
                  key={item._id || item.product?._id || item.title}
                  title={item.title}
                  subtitle={`${money(item.price)} × ${item.quantity}`}
                  trailing={
                    <span className="text-sm font-bold text-slate-900">{money(item.price * item.quantity)}</span>
                  }
                />
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Payment">
            <DataGrid>
              <DataRow label="Method" value={PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod} />
              <DataRow label="Status" value={order.paymentStatus} />
              <DataRow label="Reference" value={order.paymentResult?.id} mono />
              <DataRow label="Gateway status" value={order.paymentResult?.status} />
              <DataRow label="Items" value={money(order.itemsPrice)} />
              <DataRow label="Shipping" value={money(order.shippingPrice)} />
              <DataRow label="Tax" value={money(order.taxPrice)} />
              <DataRow label="Trade-in credit" value={order.tradeInValue > 0 ? `−${money(order.tradeInValue)}` : 'None'} />
              <DataRow label="Total paid" value={money(order.totalPrice)} />
              <DataRow label="Paid at" value={order.paidAt ? formatDateTime(order.paidAt) : 'Not paid yet'} />
            </DataGrid>
          </SectionCard>

          {order.tradeIn?.request && (
            <SectionCard
              title="Trade-in applied"
              action={
                <Link to={`/admin/trade-ins/${order.tradeIn.request}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                  Open request
                </Link>
              }
            >
              <DataGrid>
                <DataRow label="Old phone" value={`${order.tradeIn.brand} ${order.tradeIn.model}`} />
                <DataRow label="Credit applied" value={money(order.tradeIn.value)} />
                <DataRow label="Request status" value={order.tradeIn.status} />
                <DataRow label="Refund due" value={order.tradeIn.refundDue > 0 ? money(order.tradeIn.refundDue) : 'None'} />
              </DataGrid>
            </SectionCard>
          )}

          <SectionCard title="Notifications sent">
            <DataGrid>
              <DataRow
                label="WhatsApp"
                value={
                  order.whatsappNotification?.status === 'sent'
                    ? `Sent ${formatDateTime(order.whatsappNotification.sentAt)}`
                    : order.whatsappNotification?.status === 'failed'
                      ? `Failed — ${order.whatsappNotification.error}`
                      : 'Not configured'
                }
              />
              <DataRow
                label="SMS"
                value={
                  order.smsNotification?.status === 'sent'
                    ? `Sent ${formatDateTime(order.smsNotification.sentAt)}`
                    : order.smsNotification?.status === 'failed'
                      ? `Failed — ${order.smsNotification.error}`
                      : 'Not configured'
                }
              />
            </DataGrid>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Customer">
            <div className="flex items-center gap-3">
              <AdminAvatar name={order.user?.name} src={order.user?.avatar} size="lg" />
              <div className="min-w-0">
                <Link to={`/admin/users/${order.user?._id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600 block truncate">
                  {order.user?.name || 'Unknown'}
                </Link>
                <p className="text-xs text-slate-500 truncate">{order.user?.email}</p>
                {order.user?.phone && <p className="text-xs text-slate-500">{order.user.phone}</p>}
              </div>
            </div>
            <Link
              to={`/admin/users/${order.user?._id}`}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
            >
              <FiUser className="w-3.5 h-3.5" />
              View customer
            </Link>
          </SectionCard>

          <SectionCard title="Shipping address">
            <div className="flex gap-3">
              <FiMapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <address className="text-sm text-slate-600 not-italic leading-relaxed">
                <span className="font-semibold text-slate-800">{address.fullName}</span>
                <br />
                {address.street}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.country}
                <br />
                <span className="text-slate-500">{address.phone}</span>
              </address>
            </div>
          </SectionCard>

          <SectionCard title="Status history">
            <ul className="space-y-3">
              {[
                { label: 'Order placed', at: order.createdAt, done: true },
                { label: 'Payment confirmed', at: order.paidAt, done: Boolean(order.paidAt) },
                { label: 'Delivered', at: order.deliveredAt, done: Boolean(order.deliveredAt) },
                { label: 'Cancelled', at: order.cancelledAt, done: isCancelled },
              ].map((step) => (
                <li key={step.label} className="flex items-start gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    <FiCheck className="w-3 h-3" />
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                    <p className="text-[11px] text-slate-400">{step.at ? formatDateTime(step.at) : 'Not yet'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Summary">
            <DataGrid>
              <DataRow label="Items" value={pluralise(order.orderItems?.length || 0, 'line')} />
              <DataRow label="Order status" value={order.orderStatus} />
              <DataRow label="Payment" value={order.paymentStatus} />
            </DataGrid>
          </SectionCard>
        </div>
      </div>

      <AdminConfirmDialog
        open={cancelOpen}
        busy={saving}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => changeStatus('cancelled', cancelReason.trim())}
        title="Cancel this order?"
        confirmLabel="Cancel order"
        message="Cancelling releases the reserved stock and hands any trade-in credit back to the customer. The customer is not notified automatically."
      >
        <input
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason (optional, kept on the record)"
          className="input mt-4"
        />
      </AdminConfirmDialog>
    </>
  )
}
