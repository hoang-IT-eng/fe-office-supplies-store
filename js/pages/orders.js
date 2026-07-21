import { api } from '../api.js';
import { fmtVND, fmtDate, orderStatusLabel, orderStatusColor, esc } from '../format.js';
import { mountCustomerChrome, icons, requireAuth } from '../layout.js';

const app = document.getElementById('app');

function render(orders) {
  const header = `
    <div class="flex items-center gap-3">
      <i data-lucide="package" class="text-primary" style="width:24px;height:24px"></i>
      <h1 class="section-title">Đơn hàng của tôi</h1>
      <span class="chip chip-info">${orders.length} đơn</span>
    </div>`;

  if (orders.length === 0) {
    app.innerHTML = `<div class="space-y-6">${header}
      <div class="card p-12 text-center">
        <div class="mx-auto rounded-full grid place-items-center muted mb-4" style="width:5rem;height:5rem;background:var(--surface-low)"><i data-lucide="package" style="width:32px;height:32px"></i></div>
        <h2 class="font-bold text-lg">Chưa có đơn hàng nào</h2>
        <p class="muted text-sm mt-1">Hãy bắt đầu mua sắm và quay lại đây!</p>
        <a href="index.html" class="btn btn-primary mt-5">Khám phá sản phẩm</a>
      </div></div>`;
    icons();
    return;
  }

  const rows = orders
    .map(
      (o) => `
      <a href="order-detail?id=${o.id}" class="card p-5 flex items-center gap-4">
        <div class="grid place-items-center shrink-0" style="width:3rem;height:3rem;border-radius:.5rem;background:var(--primary-fixed);color:var(--primary)"><i data-lucide="package" style="width:22px;height:22px"></i></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold">#${esc(o.code)}</span>
            <span class="chip ${orderStatusColor[o.status]}">${orderStatusLabel[o.status]}</span>
          </div>
          <div class="text-xs muted mt-1">${fmtDate(o.createdAt)}</div>
        </div>
        <div class="text-right"><div class="font-extrabold text-primary text-lg">${fmtVND(o.totalAmount)}</div></div>
        <i data-lucide="arrow-right" class="muted" style="width:18px;height:18px"></i>
      </a>`,
    )
    .join('');

  app.innerHTML = `<div class="space-y-6">${header}<div class="space-y-3">${rows}</div></div>`;
  icons();
}

async function init() {
  if (!requireAuth()) return;
  mountCustomerChrome('orders');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  try {
    const orders = await api.get('/orders/me');
    render(orders);
  } catch {
    render([]);
  }
}

init();
