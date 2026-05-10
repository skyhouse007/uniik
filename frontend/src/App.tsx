import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductListingPage } from './pages/ProductListingPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { SearchPage } from './pages/SearchPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProfilePage } from './pages/ProfilePage'
import { WishlistPage } from './pages/WishlistPage'
import { WalletPage } from './pages/WalletPage'
import { AboutPage } from './pages/AboutPage'
import { BulkOrderPage } from './pages/BulkOrderPage'
import { ComparePage } from './pages/ComparePage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { TermsConditionsPage } from './pages/TermsConditionsPage'
import { ShippingPolicyPage } from './pages/ShippingPolicyPage'
import { ReturnRefundPolicyPage } from './pages/ReturnRefundPolicyPage'
import { WarrantyPolicyPage } from './pages/WarrantyPolicyPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RequireAuth } from './routes/RequireAuth'
import { RequireAdmin } from './routes/RequireAdmin'
import { AdminShell } from './components/admin/AdminShell'
import { AdminContentPage } from './pages/admin/AdminContentPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/categories', element: <CategoryPage /> },
      { path: '/categories/:parentId', element: <CategoryPage /> },
      { path: '/products', element: <ProductListingPage /> },
      { path: '/products/:id', element: <ProductDetailsPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/wishlist', element: <WishlistPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/bulk-order', element: <BulkOrderPage /> },
      { path: '/track-order', element: <TrackOrderPage /> },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: '/terms', element: <TermsConditionsPage /> },
      { path: '/shipping-policy', element: <ShippingPolicyPage /> },
      { path: '/return-refund-policy', element: <ReturnRefundPolicyPage /> },
      { path: '/warranty-policy', element: <WarrantyPolicyPage /> },
      {
        path: '/checkout',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: '/orders',
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: '/profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: '/wallet',
        element: (
          <RequireAuth>
            <WalletPage />
          </RequireAuth>
        ),
      },
      {
        path: '/admin/login',
        element: <AdminLoginPage />,
      },
      {
        path: '/admin',
        element: (
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'content', element: <AdminContentPage /> },
          { path: 'security', element: <AdminSecurityPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
