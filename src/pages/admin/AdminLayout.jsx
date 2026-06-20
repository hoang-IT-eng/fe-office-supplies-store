import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, FolderTree, Warehouse, Receipt, Users, Ticket, Pencil, LogOut, Search, Bell, Settings, } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
const NAV = [
    { to: 'products', label: 'Quản lý sản phẩm', icon: Package },
    { to: 'categories', label: 'Quản lý danh mục', icon: FolderTree },
    { to: 'inventory', label: 'Quản lý kho hàng', icon: Warehouse },
    { to: 'orders', label: 'Quản lý đơn hàng', icon: Receipt },
    { to: 'vouchers', label: 'Quản lý voucher', icon: Ticket },
    { to: 'users', label: 'Quản lý tài khoản', icon: Users },
];
export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        }
        catch {
            /* ignore */
        }
        logout();
        navigate('/');
    };
    return (<div className="flex min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 px-4 z-40">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2 group">
          <span className="w-9 h-9 rounded-lg bg-primary text-on-primary grid place-items-center shadow-soft">
            <Pencil size={18}/>
          </span>
          <div>
            <div className="text-base font-extrabold text-primary tracking-tight leading-none">StationeryAdmin</div>
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
              Trung tâm điều hành
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (<NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              {({ isActive }) => (<>
                  <item.icon size={18} className={isActive ? '' : 'text-primary'}/>
                  <span>{item.label}</span>
                </>)}
            </NavLink>))}
        </nav>

        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <div className="px-3 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary grid place-items-center font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user?.fullName}</div>
              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Quản trị viên
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-error hover:bg-error-container">
            <LogOut size={18}/>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest/85 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-8">
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input type="text" placeholder="Tìm kiếm trong hệ thống..." className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"/>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full hover:bg-surface-container-high text-on-surface-variant relative">
              <Bell size={18}/>
              <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full"/>
            </button>
            <button className="p-2.5 rounded-full hover:bg-surface-container-high text-on-surface-variant" title="Cài đặt">
              <Settings size={18}/>
            </button>
          </div>
        </header>
        <main className="p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>);
}
