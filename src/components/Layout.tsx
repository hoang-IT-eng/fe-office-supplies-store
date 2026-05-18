import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useEffect } from 'react';
import { api } from '../lib/api';
import {
  ShoppingCart,
  Package,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Pencil,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const cart = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) cart.fetch().catch(() => {});
  }, [user?.id]);

  const onLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary tracking-tight">
            <span className="w-9 h-9 rounded-lg bg-primary text-on-primary grid place-items-center shadow-soft">
              <Pencil size={18} />
            </span>
            <span>Stationery<span className="text-tertiary">Shop</span></span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              Sản phẩm
            </NavLink>
            {user && (
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    isActive ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <Package size={16} /> Đơn hàng
              </NavLink>
            )}

            <NavLink
              to="/cart"
              className="relative ml-2 p-2.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <ShoppingCart size={20} />
              {cart.count() > 0 && (
                <span className="absolute -top-1 -right-1 bg-tertiary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center px-1 shadow-soft">
                  {cart.count()}
                </span>
              )}
            </NavLink>

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="ml-2 chip bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim hover:opacity-90"
              >
                <ShieldCheck size={14} /> Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-outline-variant">
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container-high">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary grid place-items-center font-bold text-sm">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="text-on-surface font-medium text-sm hidden md:block">{user.fullName}</span>
                </Link>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-3">
                <Link to="/login" className="btn-outline">Đăng nhập</Link>
                <Link to="/register" className="btn-primary">Đăng ký</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-primary text-lg mb-2">
              <Pencil size={18} /> StationeryShop
            </div>
            <p className="text-on-surface-variant">
              Hệ thống thương mại điện tử chuyên về văn phòng phẩm — hiện đại, đáng tin cậy.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface mb-3">Liên kết</h4>
            <ul className="space-y-1.5 text-on-surface-variant">
              <li><Link to="/" className="hover:text-primary">Sản phẩm</Link></li>
              <li><Link to="/orders" className="hover:text-primary">Đơn hàng</Link></li>
              <li><Link to="/profile" className="hover:text-primary">Tài khoản</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface mb-3">Liên hệ</h4>
            <ul className="space-y-1.5 text-on-surface-variant">
              <li>Email: support@stationery.local</li>
              <li>Hotline: 1900-xxxx</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-on-surface-variant mt-6 pt-6 border-t border-outline-variant/60">
          © {new Date().getFullYear()} Stationery Shop · Đề tài Trần Huy Hoàng
        </div>
      </footer>
    </div>
  );
}
