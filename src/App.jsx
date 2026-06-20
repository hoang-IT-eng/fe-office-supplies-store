import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminVouchers from './pages/admin/AdminVouchers';
export default function App() {
    return (<Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />}/>
        <Route path="products/:id" element={<ProductDetailPage />}/>
        <Route path="login" element={<LoginPage />}/>
        <Route path="register" element={<RegisterPage />}/>
        <Route path="forgot-password" element={<ForgotPasswordPage />}/>
        <Route path="reset-password" element={<ResetPasswordPage />}/>

        <Route element={<RequireAuth />}>
          <Route path="cart" element={<CartPage />}/>
          <Route path="checkout" element={<CheckoutPage />}/>
          <Route path="orders" element={<OrdersPage />}/>
          <Route path="orders/:id" element={<OrderDetailPage />}/>
          <Route path="profile" element={<ProfilePage />}/>
        </Route>
      </Route>

      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="products" replace/>}/>
          <Route path="products" element={<AdminProducts />}/>
          <Route path="categories" element={<AdminCategories />}/>
          <Route path="orders" element={<AdminOrders />}/>
          <Route path="users" element={<AdminUsers />}/>
          <Route path="inventory" element={<AdminInventory />}/>
          <Route path="vouchers" element={<AdminVouchers />}/>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/"/>}/>
    </Routes>);
}
