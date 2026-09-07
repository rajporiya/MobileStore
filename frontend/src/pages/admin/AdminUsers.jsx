import { useEffect, useState } from 'react'
import { FiTrash2, FiUser, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useSelector } from 'react-redux'

export default function AdminUsers() {
  const { userInfo } = useSelector((s) => s.auth)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data || [])
    } catch { toast.error('Failed to load users') }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id) => {
    if (id === userInfo?._id) { toast.error("You can't delete your own account"); return }
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('User deleted')
      fetchUsers()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-brown-dark">Users</h1>
        <span className="badge badge-brown">{users.length}</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-brown font-semibold text-xs">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-stone-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 badge badge-brown">
                        <FiShield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 badge badge-blue">
                        <FiUser className="w-3 h-3" /> User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(u._id)}
                      disabled={u._id === userInfo?._id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u._id === userInfo?._id ? "Can't delete yourself" : 'Delete user'}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
