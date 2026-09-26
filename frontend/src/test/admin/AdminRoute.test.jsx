import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils'
import AdminRoute from '../../components/common/AdminRoute'

function Probe() {
  return <div>SUPER_SECRET_PAGE</div>
}

function LoginProbe() {
  return <div>LOGIN_PAGE</div>
}

function StorefrontProbe() {
  return <div>STOREFRONT</div>
}

// Renders the /admin tree the same way App.jsx does, so the guard's redirects
// land on real routes instead of hanging on a bare <Navigate>.
function AdminTree() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Probe />
          </AdminRoute>
        }
      />
      <Route path="/admin/login" element={<LoginProbe />} />
      <Route path="/" element={<StorefrontProbe />} />
    </Routes>
  )
}

describe('AdminRoute guard', () => {
  it('renders children when the user is an admin', () => {
    renderWithProviders(<AdminTree />, {
      route: '/admin',
      preloadedState: {
        auth: {
          userInfo: { _id: 'a1', name: 'Admin Ana', role: 'admin', email: 'a@voltcart.dev' },
          loading: false,
          error: null,
        },
      },
    })
    expect(screen.getByText('SUPER_SECRET_PAGE')).toBeInTheDocument()
    expect(screen.queryByText('LOGIN_PAGE')).not.toBeInTheDocument()
  })

  it('redirects to /admin/login when signed out', () => {
    renderWithProviders(<AdminTree />, { route: '/admin' })
    expect(screen.queryByText('SUPER_SECRET_PAGE')).not.toBeInTheDocument()
    expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument()
  })

  it('redirects customers to the storefront instead of the admin panel', () => {
    renderWithProviders(<AdminTree />, {
      route: '/admin',
      preloadedState: {
        auth: {
          userInfo: { _id: 'u1', name: 'Customer Carl', role: 'user' },
          loading: false,
          error: null,
        },
      },
    })
    expect(screen.queryByText('SUPER_SECRET_PAGE')).not.toBeInTheDocument()
    expect(screen.getByText('STOREFRONT')).toBeInTheDocument()
    expect(screen.queryByText('LOGIN_PAGE')).not.toBeInTheDocument()
  })

  it('redirects dealers away from the admin panel', () => {
    renderWithProviders(<AdminTree />, {
      route: '/admin',
      preloadedState: {
        auth: {
          userInfo: { _id: 'd1', name: 'Dealer Dana', role: 'dealer' },
          loading: false,
          error: null,
        },
      },
    })
    expect(screen.queryByText('SUPER_SECRET_PAGE')).not.toBeInTheDocument()
    expect(screen.getByText('STOREFRONT')).toBeInTheDocument()
  })
})
