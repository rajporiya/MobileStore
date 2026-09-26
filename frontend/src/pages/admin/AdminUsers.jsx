import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiEye, FiLock, FiSearch, FiTrash2, FiUnlock, FiUsers } from 'react-icons/fi'
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
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import { formatDate, errorMessage, pluralise, ROLE_TONE } from '../../utils/adminUtils'

const PER_PAGE = 20
const EMPTY_FILTERS = { search: '', role: 'user', status: '' }

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [suspending, setSuspending] = useState(null)
  const [suspendBusy, setSuspendBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    role: searchParams.get('role') || 'user',
    status: searchParams.get('status') || '',
  }))

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

  const fetchUsers = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/users', {
        params: {
          page: targetPage,
          limit: PER_PAGE,
          search: filters.search || undefined,
          role: filters.role || undefined,
          status: filters.status || undefined,
        },
      })
      setUsers(data.data || [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(errorMessage(err, 'The user list could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers(page)
  }, [fetchUsers, page])

  useEffect(() => {
    api
      .get('/users/stats')
      .then(({ data }) => setStats(data.data || data))
      .catch(() => setStats(null))
  }, [])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleStatusChange = async () => {
    if (!suspending) return
    setSuspendBusy(true)
    try {
      const { data } = await api.put(`/users/${suspending._id}/status`, {
        isActive: suspending.isActive === false,
      })
      setUsers((prev) => prev.map((u) => (u._id === data.data._id ? data.data : u)))
      toast.success(data.message)
      setSuspending(null)
    } catch (err) {
      toast.error(errorMessage(err, 'The account status could not be changed.'))
    } finally {
      setSuspendBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.delete(`/users/${deleting._id}`)
      toast.success('Account deleted')
      setDeleting(null)
      if (users.length === 1 && page > 1) setPage(page - 1)
      else fetchUsers(page)
    } catch (err) {
      toast.error(errorMessage(err, 'The account could not be deleted.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns = [
    { key: 'user', label: 'User' },
    { key: 'contact', label: 'Contact' },
    { key: 'role', label: 'Role' },
    { key: 'account', label: 'Account' },
    { key: 'joined', label: 'Joined' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Users"
        description={loading ? 'Loading accounts…' : `${pluralise(total, 'account')} match the current view`}
        icon={FiUsers}
        actions={
          <Link to="/admin/dealers" className="btn-secondary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            Manage dealers
          </Link>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Customers', value: stats?.totalUsers ?? '—' },
          { label: 'Active', value: stats?.activeUsers ?? '—' },
          { label: 'Suspended', value: stats?.suspendedUsers ?? '—' },
          { label: 'Dealers', value: stats?.totalDealers ?? '—' },
        ].map((stat) => (
          <SectionCard key={stat.label} bodyClassName="px-4 py-3.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </SectionCard>
        ))}
      </div>

      <AdminFilterBar
        isFiltered={isFiltered}
        resultCount={total}
        onReset={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
      >
        <AdminSearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search name, email or phone"
          className="grow"
        />
        <AdminSelect
          label="Role"
          value={filters.role}
          onChange={(value) => setFilter('role', value)}
          allLabel="All roles"
          options={[
            { value: 'user', label: 'Customers' },
            { value: 'dealer', label: 'Dealers' },
            { value: 'admin', label: 'Admins' },
          ]}
          className="w-full sm:w-44"
        />
        <AdminSelect
          label="Account status"
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          allLabel="Any status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          className="w-full sm:w-44"
        />
      </AdminFilterBar>

      <AdminTable
        columns={columns}
        loading={loading}
        error={error}
        isEmpty={users.length === 0}
        onRetry={() => fetchUsers(page)}
        emptyIcon={FiSearch}
        emptyTitle={isFiltered ? 'No account matches these filters' : 'No accounts yet'}
        emptyDescription={isFiltered ? 'Try a different keyword or clear the filters.' : 'Customer sign-ups will appear here.'}
        emptyAction={
          isFiltered && (
            <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }} className="btn-secondary !px-4 !py-2 text-sm">
              Reset filters
            </button>
          )
        }
        footer={<AdminPagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="accounts" />}
      >
        {(keyOf) =>
          users.map((user) => {
            const isActive = user.isActive !== false
            return (
              <tr key={keyOf(user)} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AdminAvatar name={user.name} src={user.avatar} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="block text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate max-w-[180px]"
                      >
                        {user.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">{user.wishlist?.length ? `${pluralise(user.wishlist.length, 'wishlist item')}` : 'No wishlist'}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="text-sm text-slate-700 truncate max-w-[200px]">{user.email}</p>
                  {user.phone && <p className="text-[11px] text-slate-500">{user.phone}</p>}
                </td>

                <td className="px-4 py-3">
                  <AdminStatusBadge value={user.role} tone={ROLE_TONE[user.role]} dot={false} />
                </td>

                <td className="px-4 py-3">
                  <AdminStatusBadge
                    value={isActive ? 'active' : 'suspended'}
                    tone={isActive ? 'green' : 'red'}
                    label={isActive ? 'Active' : 'Suspended'}
                  />
                </td>

                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>

                <td className="px-4 py-3">
                  <AdminActionMenu
                    items={[
                      { label: 'View details', icon: FiEye, onClick: () => navigate(`/admin/users/${user._id}`) },
                      {
                        label: isActive ? 'Suspend account' : 'Restore account',
                        icon: isActive ? FiLock : FiUnlock,
                        danger: isActive,
                        onClick: () => setSuspending(user),
                      },
                      { label: 'Delete account', icon: FiTrash2, danger: true, onClick: () => setDeleting(user) },
                    ]}
                  />
                </td>
              </tr>
            )
          })
        }
      </AdminTable>

      <AdminConfirmDialog
        open={Boolean(suspending)}
        busy={suspendBusy}
        onClose={() => setSuspending(null)}
        onConfirm={handleStatusChange}
        title={suspending?.isActive === false ? 'Restore this account?' : 'Suspend this account?'}
        confirmLabel={suspending?.isActive === false ? 'Restore account' : 'Suspend account'}
        message={
          suspending?.isActive === false
            ? `${suspending?.name} will be able to sign in again immediately.`
            : `${suspending?.name} will be blocked from signing in. Existing sessions stay signed out on their next request.`
        }
      />

      <AdminConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this account?"
        confirmLabel="Delete account"
        message={
          deleting
            ? `${deleting.name} and their saved addresses will be removed. Their past orders are kept for your records, but the account can no longer sign in.`
            : ''
        }
      />
    </>
  )
}
