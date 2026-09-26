import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import App from '../../App'
import { createTestStore, renderWithProviders } from '../utils'

/**
 * Route smoke tests.
 *
 * Each test boots the real App route tree inside a MemoryRouter at a specific
 * URL and asserts that the right screen mounted inside the right shell. The
 * api service is mocked at module level so no backend is needed; every test
 * only asserts what the shell guarantees, not what the data layer returns.
 *
 * Two shells exist and must never cross:
 *  - Admin (/admin/*): dark sidebar with the "Admin Panel" wordmark + page
 *    headings from AdminPageHeader. No customer Navbar, no storefront hero.
 *  - Customer (/…): storefront Navbar "VoltCart" wordmark + storefront copy.
 */

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '../../services/api'

beforeEach(() => {
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === '/admin/dashboard') {
      return Promise.resolve({
        data: {
          data: {
            range: '30d',
            totals: {
              revenue: 125000,
              orders: 42,
              users: 310,
              products: 58,
              outOfStock: 2,
              lowStock: 5,
              suspendedUsers: 1,
              inactiveDealers: 0,
            },
            previous: { range: '30d', revenue: 100000, orders: 36, users: 300, products: 54 },
            ordersByStatus: { processing: 5, confirmed: 3, shipped: 4, delivered: 28, cancelled: 2 },
            paymentsByStatus: { paid: 38, pending: 3, failed: 1, refunded: 0 },
            tradeInsByStatus: { pending: 2, approved: 1, completed: 4, rejected: 1, cancelled: 0 },
            revenueSeries: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.UTC(2026, 8, i + 1)).toISOString(),
              revenue: 3000 + i * 10,
              orders: 1 + (i % 3),
            })),
            recentOrders: [],
            recentUsers: [],
            recentDealers: [],
            recentTradeIns: [],
            bestSellers: [],
            lowStockProducts: [],
          },
        },
      })
    }

    // Every other endpoint: an empty paged list or an empty payload. That is
    // enough for the screens to leave their loading state and render their
    // shells (page header, toolbar, empty state).
    return Promise.resolve({
      data: {
        data: [],
        page: 1,
        pages: 1,
        total: 0,
        collected: 0,
        byStatus: {},
        byMethod: {},
        items: [],
      },
    })
  })
})

function renderAppAt(route, auth) {
  const store = createTestStore({ auth })
  return renderWithProviders(<App />, { route, store })
}

const adminAuth = () => ({
  userInfo: { _id: 'a1', name: 'Admin Ana', role: 'admin', email: 'a@voltcart.dev' },
  loading: false,
  error: null,
})

const guestAuth = () => ({ userInfo: null, loading: false, error: null })

describe('admin route smoke tests', () => {
  it.each([
    ['/admin', 'Dashboard', 'Overview of your store performance'],
    ['/admin/products', 'Products', 'Manage your store inventory'],
    ['/admin/categories', 'Categories', 'Manage product categories'],
    ['/admin/orders', 'Orders', 'Manage customer orders'],
    ['/admin/users', 'Users', null],
    ['/admin/dealers', 'Dealers', null],
    ['/admin/trade-ins', 'Trade-in', null],
    ['/admin/payments', 'Payments', 'Every payment on the platform, read from the orders that carry it'],
    ['/admin/notifications', 'Notifications', 'Live items that need a decision, derived from your store data'],
    ['/admin/settings', 'Settings', 'Your admin account, security and what this panel can change'],
  ])('renders %s inside the admin shell', async (route, title, description) => {
    renderAppAt(route, adminAuth())

    // The screen for this route mounted, with its page heading.
    expect(
      await screen.findByRole('heading', { level: 1, name: title }, { timeout: 4000 })
    ).toBeInTheDocument()

    if (description) {
      expect(screen.getByText(description)).toBeInTheDocument()
    }

    // The admin shell is present: sidebar brand + topbar breadcrumb source.
    expect(screen.getAllByText('VoltCart').length).toBeGreaterThan(0)
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()

    // The admin shell never renders the customer storefront chrome.
    expect(screen.queryByText('Shop Now')).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome Back/i)).not.toBeInTheDocument()
  })
})

describe('admin route protection', () => {
  it('sends a signed-out visitor from /admin to the admin login screen', async () => {
    renderAppAt('/admin', guestAuth())

    expect(await screen.findByText('VoltCart Admin Console')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor from a deep admin route to the admin login screen', async () => {
    renderAppAt('/admin/products', guestAuth())

    expect(await screen.findByText('VoltCart Admin Console')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Products' })).not.toBeInTheDocument()
  })

  it('does not mount the admin dashboard for a signed-out visitor', async () => {
    renderAppAt('/admin', guestAuth())
    await screen.findByText('VoltCart Admin Console')

    // The dashboard fetch must never fire without an admin session.
    const dashboardCalls = vi
      .mocked(api.get)
      .mock.calls.filter(([url]) => url === '/admin/dashboard')
    expect(dashboardCalls).toHaveLength(0)
  })
})

describe('customer routes stay untouched', () => {
  it('renders the storefront login screen with its own chrome', async () => {
    renderAppAt('/login', guestAuth())

    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
    // Customer chrome, not admin chrome.
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    expect(screen.queryByText('VoltCart Admin Console')).not.toBeInTheDocument()
  })

  it('renders the storefront cart page with its own chrome', async () => {
    renderAppAt('/cart', guestAuth())

    expect(await screen.findByText(/Your cart is empty/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
  })
})
