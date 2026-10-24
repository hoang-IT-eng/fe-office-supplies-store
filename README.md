# Văn phòng phẩm Trần Huy Hoàng — Frontend (HTML / CSS / JavaScript thuần)

Toàn bộ giao diện viết bằng **HTML + CSS + JavaScript thuần** (không React, Vite, Tailwind).

Nguyên tắc chính: **mỗi trang = 1 file `.html` tự chứa**. Mở 1 file là thấy đủ 3 phần:

1. `<style>` — CSS riêng của trang đó
2. `<body>` — khung HTML tĩnh (form, bảng, section) viết sẵn, không phải div rỗng
3. `<script type="module">` ở cuối body — logic của trang (gọi API, đổ dữ liệu, gắn sự kiện)

Chỉ phần **động** (danh sách, phân trang, dòng bảng) mới được render bằng JavaScript.

## Cấu trúc thư mục

```
frontend/
├── index.html              # Trang chủ: lọc + lưới sản phẩm + phân trang
├── product.html            # Chi tiết sản phẩm (?id=...) + đánh giá
├── cart.html               # Giỏ hàng
├── checkout.html           # Thanh toán: địa chỉ GHN + voucher + COD
├── orders.html             # Đơn hàng của tôi
├── order-detail.html       # Chi tiết đơn hàng (?id=...) + theo dõi GHN
├── login.html  register.html
├── forgot-password.html  reset-password.html
├── profile.html            # Thông tin tài khoản + đổi mật khẩu
├── admin/                  # Khu vực quản trị (chỉ role ADMIN vào được)
│   ├── index.html          # redirect → products.html
│   ├── products.html  categories.html  inventory.html
│   ├── orders.html    order-detail.html
│   └── users.html     vouchers.html    reviews.html
├── css/
│   ├── style.css           # CSS CHUNG toàn site
│   └── admin.css           # CSS CHUNG riêng khu vực admin
└── js/                     # CHỈ các module dùng chung (không có js/pages/)
    ├── config.js           # API_URL, API_BASE, duongDanTapTin()
    ├── api.js              # api.get/post/patch/delete + tự refresh token khi 401
    ├── auth.js             # taiKhoan: lưu phiên đăng nhập vào localStorage
    ├── cart.js             # gioHang: giỏ hàng, đồng bộ với backend
    ├── format.js           # dinhDangTien, dinhDangNgay, nhan/chip trạng thái, chuoiAnToan
    ├── toast.js            # thongBao.thanhCong() / thongBao.loi()
    ├── layout.js           # header + footer khách hàng, sidebar admin, chặn truy cập
    └── validate.js         # kiemTraForm(): kiểm tra dữ liệu form
```

## Quy ước CSS

- `css/style.css`: design tokens (`:root`), reset, khung trang khách hàng, và các
  component dùng nhiều trang: `.btn`, `.form-input`, `.card`, `.chip`, `.data-table`,
  `.page-title`, `.toast`, `.pagination`, `.qty-box`, `.star`, ...
- `css/admin.css`: khung admin (`.admin-shell`, `.admin-aside`, `.admin-content`, `.nav-item`)
  và component chỉ admin dùng (`.stat-card`, `.filter-bar`, `.admin-form`).
- `<style>` trong từng file HTML: chỉ CSS bố cục riêng trang đó (`.login-card`, `.product-gallery`, ...).
- **Tên class theo khối/mục đích** (`.cart-item`, `.order-card`), **không dùng utility class**
  kiểu `.flex`, `.gap-4`, `.mb-4`, và không viết `style="..."` trong JavaScript.

## Quy ước JavaScript

- Tên hàm và biến bằng **tiếng Việt không dấu, camelCase**: `taiDanhSachSanPham()`,
  `xuLyDangNhap()`, `veBangSanPham()`, `ganSuKienBang()`.
- Đường dẫn import: từ trang gốc là `./js/api.js`, từ `admin/` là `../js/api.js`.
- Giữ tiếng Anh: URL API (`/products`, `/auth/login`), enum backend (`PENDING`, `ADMIN`),
  key localStorage (`auth-store`), tên thư viện CDN (lucide).
- Luôn dùng `chuoiAnToan()` khi chèn dữ liệu người dùng vào `innerHTML` (chống XSS).

## Cách chạy

Vì dùng ES Modules (`import`/`export`), phải chạy qua **web server tĩnh** — không mở bằng `file://`.

Chạy tại thư mục `frontend/`:

- **VS Code Live Server**: chuột phải `index.html` → *Open with Live Server* (cổng 5500).
- **Node**: `npx serve` hoặc `npx http-server -p 5500`
- **Python**: `python -m http.server 5500`

Sau đó mở trình duyệt tại địa chỉ server (ví dụ `http://localhost:5500`).

## Kết nối backend

Backend NestJS chạy tại `http://localhost:3000` (prefix `/api`). Đổi địa chỉ trong `js/config.js`:

```js
export const API_URL = 'http://localhost:3000/api';
export const API_BASE = 'http://localhost:3000';
```

CORS backend đã mở cho mọi origin `localhost`/`127.0.0.1` (mọi cổng) nên static server nào cũng dùng được.

## Ghi chú

- Icon dùng [Lucide](https://lucide.dev) qua CDN (`<i data-lucide="..."></i>`); sau khi render HTML mới
  phải gọi `veIcon()` để icon được vẽ lại.
- Token lưu ở `localStorage` (key `auth-store`), tự refresh khi hết hạn.
- Trang khách hàng cần đăng nhập gọi `batBuocDangNhap()`, trang admin gọi `batBuocAdmin()`.
