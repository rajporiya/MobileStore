import {
  FiBell,
  FiBriefcase,
  FiCheckSquare,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiPackage,
  FiRefreshCw,
  FiSettings,
  FiShoppingCart,
  FiTag,
  FiUser,
  FiUsers,
} from 'react-icons/fi'

/**
 * Single source of truth for admin navigation. The sidebar, the mobile drawer,
 * the topbar breadcrumbs and the command search all read from here, so an entry
 * can never appear on one surface and be missing from another.
 *
 * `to` is the canonical route. `aliases` exist only so the original VoltCart
 * admin URLs keep resolving after the section renames.
 */
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: FiGrid, exact: true }],
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
    items: [
      { label: 'Trade-in Requests', to: '/admin/trade-ins', icon: FiRefreshCw, aliases: ['/admin/exchange'] },
    ],
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

/** Footer block of the sidebar — profile shortcut plus sign out. */
export const ADMIN_ACCOUNT_NAV = [
  { label: 'Admin Profile', to: '/admin/settings?tab=profile', icon: FiUser },
  { label: 'Logout', action: 'logout', icon: FiLogOut },
]

/** Used by the topbar to title a page even when it is not in the sidebar. */
export const ADMIN_ICON = FiCheckSquare

/** Matches the canonical path and any legacy alias. */
export const isNavActive = (item, pathname) => {
  const paths = [item.to, ...(item.aliases || [])]
  if (item.exact) return paths.includes(pathname)
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export const findNavItem = (pathname) => ADMIN_NAV_ITEMS.find((item) => isNavActive(item, pathname))
