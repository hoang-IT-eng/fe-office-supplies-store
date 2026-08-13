import { auth } from './auth.js';
import { api } from './api.js';
import { cart } from './cart.js';
import { fileUrl } from './config.js';
import { toast } from './toast.js';

const icons = () => window.lucide && window.lucide.createIcons();
const LOGO_URL = fileUrl('/uploads/image.png');

function ensureFavicon() {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = LOGO_URL;
}

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

  ensureFavicon();

  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="brand">
        <img src="${LOGO_URL}" alt="" class="brand-logo" />
        <span>Văn phòng phẩm <span class="accent">Trần Huy Hoàng</span></span>
      </a>

      <!-- Nút 3 gạch: CSS chỉ cho hiện khi màn hình nhỏ (điện thoại, tablet) -->
      <button
        type="button"
        class="nav-toggle"
        id="nav-toggle"
        title="Menu"
        aria-label="Mở menu"
        aria-expanded="false"
        aria-controls="main-nav"
      >
        <i data-lucide="menu" class="nav-toggle-icon"></i>
      </button>

      <nav class="main-nav" id="main-nav">
        ${link('index.html', 'Sản phẩm', 'home')}
        ${user ? link('orders.html', 'Đơn hàng', 'orders', '<i data-lucide="package" class="nav-link-icon"></i> ') : ''}
        <a href="cart.html" class="cart-link" title="Giỏ hàng">
          <i data-lucide="shopping-cart" class="cart-icon"></i>
          <span class="cart-link-text">Giỏ hàng</span>
          <span class="cart-badge" id="cart-badge" style="display:none">0</span>
        </a>
        ${auth.isAdmin() ? '<a href="admin/products.html" class="chip chip-secondary admin-link"><i data-lucide="shield-check" class="admin-link-icon"></i> Admin</a>' : ''}
        ${
          user
            ? `<div class="user-menu">
                 <a href="profile.html" class="user-menu-link">
                   <span class="avatar">${(user.fullName || 'U').charAt(0).toUpperCase()}</span>
                   <span class="user-menu-name">${user.fullName || ''}</span>
                 </a>
                 <button class="icon-btn" id="logout-btn" title="Đăng xuất"><i data-lucide="log-out" class="logout-icon"></i></button>
               </div>`
            : `<div class="header-auth-actions">
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
          <img src="${LOGO_URL}" alt="" class="brand-logo brand-logo-sm" /> Văn phòng phẩm Trần Huy Hoàng
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

  // Bấm nút 3 gạch → thêm/bỏ class "open" để hiện/ẩn menu trên điện thoại
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const opened = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
      navToggle.setAttribute('aria-label', opened ? 'Đóng menu' : 'Mở menu');
      navToggle.innerHTML = `<i data-lucide="${opened ? 'x' : 'menu'}" class="nav-toggle-icon"></i>`;
      icons();
    });
  }

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
  { to: 'reviews.html', label: 'Quản lý đánh giá', icon: 'star', key: 'reviews' },
  { to: 'users.html', label: 'Quản lý tài khoản', icon: 'users', key: 'users' },
];

export function mountAdminChrome(active) {
  const user = auth.getUser();
  const aside = document.getElementById('admin-aside');

  ensureFavicon();

  // Style chung cho 1 mục menu sidebar
  const navItemBase =
    'width:100%;display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;border-radius:var(--radius);font-size:.875rem;font-weight:500;text-decoration:none;box-sizing:border-box;border:none;cursor:pointer;font-family:inherit;background:none';
  const navItemNormal = `${navItemBase};color:var(--on-surface-variant)`;
  const navItemActive = `${navItemBase};background:var(--primary);color:#fff;font-weight:600;box-shadow:var(--shadow-soft)`;
  const navItemDanger = `${navItemBase};color:var(--error)`;

  const navLinks = ADMIN_NAV.map((n) => {
    const isActive = active === n.key;
    const style = isActive ? navItemActive : navItemNormal;
    const iconColor = isActive ? 'color:#fff' : 'color:var(--primary)';
    return `
      <a href="${n.to}" style="${style}">
        <i data-lucide="${n.icon}" style="width:18px;height:18px;${iconColor}"></i>
        <span>${n.label}</span>
      </a>`;
  }).join('');

  aside.innerHTML = `
    <!-- Logo + tên admin -->
    <a href="../index.html" style="display:flex;align-items:center;gap:.5rem;margin-bottom:2rem;padding:0 .5rem;text-decoration:none;color:inherit">
      <img src="${LOGO_URL}" alt="" style="height:2.75rem;width:auto;display:block;border-radius:var(--radius);object-fit:contain" />
      <div>
        <div style="font-weight:800;color:var(--primary);line-height:1">Trần Huy Hoàng Admin</div>
        <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--on-surface-variant);font-weight:700;margin-top:2px">Trung tâm điều hành</div>
      </div>
    </a>

    <!-- Menu điều hướng: chiếm hết chiều cao còn lại -->
    <nav style="flex:1;display:flex;flex-direction:column;gap:.25rem">
      ${navLinks}
    </nav>

    <!-- Thông tin admin + nút đăng xuất (đẩy xuống đáy sidebar) -->
    <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--outline-variant)">
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem">
        <span style="width:2rem;height:2rem;border-radius:9999px;background:var(--primary-fixed);color:var(--primary);display:grid;place-items:center;font-weight:700;font-size:.875rem">
          ${(user?.fullName || 'A').charAt(0).toUpperCase()}
        </span>
        <div style="min-width:0;flex:1">
          <div style="font-size:.875rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user?.fullName || ''}</div>
          <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--on-surface-variant);font-weight:700">Quản trị viên</div>
        </div>
      </div>
      <button type="button" id="admin-logout" style="${navItemDanger}">
        <i data-lucide="log-out" style="width:18px;height:18px"></i>
        <span>Đăng xuất</span>
      </button>
    </div>`;

  document.getElementById('admin-logout').addEventListener('click', () => doLogout('../index.html'));
  icons();
}

export { icons };
