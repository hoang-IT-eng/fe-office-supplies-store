import { api } from '../../api.js';
import { fmtVND, fmtDate, orderStatusLabel, orderStatusColor, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';

const app = document.getElementById('app');
const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
let orders = [];
let filter = '';

function render() {
  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  app.innerHTML = `
    <div class="space-y-6">
      <div>
        <h1 class="page-title">Quản lý đơn hàng</h1>
        <div class="flex items-center gap-2 muted mt-1"><i data-lucide="receipt" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Theo dõi và cập nhật trạng thái đơn hàng.</p></div>
      </div>

      <div class="card p-4 flex flex-wrap gap-2">
        <button data-filter="" class="chip ${filter === '' ? 'chip-primary' : 'chip-neutral'}">Tất cả (${orders.length})</button>
        ${STATUSES.map((s) => `<button data-filter="${s}" class="chip ${filter === s ? 'chip-primary' : 'chip-neutral'}">${orderStatusLabel[s]} (${counts[s] || 0})</button>`).join('')}
      </div>

      <div class="space-y-3">
        ${
          filtered.length === 0
            ? '<div class="card p-12 text-center muted">Không có đơn hàng nào</div>'
            : filtered.map(card).join('')
        }
      </div>
    </div>`;

  document.querySelectorAll('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      render();
    }),
  );
  document.querySelectorAll('[data-open]').forEach((el) =>
    el.addEventListener('click', () => (location.href = `order-detail?id=${el.dataset.open}`)),
  );
  document.querySelectorAll('[data-status]').forEach((sel) => {
    sel.addEventListener('click', (e) => e.stopPropagation());
    sel.addEventListener('change', (e) => {
      e.stopPropagation();
      updateStatus(sel.dataset.status, sel.value);
    });
  });
  icons();
}

function card(o) {
  return `
    <div class="card p-5 grid gap-4 items-center" data-open="${o.id}" style="grid-template-columns:2.5fr 2.5fr 2.5fr 1fr 2fr;cursor:pointer">
      <div><div class="font-mono font-bold">#${esc(o.code)}</div><div class="text-xs muted mt-1">${fmtDate(o.createdAt)}</div></div>
      <div class="text-sm">
        <div class="flex items-center gap-1"><i data-lucide="user" class="muted" style="width:14px;height:14px"></i> ${esc(o.user?.fullName || '')}</div>
        <div class="flex items-center gap-1 muted text-xs"><i data-lucide="phone" style="width:12px;height:12px"></i> ${esc(o.shippingPhone || '')}</div>
      </div>
      <div class="text-sm flex items-start gap-1 muted"><i data-lucide="map-pin" class="shrink-0" style="width:14px;height:14px;margin-top:2px"></i><span class="line-clamp-2">${esc(o.shippingAddress || '')}</span></div>
      <div class="text-right"><div class="font-extrabold text-primary">${fmtVND(o.totalAmount)}</div></div>
      <div class="flex flex-col gap-2">
        <select class="input" data-status="${o.id}">${STATUSES.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${orderStatusLabel[s]}</option>`).join('')}</select>
        <div class="text-center"><span class="chip ${orderStatusColor[o.status]}">${orderStatusLabel[o.status]}</span></div>
      </div>
    </div>`;
}

async function updateStatus(id, status) {
  try {
    await api.patch(`/orders/${id}/status`, { status });
    toast.success('Đã cập nhật trạng thái');
    reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  }
}

async function reload() {
  orders = await api.get('/orders');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('orders');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  await reload();
}

init();
