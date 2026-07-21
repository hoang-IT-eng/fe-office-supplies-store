import { api } from '../../api.js';
import { fmtVND, fmtDate, orderStatusLabel, orderStatusColor, ghnStatusLabel, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('id');
const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
let order = null;
let tracking = null;
let trackingLoading = false;
let shipmentLoading = false;

function back() {
  return `<a href="orders.html" class="inline-flex items-center gap-2 text-sm muted"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Quay lại danh sách đơn hàng</a>`;
}

function render() {
  const subtotal = Number(order.subtotalAmount ?? order.totalAmount);
  const discount = Number(order.discountAmount ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
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
      ${back()}
      <div class="card-elevated p-6 flex flex-wrap justify-between items-start gap-4">
        <div class="flex items-start gap-4">
          <div class="grid place-items-center" style="width:3rem;height:3rem;border-radius:.5rem;background:var(--primary);color:#fff"><i data-lucide="receipt" style="width:22px;height:22px"></i></div>
          <div>
            <div class="font-mono font-extrabold text-xl">#${esc(order.code)}</div>
            <div class="text-sm muted">Tạo lúc ${fmtDate(order.createdAt)}</div>
            <div class="mt-2"><span class="chip ${orderStatusColor[order.status]}">${orderStatusLabel[order.status]}</span></div>
          </div>
        </div>
        <div>
          <label class="field-label" style="text-transform:uppercase">Cập nhật trạng thái</label>
          <select id="status-select" class="input" style="min-width:200px">${STATUSES.map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${orderStatusLabel[s]}</option>`).join('')}</select>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 class="font-bold flex items-center gap-2"><i data-lucide="truck" class="text-primary" style="width:18px;height:18px"></i> Vận chuyển GHN</h2>
          <div class="flex gap-2">
            ${!order.ghnOrderCode && order.toDistrictId ? `<button id="create-shipment" class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:14px;height:14px"></i> ${shipmentLoading ? 'Đang tạo...' : 'Tạo vận đơn'}</button>` : ''}
            ${order.ghnOrderCode ? `<button id="sync-tracking" class="btn btn-outline btn-sm"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Đồng bộ GHN</button>` : ''}
          </div>
        </div>
        ${
          order.ghnOrderCode
            ? `<div class="grid gap-3 text-sm sm:grid-cols-2">
                 <div><span class="muted">Mã vận đơn:</span> <b class="font-mono">${esc(order.ghnOrderCode)}</b></div>
                 <div><span class="muted">Trạng thái GHN:</span> <b>${esc(ghnLabel || '—')}</b></div>
                 ${order.ghnExpectedDelivery ? `<div class="col-span-2"><span class="muted">Dự kiến giao:</span> ${fmtDate(order.ghnExpectedDelivery)}</div>` : ''}
                 ${
                   tracking?.log?.length
                     ? `<div class="col-span-2 mt-2 border-t pt-3"><p class="text-xs font-semibold muted mb-2">Lịch sử vận chuyển</p><div class="space-y-1 overflow-y-auto" style="max-height:10rem">${tracking.log
                         .map((e) => `<div class="text-sm">${e.updated_date ? fmtDate(e.updated_date) : ''} — ${esc(e.status || e.action || '')}</div>`)
                         .join('')}</div></div>`
                     : ''
                 }
               </div>`
            : `<p class="text-sm muted">${order.toDistrictId ? 'Chưa có vận đơn GHN. Vận đơn sẽ tự tạo khi chuyển trạng thái "Đã xác nhận", hoặc bấm "Tạo vận đơn".' : 'Đơn hàng cũ chưa có mã địa chỉ GHN — không thể tạo vận đơn tự động.'}</p>`
        }
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="card p-5">
          <h2 class="font-bold flex items-center gap-2 mb-3"><i data-lucide="user" class="text-primary" style="width:18px;height:18px"></i> Khách hàng</h2>
          <div class="space-y-2 text-sm">
            <div class="font-semibold">${esc(order.user?.fullName || '—')}</div>
            ${order.user?.email ? `<div class="flex items-center gap-1 muted"><i data-lucide="mail" style="width:14px;height:14px"></i> ${esc(order.user.email)}</div>` : ''}
          </div>
        </div>
        <div class="card p-5">
          <h2 class="font-bold flex items-center gap-2 mb-3"><i data-lucide="map-pin" class="text-primary" style="width:18px;height:18px"></i> Thông tin nhận hàng</h2>
          <div class="space-y-1 text-sm">
            <div><span class="muted">Người nhận:</span> <b>${esc(order.shippingName)}</b></div>
            <div class="flex items-center gap-1"><i data-lucide="phone" class="muted" style="width:14px;height:14px"></i> ${esc(order.shippingPhone)}</div>
            <div><span class="muted">Địa chỉ:</span> ${esc(order.shippingAddress)}</div>
            ${order.note ? `<div class="pt-1 mt-2 border-t muted"><i>Ghi chú: ${esc(order.note)}</i></div>` : ''}
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="card p-5 md:col-span-2 overflow-hidden">
          <div class="pb-4 border-t mb-4" style="border-top:none;border-bottom:1px solid var(--outline-variant)"><h2 class="font-bold flex items-center gap-2"><i data-lucide="package" class="text-primary" style="width:18px;height:18px"></i> Chi tiết sản phẩm</h2></div>
          <div class="overflow-x-auto"><table>
            <thead class="table-head"><tr><th class="table-cell" style="text-align:left">Tên sản phẩm</th><th class="table-cell text-right">Đơn giá</th><th class="table-cell text-center">SL</th><th class="table-cell text-right">Thành tiền</th></tr></thead>
            <tbody class="divide-y">${items}</tbody>
          </table></div>
        </div>
        <div class="card p-5 h-fit">
          <h2 class="font-bold mb-3">Tổng kết</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="muted">Số sản phẩm</span><span class="font-semibold">${order.items.length}</span></div>
            <div class="flex justify-between"><span class="muted">Tạm tính</span><span class="font-semibold">${fmtVND(subtotal)}</span></div>
            ${discount > 0 ? `<div class="flex justify-between text-success"><span>Giảm giá ${order.voucher?.code ? `(${esc(order.voucher.code)})` : ''}</span><span class="font-semibold">-${fmtVND(discount)}</span></div>` : ''}
            ${shippingFee > 0 ? `<div class="flex justify-between"><span class="muted">Phí GHN</span><span class="font-semibold">${fmtVND(shippingFee)}</span></div>` : ''}
            <div class="divider"></div>
            <div class="flex justify-between items-baseline"><span class="font-bold">Tổng cộng</span><span class="text-2xl font-extrabold text-primary">${fmtVND(order.totalAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('status-select').addEventListener('change', (e) => updateStatus(e.target.value));
  const cs = document.getElementById('create-shipment');
  if (cs) cs.addEventListener('click', createShipment);
  const st = document.getElementById('sync-tracking');
  if (st) st.addEventListener('click', loadTracking);
  icons();
}

async function updateStatus(status) {
  try {
    await api.patch(`/orders/${id}/status`, { status });
    toast.success('Đã cập nhật trạng thái');
    await reload();
  } catch (err) {
    const msg = err?.response?.data?.message;
    toast.error(Array.isArray(msg) ? msg[0] : msg || 'Lỗi cập nhật trạng thái');
  }
}

async function createShipment() {
  shipmentLoading = true;
  render();
  try {
    const data = await api.post(`/shipping/orders/${id}/create-shipment`);
    toast.success(`Đã tạo vận đơn GHN: ${data.shipment?.ghnOrderCode || data.order?.ghnOrderCode}`);
    await reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Không tạo được vận đơn GHN');
  } finally {
    shipmentLoading = false;
  }
}

async function loadTracking() {
  if (!order?.ghnOrderCode) return;
  trackingLoading = true;
  try {
    tracking = await api.post(`/shipping/orders/${id}/sync-tracking`);
    if (tracking.orderStatus) {
      order.status = tracking.orderStatus;
      order.ghnStatus = tracking.ghnStatus;
    }
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Không đồng bộ được trạng thái GHN');
  } finally {
    trackingLoading = false;
    render();
  }
}

async function reload() {
  order = await api.get(`/orders/${id}`);
  render();
  if (order.ghnOrderCode) loadTracking();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('orders');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  if (!id) {
    app.innerHTML = `<div class="space-y-4">${back()}<div class="card p-12 text-center muted">Không tìm thấy đơn hàng</div></div>`;
    icons();
    return;
  }
  try {
    await reload();
  } catch (err) {
    app.innerHTML = `<div class="space-y-4">${back()}<div class="card p-12 text-center muted">${esc(err?.response?.data?.message || 'Không tải được chi tiết đơn hàng')}</div></div>`;
    icons();
  }
}

init();
