import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { store } from './store';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetails from './pages/customer/ProductDetails';
import CartPage from './pages/customer/CartPage';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetails from './pages/customer/OrderDetails';
import AuthPage from './pages/customer/AuthPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import ProfilePage from './pages/customer/ProfilePage';
import WishlistPage from './pages/customer/WishlistPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAds from './pages/admin/AdminAds';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminCoupons from './pages/admin/AdminCoupons';

// Salesman Pages
import SalesmanDashboard from './pages/salesman/SalesmanDashboard';

// Deliveryman Pages
import DeliverymanDashboard from './pages/deliveryman/DeliverymanDashboard';

function App() {
  return (
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<AuthPage />} />

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/search" element={<ProductCatalog />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={
                <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrderHistory /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute><OrderDetails /></ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute><WishlistPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>

            {/* Salesman Routes */}
            <Route path="/salesman" element={
              <ProtectedRoute roles={['salesman']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SalesmanDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            {/* Deliveryman Routes */}
            <Route path="/delivery" element={
              <ProtectedRoute roles={['deliveryman']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DeliverymanDashboard />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-dark-50">
                <div className="text-center">
                  <div className="text-9xl font-bold gradient-text mb-4">404</div>
                  <h2 className="text-2xl font-bold text-dark-800 mb-3">Page Not Found</h2>
                  <p className="text-dark-400 mb-6">The page you're looking for doesn't exist.</p>
                  <a href="/" className="btn-primary">Go Home</a>
                </div>
              </div>
            } />
          </Routes>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px' }
          }} />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  );
}

export default App;
