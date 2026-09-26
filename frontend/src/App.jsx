import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

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
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminTradeIns from './pages/admin/AdminTradeIns'
import AdminUsers from './pages/admin/AdminUsers'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDealers from './pages/admin/AdminDealers'

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
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="exchange" element={<AdminTradeIns />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="dealers" element={<AdminDealers />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
