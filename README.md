# Văn phòng phẩm Trần Huy Hoàng — Frontend (HTML / CSS / JavaScript thuần)

Toàn bộ giao diện được viết bằng **HTML + CSS + JavaScript thuần** (không dùng React/Vite/Tailwind).
Mỗi trang là một file `.html` riêng (mô hình Multi-Page), dùng chung CSS và các module JS.

## Cấu trúc thư mục

```
frontend/
├── index.html              # Trang chủ (danh sách sản phẩm)
├── product.html            # Chi tiết sản phẩm  (?id=...)
├── cart.html               # Giỏ hàng
├── checkout.html           # Thanh toán (GHN + voucher + COD/MoMo)
├── orders.html             # Đơn hàng của tôi
├── order-detail.html       # Chi tiết đơn hàng  (?id=...)
├── login.html / register.html
├── forgot-password.html / reset-password.html
├── profile.html            # Tài khoản
├── admin/                  # Khu vực quản trị (yêu cầu role ADMIN)
│   ├── products.html  categories.html  inventory.html
│   ├── orders.html    order-detail.html
│   ├── users.html     vouchers.html
│   └── index.html          # redirect → products.html
├── css/
│   └── style.css           # Toàn bộ style (design tokens + component classes)
└── js/
    ├── config.js           # Địa chỉ backend (API_URL, API_BASE)
    ├── api.js              # fetch wrapper + tự refresh token khi 401
    ├── auth.js             # Lưu phiên đăng nhập vào localStorage
    ├── cart.js             # Giỏ hàng (đồng bộ với backend)
    ├── format.js           # Định dạng tiền/ngày, nhãn trạng thái, escape HTML
    ├── toast.js            # Thông báo toast
    ├── momo.js             # Helper thanh toán MoMo
    ├── layout.js           # Header/Footer + sidebar admin + guard đăng nhập
    └── pages/              # Logic của từng trang
        ├── *.js
        └── admin/*.js
```

## Cách chạy

Vì dùng ES Modules (`import`/`export`), cần chạy qua một **web server tĩnh** (không mở trực tiếp bằng `file://`).

Chọn một trong các cách sau, chạy tại thư mục `frontend/`:

- **VS Code Live Server**: chuột phải `index.html` → *Open with Live Server* (mặc định cổng 5500).
- **Node**: `npx serve` hoặc `npx http-server -p 5500`
- **Python**: `python -m http.server 5500`

Sau đó mở trình duyệt tại địa chỉ server (ví dụ `http://localhost:5500`).

## Kết nối backend

- Backend NestJS chạy tại `http://localhost:3000` (prefix `/api`).
- Nếu backend đổi địa chỉ, sửa `js/config.js`:

```js
export const API_URL = 'http://localhost:3000/api';
export const API_BASE = 'http://localhost:3000';
```

- CORS backend đã được cấu hình cho mọi origin `localhost`/`127.0.0.1` (mọi cổng), nên các static server phổ biến đều dùng được.

## Ghi chú

- Icon dùng [Lucide](https://lucide.dev) qua CDN (`<i data-lucide="...">`), gọi `lucide.createIcons()` sau khi render.
- Token lưu ở `localStorage` (key `auth-store`); tự động refresh khi hết hạn.
- Thanh toán MoMo dùng môi trường **sandbox** — cần app *MoMo Test*, OTP `000000`.
