import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'

import api from '../../services/api'
import { money, shortId } from '../../utils/adminUtils'

/**
 * Command palette. Queries the three searchable admin collections for real, so
 * it can never surface a result the API does not have.
 */
export default function AdminCommandSearch({ onClose }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState({ products: [], orders: [], users: [] })
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const firstRun = useRef(true)

  // Only a real navigation should dismiss the palette, not a parent re-render,
  // so `onClose` is deliberately left out of the dependency list.
  useEffect(() => onClose(), [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return undefined
    }

    const query = term.trim()
    if (query.length < 2) {
      setResults({ products: [], orders: [], users: [] })
      return undefined
    }

    setSearching(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const [products, orders, users] = await Promise.all([
          api.get('/products', { params: { search: query, limit: 4 }, signal: controller.signal }),
          api.get('/orders', { params: { search: query, limit: 4 }, signal: controller.signal }),
          api.get('/users', { params: { search: query, limit: 4, role: 'user' }, signal: controller.signal }),
        ])
        setResults({
          products: products.data.data || [],
          orders: orders.data.data || [],
          users: users.data.data || [],
        })
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') setResults({ products: [], orders: [], users: [] })
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  const groups = [
    {
      label: 'Products',
      rows: results.products,
      to: `/admin/products?search=${encodeURIComponent(term.trim())}`,
      path: (row) => `/admin/products/${row._id}`,
      render: (row) => row.title,
      meta: (row) => money(row.price),
    },
    {
      label: 'Orders',
      rows: results.orders,
      to: `/admin/orders?search=${encodeURIComponent(term.trim())}`,
      path: (row) => `/admin/orders/${row._id}`,
      render: (row) => `#${shortId(row._id)}`,
      meta: (row) => money(row.totalPrice),
    },
    {
      label: 'Users',
      rows: results.users,
      to: `/admin/users?search=${encodeURIComponent(term.trim())}`,
      path: (row) => `/admin/users/${row._id}`,
      render: (row) => row.name,
      meta: (row) => row.email,
    },
  ].filter((group) => group.rows.length > 0)

  const go = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="w-full max-w-xl">
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search products, orders and customers…"
          aria-label="Search the admin panel"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
        )}
      </div>

      <p className="px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {term.trim().length < 2
          ? 'Type at least 2 characters'
          : searching
            ? 'Searching…'
            : `${groups.length} result ${groups.length === 1 ? 'group' : 'groups'}`}
      </p>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.label}</span>
              <button onClick={() => go(group.to)} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                See all
              </button>
            </div>
            {group.rows.map((row) => (
              <button
                key={row._id}
                onClick={() => go(group.path(row))}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-slate-50"
              >
                <span className="truncate font-medium text-slate-700">{group.render(row)}</span>
                <span className="shrink-0 truncate text-[11px] text-slate-500">{group.meta(row)}</span>
              </button>
            ))}
          </div>
        ))}

        {term.trim().length >= 2 && !searching && groups.length === 0 && (
          <p className="px-1 py-6 text-center text-[13px] text-slate-400">No matches for “{term.trim()}”.</p>
        )}
      </div>
    </div>
  )
}
