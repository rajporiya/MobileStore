import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiBriefcase, FiEdit, FiEye, FiPower, FiUserMinus, FiUserPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminPagination from '../../components/admin/ui/AdminPagination'
import AdminFilterBar from '../../components/admin/ui/AdminFilterBar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminSelect from '../../components/admin/ui/AdminSelect'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminAvatar from '../../components/admin/ui/AdminAvatar'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminModal from '../../components/admin/ui/AdminModal'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import { formatDate, errorMessage, pluralise } from '../../utils/adminUtils'

const PER_PAGE = 20
const EMPTY_FILTERS = { search: '', status: '' }
const EMPTY_PROMOTE = { email: '', shopName: '', city: '' }

export default function AdminDealers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
  }))

  const [promoteOpen, setPromoteOpen] = useState(false)
  const [promoteForm, setPromoteForm] = useState(EMPTY_PROMOTE)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ shopName: '', description: '', city: '' })
  const [demoting, setDemoting] = useState(null)
  const [toggling, setToggling] = useState(null)

  const isFiltered = useMemo(
    () => Object.entries(filters).some(([key, value]) => value !== EMPTY_FILTERS[key]),
    [filters]
  )

  useEffect(() => {
    const next = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== EMPTY_FILTERS[key]) next[key] = value
    })
    setSearchParams(next, { replace: true })
  }, [filters, setSearchParams])

  const fetchDealers = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/users/dealers', {
        params: {
          page: targetPage,
          limit: PER_PAGE,
          search: filters.search || undefined,
          status: filters.status || undefined,
        },
      })
      setDealers(data.data || [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(errorMessage(err, 'The dealer list could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDealers(page)
  }, [fetchDealers, page])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handlePromote = async (event) => {
    event.preventDefault()
    if (!promoteForm.email.trim()) {
      toast.error('Enter the email of an existing account')
      return
    }
    setSaving(true)
    try {
      await api.post('/users/dealers', promoteForm)
      toast.success(`${promoteForm.email} is now a dealer`)
      setPromoteOpen(false)
      setPromoteForm(EMPTY_PROMOTE)
      fetchDealers(page)
    } catch (err) {
      toast.error(errorMessage(err, 'The account could not be promoted.'))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (dealer) => {
    setEditing(dealer)
    setEditForm({
      shopName: dealer.dealerInfo?.shopName || '',
      description: dealer.dealerInfo?.description || '',
      city: dealer.dealerInfo?.city || '',
    })
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put(`/users/dealers/${editing._id}`, editForm)
      setDealers((prev) => prev.map((d) => (d._id === data.data._id ? data.data : d)))
      toast.success('Dealer updated')
      setEditing(null)
    } catch (err) {
      toast.error(errorMessage(err, 'The dealer could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (dealer) => {
    setToggling(dealer._id)
    try {
      const { data } = await api.put(`/users/dealers/${dealer._id}`, {
        isActive: !dealer.dealerInfo?.isActive,
      })
      setDealers((prev) => prev.map((d) => (d._id === data.data._id ? data.data : d)))
      toast.success(data.data.dealerInfo?.isActive ? 'Dealer activated' : 'Dealer deactivated')
    } catch (err) {
      toast.error(errorMessage(err, 'The dealer status could not be changed.'))
    } finally {
      setToggling(null)
    }
  }

  const handleDemote = async () => {
    if (!demoting) return
    setSaving(true)
    try {
      await api.put(`/users/dealers/${demoting._id}/demote`)
      toast.success('Dealer demoted to a regular customer')
      setDemoting(null)
      if (dealers.length === 1 && page > 1) setPage(page - 1)
      else fetchDealers(page)
    } catch (err) {
      toast.error(errorMessage(err, 'The dealer could not be demoted.'))
    } finally {
      setSaving(false)
    }
  }

  const activeCount = dealers.filter((d) => d.dealerInfo?.isActive).length

  const columns = [
    { key: 'dealer', label: 'Dealer' },
    { key: 'contact', label: 'Contact' },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status' },
    { key: 'joined', label: 'Joined' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Dealers"
        description={
          loading ? 'Loading dealers…' : `${pluralise(total, 'dealer')} · ${activeCount} active on this page`
        }
        icon={FiBriefcase}
        actions={
          <button onClick={() => setPromoteOpen(true)} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            <FiUserPlus className="w-4 h-4" />
            Add dealer
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard bodyClassName="px-4 py-3.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dealers</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{loading ? '—' : total}</p>
        </SectionCard>
        <SectionCard bodyClassName="px-4 py-3.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active on this page</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{loading ? '—' : activeCount}</p>
        </SectionCard>
      </div>

      <AdminFilterBar
        isFiltered={isFiltered}
        resultCount={total}
        onReset={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
      >
        <AdminSearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search shop, owner, email or city"
          className="grow"
        />
        <AdminSelect
          label="Status"
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          allLabel="Any status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          className="w-full sm:w-44"
        />
      </AdminFilterBar>

      <AdminTable
        columns={columns}
        loading={loading}
        error={error}
        isEmpty={dealers.length === 0}
        onRetry={() => fetchDealers(page)}
        emptyIcon={FiBriefcase}
        emptyTitle={isFiltered ? 'No dealer matches these filters' : 'No dealers yet'}
        emptyDescription={
          isFiltered ? 'Try a different keyword or clear the filters.' : 'Promote an existing account to handle trade-ins.'
        }
        emptyAction={
          !isFiltered && (
            <button onClick={() => setPromoteOpen(true)} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiUserPlus className="w-4 h-4" />
              Add the first dealer
            </button>
          )
        }
        footer={<AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="dealers" />}
      >
        {(keyOf) =>
          dealers.map((dealer) => (
            <tr key={keyOf(dealer)} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AdminAvatar name={dealer.dealerInfo?.shopName || dealer.name} src={dealer.avatar} size="sm" />
                  <div className="min-w-0">
                    <Link
                      to={`/admin/dealers/${dealer._id}`}
                      className="block text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate max-w-[180px]"
                    >
                      {dealer.dealerInfo?.shopName || dealer.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{dealer.name}</p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <p className="text-sm text-slate-700 truncate max-w-[200px]">{dealer.email}</p>
                {dealer.phone && <p className="text-[11px] text-slate-500">{dealer.phone}</p>}
              </td>

              <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                {dealer.dealerInfo?.city || '—'}
              </td>

              <td className="px-4 py-3">
                <AdminStatusBadge
                  value={dealer.dealerInfo?.isActive ? 'active' : 'inactive'}
                  tone={dealer.dealerInfo?.isActive ? 'green' : 'slate'}
                  label={dealer.dealerInfo?.isActive ? 'Active' : 'Inactive'}
                />
              </td>

              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(dealer.createdAt)}</td>

              <td className="px-4 py-3">
                <AdminActionMenu
                  items={[
                    { label: 'View activity', icon: FiEye, onClick: () => navigate(`/admin/dealers/${dealer._id}`) },
                    { label: 'Edit shop details', icon: FiEdit, onClick: () => openEdit(dealer) },
                    {
                      label: dealer.dealerInfo?.isActive ? 'Deactivate' : 'Activate',
                      icon: FiPower,
                      disabled: toggling === dealer._id,
                      onClick: () => handleToggleActive(dealer),
                    },
                    { label: 'Demote to customer', icon: FiUserMinus, danger: true, onClick: () => setDemoting(dealer) },
                  ]}
                />
              </td>
            </tr>
          ))
        }
      </AdminTable>

      <AdminModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promote a customer to dealer"
        description="Dealers handle trade-in requests assigned to them by you."
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setPromoteOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handlePromote} disabled={saving || !promoteForm.email.trim()} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Promoting…' : 'Promote to dealer'}
            </button>
          </>
        }
      >
        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label htmlFor="dealer-email" className="block text-xs font-bold text-slate-600 mb-1.5">
              Account email *
            </label>
            <input
              id="dealer-email"
              type="email"
              value={promoteForm.email}
              onChange={(e) => setPromoteForm({ ...promoteForm, email: e.target.value })}
              className="input"
              placeholder="customer@example.com"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5">The account must already exist in VoltCart.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dealer-shop" className="block text-xs font-bold text-slate-600 mb-1.5">
                Shop name
              </label>
              <input
                id="dealer-shop"
                value={promoteForm.shopName}
                onChange={(e) => setPromoteForm({ ...promoteForm, shopName: e.target.value })}
                className="input"
                placeholder="e.g. Mobile Hub"
              />
            </div>
            <div>
              <label htmlFor="dealer-city" className="block text-xs font-bold text-slate-600 mb-1.5">
                City
              </label>
              <input
                id="dealer-city"
                value={promoteForm.city}
                onChange={(e) => setPromoteForm({ ...promoteForm, city: e.target.value })}
                className="input"
                placeholder="e.g. Mumbai"
              />
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.dealerInfo?.shopName || editing?.name || 'dealer'}`}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleUpdate} disabled={saving} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="edit-shop" className="block text-xs font-bold text-slate-600 mb-1.5">
              Shop name
            </label>
            <input
              id="edit-shop"
              value={editForm.shopName}
              onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="edit-city" className="block text-xs font-bold text-slate-600 mb-1.5">
              City
            </label>
            <input
              id="edit-city"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-xs font-bold text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input resize-none"
            />
          </div>
        </form>
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(demoting)}
        busy={saving}
        onClose={() => setDemoting(null)}
        onConfirm={handleDemote}
        title="Demote this dealer?"
        confirmLabel="Demote to customer"
        message={
          demoting
            ? `${demoting.dealerInfo?.shopName || demoting.name} will become a regular customer and lose access to the dealer panel. Their past trade-ins stay on record.`
            : ''
        }
      />
    </>
  )
}
