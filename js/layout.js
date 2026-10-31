/**
 * Dựng phần "khung" lặp lại ở mọi trang:
 *  - Khách hàng: header (logo + menu + giỏ hàng) và footer
 *  - Admin: thanh menu (vị trí trái/trên do css/admin.css quyết định)
 * Ngoài ra có 2 hàm chặn truy cập: batBuocDangNhap() và batBuocAdmin().
 */

import { taiKhoan } from './auth.js';
import { ganHopThoai } from './chat-widget.js';
import { api } from './api.js';
import { gioHang } from './cart.js';
import { duongDanTapTin, duongDanTrang } from './config.js';
import { chuoiAnToan } from './format.js';

const URL_LOGO = duongDanTapTin('/uploads/image.png');

/** Đổi mọi thẻ <i data-lucide="..."> thành icon SVG (gọi lại sau khi render HTML mới) */
export function veIcon() {
  if (window.lucide) window.lucide.createIcons();
}

/** Gắn nút con mắt để hiện/ẩn mật khẩu cho mọi ô [data-password-toggle] */
export function ganNutHienMatKhau() {
  document.querySelectorAll('[data-password-toggle]').forEach((nut) => {
    if (nut.dataset.daGanHienMatKhau) return;
    nut.dataset.daGanHienMatKhau = '1';

    nut.addEventListener('click', () => {
      const oNhap = nut.closest('.input-icon-wrap')?.querySelector('input');
      if (!oNhap) return;

      const dangAn = oNhap.type === 'password';
      oNhap.type = dangAn ? 'text' : 'password';
      const nhan = dangAn ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
      nut.setAttribute('aria-label', nhan);
      nut.setAttribute('title', nhan);
      nut.innerHTML = `<i data-lucide="${dangAn ? 'eye-off' : 'eye'}"></i>`;
      veIcon();
    });
  });
}

/** Gắn favicon là logo shop */
function ganFavicon() {
  let the = document.querySelector("link[rel='icon']");
  if (!the) {
    the = document.createElement('link');
    the.rel = 'icon';
    the.type = 'image/png';
    document.head.appendChild(the);
  }
  the.href = URL_LOGO;
}

// ---------------------------------------------------------------- Chặn truy cập

/** Trang chỉ dành cho người đã đăng nhập; chưa đăng nhập → về trang login */
export function batBuocDangNhap() {
  if (!taiKhoan.layNguoiDung()) {
    const trangDangMo = location.pathname.split('/').pop() + location.search;
    location.replace(duongDanTrang('login.html', { next: trangDangMo }));
    return false;
  }
  return true;
}

/** Trang chỉ dành cho ADMIN; khách thường → về trang chủ */
export function batBuocAdmin() {
  const nguoiDung = taiKhoan.layNguoiDung();
  if (!nguoiDung) {
    location.replace('../login.html');
    return false;
  }
  if (nguoiDung.role !== 'ADMIN') {
    location.replace('../index.html');
    return false;
  }
  return true;
}

/** Gọi API đăng xuất, xóa phiên rồi về trang chủ */
async function xuLyDangXuat(duongDanTrangChu) {
  try {
    await api.post('/auth/logout');
  } catch {
    /* API lỗi vẫn xóa phiên phía trình duyệt */
  }
  taiKhoan.dangXuat();
  location.href = duongDanTrangChu;
}

// ------------------------------------------------------- Khung trang khách hàng

/**
 * Dựng header + footer cho trang khách hàng.
 * @param {string} trangHienTai khóa để tô sáng menu: 'home' | 'category' | 'orders' | 'cart' | ''
 */
export function dungKhungKhachHang(trangHienTai) {
  const nguoiDung = taiKhoan.layNguoiDung();
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const nam = new Date().getFullYear();
  const anThongBao = localStorage.getItem('fq-an-thong-bao') === '1';

  ganFavicon();

  const lienKet = (href, nhan) =>
    `<a href="${href}" class="nav-link ${trangHienTai === 'home' && href.endsWith('#bo-suu-tap') ? '' : ''}">${nhan}</a>`;

  const menuTaiKhoan = nguoiDung
    ? `<a href="profile.html">Tài khoản</a>
       <a href="orders.html">Đơn hàng</a>
       ${taiKhoan.laAdmin() ? '<a href="admin/dashboard.html">Quản trị</a>' : ''}
       <button type="button" id="nut-dang-xuat">Đăng xuất</button>`
    : `<a href="login.html">Đăng nhập</a>
       <a href="register.html">Đăng ký</a>`;

  header.innerHTML = `
    ${
      anThongBao
        ? ''
        : `<div class="fq-announce" id="thanh-thong-bao">
            <p>Miễn phí khắc tên cho mọi sổ tay</p>
            <button type="button" class="fq-announce-close" id="dong-thong-bao" aria-label="Đóng thông báo">×</button>
          </div>`
    }
    <div class="fq-scrim" id="fq-scrim"></div>
    <div class="fq-logo-row">
      <button
        type="button"
        class="nav-toggle"
        id="nut-menu"
        title="Menu"
        aria-label="Mở menu"
        aria-expanded="false"
        aria-controls="main-nav"
      >
        <i data-lucide="menu"></i>
      </button>
      <a href="index.html" class="fq-logo">
        <span class="fq-logo-est">Est. 2018</span>
        <span class="fq-logo-name">Folio &amp; Quill</span>
        <span class="fq-logo-city">Saigon</span>
      </a>
      <div class="fq-tools">
        <button type="button" class="fq-tool" id="nut-tim" aria-label="Tìm kiếm">
          <i data-lucide="search"></i>
        </button>
        <button type="button" class="fq-tool" id="nut-yeu-thich" aria-label="Yêu thích">
          <i data-lucide="heart"></i>
        </button>
        <div class="fq-account">
          <button type="button" class="fq-tool" id="nut-tai-khoan" aria-label="Tài khoản" aria-expanded="false" aria-controls="menu-tai-khoan">
            <i data-lucide="user"></i>
          </button>
          <div class="fq-account-menu" id="menu-tai-khoan" hidden>
            ${menuTaiKhoan}
          </div>
        </div>
        <a href="cart.html" class="cart-link fq-tool ${trangHienTai === 'cart' ? 'active' : ''}" title="Giỏ hàng">
          <i data-lucide="shopping-bag"></i>
          <span class="cart-link-text">Giỏ hàng</span>
          <span class="cart-badge" id="so-luong-gio-hang" hidden>0</span>
        </a>
      </div>
    </div>
    <nav class="main-nav" id="main-nav" aria-label="Danh mục">
      <div class="fq-has-mega">
        <a href="index.html#bo-suu-tap" class="nav-link">Bộ sưu tập</a>
        <div class="fq-mega">
          <div class="fq-mega-col">
            <h3>Sổ tay</h3>
            <a href="index.html#muc-danh-muc">Sổ da</a>
            <a href="index.html#muc-danh-muc">Sổ kẻ ô</a>
            <a href="index.html#muc-danh-muc">Sổ bìa cứng</a>
          </div>
          <div class="fq-mega-col">
            <h3>Bút ký</h3>
            <a href="index.html#muc-danh-muc">Bút máy</a>
            <a href="index.html#muc-danh-muc">Bút bi</a>
            <a href="index.html#muc-danh-muc">Mực viết</a>
          </div>
          <div class="fq-mega-col">
            <h3>Quà tặng</h3>
            <a href="index.html#muc-danh-muc">Bộ quà</a>
            <a href="index.html#b2b-form-section">In logo</a>
            <a href="index.html#cau-chuyen">Gói quà</a>
          </div>
          <div class="fq-mega-col fq-mega-feature">
            <h3>Bộ sưu tập 2027</h3>
            <a href="index.html#bo-suu-tap">Khám phá</a>
          </div>
        </div>
      </div>
      ${lienKet('index.html#san-pham-tieu-bieu', 'Mới về')}
      <a href="category.html" class="nav-link ${trangHienTai === 'category' ? 'active' : ''}" ${trangHienTai === 'category' ? 'aria-current="page"' : ''}>Danh mục</a>
      ${lienKet('index.html#muc-danh-muc', 'Sổ tay')}
      ${lienKet('index.html#muc-danh-muc', 'Bút ký')}
      ${lienKet('index.html#muc-danh-muc', 'Đồ dùng bàn')}
      ${lienKet('index.html#muc-danh-muc', 'Quà tặng')}
      ${lienKet('index.html#b2b-form-section', 'Doanh nghiệp')}
      ${lienKet('index.html#cau-chuyen', 'Câu chuyện')}
    </nav>`;

  footer.innerHTML = `
    <form class="footer-news" id="form-nhan-tin">
      <h2 class="footer-heading">Đăng ký nhận tin</h2>
      <div class="footer-news-row">
        <label class="visually-hidden" for="email-nhan-tin">Email</label>
        <input id="email-nhan-tin" type="email" name="email" placeholder="Email" required autocomplete="email" />
        <button type="submit">Gửi</button>
      </div>
      <p class="footer-news-note" id="nhan-tin-trang-thai"></p>
    </form>
    <div class="footer-grid">
      <div class="footer-column">
        <div class="footer-brand">Folio &amp; Quill</div>
        <p class="muted">Sổ tay, bút ký và đồ dùng bàn, làm tại Sài Gòn.</p>
      </div>
      <div class="footer-column">
        <h2 class="footer-heading">Cửa hàng</h2>
        <ul class="footer-links">
          <li><a href="index.html#san-pham-tieu-bieu">Sản phẩm</a></li>
          <li><a href="category.html">Danh mục</a></li>
          <li><a href="index.html#bo-suu-tap">Bộ sưu tập</a></li>
          <li><a href="index.html#b2b-form-section">Doanh nghiệp</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h2 class="footer-heading">Tài khoản</h2>
        <ul class="footer-links">
          <li><a href="login.html">Đăng nhập</a></li>
          <li><a href="orders.html">Đơn hàng</a></li>
          <li><a href="profile.html">Tài khoản</a></li>
          <li>Email: hello@folioquill.saigon</li>
        </ul>
      </div>
    </div>
    <div class="footer-social">
      <a href="index.html#cau-chuyen" aria-label="Instagram"><i data-lucide="instagram"></i></a>
      <a href="index.html#cau-chuyen" aria-label="Facebook"><i data-lucide="facebook"></i></a>
    </div>
    <div class="footer-copy">© ${nam} Folio &amp; Quill. Sài Gòn.</div>`;

  document.getElementById('nut-dang-xuat')?.addEventListener('click', () => xuLyDangXuat('index.html'));
  document.getElementById('dong-thong-bao')?.addEventListener('click', () => {
    localStorage.setItem('fq-an-thong-bao', '1');
    const thanh = document.getElementById('thanh-thong-bao');
    if (thanh) thanh.hidden = true;
  });
  document.getElementById('nut-tim')?.addEventListener('click', () => {
    const oTim = document.getElementById('tu-khoa');
    if (oTim) {
      oTim.scrollIntoView({ behavior: 'smooth', block: 'center' });
      oTim.focus();
      return;
    }
    location.href = 'index.html#tu-khoa';
  });
  const nutTaiKhoan = document.getElementById('nut-tai-khoan');
  const menuTaiKhoanEl = document.getElementById('menu-tai-khoan');
  nutTaiKhoan?.addEventListener('click', () => {
    const dangMo = menuTaiKhoanEl.hasAttribute('hidden');
    if (dangMo) menuTaiKhoanEl.removeAttribute('hidden');
    else menuTaiKhoanEl.hidden = true;
    nutTaiKhoan.setAttribute('aria-expanded', dangMo ? 'true' : 'false');
  });
  document.getElementById('form-nhan-tin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oEmail = document.getElementById('email-nhan-tin');
    const trangThai = document.getElementById('nhan-tin-trang-thai');
    if (!oEmail?.value.trim()) return;
    if (trangThai) trangThai.textContent = 'Đã ghi nhận email.';
    oEmail.value = '';
  });

  ganSuKienNutMenu();
  ganCuonHeader();
  theoDoiSoLuongGioHang(Boolean(nguoiDung));
  ganNutHienMatKhau();
  ganHopThoai();
  veIcon();
  ganHienKhiCuon();
}

/** Bấm nút 3 gạch → thêm/bỏ class "open" để hiện/ẩn menu trên điện thoại */
function ganSuKienNutMenu() {
  const nutMenu = document.getElementById('nut-menu');
  const menu = document.getElementById('main-nav');
  const header = document.getElementById('site-header');
  if (!nutMenu || !menu) return;

  const datTrangThai = (mo) => {
    menu.classList.toggle('open', mo);
    header?.classList.toggle('menu-mo', mo);
    nutMenu.setAttribute('aria-expanded', mo ? 'true' : 'false');
    nutMenu.setAttribute('aria-label', mo ? 'Đóng menu' : 'Mở menu');
    nutMenu.innerHTML = `<i data-lucide="${mo ? 'x' : 'menu'}"></i>`;
    veIcon();
  };

  nutMenu.addEventListener('click', () => datTrangThai(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((the) => the.addEventListener('click', () => datTrangThai(false)));
  document.getElementById('fq-scrim')?.addEventListener('click', () => datTrangThai(false));
}

function ganCuonHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const capNhat = () => header.classList.toggle('header-rut', window.scrollY > 40);
  capNhat();
  window.addEventListener('scroll', capNhat, { passive: true });
}

/** Ảnh và khối .reveal hiện dần khi cuộn tới */
export function ganHienKhiCuon(goc = document) {
  const ds = [...goc.querySelectorAll('.reveal:not([data-da-quan-sat])')];
  if (!ds.length) return;
  const giamChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (giamChuyenDong || !('IntersectionObserver' in window)) {
    ds.forEach((el) => {
      el.classList.add('hien');
      el.dataset.daQuanSat = '1';
    });
    return;
  }
  const quanSat = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('hien');
        quanSat.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );
  ds.forEach((el) => {
    el.dataset.daQuanSat = '1';
    quanSat.observe(el);
  });
}

/** Cập nhật con số nhỏ trên icon giỏ hàng mỗi khi giỏ đổi */
function theoDoiSoLuongGioHang(daDangNhap) {
  const capNhatBadge = () => {
    const badge = document.getElementById('so-luong-gio-hang');
    if (!badge) return;
    const soLuong = gioHang.demSoLuong();
    badge.textContent = soLuong;
    badge.hidden = soLuong === 0;
  };

  gioHang.theoDoi(capNhatBadge);
  if (daDangNhap) gioHang.tai().then(capNhatBadge).catch(() => {});
}

// ------------------------------------------------------------- Khung trang admin
// Mục lục trái, xếp theo việc trong ngày. Ô tìm của từng trang nằm trong trang đó.

const MENU_ADMIN = [
  { nhom: 'Hôm nay', duongDan: 'dashboard.html', nhan: 'Tổng quan', icon: 'layout-dashboard', khoa: 'dashboard' },
  { duongDan: 'orders.html', nhan: 'Đơn hàng', icon: 'receipt', khoa: 'orders' },
  { duongDan: 'inventory.html', nhan: 'Tồn kho', icon: 'warehouse', khoa: 'inventory' },
  { nhom: 'Hàng hóa', duongDan: 'products.html', nhan: 'Sản phẩm', icon: 'package', khoa: 'products' },
  { duongDan: 'categories.html', nhan: 'Danh mục', icon: 'folder-tree', khoa: 'categories' },
  { nhom: 'Khách hàng', duongDan: 'users.html', nhan: 'Người dùng', icon: 'users', khoa: 'users' },
  { duongDan: 'reviews.html', nhan: 'Đánh giá', icon: 'message-square', khoa: 'reviews' },
  { duongDan: 'vouchers.html', nhan: 'Voucher', icon: 'ticket', khoa: 'vouchers' },
];

/**
 * Dựng mục lục và thanh tài khoản.
 * @param {string} trangHienTai khóa mục đang mở (xem MENU_ADMIN)
 */
export function dungKhungAdmin(trangHienTai) {
  const nguoiDung = taiKhoan.layNguoiDung();
  const sidebar = document.getElementById('admin-aside');
  const ten = nguoiDung?.fullName || 'Quản trị';
  const chuCai = ten.trim().charAt(0).toUpperCase() || 'Q';

  ganFavicon();
  damBaoKhungAdminMain();

  let nhomTruoc = '';
  const cacMucMenu = MENU_ADMIN.map((muc) => {
    const nhanNhom =
      muc.nhom && muc.nhom !== nhomTruoc
        ? `<p class="admin-nav-label">${muc.nhom}</p>`
        : '';
    if (muc.nhom) nhomTruoc = muc.nhom;
    const dangMo = trangHienTai === muc.khoa;
    return `
      ${nhanNhom}
      <a href="${muc.duongDan}" class="nav-item ${dangMo ? 'active' : ''}"
        ${dangMo ? 'aria-current="page"' : ''}>
        <i data-lucide="${muc.icon}"></i>
        <span>${muc.nhan}</span>
      </a>`;
  }).join('');

  sidebar.innerHTML = `
    <div class="admin-aside-inner">
      <div class="admin-brand-bar">
        <a href="dashboard.html" class="admin-brand">
          <span class="admin-brand-est">Est. 2018</span>
          <span class="admin-brand-name">Folio &amp; Quill</span>
          <span class="admin-brand-sub">Quầy quản trị</span>
        </a>
      </div>
      <nav class="admin-nav" aria-label="Mục quản trị">${cacMucMenu}</nav>
      <div class="admin-aside-footer">
        <a href="../index.html" class="admin-shop-link">
          <i data-lucide="arrow-up-right"></i>
          <span>Mở cửa hàng</span>
        </a>
      </div>
    </div>`;

  const topbar = document.getElementById('admin-topbar');
  if (topbar) {
    topbar.innerHTML = `
      <button type="button" class="admin-menu-btn" id="nut-menu-admin" aria-label="Mở menu">
        <i data-lucide="menu"></i>
      </button>
      <div class="admin-topbar-right">
        <div class="admin-topbar-user">
          <div class="admin-topbar-meta">
            <strong>${chuoiAnToan(ten)}</strong>
            <span>Quản trị</span>
          </div>
          <div class="admin-topbar-avatar" aria-hidden="true">${chuoiAnToan(chuCai)}</div>
        </div>
        <button type="button" class="admin-logout-link" id="nut-dang-xuat-topbar">
          <i data-lucide="log-out"></i>
          <span>Đăng xuất</span>
        </button>
      </div>`;
    document.getElementById('nut-dang-xuat-topbar')?.addEventListener('click', () => xuLyDangXuat('../index.html'));
  }

  const shell = document.querySelector('.admin-shell');
  document.getElementById('nut-menu-admin')?.addEventListener('click', () => {
    shell?.classList.toggle('menu-mo');
  });
  document.getElementById('admin-scrim')?.addEventListener('click', () => {
    shell?.classList.remove('menu-mo');
  });

  veIcon();
}

/** Bọc .admin-content bằng .admin-main + topbar nếu HTML cũ chưa có */
function damBaoKhungAdminMain() {
  const shell = document.querySelector('.admin-shell');
  if (!shell) return;
  if (!document.getElementById('admin-scrim')) {
    const scrim = document.createElement('button');
    scrim.id = 'admin-scrim';
    scrim.className = 'admin-scrim';
    scrim.type = 'button';
    scrim.setAttribute('aria-label', 'Đóng menu');
    shell.appendChild(scrim);
  }
  const content = document.querySelector('.admin-shell > .admin-content, .admin-shell > main.admin-content');
  if (!content || document.querySelector('.admin-main')) return;

  const main = document.createElement('div');
  main.className = 'admin-main';
  const topbar = document.createElement('header');
  topbar.className = 'admin-topbar';
  topbar.id = 'admin-topbar';
  content.parentNode.insertBefore(main, content);
  main.appendChild(topbar);
  main.appendChild(content);
}
