# Hướng dẫn Frontend — Stationery Shop

> Tài liệu này giải thích toàn bộ code frontend cho người mới, từ cấu trúc thư mục đến từng file cụ thể.

---

## Mục lục

1. [Tổng quan công nghệ](#1-tổng-quan-công-nghệ)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Điểm khởi đầu — main.jsx và App.jsx](#3-điểm-khởi-đầu--mainjsx-và-appjsx)
4. [Routing — cách điều hướng trang](#4-routing--cách-điều-hướng-trang)
5. [State Management — Zustand Store](#5-state-management--zustand-store)
6. [Giao tiếp API — lib/api.js](#6-giao-tiếp-api--libapiijs)
7. [Components dùng chung](#7-components-dùng-chung)
8. [Các trang (Pages)](#8-các-trang-pages)
9. [Design System — Tailwind + CSS](#9-design-system--tailwind--css)
10. [Chạy dự án](#10-chạy-dự-án)

---

## 1. Tổng quan công nghệ

| Thư viện | Vai trò | Phiên bản |
|---|---|---|
| **React 18** | Thư viện xây dựng giao diện | ^18.3.1 |
| **Vite** | Build tool & dev server (nhanh hơn CRA) | ^5.3.4 |
| **React Router v6** | Điều hướng giữa các trang | ^6.26.0 |
| **Zustand** | Quản lý state toàn cục (thay Redux) | ^4.5.4 |
| **Axios** | Gọi HTTP API đến backend | ^1.7.2 |
| **Tailwind CSS** | Viết CSS bằng class (utility-first) | ^3.4.6 |
| **Lucide React** | Bộ icon | ^0.460.0 |
| **Framer Motion** | Animation mượt | ^11.18.2 |
| **React Hot Toast** | Thông báo popup (toast) | ^2.4.1 |

---

## 2. Cấu trúc thư mục

```
frontend/
├── index.html              ← HTML gốc, React "gắn" vào thẻ <div id="root">
├── vite.config.js          ← Cấu hình Vite (port, plugins)
├── tailwind.config.js      ← Cấu hình màu sắc, font, shadow custom
├── package.json            ← Danh sách thư viện & scripts
└── src/
    ├── main.jsx            ← Điểm khởi đầu, render React vào HTML
    ├── App.jsx             ← Định nghĩa tất cả route (đường dẫn URL)
    ├── index.css           ← CSS toàn cục + các class tiện ích (.btn-primary, .card...)
    │
    ├── components/         ← Các component tái sử dụng
    │   ├── Layout.jsx      ← Khung chính: header + nav + footer
    │   ├── RequireAuth.jsx ← Bảo vệ route: chưa đăng nhập → chuyển /login
    │   └── RequireAdmin.jsx← Bảo vệ route: không phải Admin → chuyển /
    │
    ├── lib/                ← Hàm tiện ích
    │   ├── api.js          ← Cấu hình axios + tự động refresh token
    │   └── format.js       ← Hàm format tiền (fmtVND) và ngày (fmtDate)
    │
    ├── store/              ← State toàn cục (Zustand)
    │   ├── auth.js         ← Lưu thông tin user + token đăng nhập
    │   └── cart.js         ← Lưu danh sách sản phẩm trong giỏ hàng
    │
    └── pages/              ← Các trang tương ứng với URL
        ├── HomePage.jsx
        ├── ProductDetailPage.jsx
        ├── CartPage.jsx
        ├── CheckoutPage.jsx
        ├── OrdersPage.jsx
        ├── OrderDetailPage.jsx
        ├── LoginPage.jsx
        ├── RegisterPage.jsx
        ├── ForgotPasswordPage.jsx
        ├── ResetPasswordPage.jsx
        ├── ProfilePage.jsx
        └── admin/
            ├── AdminLayout.jsx
            ├── AdminProducts.jsx
            ├── AdminCategories.jsx
            ├── AdminOrders.jsx
            ├── AdminUsers.jsx
            └── AdminInventory.jsx
```

---

## 3. Điểm khởi đầu — main.jsx và App.jsx

### `src/main.jsx`

```jsx
// Đây là file đầu tiên chạy khi mở web
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>   {/* Bật tính năng điều hướng URL */}
      <App />
      <Toaster position="top-right" />  {/* Hiện toast ở góc phải */}
    </BrowserRouter>
  </React.StrictMode>
);
```

**Giải thích:**
- `ReactDOM.createRoot` → chọn thẻ `<div id="root">` trong `index.html` để React "vẽ" vào đó
- `BrowserRouter` → cho phép dùng URL kiểu `/products/123` thay vì `/#/products/123`
- `Toaster` → đặt một lần ở đây, bất kỳ trang nào cũng có thể gọi `toast.success(...)` để hiện thông báo

### `src/App.jsx`

File này chỉ làm một việc: **khai báo tất cả các route** (URL ↔ component nào hiển thị).

---

## 4. Routing — cách điều hướng trang

Dự án dùng **React Router v6** với cấu trúc route lồng nhau (nested routes):

```
/                    → HomePage          (công khai)
/products/:id        → ProductDetailPage (công khai)
/login               → LoginPage         (công khai)
/register            → RegisterPage      (công khai)
/forgot-password     → ForgotPasswordPage(công khai)
/reset-password      → ResetPasswordPage (công khai)

/cart                → CartPage          (cần đăng nhập)
/checkout            → CheckoutPage      (cần đăng nhập)
/orders              → OrdersPage        (cần đăng nhập)
/orders/:id          → OrderDetailPage   (cần đăng nhập)
/profile             → ProfilePage       (cần đăng nhập)

/admin/products      → AdminProducts     (cần role ADMIN)
/admin/categories    → AdminCategories   (cần role ADMIN)
/admin/orders        → AdminOrders       (cần role ADMIN)
/admin/users         → AdminUsers        (cần role ADMIN)
/admin/inventory     → AdminInventory    (cần role ADMIN)
```

### Cơ chế route lồng nhau

```jsx
// App.jsx — đơn giản hoá
<Routes>
  {/* Nhóm 1: Trang public — dùng Layout (có header/footer) */}
  <Route element={<Layout />}>
    <Route index element={<HomePage />} />           {/* / */}
    <Route path="products/:id" element={<ProductDetailPage />} />

    {/* Nhóm con: Cần đăng nhập */}
    <Route element={<RequireAuth />}>
      <Route path="cart" element={<CartPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
  </Route>

  {/* Nhóm 2: Trang Admin — cần role ADMIN */}
  <Route path="/admin" element={<RequireAdmin />}>
    <Route element={<AdminLayout />}>
      <Route path="products" element={<AdminProducts />} />
    </Route>
  </Route>
</Routes>
```

**Khái niệm `<Outlet />`:** Khi route lồng nhau, component cha dùng `<Outlet />` như "ô trống" để React Router điền component con vào. Ví dụ `Layout.jsx` có `<Outlet />` trong `<main>` — tuỳ URL mà nó sẽ hiển thị `HomePage` hay `CartPage`...

---

## 5. State Management — Zustand Store

**Zustand** là thư viện quản lý state đơn giản hơn Redux. State được chia làm 2 store:

### `src/store/auth.js` — Thông tin đăng nhập

```js
export const useAuthStore = create(
  persist(                        // persist = tự lưu vào localStorage
    (set) => ({
      user: null,                 // object User (id, email, fullName, role)
      accessToken: null,          // JWT ngắn hạn (15 phút)
      refreshToken: null,         // JWT dài hạn (7 ngày)

      setSession: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),   // Gọi sau khi đăng nhập

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),         // Gọi sau khi refresh

      setUser: (user) => set({ user }),             // Cập nhật thông tin profile

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }), // Xoá hết
    }),
    { name: 'auth-store' }        // key trong localStorage
  )
);
```

**Cách dùng trong component:**
```jsx
const { user, logout } = useAuthStore();    // Lấy user và hàm logout
const setSession = useAuthStore(s => s.setSession);  // Chỉ lấy một hàm
```

### `src/store/cart.js` — Giỏ hàng

```js
export const useCartStore = create((set, get) => ({
  items: [],          // Mảng CartItem từ server
  loading: false,

  fetch: async () => { /* GET /cart */ },           // Tải giỏ hàng từ server
  add: async (productId, quantity) => { /* POST /cart */ },
  update: async (itemId, quantity) => { /* PATCH /cart/:id */ },
  remove: async (itemId) => { /* DELETE /cart/:id */ },
  clear: async () => { /* DELETE /cart */ },

  total: () => /* tính tổng tiền */,
  count: () => /* đếm tổng số lượng */,
}));
```

> Giỏ hàng **không** dùng `persist` vì dữ liệu được lưu phía backend, mỗi lần cần thì gọi `fetch()`.

---

## 6. Giao tiếp API — lib/api.js

Đây là file quan trọng nhất, xử lý toàn bộ việc gọi HTTP đến backend.

### Tạo axios instance

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

Thay vì `axios.get('http://localhost:3000/api/products')`, bây giờ chỉ cần viết `api.get('/products')`.

### Interceptor 1 — Gắn token vào mọi request

```js
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Mỗi lần gọi API, interceptor tự động thêm header `Authorization: Bearer <token>` — không cần làm thủ công trong từng component.

### Interceptor 2 — Tự động refresh token khi hết hạn

```
Request gọi API
   ↓
Server trả về lỗi 401 (token hết hạn)
   ↓
Interceptor bắt lỗi 401
   ↓
Gọi POST /auth/refresh với refreshToken
   ↓
Nhận accessToken mới → lưu vào store
   ↓
Thử lại request ban đầu với token mới
   ↓
Trả về kết quả bình thường cho component
```

Người dùng sẽ không bao giờ thấy lỗi "phiên hết hạn" chỉ vì accessToken ngắn hạn — hệ thống tự xử lý.

**Cơ chế queue:** Nếu có nhiều request cùng lúc bị 401, chúng sẽ chờ vào hàng đợi (`queue`), chỉ refresh một lần rồi phát lại tất cả — tránh gọi refresh nhiều lần.

### Hàm `fileUrl`

```js
export const fileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;      // URL đầy đủ thì giữ nguyên
  return `${API_BASE}${path}`;                   // /uploads/abc.jpg → http://localhost:3000/uploads/abc.jpg
};
```

Dùng để hiển thị ảnh sản phẩm được upload lên server.

---

## 7. Components dùng chung

### `Layout.jsx` — Khung chung của website

Component này hiển thị **header** (thanh điều hướng phía trên) và **footer** (phía dưới). Nội dung từng trang được điền vào giữa thông qua `<Outlet />`.

**Logic chính trong header:**
- Nếu đã đăng nhập (`user !== null`): hiện tên, avatar chữ cái đầu, nút logout
- Nếu chưa đăng nhập: hiện nút "Đăng nhập" và "Đăng ký"
- Nếu là ADMIN: hiện thêm nút "Admin"
- Icon giỏ hàng hiện badge số lượng (`cart.count()`) nếu có hàng

```jsx
useEffect(() => {
  if (user) cart.fetch().catch(() => {});
}, [user?.id]);
// Khi user đăng nhập, tự động tải giỏ hàng
```

### `RequireAuth.jsx` — Bảo vệ trang cần đăng nhập

```jsx
export default function RequireAuth() {
  const { user } = useAuthStore();
  const loc = useLocation();

  if (!user)
    return <Navigate to={`/login?next=${loc.pathname}`} replace />;
  // Ví dụ: vào /cart khi chưa đăng nhập → chuyển đến /login?next=/cart

  return <Outlet />;  // Đã đăng nhập → hiển thị trang con bình thường
}
```

### `RequireAdmin.jsx` — Bảo vệ trang admin

```jsx
export default function RequireAdmin() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  // Không phải ADMIN → đuổi về trang chủ

  return <Outlet />;
}
```

---

## 8. Các trang (Pages)

### `HomePage.jsx` — Trang chủ / danh sách sản phẩm

**Chức năng:** Hiển thị lưới sản phẩm, cho phép lọc theo tên, danh mục, khoảng giá.

**State local:**
```js
const [products, setProducts] = useState([]);   // Danh sách sản phẩm
const [categories, setCategories] = useState([]); // Danh sách danh mục
const [search, setSearch] = useState('');
const [categoryId, setCategoryId] = useState('');
const [minPrice, setMinPrice] = useState('');
const [maxPrice, setMaxPrice] = useState('');
```

**Flow dữ liệu:**
```
useEffect chạy khi mount
  → api.get('/categories')   → setCategories(...)
  → load()
      → api.get('/products', { params: { search, categoryId, ... } })
      → setProducts(data.items)
```

Khi user chọn danh mục (`setCategoryId`), `useEffect` theo dõi `categoryId` sẽ tự gọi lại `load()`.

**Hiệu ứng:** Mỗi card sản phẩm dùng `motion.div` của Framer Motion để fade-in lần lượt (`delay: idx * 0.03`).

---

### `LoginPage.jsx` — Trang đăng nhập

**State:**
```js
const [form, setForm] = useState({ email: '', password: '' });
const [loading, setLoading] = useState(false);
```

**Xử lý submit:**
```js
const submit = async (e) => {
  e.preventDefault();         // Ngăn form reload trang
  setLoading(true);
  try {
    const { data } = await api.post('/auth/login', form);
    setSession(data.user, data.accessToken, data.refreshToken);  // Lưu vào store
    toast.success('Đăng nhập thành công');
    navigate(params.get('next') || '/');  // Chuyển về trang trước hoặc trang chủ
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
  } finally {
    setLoading(false);
  }
};
```

**Tính năng:** Nếu URL có `?next=/cart`, sau khi đăng nhập sẽ tự chuyển về `/cart` (do `RequireAuth` truyền vào).

---

### `ProductDetailPage.jsx` — Chi tiết sản phẩm

**Lấy ID từ URL:**
```js
const { id } = useParams();   // URL /products/abc-123 → id = "abc-123"
```

**Tính toán hiển thị:**
```js
const price = discountPrice > 0 ? discountPrice : price;  // Giá sau giảm
const discountPct = Math.round((1 - discountPrice / price) * 100); // % giảm
const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
```

**Hai chức năng chính:**
1. **Thêm vào giỏ:** `cart.add(product.id, quantity)` → gọi store
2. **Gửi đánh giá:** `api.post('/reviews', { productId, rating, comment })` → reload lại trang

---

### `CartPage.jsx` — Giỏ hàng

**Cập nhật số lượng:**
```js
const updateQty = async (itemId, quantity) => {
  if (quantity < 1) return;   // Không cho số âm
  await cart.update(itemId, quantity);
};
```

Khi nhấn `−` / `+` hoặc nhập trực tiếp vào ô số → gọi `updateQty`.

**Layout:** Grid 3 cột — 2 cột trái là danh sách sản phẩm, 1 cột phải là "Tóm tắt đơn hàng" (sticky, luôn hiển thị khi scroll).

---

### Các trang Admin

Tất cả trang admin (`AdminProducts`, `AdminCategories`, `AdminOrders`, `AdminUsers`, `AdminInventory`) đều có cấu trúc tương tự:

```
mount → api.get(endpoint) → hiển thị bảng dữ liệu
       ↓
Nút "Thêm mới" → mở modal form → api.post(endpoint)
Nút "Sửa"     → mở modal form điền sẵn dữ liệu → api.patch(endpoint/:id)
Nút "Xoá"     → confirm → api.delete(endpoint/:id)
       ↓
Sau mỗi thao tác → gọi lại api.get() để cập nhật bảng
```

---

## 9. Design System — Tailwind + CSS

### Màu sắc custom (`tailwind.config.js`)

```js
colors: {
  primary: { DEFAULT: '#005ab4', ... },  // Xanh dương chính
  tertiary: { DEFAULT: '#964400', ... }, // Cam (cảnh báo, giảm giá)
  surface: { ... },                       // Các tông nền trắng xám
  error: { DEFAULT: '#ba1a1a', ... },    // Đỏ lỗi
  success: '#16a34a',                    // Xanh lá thành công
}
```

Thay vì `text-blue-600`, dùng `text-primary` để đồng nhất với design system.

### Các class tiện ích trong `index.css`

| Class | Dùng cho |
|---|---|
| `.btn-primary` | Nút chính (xanh, shadow) |
| `.btn-outline` | Nút viền |
| `.card` | Khung trắng bo góc, shadow nhẹ |
| `.card-elevated` | Card nổi hơn, shadow đậm |
| `.input` | Ô input chuẩn |
| `.chip` | Badge nhỏ |
| `.chip-success` | Badge xanh "Còn hàng" |
| `.chip-danger` | Badge đỏ "Hết hàng" |
| `.chip-info` | Badge xanh thông tin |
| `.section-title` | Tiêu đề section |

**Ví dụ:**
```jsx
<button className="btn-primary">Thêm vào giỏ</button>
<div className="card p-6">...</div>
<span className="chip-success">Còn 5 sản phẩm</span>
```

### Shadow custom

```js
boxShadow: {
  soft: '...',      // shadow nhẹ, dùng cho card bình thường
  elevated: '...',  // shadow đậm hơn, dùng cho modal, card nổi bật
}
// Dùng: className="shadow-soft" hoặc "shadow-elevated"
```

---

## 10. Chạy dự án

### Yêu cầu
- Node.js >= 18
- Backend đang chạy ở `http://localhost:3000`

### Cài đặt

```bash
cd frontend
npm install
```

### Tạo file môi trường

Tạo file `.env` (hoặc copy từ `.env.example`):
```env
VITE_API_URL=http://localhost:3000/api
VITE_API_BASE=http://localhost:3000
```

### Chạy dev server

```bash
npm run dev
# → http://localhost:5173
```

### Build production

```bash
npm run build
# → output vào thư mục dist/
```

---

## Tóm tắt luồng dữ liệu

```
User thao tác trên UI
    ↓
Component gọi hàm trong store (Zustand)
    hoặc gọi trực tiếp api.get/post/...
    ↓
api.js (axios) tự động gắn JWT token
    ↓
Request đến Backend (NestJS :3000)
    ↓
Backend trả JSON
    ↓
Component cập nhật state → React re-render → UI thay đổi
```

---

*Tài liệu này được tạo tự động dựa trên source code thực tế của dự án.*
