import { fileUrl } from '../config.js';
import { fmtVND, esc } from '../format.js';
import { cart } from '../cart.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons, requireAuth } from '../layout.js';
import { validateFields } from '../validate.js';

const app = document.getElementById('app');

function render() {
  const items = cart.items;
  const header = `
    <div class="flex items-center gap-3">
      <i data-lucide="shopping-cart" class="text-primary" style="width:24px;height:24px"></i>
      <h1 class="section-title">Giỏ hàng của bạn</h1>
      <span class="chip chip-info">${cart.count()} sản phẩm</span>
    </div>`;

  if (items.length === 0) {
    app.innerHTML = `<div class="space-y-6">${header}
      <div class="card p-12 text-center">
        <div class="mx-auto rounded-full grid place-items-center muted mb-4" style="width:5rem;height:5rem;background:var(--surface-low)"><i data-lucide="shopping-cart" style="width:32px;height:32px"></i></div>
        <h2 class="font-bold text-lg">Giỏ hàng trống</h2>
        <p class="muted text-sm mt-1">Hãy khám phá sản phẩm và thêm vào giỏ hàng</p>
        <a href="index.html" class="btn btn-primary mt-5">Tiếp tục mua sắm</a>
      </div></div>`;
    icons();
    return;
  }

  const rows = items
    .map((item) => {
      const price = Number(item.product.discountPrice) > 0 ? Number(item.product.discountPrice) : Number(item.product.price);
      const img = item.product.images?.[0]
        ? `<img src="${fileUrl(item.product.images[0])}" style="width:5rem;height:5rem;border-radius:.5rem;object-fit:cover;background:var(--surface-low)" />`
        : `<div class="grid place-items-center muted" style="width:5rem;height:5rem;border-radius:.5rem;background:var(--surface-low)"><i data-lucide="box" style="width:28px;height:28px"></i></div>`;
      return `
      <div class="card p-4 flex gap-4 items-center">
        <a href="product?id=${item.product.id}" class="shrink-0">${img}</a>
        <div class="flex-1 min-w-0">
          <a href="product?id=${item.product.id}" class="font-semibold block truncate">${esc(item.product.name)}</a>
          <div class="text-primary text-sm font-bold mt-1">${fmtVND(price)}</div>
        </div>
        <div class="qty-box">
          <button data-dec="${item.id}">−</button>
          <input type="number" min="1" value="${item.quantity}" data-qty="${item.id}" />
          <button data-inc="${item.id}">+</button>
        </div>
        <div class="font-bold text-right" style="width:8rem">${fmtVND(price * item.quantity)}</div>
        <button class="icon-btn" data-remove="${item.id}" title="Xóa"><i data-lucide="trash-2" style="width:18px;height:18px"></i></button>
      </div>`;
    })
    .join('');

  app.innerHTML = `<div class="space-y-6">${header}
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-3">${rows}</div>
      <div class="card-elevated p-6 h-fit lg:sticky">
        <h3 class="font-bold text-lg mb-4">Tóm tắt đơn hàng</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="muted">Tạm tính</span><span class="font-semibold">${fmtVND(cart.total())}</span></div>
          <div class="flex justify-between"><span class="muted">Phí vận chuyển</span><span class="text-xs muted">Tính ở checkout</span></div>
          <div class="divider"></div>
          <div class="flex justify-between items-baseline"><span class="font-bold">Tổng cộng</span><span class="text-2xl font-extrabold text-primary">${fmtVND(cart.total())}</span></div>
        </div>
        <a href="checkout.html" class="btn btn-primary btn-block btn-lg mt-5">Tiến hành thanh toán <i data-lucide="arrow-right" style="width:18px;height:18px"></i></a>
      </div>
    </div></div>`;

  bind();
  icons();
}

async function updateQty(itemId, quantity) {
  const item = cart.items.find((x) => x.id === itemId);
  const stock = item?.product?.inventory?.quantity ?? 9999;
  const check = validateFields([
    { id: 'qty', label: 'Số lượng', value: quantity, rules: ['required', 'integer', 'min:1', `max:${stock}`] },
  ]);
  if (!check.ok) {
    toast.error(check.errors[0].message);
    render();
    return;
  }
  try {
    await cart.update(itemId, quantity);
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi cập nhật');
    render();
  }
}

function bind() {
  document.querySelectorAll('[data-dec]').forEach((b) =>
    b.addEventListener('click', () => {
      const item = cart.items.find((i) => i.id === b.dataset.dec);
      updateQty(item.id, item.quantity - 1);
    }),
  );
  document.querySelectorAll('[data-inc]').forEach((b) =>
    b.addEventListener('click', () => {
      const item = cart.items.find((i) => i.id === b.dataset.inc);
      updateQty(item.id, item.quantity + 1);
    }),
  );
  document.querySelectorAll('[data-qty]').forEach((inp) =>
    inp.addEventListener('change', () => updateQty(inp.dataset.qty, Number(inp.value))),
  );
  document.querySelectorAll('[data-remove]').forEach((b) =>
    b.addEventListener('click', async () => {
      await cart.remove(b.dataset.remove);
    }),
  );
}

async function init() {
  if (!requireAuth()) return;
  mountCustomerChrome('cart');
  cart.subscribe(render);
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  try {
    await cart.fetch();
  } catch {
    render();
  }
}

init();
