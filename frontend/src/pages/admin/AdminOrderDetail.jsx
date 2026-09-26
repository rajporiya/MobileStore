import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiChevronRight,
  FiFileText,
  FiMapPin,
  FiPhone,
  FiPrinter,
  FiRefreshCw,
  FiTruck,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import { ADMIN_BUTTONS, ADMIN_INPUT, cx } from '../../components/admin/adminTheme'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard, DataGrid, DataRow } from '../../components/admin/ui/AdminPanels'
import { AdminPanelSkeleton, AdminListSkeleton } from '../../components/admin/ui/AdminSkeletons'
import { AdminErrorState } from '../../components/admin/ui/AdminEmptyState'
import AdminTimeline from '../../components/admin/ui/AdminTimeline'
import {
  money,
  formatDate,
  formatDateTime,
  errorMessage,
  shortId,
  ORDER_STATUSES,
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

const NOTIFICATION_TONE = { sent: 'green', failed: 'red', not_configured: 'slate' }

const NOTIFICATION_LABEL = {
  sent: 'Sent',
  failed: 'Failed',
  not_configured: 'Not configured',
}

const notificationText = (notification) => {
  if (!notification || !notification.status) return 'Not configured'
  if (notification.status === 'sent') {
    return notification.sentAt ? `Sent ${formatDateTime(notification.sentAt)}` : 'Sent'
  }
  if (notification.status === 'failed') {
    return notification.error ? `Failed — ${notification.error}` : 'Failed'
  }
  return 'Not configured'
}

const iconButton =
  'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/orders/${id}`)
      setOrder(data.data)
    } catch (err) {
      setOrder(null)
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

  const handleMark = (nextStatus) => {
    // Shipping and handing over are the two states the customer is told about,
    // so those are the ones worth a deliberate confirmation.
    if (nextStatus === 'shipped' || nextStatus === 'delivered') {
      if (!window.confirm(`Mark this order as ${nextStatus}?`)) return
    }
    changeStatus(nextStatus)
  }

  const handleRestore = () => {
    if (!window.confirm('Restore this order to processing?')) return
    changeStatus('processing')
  }

  const timeline = useMemo(() => {
    if (!order) return []
    const stages = [
      { label: 'Order placed', meta: null, time: order.createdAt, done: true },
      { label: 'Payment confirmed', meta: null, time: order.paidAt, done: Boolean(order.paidAt) },
      { label: 'Processing', meta: null, time: null, done: ['processing', 'confirmed', 'shipped', 'delivered'].includes(order.orderStatus) },
      { label: 'Shipped', meta: null, time: null, done: ['shipped', 'delivered'].includes(order.orderStatus) },
      { label: 'Delivered', meta: null, time: order.deliveredAt, done: order.orderStatus === 'delivered' },
    ]
    if (order.orderStatus === 'cancelled') {
      stages.push({
        label: 'Cancelled',
        meta: order.cancelReason || null,
        time: order.cancelledAt,
        done: Boolean(order.cancelledAt),
      })
    }
    return stages
  }, [order])

  if (loading) {
    return (
      <>
        <Link
          to="/admin/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to orders
        </Link>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AdminPanelSkeleton className="h-64" />
            <AdminPanelSkeleton className="h-56" />
            <div className="rounded-xl border border-slate-200 bg-white">
              <AdminListSkeleton rows={3} />
            </div>
          </div>
          <div className="space-y-4">
            <AdminPanelSkeleton className="h-48" />
            <AdminPanelSkeleton className="h-32" />
          </div>
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <Link
          to="/admin/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to orders
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white">
          <AdminErrorState message={error || 'Check the link, or the order may have been removed.'} onRetry={load} />
        </div>
      </>
    )
  }

  const nextStatus = NEXT_STATUS[order.orderStatus]
  const isCancelled = order.orderStatus === 'cancelled'
  const address = order.shippingAddress || {}
  const items = order.orderItems || []
  const customerName = order.user?.name || 'Guest'
  const tradeIn = order.tradeIn || {}
  const hasTradeIn = order.tradeInValue > 0 || Boolean(tradeIn.request)
  const itemColumns = [
    { key: 'item', label: 'Item' },
    { key: 'price', label: 'Unit price' },
    { key: 'quantity', label: 'Qty' },
    { key: 'total', label: 'Line total', className: 'text-right' },
  ]

  const priceRows = [
    { key: 'items', label: 'Items', value: money(order.itemsPrice) },
    { key: 'shipping', label: 'Shipping', value: money(order.shippingPrice) },
    { key: 'tax', label: 'Tax', value: money(order.taxPrice) },
  ]
  if (order.tradeInValue > 0) {
    priceRows.push({ key: 'tradeIn', label: 'Trade-in credit', value: `−${money(order.tradeInValue)}`, tone: 'emerald' })
  }

  return (
    <>
      <Link
        to="/admin/orders"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <FiArrowLeft className="h-3.5 w-3.5" />
        Back to orders
      </Link>

      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Order</p>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">#{shortId(order._id)}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
          <AdminStatusBadge value={order.paymentStatus} tone={PAYMENT_TONE[order.paymentStatus]} />
          <AdminStatusBadge
            value={order.paymentMethod}
            tone="slate"
            label={PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            dot={false}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Order Items"
            subtitle={items.length ? `${items.length} line ${items.length === 1 ? 'item' : 'items'}` : undefined}
            bodyClassName=""
          >
            <AdminTable
              columns={itemColumns}
              isEmpty={items.length === 0}
              emptyIcon={FiFileText}
              emptyTitle="No line items"
              emptyDescription="This order has no products attached to it."
              minWidth="min-w-[560px]"
              stickyHeader={false}
              rowKey={(row) => row._id || row.product?._id || row.title}
              footer={
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-500">Items total</span>
                  <span className="text-[13px] font-bold tabular-nums text-slate-900">{money(order.itemsPrice)}</span>
                </div>
              }
            >
              {(keyOf) =>
                items.map((item) => (
                  <tr
                    key={keyOf(item)}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 align-middle text-[13px] text-slate-600">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <FiFileText className="h-4 w-4 text-slate-300" aria-hidden="true" />
                          )}
                        </span>
                        <p className="min-w-0 max-w-[300px] truncate text-[13px] font-medium text-slate-800">
                          {item.title}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-middle text-[13px] tabular-nums text-slate-600">
                      {money(item.price)}
                    </td>
                    <td className="px-4 py-3 align-middle text-[13px] tabular-nums text-slate-600">{item.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-middle text-[13px] font-semibold tabular-nums text-slate-900">
                      {money(item.price * item.quantity)}
                    </td>
                  </tr>
                ))
              }
            </AdminTable>
          </SectionCard>

          <SectionCard title="Price Summary">
            <dl className="divide-y divide-slate-100">
              {priceRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <dt className="text-[13px] text-slate-500">{row.label}</dt>
                  <dd
                    className={cx(
                      'text-[13px] font-semibold tabular-nums',
                      row.tone === 'emerald' ? 'text-emerald-600' : 'text-slate-800'
                    )}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="text-[13px] font-semibold text-slate-900">Total</span>
              <span className="text-[17px] font-bold tabular-nums text-slate-900">{money(order.totalPrice)}</span>
            </div>
          </SectionCard>

          {hasTradeIn && (
            <SectionCard
              title="Trade-in applied"
              subtitle={[tradeIn.brand, tradeIn.model].filter(Boolean).join(' ') || undefined}
              action={
                tradeIn.request && (
                  <Link
                    to={`/admin/trade-ins/${tradeIn.request}`}
                    className="text-[12px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    Open request
                  </Link>
                )
              }
            >
              <DataGrid>
                <DataRow label="Old phone" value={[tradeIn.brand, tradeIn.model].filter(Boolean).join(' ')} />
                <DataRow label="Credit applied" value={money(tradeIn.value)} />
                <DataRow label="Request status" value={tradeIn.status} />
                <DataRow label="Refund due" value={tradeIn.refundDue > 0 ? money(tradeIn.refundDue) : 'None'} />
              </DataGrid>
            </SectionCard>
          )}

          <SectionCard title="Customer Information">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <AdminAvatar name={customerName} src={order.user?.avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/admin/users/${order.user?._id}`}
                  className="block truncate text-[15px] font-bold text-slate-900 transition-colors hover:text-indigo-600"
                >
                  {customerName}
                </Link>
                <p className="truncate text-[13px] text-slate-500">{order.user?.email || '—'}</p>
                {order.user?.phone && (
                  <p className="mt-0.5 text-[13px] text-slate-500">{order.user.phone}</p>
                )}
              </div>
              {order.user?._id && (
                <Link to={`/admin/users/${order.user._id}`} className={cx(ADMIN_BUTTONS.secondary, 'shrink-0')}>
                  View customer
                </Link>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Shipping Information">
            <DataGrid>
              <DataRow label="Full name" value={address.fullName} icon={FiMapPin} />
              <DataRow label="Phone" value={address.phone} icon={FiPhone} />
              <DataRow label="Street" value={address.street} wide />
              <DataRow label="City" value={address.city} />
              <DataRow label="State" value={address.state} />
              <DataRow label="Pincode" value={address.pincode} />
              <DataRow label="Country" value={address.country} />
            </DataGrid>
          </SectionCard>

          <SectionCard title="Payment Information">
            <DataGrid>
              <DataRow label="Method" value={PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod} />
              <DataRow
                label="Status"
                value={
                  <AdminStatusBadge
                    value={order.paymentStatus}
                    tone={PAYMENT_TONE[order.paymentStatus]}
                    size="xs"
                  />
                }
              />
              <DataRow label="Transaction id" value={order.paymentResult?.id} mono wide />
              <DataRow label="Gateway status" value={order.paymentResult?.status} />
              <DataRow label="Paid at" value={formatDateTime(order.paidAt)} />
            </DataGrid>
          </SectionCard>

          <SectionCard title="Order Timeline" bodyClassName="p-4 sm:p-5">
            <AdminTimeline
              steps={timeline.map((step) => ({
                label: step.label,
                meta: step.meta,
                time: step.time ? formatDate(step.time) : undefined,
                done: step.done,
                current: order.orderStatus === step.label.toLowerCase(),
              }))}
            />
          </SectionCard>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <SectionCard title="Order Status">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current</span>
                <AdminStatusBadge value={order.orderStatus} tone={ORDER_TONE[order.orderStatus]} />
              </div>

              {!isCancelled && nextStatus && (
                <button type="button" onClick={() => handleMark(nextStatus)} disabled={saving} className={ADMIN_BUTTONS.primary}>
                  <FiTruck className="h-4 w-4" />
                  Mark {nextStatus}
                </button>
              )}

              {!isCancelled && (
                <button type="button" onClick={() => setCancelOpen(true)} disabled={saving} className={ADMIN_BUTTONS.dangerGhost}>
                  Cancel order
                </button>
              )}

              {isCancelled && (
                <button type="button" onClick={handleRestore} disabled={saving} className={ADMIN_BUTTONS.secondary}>
                  <FiRefreshCw className="h-4 w-4" />
                  Restore order
                </button>
              )}

              {isCancelled && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">Cancel reason</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-red-700">
                    {order.cancelReason || 'No reason recorded.'}
                  </p>
                  <p className="mt-1 text-[11px] text-red-500">Cancelled {formatDateTime(order.cancelledAt)}</p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Payment Status">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</span>
                <AdminStatusBadge value={order.paymentStatus} tone={PAYMENT_TONE[order.paymentStatus]} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Method</span>
                <span className="text-[13px] font-semibold text-slate-800">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Paid at</span>
                <span className="text-[13px] text-slate-600">{formatDateTime(order.paidAt)}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Notifications">
            <div className="flex flex-col gap-3">
              {[
                { label: 'WhatsApp', notification: order.whatsappNotification },
                { label: 'SMS', notification: order.smsNotification },
              ].map((channel) => (
                <div key={channel.label} className="flex items-start justify-between gap-3">
                  <span className="text-[13px] text-slate-500">{channel.label}</span>
                  <div className="min-w-0 text-right">
                    <AdminStatusBadge
                      value={channel.notification?.status}
                      tone={NOTIFICATION_TONE[channel.notification?.status] || 'slate'}
                      label={NOTIFICATION_LABEL[channel.notification?.status] || channel.notification?.status}
                      size="xs"
                    />
                    <p className="mt-0.5 break-words text-[11px] text-slate-500">
                      {notificationText(channel.notification)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Actions">
            <div className="flex flex-col gap-2">
              <Link
                to="/admin/orders"
                className="inline-flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Back to orders
                <FiChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              {order.user?._id && (
                <Link
                  to={`/admin/users/${order.user._id}`}
                  className="inline-flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  View customer
                  <FiChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-400">
                <FiPrinter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Use your browser print command to save a copy of this order.
              </p>
            </div>
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
          className={cx(ADMIN_INPUT, 'mt-4')}
        />
      </AdminConfirmDialog>
    </>
  )
}
