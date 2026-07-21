import { api } from '../api.js';
import { fileUrl } from '../config.js';
import { fmtVND, esc } from '../format.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { toast } from '../toast.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
let categories = [];
const filters = { search: '', categoryId: '', minPrice: '', maxPrice: '' };

function shell() {
  app.innerHTML = `
    <div class="space-y-8">
      <section class="hero">
        <div class="hero-badge"><i data-lucide="sparkles" style="width:14px;height:14px"></i> Văn phòng phẩm chính hãng</div>
        <h1 class="text-4xl font-extrabold" style="max-width:40rem;letter-spacing:-.02em">
          Mua sắm văn phòng phẩm<br /><span style="color:var(--tertiary-fixed)">nhanh chóng &amp; tin cậy</span>
        </h1>
        <p class="mt-4" style="max-width:36rem;opacity:.9">Hơn 1,000+ sản phẩm chất lượng — bút viết, sổ tay, dụng cụ học tập, đồ dùng văn phòng.</p>
      </section>

      <section class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <i data-lucide="sliders-horizontal" class="text-primary" style="width:18px;height:18px"></i>
          <h2 class="font-bold">Tìm kiếm &amp; lọc sản phẩm</h2>
        </div>
        <div class="grid gap-3" style="grid-template-columns:2fr 1.5fr 1fr 1fr auto;align-items:end">
          <div class="input-wrap">
            <i data-lucide="search" class="input-icon" style="width:16px;height:16px"></i>
            <input id="f-search" class="input pl-10" placeholder="Tìm kiếm sản phẩm..." />
          </div>
          <select id="f-category" class="input"><option value="">Tất cả danh mục</option></select>
          <input id="f-min" class="input" placeholder="Giá từ" type="number" min="0" />
          <input id="f-max" class="input" placeholder="Giá đến" type="number" min="0" />
          <button id="f-apply" class="btn btn-primary">Lọc</button>
        </div>
        <div id="chips" class="flex flex-wrap gap-2 mt-4"></div>
      </section>

      <section id="grid"></section>
    </div>`;
}

function renderChips() {
  const chips = document.getElementById('chips');
  if (!categories.length) return;
  chips.innerHTML =
    `<button data-cat="" class="chip ${filters.categoryId === '' ? 'chip-primary' : 'chip-neutral'}"><i data-lucide="tag" style="width:12px;height:12px"></i> Tất cả</button>` +
    categories
      .map(
        (c) =>
          `<button data-cat="${c.id}" class="chip ${filters.categoryId === c.id ? 'chip-primary' : 'chip-neutral'}">${esc(c.name)}</button>`,
      )
      .join('');
  chips.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => {
      filters.categoryId = b.dataset.cat;
      renderChips();
      load();
    }),
  );
  icons();
}

async function load() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '<div class="loading-block">Đang tải...</div>';
  const params = { page: 1, limit: 24 };
  if (filters.search) params.search = filters.search;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice !== '') params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice !== '') params.maxPrice = Number(filters.maxPrice);
  try {
    const data = await api.get('/products', { params });
    const items = data.items || [];
    if (!items.length) {
      grid.innerHTML = '<div class="empty-block card muted">Không có sản phẩm phù hợp.</div>';
      return;
    }
    grid.innerHTML = `<div class="product-grid">${items.map(card).join('')}</div>`;
    icons();
  } catch {
    grid.innerHTML = '<div class="empty-block card muted">Lỗi tải sản phẩm.</div>';
  }
}

function card(p) {
  const price = Number(p.discountPrice) > 0 ? Number(p.discountPrice) : Number(p.price);
  const stock = p.inventory?.quantity ?? 0;
  const pct = Number(p.discountPrice) > 0 ? Math.round((1 - Number(p.discountPrice) / Number(p.price)) * 100) : 0;
  const img = p.images?.[0]
    ? `<img src="${fileUrl(p.images[0])}" alt="${esc(p.name)}" />`
    : `<i data-lucide="shopping-bag" class="muted" style="width:48px;height:48px"></i>`;
  return `
    <a href="product?id=${p.id}" class="card product-card">
      <div class="product-thumb">
        ${img}
        ${pct > 0 ? `<span class="chip badge-tl" style="background:var(--tertiary);color:#fff">-${pct}%</span>` : ''}
        ${stock <= 0 ? '<span class="chip chip-danger badge-tr">Hết hàng</span>' : ''}
      </div>
      <div style="padding:.875rem">
        ${p.category ? `<div class="text-xs uppercase tracking-wide font-bold muted">${esc(p.category.name)}</div>` : ''}
        <h3 class="font-semibold line-clamp-2" style="margin-top:.125rem;min-height:44px">${esc(p.name)}</h3>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-primary font-bold text-lg">${fmtVND(price)}</span>
          ${Number(p.discountPrice) > 0 ? `<span class="text-xs muted line-through">${fmtVND(p.price)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

function bindFilters() {
  const search = document.getElementById('f-search');
  const cat = document.getElementById('f-category');
  cat.innerHTML =
    '<option value="">Tất cả danh mục</option>' +
    categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  cat.value = filters.categoryId;
  const apply = () => {
    const filterForm = document.querySelector('.card.p-5');
    const check = guardForm(
      [
        { id: 'f-search', label: 'Từ khóa', rules: ['maxLength:100'] },
        { id: 'f-min', label: 'Giá từ', rules: ['number', 'min:0'] },
        { id: 'f-max', label: 'Giá đến', rules: ['number', 'min:0'] },
      ],
      filterForm,
      toast,
    );
    if (!check) return;
    const min = check.values['f-min'] !== '' ? Number(check.values['f-min']) : '';
    const max = check.values['f-max'] !== '' ? Number(check.values['f-max']) : '';
    if (min !== '' && max !== '' && min > max) {
      toast.error('Giá từ không được lớn hơn giá đến');
      return;
    }
    filters.search = String(check.values['f-search']).trim();
    filters.categoryId = cat.value;
    filters.minPrice = check.values['f-min'];
    filters.maxPrice = check.values['f-max'];
    renderChips();
    load();
  };
  document.getElementById('f-apply').addEventListener('click', apply);
  search.addEventListener('keydown', (e) => e.key === 'Enter' && apply());
  cat.addEventListener('change', apply);
  bindLiveClear(document.querySelector('.card.p-5'));
}

async function init() {
  mountCustomerChrome('home');
  shell();
  icons();
  try {
    categories = await api.get('/categories');
  } catch {
    categories = [];
  }
  bindFilters();
  renderChips();
  load();
}

init();
