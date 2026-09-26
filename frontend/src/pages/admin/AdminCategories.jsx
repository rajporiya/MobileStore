import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

import api from '../../services/api'
import { ADMIN_BUTTONS, ADMIN_INPUT, ADMIN_LABEL } from '../../components/admin/adminTheme'
import AdminPageHeader from '../../components/admin/ui/AdminPageHeader'
import AdminTable, { Td } from '../../components/admin/ui/AdminTable'
import AdminTableToolbar from '../../components/admin/ui/AdminTableToolbar'
import AdminSearchInput from '../../components/admin/ui/AdminSearchInput'
import AdminStatusBadge from '../../components/admin/ui/AdminStatusBadge'
import AdminActionMenu from '../../components/admin/ui/AdminActionMenu'
import AdminModal from '../../components/admin/ui/AdminModal'
import AdminConfirmDialog from '../../components/admin/ui/AdminConfirmDialog'
import { formatDate, errorMessage, pluralise } from '../../utils/adminUtils'

const EMPTY_FORM = { name: '', icon: '', description: '', isActive: true }

const ROW = 'border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70'

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

  const catalogued = categories.reduce((sum, category) => sum + (category.productCount || 0), 0)

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'products', label: 'Products', className: 'text-right' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
    { key: 'updated', label: 'Updated' },
    { key: 'actions', label: '', className: 'w-12' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Categories"
        eyebrow="Catalog"
        description="Manage product categories"
        meta={
          <span className="text-[12px] text-slate-500">
            {loading
              ? 'Loading categories…'
              : `${pluralise(categories.length, 'category')} · ${pluralise(catalogued, 'product')} catalogued`}
          </span>
        }
        actions={
          <button type="button" className={ADMIN_BUTTONS.primary} onClick={openAdd}>
            <FiPlus className="h-4 w-4" aria-hidden="true" />
            Add Category
          </button>
        }
      />

      <AdminTableToolbar
        isFiltered={Boolean(search)}
        resultCount={categories.length}
        resultLabel="matching"
        onReset={() => setSearch('')}
        className="mb-4"
      >
        <AdminSearchInput
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Category name or description"
          className="grow sm:max-w-md"
        />
      </AdminTableToolbar>

      <AdminTable
        columns={columns}
        minWidth="min-w-[860px]"
        loading={loading}
        error={error}
        isEmpty={categories.length === 0}
        onRetry={() => fetchCategories(search)}
        emptyIcon={FiTag}
        emptyTitle={search ? 'No category matches your search' : 'No categories yet'}
        emptyDescription={search ? 'Try a different keyword.' : 'Create a category so products can be grouped.'}
        emptyAction={
          search ? (
            <button type="button" className={ADMIN_BUTTONS.secondary} onClick={() => setSearch('')}>
              Reset search
            </button>
          ) : (
            <button type="button" className={ADMIN_BUTTONS.primary} onClick={openAdd}>
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              Add Category
            </button>
          )
        }
      >
        {(keyOf) =>
          categories.map((category) => (
            <tr key={keyOf(category)} className={ROW}>
              <Td>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base"
                  >
                    {category.icon || '📦'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{category.name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">{category.description || '—'}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{category.slug}</p>
                  </div>
                </div>
              </Td>

              <Td className="whitespace-nowrap text-right">
                {category.productCount > 0 ? (
                  <Link
                    to={`/admin/products?category=${category._id}`}
                    className="font-semibold text-indigo-600 tabular-nums transition-colors hover:text-indigo-700 hover:underline"
                  >
                    {category.productCount}
                  </Link>
                ) : (
                  <span className="text-slate-400 tabular-nums">0</span>
                )}
              </Td>

              <Td>
                <AdminStatusBadge
                  value={category.isActive ? 'active' : 'inactive'}
                  tone={category.isActive ? 'green' : 'slate'}
                  label={category.isActive ? 'Active' : 'Inactive'}
                />
              </Td>

              <Td className="whitespace-nowrap text-[12px] text-slate-500">{formatDate(category.createdAt)}</Td>

              <Td className="whitespace-nowrap text-[12px] text-slate-500">{formatDate(category.updatedAt)}</Td>

              <Td>
                <AdminActionMenu
                  label={`Actions for ${category.name}`}
                  items={[
                    { label: 'Edit', icon: FiEdit, onClick: () => openEdit(category) },
                    {
                      label: category.productCount > 0 ? 'Delete (has products)' : 'Delete',
                      icon: FiTrash2,
                      danger: true,
                      disabled: category.productCount > 0,
                      onClick: () => setDeleting(category),
                    },
                  ]}
                />
              </Td>
            </tr>
          ))
        }
      </AdminTable>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit category' : 'Add category'}
        description={
          editId
            ? 'Rename it or change how it appears in the storefront.'
            : 'Categories group products in the storefront navigation.'
        }
        footer={
          <>
            <button type="button" className={ADMIN_BUTTONS.secondary} onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={ADMIN_BUTTONS.primary}
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="category-name" className={ADMIN_LABEL}>
              Category name *
            </label>
            <input
              id="category-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${ADMIN_INPUT} mt-1.5`}
              placeholder="e.g. Flagship"
              required
            />
          </div>

          <div>
            <label htmlFor="category-icon" className={ADMIN_LABEL}>
              Icon
            </label>
            <input
              id="category-icon"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className={`${ADMIN_INPUT} mt-1.5`}
              placeholder="Any emoji, e.g. 🚀"
              maxLength={8}
            />
          </div>

          <div>
            <label htmlFor="category-description" className={ADMIN_LABEL}>
              Description
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${ADMIN_INPUT} mt-1.5 resize-none`}
              placeholder="Shown to customers browsing this category"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 accent-indigo-600"
            />
            <span className="text-[13px] text-slate-700">Visible in the storefront</span>
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
            ? `"${deleting.name}" will be removed. Categories that still hold products cannot be deleted — move or delete those products first.`
            : ''
        }
      />
    </>
  )
}
