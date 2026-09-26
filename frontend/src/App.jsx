import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'

// User pages
import HomePage from './pages/user/HomePage'
import ProductsPage from './pages/user/ProductsPage'
import ProductDetailPage from './pages/user/ProductDetailPage'
import CartPage from './pages/user/CartPage'
import CheckoutPage from './pages/user/CheckoutPage'
import LoginPage from './pages/user/LoginPage'
import RegisterPage from './pages/user/RegisterPage'
import ProfilePage from './pages/user/ProfilePage'
import WishlistPage from './pages/user/WishlistPage'
import OrderSuccessPage from './pages/user/OrderSuccessPage'

// Admin pages
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminAddProduct from './pages/admin/AdminAddProduct'
import AdminEditProduct from './pages/admin/AdminEditProduct'
import AdminProductDetail from './pages/admin/AdminProductDetail'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminPayments from './pages/admin/AdminPayments'
import AdminTradeIns from './pages/admin/AdminTradeIns'
import AdminTradeInDetail from './pages/admin/AdminTradeInDetail'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminDealers from './pages/admin/AdminDealers'
import AdminDealerDetail from './pages/admin/AdminDealerDetail'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/AdminSettings'
import AdminLogin from './pages/admin/AdminLogin'

// Sell & Dealer pages
import SellMobilePage from './pages/user/SellMobilePage'
import DealerLayout from './components/dealer/DealerLayout'
import DealerDashboard from './pages/dealer/DealerDashboard'
import DealerRequestsPage from './pages/dealer/DealerRequestsPage'

// Components
import UserLayout from './components/user/UserLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import DealerRoute from './components/common/DealerRoute'
import CustomerRoute from './components/common/CustomerRoute'
import ScrollToTop from './components/common/ScrollToTop'

import { loadUserFromStorage } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadUserFromStorage())
  }, [dispatch])

  // A suspended or expired session is cleared by the axios interceptor; mirror
  // that into redux so the protected routes redirect without a reload.
  useEffect(() => {
    const onSessionEnded = (event) => {
      dispatch(loadUserFromStorage())
      toast.error(
        event.detail?.suspended
          ? 'Your account has been suspended. Please contact an administrator.'
          : 'Your session has expired. Please sign in again.'
      )
    }
    window.addEventListener('voltcart:session-ended', onSessionEnded)
    return () => window.removeEventListener('voltcart:session-ended', onSessionEnded)
  }, [dispatch])

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="sell-mobile" element={<CustomerRoute><SellMobilePage /></CustomerRoute>} />
          <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        </Route>

        {/* Dealer Routes */}
        <Route path="/dealer" element={<DealerRoute><DealerLayout /></DealerRoute>}>
          <Route index element={<DealerDashboard />} />
          <Route path="requests" element={<DealerRequestsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />

          {/* Catalog — static segments must come before the dynamic ones */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AdminAddProduct />} />
          <Route path="add-phone" element={<AdminAddProduct />} />
          <Route path="products/edit/:id" element={<AdminEditProduct />} />
          <Route path="products/:id" element={<AdminProductDetail />} />
          <Route path="categories" element={<AdminCategories />} />

          {/* Sales */}
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="payments" element={<AdminPayments />} />

          {/* Customers */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="dealers" element={<AdminDealers />} />
          <Route path="dealers/:id" element={<AdminDealerDetail />} />

          {/* Trade-in */}
          <Route path="trade-ins" element={<AdminTradeIns />} />
          <Route path="exchange" element={<AdminTradeIns />} />
          <Route path="trade-ins/:id" element={<AdminTradeInDetail />} />
          <Route path="exchange/:id" element={<AdminTradeInDetail />} />

          {/* System */}
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
