import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPackage, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable from '../../components/admin/ui/AdminTable'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminModal from '../../components/admin/ui/AdminModal'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { SectionCard } from '../../components/admin/ui/AdminPanels'
import { formatDate, errorMessage, pluralise } from '../../utils/adminUtils'

const EMPTY_FORM = { name: '', icon: '', description: '', isActive: true }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const fetchCategories = useCallback(async (term) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/categories/all', { params: { search: term || undefined } })
      setCategories(data.data || [])
    } catch (err) {
      setError(errorMessage(err, 'Categories could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories(search)
  }, [fetchCategories, search])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setForm({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      isActive: category.isActive,
    })
    setEditId(category._id)
    setModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, form)
        toast.success('Category updated')
      } else {
        await api.post('/categories', form)
        toast.success('Category created')
      }
      setModalOpen(false)
      fetchCategories(search)
    } catch (err) {
      toast.error(errorMessage(err, 'The category could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.delete(`/categories/${deleting._id}`)
      toast.success('Category deleted')
      setDeleting(null)
      fetchCategories(search)
    } catch (err) {
      toast.error(errorMessage(err, 'The category could not be deleted.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const totalPhones = categories.reduce((sum, category) => sum + (category.productCount || 0), 0)

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'slug', label: 'Slug' },
    { key: 'products', label: 'Products' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description={
          loading ? 'Loading categories…' : `${pluralise(categories.length, 'category')} · ${pluralise(totalPhones, 'phone')} catalogued`
        }
        icon={FiTag}
        actions={
          <button onClick={openAdd} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Add category
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-1">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Search categories" />
        </div>
        <div className="lg:col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: 'Categories', value: categories.length },
            { label: 'Phones', value: totalPhones },
            {
              label: 'Hidden',
              value: categories.filter((c) => !c.isActive).length,
            },
          ].map((stat) => (
            <SectionCard key={stat.label} bodyClassName="px-4 py-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </SectionCard>
          ))}
        </div>
      </div>

      <AdminTable
        columns={columns}
        loading={loading}
        error={error}
        isEmpty={categories.length === 0}
        onRetry={() => fetchCategories(search)}
        emptyIcon={FiTag}
        emptyTitle={search ? 'No category matches your search' : 'No categories yet'}
        emptyDescription={search ? 'Try a different keyword.' : 'Create a category so phones can be grouped.'}
        emptyAction={
          !search && (
            <button onClick={openAdd} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Add category
            </button>
          )
        }
      >
        {(keyOf) =>
          categories.map((category) => (
            <tr key={keyOf(category)} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                    {category.icon || '📦'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{category.name}</p>
                    {category.description && (
                      <p className="text-[11px] text-slate-500 truncate max-w-[260px]">{category.description}</p>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 font-mono text-xs text-slate-500">{category.slug}</td>

              <td className="px-4 py-3 whitespace-nowrap">
                {category.productCount > 0 ? (
                  <Link
                    to={`/admin/products?category=${category._id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    <FiPackage className="w-3.5 h-3.5" />
                    {pluralise(category.productCount, 'phone')}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">None</span>
                )}
              </td>

              <td className="px-4 py-3">
                <AdminStatusBadge
                  value={category.isActive ? 'active' : 'hidden'}
                  tone={category.isActive ? 'green' : 'slate'}
                  label={category.isActive ? 'Visible' : 'Hidden'}
                />
              </td>

              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(category.createdAt)}</td>

              <td className="px-4 py-3">
                <AdminActionMenu
                  items={[
                    { label: 'Edit', icon: FiEdit, onClick: () => openEdit(category) },
                    {
                      label: category.productCount > 0 ? 'Delete (has phones)' : 'Delete',
                      icon: FiTrash2,
                      danger: true,
                      disabled: category.productCount > 0,
                      onClick: () => setDeleting(category),
                    },
                  ]}
                />
              </td>
            </tr>
          ))
        }
      </AdminTable>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit category' : 'Add category'}
        description={editId ? 'Rename it or change how it appears in the storefront.' : 'Categories group phones in the storefront navigation.'}
        footer={
          <>
            <button type="button" className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary !px-4 !py-2 text-sm inline-flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="block text-xs font-bold text-slate-600 mb-1.5">
              Category name *
            </label>
            <input
              id="category-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="e.g. Flagship"
              required
            />
          </div>

          <div>
            <label htmlFor="category-icon" className="block text-xs font-bold text-slate-600 mb-1.5">
              Icon
            </label>
            <input
              id="category-icon"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="input"
              placeholder="Any emoji, e.g. 🚀"
              maxLength={8}
            />
          </div>

          <div>
            <label htmlFor="category-description" className="block text-xs font-bold text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
              placeholder="Shown to customers browsing this category"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Visible in the storefront</span>
          </label>
        </form>
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this category?"
        confirmLabel="Delete category"
        message={
          deleting
            ? `"${deleting.name}" will be removed. Categories that still hold phones cannot be deleted — move or delete those phones first.`
            : ''
        }
      />
    </>
  )
}
