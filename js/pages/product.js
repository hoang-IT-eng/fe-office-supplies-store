import { api } from '../api.js';
import { fileUrl } from '../config.js';
import { fmtVND, fmtDate, esc } from '../format.js';
import { cart } from '../cart.js';
import { auth } from '../auth.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { guardForm } from '../validate.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('id');
let product = null;
let imageIdx = 0;
let quantity = 1;
let rating = 5;

const stars = (value, size = 16) =>
  [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<i data-lucide="star" class="star ${value >= n ? 'filled' : ''}" style="width:${size}px;height:${size}px;${value >= n ? 'fill:#f59e0b' : ''}"></i>`,
    )
    .join('');

function render() {
  if (!product) {
    app.innerHTML = '<div class="loading-block">Đang tải...</div>';
    return;
  }
  const stock = product.inventory?.quantity ?? 0;
  const price = Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Number(product.price);
  const pct =
    Number(product.discountPrice) > 0 ? Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100) : 0;
  const reviews = product.reviews || [];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const user = auth.getUser();

  const gallery = product.images?.[imageIdx]
    ? `<img src="${fileUrl(product.images[imageIdx])}" alt="${esc(product.name)}" style="width:100%;height:100%;object-fit:cover" />`
    : `<i data-lucide="box" class="muted" style="width:64px;height:64px"></i>`;

  const thumbs =
    (product.images?.length ?? 0) > 1
      ? `<div class="flex gap-2 overflow-x-auto">${product.images
          .map(
            (img, i) =>
              `<button data-thumb="${i}" class="shrink-0" style="width:5rem;height:5rem;border-radius:.5rem;overflow:hidden;border:2px solid ${i === imageIdx ? 'var(--primary)' : 'transparent'}"><img src="${fileUrl(img)}" style="width:100%;height:100%;object-fit:cover" /></button>`,
          )
          .join('')}</div>`
      : '';

  app.innerHTML = `
    <div class="space-y-8">
      <a href="index.html" class="inline-flex items-center gap-2 text-sm muted"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Quay lại danh sách</a>
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <div class="card place-items-center grid" style="aspect-ratio:1/1;overflow:hidden;background:var(--surface-low)">${gallery}</div>
          ${thumbs}
        </div>
        <div>
          ${product.category ? `<div class="chip chip-info mb-3"><i data-lucide="tag" style="width:12px;height:12px"></i> ${esc(product.category.name)}</div>` : ''}
          <h1 class="text-3xl font-extrabold">${esc(product.name)}</h1>
          <div class="text-xs muted mt-1">SKU: ${esc(product.sku)}</div>
          <div class="flex items-center gap-3 mt-4">
            <div class="flex items-center gap-1">${stars(Number(avg))}</div>
            <span class="text-sm font-semibold">${avg}</span>
            <span class="text-sm muted">(${reviews.length} đánh giá)</span>
          </div>
          <div class="mt-4 flex items-baseline gap-3">
            <span class="text-4xl font-extrabold text-primary">${fmtVND(price)}</span>
            ${Number(product.discountPrice) > 0 ? `<span class="muted line-through">${fmtVND(product.price)}</span><span class="chip" style="background:var(--tertiary);color:#fff">-${pct}%</span>` : ''}
          </div>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="muted">Tồn kho:</span>
            ${stock > 0 ? `<span class="chip chip-success">Còn ${stock} sản phẩm</span>` : '<span class="chip chip-danger">Hết hàng</span>'}
          </div>
          ${product.description ? `<div class="mt-4 p-4 rounded-lg text-sm" style="background:var(--surface-low);white-space:pre-line">${esc(product.description)}</div>` : ''}
          <div class="mt-4 flex items-center gap-3">
            <div class="qty-box">
              <button id="qty-dec">−</button>
              <input id="qty" type="number" min="1" max="${stock}" value="${quantity}" />
              <button id="qty-inc">+</button>
            </div>
            <button id="add-cart" class="btn btn-primary btn-lg flex-1" ${stock <= 0 ? 'disabled' : ''}>
              <i data-lucide="shopping-cart" style="width:18px;height:18px"></i> ${stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
          </div>
        </div>
      </div>

      <section class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <i data-lucide="message-square" class="text-primary" style="width:20px;height:20px"></i>
          <h2 class="font-bold text-lg">Đánh giá (${reviews.length})</h2>
        </div>
        ${
          user
            ? `<div class="rounded-lg p-4 mb-4" style="background:var(--surface-low)">
                 <div class="flex items-center gap-3 mb-3">
                   <span class="text-sm font-semibold">Đánh giá của bạn:</span>
                   <div class="flex gap-1" id="rating-stars">${stars(rating, 20)}</div>
                 </div>
                 <textarea id="review-comment" class="input" rows="3" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."></textarea>
                 <div class="flex items-center justify-between mt-2">
                   <p class="text-xs muted">* Chỉ đánh giá được khi đã mua sản phẩm này</p>
                   <button id="submit-review" class="btn btn-primary"><i data-lucide="send" style="width:16px;height:16px"></i> Gửi đánh giá</button>
                 </div>
               </div>`
            : ''
        }
        <div class="space-y-3">
          ${
            reviews.length === 0
              ? '<div class="empty-block muted text-sm">Chưa có đánh giá nào.</div>'
              : reviews
                  .map(
                    (r) => `
            <div class="p-4 rounded-lg" style="border:1px solid rgba(193,198,213,.6)">
              <div class="flex items-center gap-3 mb-1">
                <div class="avatar">${(r.user?.fullName || 'U').charAt(0).toUpperCase()}</div>
                <div class="flex-1">
                  <div class="font-semibold text-sm">${esc(r.user?.fullName || '')}</div>
                  <div class="text-xs muted">${fmtDate(r.createdAt)}</div>
                </div>
                <div class="flex items-center gap-1">${stars(r.rating, 14)}</div>
              </div>
              <p class="text-sm mt-2">${esc(r.comment)}</p>
            </div>`,
                  )
                  .join('')
          }
        </div>
      </section>
    </div>`;

  bind(stock);
  icons();
}

function bind(stock) {
  const qtyInput = document.getElementById('qty');
  document.getElementById('qty-dec').addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    qtyInput.value = quantity;
  });
  document.getElementById('qty-inc').addEventListener('click', () => {
    quantity = Math.min(stock, quantity + 1);
    qtyInput.value = quantity;
  });
  qtyInput.addEventListener('change', () => {
    quantity = Number(qtyInput.value) || 1;
  });

  document.querySelectorAll('[data-thumb]').forEach((b) =>
    b.addEventListener('click', () => {
      imageIdx = Number(b.dataset.thumb);
      render();
    }),
  );

  document.getElementById('add-cart').addEventListener('click', async () => {
    if (!auth.getUser()) return toast.error('Vui lòng đăng nhập');
    const stock = product.inventory?.quantity ?? 0;
    const check = guardForm([
      { id: 'qty-input', label: 'Số lượng', value: quantity, rules: ['required', 'integer', 'min:1', `max:${stock}`] },
    ]);
    if (!check) return toast.error(stock <= 0 ? 'Sản phẩm đã hết hàng' : 'Số lượng không hợp lệ');
    try {
      await cart.add(product.id, quantity);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi khi thêm giỏ hàng');
    }
  });

  const ratingStars = document.getElementById('rating-stars');
  if (ratingStars) {
    ratingStars.querySelectorAll('i').forEach((el, i) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        rating = i + 1;
        render();
      });
    });
  }

  const submitBtn = document.getElementById('submit-review');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const check = guardForm([
        { id: 'review-comment', label: 'Nhận xét', rules: ['required', 'minLength:5', 'maxLength:1000'] },
      ]);
      if (!check) return;
      const comment = String(check.values['review-comment']).trim();
      try {
        await api.post('/reviews', { productId: product.id, rating, comment });
        toast.success('Đã gửi đánh giá');
        await reload();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không gửi được đánh giá');
      }
    });
  }
}

async function reload() {
  product = await api.get(`/products/${id}`);
  imageIdx = 0;
  render();
}

async function init() {
  mountCustomerChrome('home');
  render();
  if (!id) {
    app.innerHTML = '<div class="empty-block card muted">Không tìm thấy sản phẩm.</div>';
    return;
  }
  try {
    await reload();
  } catch {
    app.innerHTML = '<div class="empty-block card muted">Không tải được sản phẩm.</div>';
  }
}

init();
