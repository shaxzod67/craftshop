import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp, theme } from 'antd'
import { useAuthStore } from './store/authStore'

// Layouts
import BuyerLayout from './components/common/BuyerLayout'
import SellerLayout from './components/common/SellerLayout'
import AdminLayout from './components/common/AdminLayout'

// Auth pages
import BuyerAuth from './pages/auth/BuyerAuth'
import SellerAuth from './pages/auth/SellerAuth'

// Buyer pages
import Home from './pages/buyer/Home'
import ProductList from './pages/buyer/ProductList'
import ProductDetail from './pages/buyer/ProductDetail'
import Cart from './pages/buyer/Cart'
import Checkout from './pages/buyer/Checkout'
import BuyerOrders from './pages/buyer/BuyerOrders'
import BuyerProfile from './pages/buyer/BuyerProfile'
import Wishlist from './pages/buyer/Wishlist'
import ShopPage from './pages/buyer/ShopPage'

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard'
import ProductManage from './pages/seller/ProductManage'
import ProductForm from './pages/seller/ProductForm'
import SellerOrders from './pages/seller/SellerOrders'
import SellerAnalytics from './pages/seller/SellerAnalytics'
import SellerProfile from './pages/seller/SellerProfile'
import SellerMessages from './pages/seller/SellerMessages'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'

import LoadingScreen from './components/common/LoadingScreen'

const craftToken = {
  colorPrimary: '#8B4513',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  borderRadius: 8,
  fontFamily: "'Segoe UI', 'Inter', sans-serif",
  colorBgContainer: '#ffffff',
  colorBgLayout: '#faf8f5',
  colorLink: '#8B4513',
  colorLinkHover: '#a0522d',
}

function ProtectedRoute({ children, role }) {
  const { profile, loading, initialized } = useAuthStore()
  if (!initialized || loading) return <LoadingScreen />
  if (!profile) return <Navigate to={role === 'seller' ? '/seller/auth' : '/auth'} replace />
  if (role && profile.role !== role) return <Navigate to='/' replace />
  return children
}

export default function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (!initialized) return <LoadingScreen />

  return (
    <ConfigProvider theme={{ token: craftToken, algorithm: theme.defaultAlgorithm }}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<BuyerAuth />} />
            <Route path="/seller/auth" element={<SellerAuth />} />

            {/* Buyer (public + protected) */}
            <Route element={<BuyerLayout />}>
              <Route index element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/shop/:sellerId" element={<ShopPage />} />
              <Route path="/cart" element={
                <ProtectedRoute role="buyer"><Cart /></ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute role="buyer"><Checkout /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute role="buyer"><BuyerOrders /></ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute role="buyer"><Wishlist /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute role="buyer"><BuyerProfile /></ProtectedRoute>
              } />
            </Route>

            {/* Seller dashboard */}
            <Route path="/seller" element={
              <ProtectedRoute role="seller"><SellerLayout /></ProtectedRoute>
            }>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<ProductManage />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/edit/:id" element={<ProductForm />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="analytics" element={<SellerAnalytics />} />
              <Route path="messages" element={<SellerMessages />} />
              <Route path="profile" element={<SellerProfile />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
