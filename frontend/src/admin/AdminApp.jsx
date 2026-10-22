import { lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider, RequireAdmin } from './auth/AdminAuthContext.jsx'
import { demoAuthProvider } from './auth/demoAuthProvider.js'
import AdminLayout from './components/AdminLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const ProductsPage = lazy(() => import('./pages/products/ProductsPage.jsx'))
const ProductEditorPage = lazy(() => import('./pages/products/ProductEditorPage.jsx'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage.jsx'))
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'))
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'))
const BuildASetPage = lazy(() => import('./pages/BuildASetPage.jsx'))
const ContentPage = lazy(() => import('./pages/content/ContentPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const ActivityPage = lazy(() => import('./pages/ActivityPage.jsx'))

function AdminNotFound() {
  return (
    <div className="adm-card adm-empty">
      <h1 className="adm-page-title">Page not found</h1>
      <p className="muted">There is no admin page at this address.</p>
      <Link to="/admin" className="btn btn--sm">
        Back to the dashboard
      </Link>
    </div>
  )
}

/**
 * Admin area (/admin/*). Swap `demoAuthProvider` for a real provider to connect authentication;
 * the route guard and every page stay the same.
 */
export default function AdminApp() {
  return (
    <AdminAuthProvider provider={demoAuthProvider}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductEditorPage />} />
          <Route path="products/:productId" element={<ProductEditorPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="build-a-set" element={<BuildASetPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}
