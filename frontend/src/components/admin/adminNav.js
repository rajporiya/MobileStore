import {
  FiGrid,
  FiPackage,
  FiTag,
  FiShoppingCart,
  FiCreditCard,
  FiUsers,
  FiBriefcase,
  FiRefreshCw,
  FiBell,
  FiSettings,
} from 'react-icons/fi'

/**
 * The single source of truth for admin navigation. The sidebar, the mobile
 * drawer, the command palette and the page-header breadcrumbs all read from
 * here, so a new entry can never be added to one surface and forgotten in
 * another.
 *
 * `path` is the canonical route. `aliases` exist only so the original VoltCart
 * admin URLs keep working after the section renames.
 */
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: FiGrid, exact: true }],
  },
  {
    section: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: FiPackage, aliases: ['/admin/add-phone'] },
      { label: 'Categories', to: '/admin/categories', icon: FiTag },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: FiShoppingCart },
      { label: 'Payments', to: '/admin/payments', icon: FiCreditCard },
    ],
  },
  {
    section: 'Customers',
    items: [
      { label: 'Users', to: '/admin/users', icon: FiUsers },
      { label: 'Dealers', to: '/admin/dealers', icon: FiBriefcase },
    ],
  },
  {
    section: 'Trade-in',
    items: [{ label: 'Trade-in', to: '/admin/trade-ins', icon: FiRefreshCw, aliases: ['/admin/exchange'] }],
  },
  {
    section: 'System',
    items: [
      { label: 'Notifications', to: '/admin/notifications', icon: FiBell },
      { label: 'Settings', to: '/admin/settings', icon: FiSettings },
    ],
  },
]

export const ADMIN_NAV_ITEMS = ADMIN_NAV.flatMap((group) => group.items)

/** Matches both the canonical path and any legacy alias. */
export const isNavActive = (item, pathname) => {
  const paths = [item.to, ...(item.aliases || [])]
  if (item.exact) return paths.includes(pathname)
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export const findNavItem = (pathname) => ADMIN_NAV_ITEMS.find((item) => isNavActive(item, pathname))
