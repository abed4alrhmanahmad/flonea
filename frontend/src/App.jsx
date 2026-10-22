import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import { PageLoader } from './components/ui/EmptyState.jsx'
import HomePage from './pages/HomePage.jsx'

// The whole Admin (login, dashboard, editors) is a separate lazy chunk, so the storefront doesn't load it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const ShopPage = lazy(() => import('./pages/ShopPage.jsx'))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))
const SetBuilderPage = lazy(() => import('./pages/SetBuilderPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'))
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const HelpPage = lazy(() => import('./pages/HelpPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<PageLoader />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="collections/:collectionId" element={<ShopPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="bedding-sets" element={<Navigate to="/collections/bedding-sets" replace />} />
        <Route path="bedding-sets/builder" element={<SetBuilderPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="help/:topic" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
