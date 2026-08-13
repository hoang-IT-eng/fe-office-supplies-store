/**
 * Trang chủ (index.html)
 * Việc của file này:
 * 1. Vẽ khung trang (banner + bộ lọc + chỗ danh sách)
 * 2. Gọi API lấy sản phẩm / danh mục
 * 3. Hiện card sản phẩm, phân trang
 * 4. Cho phép thêm vào giỏ ngay trên trang chủ
 */

import { api } from '../api.js';
import { auth } from '../auth.js';
import { cart } from '../cart.js';
import { fileUrl } from '../config.js';
import { fmtVND, esc } from '../format.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { toast } from '../toast.js';
import { bindLiveClear, guardForm } from '../validate.js';

// ---------- Trạng thái trang ----------
// app = khung HTML trống trong index.html: <div id="app"></div>
const app = document.getElementById('app');

// Danh mục lấy từ backend (ví dụ: Bút, Sổ tay...)
let categories = [];

// Đang xem trang số mấy (phân trang)
let currentPage = 1;

// Mỗi lần gọi API lấy tối đa bao nhiêu sản phẩm
const PAGE_SIZE = 8;

// Bộ lọc hiện tại (user chọn gì thì lưu vào đây)
const filters = {
  search: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
};

// ============================================================
// 1. VẼ KHUNG TRANG (chỉ chạy 1 lần khi mở trang)
// ============================================================

function renderPageLayout() {
  app.innerHTML = `
    <div class="home-page">
      <!-- Banner giới thiệu -->
      <section class="hero">
        <img src="${fileUrl('/uploads/banner.png')}" alt="Văn phòng phẩm chính hãng — mua sắm nhanh chóng &amp; tin cậy" />
      </section>

      <!-- Bộ lọc -->
      <section class="card filter-box" id="filter-box">
        <div class="filter-heading">
          <i data-lucide="sliders-horizontal" class="filter-heading-icon"></i>
          <h2>Tìm kiếm &amp; lọc sản phẩm</h2>
        </div>

        <div class="filter-fields">
          <div class="filter-search">
            <i data-lucide="search" class="filter-search-icon"></i>
            <input id="f-search" class="input filter-search-input" placeholder="Tìm kiếm sản phẩm..." />
          </div>
          <select id="f-category" class="input">
            <option value="">Tất cả danh mục</option>
          </select>
          <input id="f-min" class="input" placeholder="Giá từ" type="number" min="0" />
          <input id="f-max" class="input" placeholder="Giá đến" type="number" min="0" />
          <button id="f-apply" class="btn btn-primary" type="button">Lọc</button>
        </div>

        <!-- Nút chip danh mục nhanh (Tất cả / Bút / Sổ...) -->
        <div id="chips" class="filter-chips"></div>
      </section>

      <!-- Danh sách sản phẩm sẽ được đổ vào đây -->
      <section id="grid"></section>

      <!-- Nút trang 1, 2, 3... -->
      <nav id="pagination" aria-label="Phân trang sản phẩm"></nav>
    </div>
  `;
}

// ============================================================
// 2. CHIP DANH MỤC (nút lọc nhanh bên dưới form)
// ============================================================

function renderCategoryChips() {
  const chipsBox = document.getElementById('chips');
  if (!categories.length) return;

  // Nút "Tất cả"
  const allSelected = filters.categoryId === '';
  let html = `
    <button type="button" data-cat="" class="chip category-chip ${allSelected ? 'chip-primary' : 'chip-neutral'}">
      <i data-lucide="tag" class="filter-chip-icon"></i>
      Tất cả
    </button>
  `;

  // Mỗi danh mục = 1 nút
  categories.forEach((category) => {
    const selected = filters.categoryId === category.id;
    html += `
      <button
        type="button"
        data-cat="${category.id}"
        class="chip category-chip ${selected ? 'chip-primary' : 'chip-neutral'}"
      >
        ${esc(category.name)}
      </button>
    `;
  });

  chipsBox.innerHTML = html;

  // Khi bấm 1 chip → đổi bộ lọc → tải lại sản phẩm
  chipsBox.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      filters.categoryId = button.dataset.cat; // "" hoặc id danh mục
      currentPage = 1;
      renderCategoryChips();
      loadProducts();
    });
  });

  icons();
}

// ============================================================
// 3. TẢI SẢN PHẨM TỪ BACKEND
// ============================================================

function buildProductQuery() {
  // Object gửi kèm GET /products?...
  const params = {
    page: currentPage,
    limit: PAGE_SIZE,
  };

  if (filters.search) params.search = filters.search;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice !== '') params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice !== '') params.maxPrice = Number(filters.maxPrice);

  return params;
}

async function loadProducts() {
  const grid = document.getElementById('grid');
  const pagination = document.getElementById('pagination');

  // Hiện trạng thái đang tải
  grid.innerHTML = '<div class="products-loading">Đang tải...</div>';
  pagination.innerHTML = '';

  try {
    const data = await api.get('/products', { params: buildProductQuery() });
    const products = data.items || [];

    // Không có sản phẩm nào khớp bộ lọc
    if (products.length === 0) {
      grid.innerHTML = '<div class="card products-empty">Không có sản phẩm phù hợp.</div>';
      return;
    }

    // Ghép HTML của từng card thành 1 lưới
    let cardsHtml = '';
    products.forEach((product) => {
      cardsHtml += buildProductCard(product);
    });
    grid.innerHTML = `<div class="product-grid">${cardsHtml}</div>`;

    // Đồng bộ số trang từ server (phòng trường hợp lệch)
    currentPage = Number(data.page) || currentPage;

    renderPagination(data);
    bindAddToCartButtons(grid);
    icons();
  } catch {
    grid.innerHTML = '<div class="card products-empty">Lỗi tải sản phẩm.</div>';
  }
}

// ============================================================
// 4. PHÂN TRANG
// ============================================================

/** Trả về danh sách số trang cần hiện, ví dụ: [1, '…', 4, 5, 6, '…', 20] */
function getVisiblePageNumbers(page, totalPages) {
  // Ít trang thì hiện hết
  if (totalPages <= 7) {
    const list = [];
    for (let i = 1; i <= totalPages; i += 1) list.push(i);
    return list;
  }

  // Nhiều trang: luôn hiện trang 1, trang cuối, và vài trang quanh trang hiện tại
  const list = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) list.push('ellipsis');
  for (let i = start; i <= end; i += 1) list.push(i);
  if (end < totalPages - 1) list.push('ellipsis');
  list.push(totalPages);

  return list;
}

function renderPagination(data) {
  const pagination = document.getElementById('pagination');
  const totalPages = Number(data.totalPages) || 0;
  const total = Number(data.total) || 0;

  // Chỉ 1 trang thì không cần nút phân trang
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  // Các nút số trang ở giữa
  let pageButtonsHtml = '';
  getVisiblePageNumbers(currentPage, totalPages).forEach((item) => {
    if (typeof item !== 'number') {
      pageButtonsHtml += '<span class="pagination-ellipsis" aria-hidden="true">…</span>';
      return;
    }

    const isActive = item === currentPage;
    pageButtonsHtml += `
      <button
        type="button"
        class="pagination-btn ${isActive ? 'active' : ''}"
        data-page="${item}"
        ${isActive ? 'aria-current="page"' : ''}
      >
        ${item}
      </button>
    `;
  });

  const prevDisabled = currentPage <= 1 ? 'disabled' : '';
  const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

  pagination.innerHTML = `
    <p class="pagination-summary">${total} sản phẩm · Trang ${currentPage}/${totalPages}</p>
    <div class="pagination-controls">
      <button type="button" class="pagination-btn" data-page="${currentPage - 1}" ${prevDisabled} aria-label="Trang trước">
        <i data-lucide="chevron-left" class="pagination-icon"></i>
      </button>
      ${pageButtonsHtml}
      <button type="button" class="pagination-btn" data-page="${currentPage + 1}" ${nextDisabled} aria-label="Trang sau">
        <i data-lucide="chevron-right" class="pagination-icon"></i>
      </button>
    </div>
  `;

  // Bấm nút trang → đổi currentPage → tải lại
  pagination.querySelectorAll('[data-page]:not([disabled])').forEach((button) => {
    button.addEventListener('click', async () => {
      const nextPage = Number(button.dataset.page);
      if (nextPage === currentPage) return;

      currentPage = nextPage;
      await loadProducts();
      document.getElementById('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ============================================================
// 5. CARD SẢN PHẨM (1 sản phẩm = 1 khối HTML)
// ============================================================

function buildProductCard(product) {
  // Giá hiển thị: nếu có giá giảm thì dùng giá giảm
  const hasDiscount = Number(product.discountPrice) > 0;
  const displayPrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);

  // Tồn kho (nếu không có inventory thì coi như 0)
  const stock = product.inventory?.quantity ?? 0;
  const isOutOfStock = stock <= 0;

  // % giảm giá để hiện badge "-20%"
  let discountPercent = 0;
  if (hasDiscount) {
    discountPercent = Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100);
  }

  // Ảnh: lấy ảnh đầu tiên, không có thì dùng icon
  let imageHtml;
  if (product.images && product.images[0]) {
    imageHtml = `<img src="${fileUrl(product.images[0])}" alt="${esc(product.name)}" />`;
  } else {
    imageHtml = `<i data-lucide="shopping-bag" class="product-card-no-image"></i>`;
  }

  const discountBadge = discountPercent > 0
    ? `<span class="chip product-discount-badge">-${discountPercent}%</span>`
    : '';

  const stockBadge = isOutOfStock
    ? '<span class="chip chip-danger product-stock-badge">Hết hàng</span>'
    : '';

  const categoryHtml = product.category
    ? `<div class="product-card-category">${esc(product.category.name)}</div>`
    : '';

  const oldPriceHtml = hasDiscount
    ? `<span class="product-card-old-price">${fmtVND(product.price)}</span>`
    : '';

  const addButtonLabel = isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ';
  const addButtonDisabled = isOutOfStock ? 'disabled' : '';

  // Lưu ý: phần ảnh+tên là link sang trang chi tiết;
  // nút "Thêm vào giỏ" nằm NGOÀI thẻ <a> để không bị nhảy trang khi bấm.
  return `
    <article class="card product-card">
      <a href="product?id=${product.id}" class="product-card-link">
        <div class="product-thumb">
          ${imageHtml}
          ${discountBadge}
          ${stockBadge}
        </div>
        <div class="product-card-body">
          ${categoryHtml}
          <h3 class="product-card-name">
            ${esc(product.name)}
          </h3>
          <div class="product-card-prices">
            <span class="product-card-price">${fmtVND(displayPrice)}</span>
            ${oldPriceHtml}
          </div>
        </div>
      </a>

      <div class="product-card-actions">

        <button
          type="button"
          class="btn btn-primary btn-sm btn-block"
          data-add-cart="${esc(product.id)}"
          ${addButtonDisabled}
        >
          <i data-lucide="shopping-cart" class="product-card-button-icon"></i>
          ${addButtonLabel}
        </button>
      </div>
    </article>
  `;
}

// ============================================================
// 6. NÚT "THÊM VÀO GIỎ" TRÊN CARD
// ============================================================

function bindAddToCartButtons(grid) {
  const buttons = grid.querySelectorAll('[data-add-cart]');

  buttons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      // Không để trình duyệt làm hành vi mặc định / lan sự kiện
      event.preventDefault();
      event.stopPropagation();

      // Chưa đăng nhập thì không thêm được (API giỏ cần JWT)
      if (!auth.getUser()) {
        toast.error('Vui lòng đăng nhập');
        return;
      }

      if (button.disabled) return;

      // Khóa nút tạm thời tránh bấm 2 lần liên tục
      button.disabled = true;
      const productId = button.dataset.addCart;

      try {
        await cart.add(productId, 1); // thêm 1 sản phẩm
        toast.success('Đã thêm vào giỏ hàng');
      } catch (err) {
        const message = err?.response?.data?.message || 'Lỗi khi thêm giỏ hàng';
        toast.error(message);
      } finally {
        button.disabled = false;
      }
    });
  });
}

// ============================================================
// 7. BỘ LỌC (ô tìm kiếm + giá + select danh mục)
// ============================================================

function fillCategorySelect() {
  const select = document.getElementById('f-category');

  let optionsHtml = '<option value="">Tất cả danh mục</option>';
  categories.forEach((category) => {
    optionsHtml += `<option value="${category.id}">${esc(category.name)}</option>`;
  });

  select.innerHTML = optionsHtml;
  select.value = filters.categoryId;
}

function applyFilters() {
  const filterBox = document.getElementById('filter-box');
  const categorySelect = document.getElementById('f-category');

  // Kiểm tra dữ liệu nhập có hợp lệ không
  const check = guardForm(
    [
      { id: 'f-search', label: 'Từ khóa', rules: ['maxLength:100'] },
      { id: 'f-min', label: 'Giá từ', rules: ['number', 'min:0'] },
      { id: 'f-max', label: 'Giá đến', rules: ['number', 'min:0'] },
    ],
    filterBox,
    toast,
  );
  if (!check) return;

  const minValue = check.values['f-min'];
  const maxValue = check.values['f-max'];
  const min = minValue !== '' ? Number(minValue) : '';
  const max = maxValue !== '' ? Number(maxValue) : '';

  if (min !== '' && max !== '' && min > max) {
    toast.error('Giá từ không được lớn hơn giá đến');
    return;
  }

  // Lưu bộ lọc → về trang 1 → tải lại
  filters.search = String(check.values['f-search']).trim();
  filters.categoryId = categorySelect.value;
  filters.minPrice = minValue;
  filters.maxPrice = maxValue;
  currentPage = 1;

  renderCategoryChips();
  loadProducts();
}

function bindFilterEvents() {
  fillCategorySelect();

  const searchInput = document.getElementById('f-search');
  const categorySelect = document.getElementById('f-category');
  const applyButton = document.getElementById('f-apply');
  const filterBox = document.getElementById('filter-box');

  // Bấm nút "Lọc"
  applyButton.addEventListener('click', applyFilters);

  // Enter trong ô tìm kiếm cũng lọc
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applyFilters();
  });

  // Đổi danh mục trong select → lọc ngay
  categorySelect.addEventListener('change', applyFilters);

  // Khi user sửa input, xóa thông báo lỗi validate cũ
  bindLiveClear(filterBox);
}

// ============================================================
// 8. KHỞI ĐỘNG TRANG
// ============================================================

async function init() {
  // Gắn header / menu khách hàng
  mountCustomerChrome('home');

  // Vẽ khung HTML
  renderPageLayout();
  icons();

  // Lấy danh mục từ backend (lỗi thì để mảng rỗng)
  try {
    categories = await api.get('/categories');
  } catch {
    categories = [];
  }

  // Gắn sự kiện lọc + hiện chip + tải sản phẩm trang 1
  bindFilterEvents();
  renderCategoryChips();
  loadProducts();
}

// Chạy ngay khi trình duyệt load xong file này
init();
