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
const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

let product = null;
let imageIdx = 0;
let quantity = 1;
let rating = 5;
let editingReviewId = null;

const sameId = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

const canEditReview = (review) => {
  if (!review?.createdAt) return false;
  return Date.now() - new Date(review.createdAt).getTime() <= EDIT_WINDOW_MS;
};

const stars = (value, size = 16, interactive = false) =>
  [1, 2, 3, 4, 5]
    .map((n) => {
      // Sao Lucide: filled = vàng #f59e0b; interactive = bọc trong nút data-star
      const icon = `<i data-lucide="star" class="star ${value >= n ? 'filled' : ''}" style="width:${size}px;height:${size}px;${value >= n ? 'fill:#f59e0b' : ''};pointer-events:none"></i>`;
      return interactive
        ? `<button type="button" data-star="${n}" class="star-btn" aria-label="${n} sao" title="${n} sao">${icon}</button>`
        : icon;
    })
    .join('');

function myReview(user) {
  if (!user) return null;
  return (product?.reviews || []).find((r) => sameId(r.user?.id, user.id)) || null;
}

function render() {
  if (!product) {
    app.innerHTML = '<div class="loading-block">Đang tải...</div>';
    return;
  }
  const savedComment = document.getElementById('review-comment')?.value;
  const stock = product.inventory?.quantity ?? 0;
  const price = Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Number(product.price);
  const pct =
    Number(product.discountPrice) > 0 ? Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100) : 0;
  const reviews = product.reviews || [];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const user = auth.getUser();
  const mine = myReview(user);
  const editing = Boolean(editingReviewId && mine && sameId(editingReviewId, mine.id) && canEditReview(mine));
  const commentValue =
    savedComment !== undefined && savedComment !== null
      ? savedComment
      : editing
        ? mine.comment || ''
        : '';

  // Ảnh chính: cover full ô vuông (aspect 1/1); không có ảnh → icon box
  const gallery = product.images?.[imageIdx]
    ? `<img src="${fileUrl(product.images[imageIdx])}" alt="${esc(product.name)}" style="width:100%;height:100%;object-fit:cover" />`
    : `<i data-lucide="box" class="muted" style="width:64px;height:64px"></i>`;

  // Thumbnail: chỉ hiện khi ≥2 ảnh; border primary = ảnh đang chọn
  const thumbs =
    (product.images?.length ?? 0) > 1
      ? `<div class="flex gap-2 overflow-x-auto">${product.images
          .map(
            (img, i) =>
              `<button data-thumb="${i}" class="shrink-0" style="width:5rem;height:5rem;border-radius:.5rem;overflow:hidden;border:2px solid ${i === imageIdx ? 'var(--primary)' : 'transparent'}"><img src="${fileUrl(img)}" style="width:100%;height:100%;object-fit:cover" /></button>`,
          )
          .join('')}</div>`
      : '';

  // Form đánh giá: tạo mới | đang sửa | hết hạn 7 ngày | (ẩn nếu chưa đăng nhập / đã đánh giá & không edit)
  let reviewForm = '';
  if (user) {
    if (!mine) {
      // Form gửi mới: nền surface-low, sao interactive, textarea + nút Gửi
      reviewForm = `
        <!-- Form gửi đánh giá mới -->
        <div class="rounded-lg p-4 mb-4" style="background:var(--surface-low)">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-sm font-semibold">Đánh giá của bạn:</span>
            <div class="flex gap-1" id="rating-stars">${stars(rating, 20, true)}</div>
          </div>
          <textarea id="review-comment" class="input" rows="3" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm...">${esc(commentValue)}</textarea>
          <div class="flex items-center justify-between mt-2 gap-3 flex-wrap">
            <p class="text-xs muted">* Chỉ đánh giá được khi đã mua sản phẩm này. Có thể sửa trong 7 ngày.</p>
            <button id="submit-review" class="btn btn-primary"><i data-lucide="send" style="width:16px;height:16px"></i> Gửi đánh giá</button>
          </div>
        </div>`;
    } else if (editing) {
      // Form chỉnh sửa: giống form mới nhưng nút Hủy + Cập nhật
      reviewForm = `
        <!-- Form chỉnh sửa đánh giá (trong 7 ngày) -->
        <div class="rounded-lg p-4 mb-4" style="background:var(--surface-low)">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-sm font-semibold">Chỉnh sửa đánh giá:</span>
            <div class="flex gap-1" id="rating-stars">${stars(rating, 20, true)}</div>
          </div>
          <textarea id="review-comment" class="input" rows="3" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm...">${esc(commentValue)}</textarea>
          <div class="flex items-center justify-between mt-2 gap-3 flex-wrap">
            <p class="text-xs muted">* Chỉ được chỉnh sửa trong vòng 7 ngày kể từ lúc gửi.</p>
            <div class="flex gap-2">
              <button id="cancel-edit-review" class="btn btn-outline">Hủy</button>
              <button id="submit-review" class="btn btn-primary"><i data-lucide="save" style="width:16px;height:16px"></i> Cập nhật</button>
            </div>
          </div>
        </div>`;
    } else if (!canEditReview(mine)) {
      reviewForm = `<p class="text-xs muted mb-4">Bạn đã đánh giá sản phẩm này. Thời hạn chỉnh sửa (7 ngày) đã hết.</p>`;
    }
  }

  // ── Vẽ trang: link quay lại → gallery+info (2 cột) → section đánh giá ──
  app.innerHTML = `
    <div class="space-y-8">
      <!-- Link quay lại danh sách sản phẩm -->
      <a href="index.html" class="inline-flex items-center gap-2 text-sm muted"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Quay lại danh sách</a>

      <!-- Khối chính: 2 cột (desktop lg) — trái ảnh, phải thông tin mua -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Cột trái: ảnh chính vuông + dải thumbnail cuộn ngang -->
        <div class="space-y-3">
          <div class="card place-items-center grid" style="aspect-ratio:1/1;overflow:hidden;background:var(--surface-low)">${gallery}</div>
          ${thumbs}
        </div>

        <!-- Cột phải: category, tên, SKU, sao, giá, tồn kho, mô tả, qty + giỏ -->
        <div>
          <!-- Chip danh mục (nếu có) -->
          ${product.category ? `<div class="chip chip-info mb-3"><i data-lucide="tag" style="width:12px;height:12px"></i> ${esc(product.category.name)}</div>` : ''}
          <h1 class="text-3xl font-extrabold">${esc(product.name)}</h1>
          <div class="text-xs muted mt-1">SKU: ${esc(product.sku)}</div>
          <!-- Điểm TB + số lượng đánh giá -->
          <div class="flex items-center gap-3 mt-4">
            <div class="flex items-center gap-1">${stars(Number(avg))}</div>
            <span class="text-sm font-semibold">${avg}</span>
            <span class="text-sm muted">(${reviews.length} đánh giá)</span>
          </div>
          <!-- Giá bán; nếu có giảm: gạch giá gốc + chip -% -->
          <div class="mt-4 flex items-baseline gap-3">
            <span class="text-4xl font-extrabold text-primary">${fmtVND(price)}</span>
            ${Number(product.discountPrice) > 0 ? `<span class="muted line-through">${fmtVND(product.price)}</span><span class="chip" style="background:var(--tertiary);color:#fff">-${pct}%</span>` : ''}
          </div>
          <!-- Chip tồn kho: xanh còn hàng / đỏ hết hàng -->
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="muted">Tồn kho:</span>
            ${stock > 0 ? `<span class="chip chip-success">Còn ${stock} sản phẩm</span>` : '<span class="chip chip-danger">Hết hàng</span>'}
          </div>
          <!-- Mô tả: pre-line giữ xuống dòng; nền surface-low -->
          ${product.description ? `<div class="mt-4 p-4 rounded-lg text-sm" style="background:var(--surface-low);white-space:pre-line">${esc(product.description)}</div>` : ''}
          <!-- Hàng thao tác: qty-box (− / input / +) + nút thêm giỏ (disabled nếu hết) -->
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

      <!-- Section đánh giá: form (nếu có) + danh sách review -->
      <section id="reviews" class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <i data-lucide="message-square" class="text-primary" style="width:20px;height:20px"></i>
          <h2 class="font-bold text-lg">Đánh giá (${reviews.length})</h2>
        </div>
        ${reviewForm}
        <div class="space-y-3">
          ${
            reviews.length === 0
              ? '<div class="empty-block muted text-sm">Chưa có đánh giá nào.</div>'
              : reviews
                  .map((r) => {
                    const isMine = user && sameId(r.user?.id, user.id);
                    const editable = isMine && canEditReview(r);
                    // Card review: avatar chữ cái | tên+ngày | sao | comment | nút Sửa/Xóa (nếu của mình)
                    return `
            <div class="p-4 rounded-lg" style="border:1px solid rgba(193,198,213,.6)">
              <div class="flex items-center gap-3 mb-1">
                <div class="avatar">${(r.user?.fullName || 'U').charAt(0).toUpperCase()}</div>
                <div class="flex-1">
                  <div class="font-semibold text-sm">${esc(r.user?.fullName || '')}${isMine ? ' <span class="text-xs muted">(Bạn)</span>' : ''}</div>
                  <div class="text-xs muted">${fmtDate(r.createdAt)}</div>
                </div>
                <div class="flex items-center gap-1">${stars(r.rating, 14)}</div>
              </div>
              <p class="text-sm mt-2">${esc(r.comment)}</p>
              ${
                editable
                  ? `<div class="mt-3 flex gap-2">
                       <button data-edit-review="${esc(r.id)}" class="btn btn-outline btn-sm"><i data-lucide="pen" style="width:14px;height:14px"></i> Sửa</button>
                       <button data-del-review="${esc(r.id)}" class="btn btn-outline btn-sm" style="color:var(--danger)"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Xóa</button>
                     </div>`
                  : isMine
                    ? `<div class="mt-3"><button data-del-review="${esc(r.id)}" class="btn btn-outline btn-sm" style="color:var(--danger)"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Xóa</button></div>`
                    : ''
              }
            </div>`;
                  })
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
    ratingStars.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-star]');
      if (!btn || !ratingStars.contains(btn)) return;
      rating = Number(btn.dataset.star);
      render();
    });
  }

  const cancelEdit = document.getElementById('cancel-edit-review');
  if (cancelEdit) {
    cancelEdit.addEventListener('click', () => {
      editingReviewId = null;
      rating = 5;
      render();
    });
  }

  document.querySelectorAll('[data-edit-review]').forEach((b) =>
    b.addEventListener('click', () => {
      const review = (product.reviews || []).find((r) => sameId(r.id, b.dataset.editReview));
      if (!review || !canEditReview(review)) return toast.error('Đã hết hạn chỉnh sửa (7 ngày)');
      editingReviewId = review.id;
      rating = Number(review.rating) || 5;
      render();
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );

  document.querySelectorAll('[data-del-review]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm('Xóa đánh giá của bạn?')) return;
      try {
        await api.delete(`/reviews/${b.dataset.delReview}`);
        toast.success('Đã xóa đánh giá');
        editingReviewId = null;
        rating = 5;
        await reload();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không xóa được đánh giá');
      }
    }),
  );

  const submitBtn = document.getElementById('submit-review');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const check = guardForm([
        { id: 'review-comment', label: 'Nhận xét', rules: ['required', 'minLength:5', 'maxLength:1000'] },
      ]);
      if (!check) return;
      const comment = String(check.values['review-comment']).trim();
      try {
        if (editingReviewId) {
          await api.patch(`/reviews/${editingReviewId}`, { rating, comment });
          toast.success('Đã cập nhật đánh giá');
          editingReviewId = null;
        } else {
          await api.post('/reviews', { productId: product.id, rating, comment });
          toast.success('Đã gửi đánh giá');
        }
        rating = 5;
        await reload();
      } catch (err) {
        toast.error(err?.response?.data?.message || (editingReviewId ? 'Không cập nhật được đánh giá' : 'Không gửi được đánh giá'));
      }
    });
  }
}

async function reload() {
  product = await api.get(`/products/${id}`);
  imageIdx = 0;
  const user = auth.getUser();
  const mine = myReview(user);
  if (editingReviewId && (!mine || !sameId(mine.id, editingReviewId) || !canEditReview(mine))) {
    editingReviewId = null;
  }
  if (editingReviewId && mine) rating = Number(mine.rating) || rating;
  render();
  if (location.hash === '#reviews') {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
