import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCreditCard, FiInbox, FiRefreshCw } from 'react-icons/fi'

import { useDispatch, useSelector } from 'react-redux'
import { fetchPayments } from '../../store/slices/adminSlice'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminFilterBar from '../../components/admin/ui/AdminFilterBar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminDateRange from '../../components/admin/ui/AdminDateRange'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import {
  money,
  formatDate,
  errorMessage,
  pluralise,
  shortId,
  toDateInput,
  titleCase,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_TONE,
} from '../../utils/adminUtils'

const PER_PAGE = 20
const EMPTY_FILTERS = { search: '', status: '', method: '', from: '', to: '' }
const methodLabel = (method) => PAYMENT_METHOD_LABELS[method] || titleCase(method)

export default function AdminPayments() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { payments, paymentsLoading, paymentsError } = useSelector((state) => state.admin)

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    method: searchParams.get('method') || '',
    from: toDateInput(searchParams.get('dateFrom')),
    to: toDateInput(searchParams.get('dateTo')),
  }))

  const isFiltered = useMemo(
    () => Object.entries(filters).some(([key, value]) => value !== EMPTY_FILTERS[key]),
    [filters]
  )

  useEffect(() => {
    const next = page > 1 ? { page } : {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== EMPTY_FILTERS[key]) next[key] = value
    })
    setSearchParams(next, { replace: true })
  }, [filters, page, setSearchParams])

  useEffect(() => {
    dispatch(
      fetchPayments({
        page,
        limit: PER_PAGE,
        search: filters.search || undefined,
        status: filters.status || undefined,
        method: filters.method || undefined,
        dateFrom: filters.from || undefined,
        dateTo: filters.to || undefined,
      })
    )
  }, [dispatch, filters, page])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const columns = [
    { key: 'order', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount' },
    { key: 'reference', label: 'Reference' },
    { key: 'date', label: 'Paid / placed' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="Every payment on the platform, read from the orders that carry it"
        icon={FiCreditCard}
        actions={
          <button
            onClick={() =>
              dispatch(
                fetchPayments({
                  page,
                  limit: PER_PAGE,
                  search: filters.search || undefined,
                  status: filters.status || undefined,
                  method: filters.method || undefined,
                  dateFrom: filters.from || undefined,
                  dateTo: filters.to || undefined,
                })
              )
            }
            className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${paymentsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <SectionCard bodyClassName="px-4 py-3.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collected (all time)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{money(payments.collected)}</p>
        </SectionCard>
        {PAYMENT_STATUSES.map((status) => (
          <SectionCard key={status} bodyClassName="px-4 py-3.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{titleCase(status)}</p>
            <div className="mt-1.5">
              <AdminStatusBadge value={status} tone={PAYMENT_TONE[status]} label={payments.byStatus?.[status] ?? 0} dot={false} />
            </div>
          </SectionCard>
        ))}
      </div>

      <AdminFilterBar
        isFiltered={isFiltered}
        resultCount={payments.total}
        onReset={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
      >
        <AdminSearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search order reference, gateway id or customer"
          className="grow"
        />
        <AdminSelect
          label="Payment status"
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          allLabel="All statuses"
          options={PAYMENT_STATUSES}
          className="w-full sm:w-44"
        />
        <AdminSelect
          label="Method"
          value={filters.method}
          onChange={(value) => setFilter('method', value)}
          allLabel="All methods"
          options={PAYMENT_METHODS.map((method) => ({ value: method, label: methodLabel(method) }))}
          className="w-full sm:w-44"
        />
        <AdminDateRange
          label="Between"
          from={filters.from}
          to={filters.to}
          onChange={({ from, to }) => {
            setFilters((prev) => ({ ...prev, from, to }))
            setPage(1)
          }}
          className="w-full sm:w-72"
        />
      </AdminFilterBar>

      <AdminTable
        columns={columns}
        loading={paymentsLoading}
        error={paymentsError}
        isEmpty={payments.items.length === 0}
        onRetry={() => dispatch(fetchPayments({ page, limit: PER_PAGE }))}
        emptyIcon={FiInbox}
        emptyTitle={isFiltered ? 'No payment matches these filters' : 'No payments recorded yet'}
        emptyDescription={
          isFiltered ? 'Try a different reference or clear the filters.' : 'Payments appear here as soon as an order is placed.'
        }
        emptyAction={
          isFiltered && (
            <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }} className="btn-secondary !px-4 !py-2 text-sm">
              Reset filters
            </button>
          )
        }
        footer={
          <AdminPagination
            page={payments.page}
            pages={payments.pages}
            total={payments.total}
            onChange={setPage}
            itemLabel="payments"
          />
        }
      >
        {(keyOf) =>
          payments.items.map((payment) => (
            <tr key={keyOf(payment)} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link to={`/admin/orders/${payment._id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600">
                  #{shortId(payment._id)}
                </Link>
                {payment.tradeInValue > 0 && (
                  <p className="text-[11px] text-violet-600 font-semibold">Trade-in −{money(payment.tradeInValue)}</p>
                )}
              </td>

              <td className="px-4 py-3">
                <p className="text-sm text-slate-700 truncate max-w-[180px]">{payment.user?.name || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{payment.user?.email}</p>
              </td>

              <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                {methodLabel(payment.paymentMethod)}
              </td>

              <td className="px-4 py-3">
                <AdminStatusBadge value={payment.paymentStatus} tone={PAYMENT_TONE[payment.paymentStatus]} />
              </td>

              <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                {money(payment.totalPrice)}
              </td>

              <td className="px-4 py-3">
                <p className="font-mono text-[11px] text-slate-500 truncate max-w-[160px]">
                  {payment.paymentResult?.id || '—'}
                </p>
                {payment.paymentResult?.status && (
                  <p className="text-[11px] text-slate-400">{payment.paymentResult.status}</p>
                )}
              </td>

              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {formatDate(payment.paidAt || payment.createdAt)}
              </td>
            </tr>
          ))
        }
      </AdminTable>

      <p className="mt-3 text-xs text-slate-400 text-center">
        {Object.entries(payments.byMethod || {})
          .map(([method, count]) => `${methodLabel(method)}: ${pluralise(count, 'order')}`)
          .join(' · ') || 'No payment methods recorded yet.'}
      </p>

      {paymentsError && (
        <p className="mt-2 text-xs text-red-500 text-center">{errorMessage({ message: paymentsError })}</p>
      )}
    </>
  )
}
