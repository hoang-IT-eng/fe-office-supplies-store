import { api } from '../api.js';
import {
  fmtVND,
  fmtDate,
  orderStatusLabel,
  orderStatusColor,
  ghnStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusColor,
  esc,
} from '../format.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons, requireAuth } from '../layout.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('id');
let order = null;
let tracking = null;

function backLink() {
  return `<a href="orders.html" class="inline-flex items-center gap-2 text-sm muted"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Quay lại danh sách đơn hàng</a>`;
}

function render() {
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
  const subtotal = Number(order.subtotalAmount ?? order.totalAmount);
  const discount = Number(order.discountAmount ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
  const ghnCode = order.ghnOrderCode || tracking?.ghnOrderCode;
  const ghnLabel = tracking?.ghnStatusLabel || ghnStatusLabel[order.ghnStatus] || order.ghnStatus;

  const items = order.items
    .map(
      (it) => `<tr>
        <td class="table-cell font-medium">${esc(it.productName)}</td>
        <td class="table-cell text-right">${fmtVND(it.unitPrice)}</td>
        <td class="table-cell text-center">${it.quantity}</td>
        <td class="table-cell text-right font-bold text-primary">${fmtVND(it.subtotal)}</td>
      </tr>`,
    )
    .join('');

  app.innerHTML = `
    <div class="space-y-6">
      ${backLink()}
      <div class="card-elevated p-6 flex flex-wrap justify-between items-start gap-4">
        <div class="flex items-start gap-4">
          <div class="grid place-items-center" style="width:3rem;height:3rem;border-radius:.5rem;background:var(--primary);color:#fff"><i data-lucide="receipt" style="width:22px;height:22px"></i></div>
          <div>
            <div class="font-mono font-extrabold text-xl">#${esc(order.code)}</div>
            <div class="text-sm muted">Tạo lúc ${fmtDate(order.createdAt)}</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span class="chip ${orderStatusColor[order.status]}">${orderStatusLabel[order.status]}</span>
              ${order.paymentMethod ? `<span class="chip" style="background:var(--surface-high)">${paymentMethodLabel[order.paymentMethod] || order.paymentMethod}</span>` : ''}
              ${order.paymentStatus ? `<span class="chip ${paymentStatusColor[order.paymentStatus]}">${paymentStatusLabel[order.paymentStatus] || order.paymentStatus}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          ${canCancel ? `<button id="cancel-order" class="btn btn-danger"><i data-lucide="circle-x" style="width:16px;height:16px"></i> Hủy đơn</button>` : ''}
        </div>
      </div>

      ${
        ghnCode
          ? `<div class="card p-5">
               <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                 <h2 class="font-bold flex items-center gap-2"><i data-lucide="truck" class="text-primary" style="width:18px;height:18px"></i> Theo dõi vận chuyển GHN</h2>
                 <button id="sync-tracking" class="btn btn-outline btn-sm"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Cập nhật</button>
               </div>
               <div class="grid gap-3 text-sm sm:grid-cols-2">
                 <div><span class="muted">Mã vận đơn:</span> <b class="font-mono">${esc(ghnCode)}</b></div>
                 <div><span class="muted">Trạng thái GHN:</span> <b>${esc(ghnLabel || '—')}</b></div>
                 ${order.ghnExpectedDelivery ? `<div class="col-span-2"><span class="muted">Dự kiến giao:</span> ${fmtDate(order.ghnExpectedDelivery)}</div>` : ''}
               </div>
               ${
                 tracking?.log?.length
                   ? `<div class="mt-4 border-t pt-4"><p class="text-xs font-semibold muted mb-2">Lịch sử vận chuyển</p><div class="space-y-2 overflow-y-auto" style="max-height:12rem">${tracking.log
                       .map(
                         (e) =>
                           `<div class="text-sm flex gap-2"><span class="muted shrink-0">${e.updated_date ? fmtDate(e.updated_date) : ''}</span><span>${esc(e.status || e.action || e.message || '')}</span></div>`,
                       )
                       .join('')}</div></div>`
                   : ''
               }
               <a href="https://donhang.ghn.vn/?order_code=${esc(ghnCode)}" target="_blank" rel="noreferrer" class="inline-block mt-4 text-sm text-primary" style="text-decoration:underline">Tra cứu trên GHN →</a>
             </div>`
          : ''
      }

      <div class="grid gap-4 md:grid-cols-2">
        <div class="card p-5">
          <h2 class="font-bold flex items-center gap-2 mb-3"><i data-lucide="map-pin" class="text-primary" style="width:18px;height:18px"></i> Thông tin nhận hàng</h2>
          <div class="space-y-1 text-sm">
            <div><span class="muted">Người nhận:</span> <b>${esc(order.shippingName)}</b></div>
            <div><span class="muted">Điện thoại:</span> ${esc(order.shippingPhone)}</div>
            <div><span class="muted">Địa chỉ:</span> ${esc(order.shippingAddress)}</div>
            ${order.note ? `<div class="pt-1 mt-2 border-t muted"><i>Ghi chú: ${esc(order.note)}</i></div>` : ''}
          </div>
        </div>
        <div class="card p-5">
          <h2 class="font-bold flex items-center gap-2 mb-3"><i data-lucide="package" class="text-primary" style="width:18px;height:18px"></i> Tổng kết</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="muted">Số sản phẩm</span><span class="font-semibold">${order.items.length}</span></div>
            <div class="flex justify-between"><span class="muted">Tạm tính</span><span class="font-semibold">${fmtVND(subtotal)}</span></div>
            ${discount > 0 ? `<div class="flex justify-between text-success"><span>Giảm giá ${order.voucher?.code ? `(${esc(order.voucher.code)})` : ''}</span><span class="font-semibold">-${fmtVND(discount)}</span></div>` : ''}
            ${shippingFee > 0 ? `<div class="flex justify-between"><span class="muted">Phí vận chuyển (GHN)</span><span class="font-semibold">${fmtVND(shippingFee)}</span></div>` : ''}
            <div class="divider"></div>
            <div class="flex justify-between items-baseline"><span class="font-bold">Tổng cộng</span><span class="text-2xl font-extrabold text-primary">${fmtVND(order.totalAmount)}</span></div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-t" style="border-top:none;border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)"><h2 class="font-bold">Chi tiết sản phẩm</h2></div>
        <div class="overflow-x-auto">
          <table>
            <thead class="table-head"><tr><th class="table-cell" style="text-align:left">Tên sản phẩm</th><th class="table-cell text-right">Đơn giá</th><th class="table-cell text-center">SL</th><th class="table-cell text-right">Thành tiền</th></tr></thead>
            <tbody class="divide-y">${items}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  bind();
  icons();
}

function bind() {
  const cancelBtn = document.getElementById('cancel-order');
  if (cancelBtn) cancelBtn.addEventListener('click', cancel);
  const syncBtn = document.getElementById('sync-tracking');
  if (syncBtn) syncBtn.addEventListener('click', loadTracking);
}

async function cancel() {
  if (!confirm('Bạn chắc chắn muốn hủy đơn?')) return;
  try {
    await api.patch(`/orders/${id}/cancel`);
    toast.success('Đã hủy đơn hàng');
    await reload();
    loadTracking();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Không hủy được đơn');
  }
}

async function loadTracking() {
  try {
    tracking = await api.get(`/shipping/orders/${id}/tracking`);
  } catch {
    tracking = null;
  }
  if (order) render();
}

async function reload() {
  order = await api.get(`/orders/${id}`);
  render();
}

async function init() {
  if (!requireAuth()) return;
  mountCustomerChrome('orders');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  if (!id) {
    app.innerHTML = `<div class="space-y-4">${backLink()}<div class="card p-12 text-center muted">Không tìm thấy đơn hàng</div></div>`;
    icons();
    return;
  }
  try {
    await reload();
    await loadTracking();
  } catch (err) {
    app.innerHTML = `<div class="space-y-4">${backLink()}<div class="card p-12 text-center muted">${esc(err?.response?.data?.message || 'Không tải được chi tiết đơn hàng')}</div></div>`;
    icons();
  }
}

init();
