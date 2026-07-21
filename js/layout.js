import { auth } from './auth.js';
import { api } from './api.js';
import { cart } from './cart.js';
import { toast } from './toast.js';

const icons = () => window.lucide && window.lucide.createIcons();

// ---- Guards ----
export function requireAuth() {
  if (!auth.getUser()) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login?next=${next}`);
    return false;
  }
  return true;
}

export function requireAdmin() {
  const user = auth.getUser();
  if (!user) {
    location.replace('../login.html');
    return false;
  }
  if (user.role !== 'ADMIN') {
    location.replace('../index.html');
    return false;
  }
  return true;
}

async function doLogout(homeHref) {
  try {
    await api.post('/auth/logout');
  } catch {
    /* ignore */
  }
  auth.logout();
  location.href = homeHref;
}

// ---- Customer chrome ----
export function mountCustomerChrome(active) {
  const user = auth.getUser();
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const year = new Date().getFullYear();

  const link = (href, label, key, extra = '') =>
    `<a href="${href}" class="nav-link ${active === key ? 'active' : ''}">${extra}${label}</a>`;

  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="brand">
        <span class="brand-badge"><i data-lucide="pencil" style="width:18px;height:18px"></i></span>
        <span>Văn phòng phẩm <span class="accent">Trần Huy Hoàng</span></span>
      </a>
      <nav class="main-nav">
        ${link('index.html', 'Sản phẩm', 'home')}
        ${user ? link('orders.html', 'Đơn hàng', 'orders', '<i data-lucide="package" style="width:16px;height:16px"></i> ') : ''}
        <a href="cart.html" class="cart-link" title="Giỏ hàng">
          <i data-lucide="shopping-cart" style="width:20px;height:20px"></i>
          <span class="cart-badge" id="cart-badge" style="display:none">0</span>
        </a>
        ${auth.isAdmin() ? '<a href="admin/products.html" class="chip chip-secondary" style="margin-left:.5rem"><i data-lucide="shield-check" style="width:14px;height:14px"></i> Admin</a>' : ''}
        ${
          user
            ? `<div class="user-menu">
                 <a href="profile.html" class="flex items-center gap-2" style="padding:.375rem .75rem;border-radius:.5rem">
                   <span class="avatar">${(user.fullName || 'U').charAt(0).toUpperCase()}</span>
                   <span class="font-medium text-sm">${user.fullName || ''}</span>
                 </a>
                 <button class="icon-btn" id="logout-btn" title="Đăng xuất"><i data-lucide="log-out" style="width:18px;height:18px"></i></button>
               </div>`
            : `<div class="flex items-center gap-2" style="margin-left:.75rem">
                 <a href="login.html" class="btn btn-outline">Đăng nhập</a>
                 <a href="register.html" class="btn btn-primary">Đăng ký</a>
               </div>`
        }
      </nav>
    </div>`;

  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <div class="flex items-center gap-2 font-extrabold text-primary text-lg mb-2">
          <i data-lucide="pencil" style="width:18px;height:18px"></i> Văn phòng phẩm Trần Huy Hoàng
        </div>
        <p class="muted">Hệ thống thương mại điện tử chuyên về văn phòng phẩm — hiện đại, đáng tin cậy.</p>
      </div>
      <div>
        <h4 class="font-semibold mb-3">Liên kết</h4>
        <ul class="space-y-2 muted">
          <li><a href="index.html">Sản phẩm</a></li>
          <li><a href="orders.html">Đơn hàng</a></li>
          <li><a href="profile.html">Tài khoản</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-3">Liên hệ</h4>
        <ul class="space-y-2 muted">
          <li>Email: support@stationery.local</li>
          <li>Hotline: 1900-xxxx</li>
        </ul>
      </div>
    </div>
    <div class="footer-copy">© ${year} Văn phòng phẩm Trần Huy Hoàng</div>`;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => doLogout('index.html'));

  // Cập nhật badge giỏ hàng
  const refreshBadge = () => {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const c = cart.count();
    badge.textContent = c;
    badge.style.display = c > 0 ? 'grid' : 'none';
  };
  cart.subscribe(refreshBadge);
  if (user) cart.fetch().then(refreshBadge).catch(() => {});

  icons();
}

// ---- Admin chrome ----
const ADMIN_NAV = [
  { to: 'products.html', label: 'Quản lý sản phẩm', icon: 'package', key: 'products' },
  { to: 'categories.html', label: 'Quản lý danh mục', icon: 'folder-tree', key: 'categories' },
  { to: 'inventory.html', label: 'Quản lý kho hàng', icon: 'warehouse', key: 'inventory' },
  { to: 'orders.html', label: 'Quản lý đơn hàng', icon: 'receipt', key: 'orders' },
  { to: 'vouchers.html', label: 'Quản lý voucher', icon: 'ticket', key: 'vouchers' },
  { to: 'users.html', label: 'Quản lý tài khoản', icon: 'users', key: 'users' },
];

export function mountAdminChrome(active) {
  const user = auth.getUser();
  const aside = document.getElementById('admin-aside');
  const topbar = document.getElementById('admin-topbar');

  aside.innerHTML = `
    <a href="../index.html" class="brand" style="margin-bottom:2rem;padding:0 .5rem">
      <span class="brand-badge"><i data-lucide="pencil" style="width:18px;height:18px"></i></span>
      <div>
        <div class="font-extrabold text-primary" style="line-height:1">Trần Huy Hoàng Admin</div>
        <div class="text-xs uppercase tracking-wide muted font-bold" style="margin-top:2px">Trung tâm điều hành</div>
      </div>
    </a>
    <nav class="flex-1 space-y-1">
      ${ADMIN_NAV.map(
        (n) =>
          `<a href="${n.to}" class="nav-item ${active === n.key ? 'active' : ''}"><i data-lucide="${n.icon}" style="width:18px;height:18px"></i><span>${n.label}</span></a>`,
      ).join('')}
    </nav>
    <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--outline-variant)">
      <div class="flex items-center gap-3" style="padding:.75rem">
        <span class="avatar">${(user?.fullName || 'A').charAt(0).toUpperCase()}</span>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold truncate">${user?.fullName || ''}</div>
          <div class="text-xs uppercase tracking-wide muted font-bold">Quản trị viên</div>
        </div>
      </div>
      <button id="admin-logout" class="nav-item danger w-full"><i data-lucide="log-out" style="width:18px;height:18px"></i><span>Đăng xuất</span></button>
    </div>`;

  topbar.innerHTML = `
    <div class="flex-1 relative max-w-md">
      <i data-lucide="search" class="input-icon" style="width:16px;height:16px"></i>
      <input type="text" placeholder="Tìm kiếm trong hệ thống..." class="input pl-10" style="border-radius:9999px" />
    </div>
    <div class="flex items-center gap-2">
      <button class="icon-btn" style="border-radius:9999px"><i data-lucide="bell" style="width:18px;height:18px"></i></button>
      <button class="icon-btn" style="border-radius:9999px"><i data-lucide="settings" style="width:18px;height:18px"></i></button>
    </div>`;

  document.getElementById('admin-logout').addEventListener('click', () => doLogout('../index.html'));
  icons();
}

export { icons };
