/**
 * Trang chi tiết đơn hàng (admin)
 *
 * CSS: toàn bộ dùng style inline (không utility class).
 * Các chuỗi style lặp lại lấy từ admin-ui.js cho gọn.
 */

import { api } from '../../api.js';
import { fmtVND, fmtDate, orderStatusLabel, ghnStatusLabel, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import {
  CARD,
  CARD_ELEVATED,
  MUTED,
  MONO,
  INPUT,
  LABEL,
  BTN_PRIMARY,
  BTN_OUTLINE,
  BTN_SM,
  ORDER_STATUS_CHIP,
  TABLE_HEAD,
  TH,
  TD,
  rowBorder,
} from '../../admin-ui.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('id');
const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
let order = null;
let tracking = null;
let trackingLoading = false;
let shipmentLoading = false;

function back() {
  return `
    <a href="orders.html" style="display:inline-flex;align-items:center;gap:.5rem;font-size:.875rem;${MUTED}">
      <i data-lucide="arrow-left" style="width:16px;height:16px"></i>
      Quay lại danh sách đơn hàng
    </a>`;
}

function render() {
  const subtotal = Number(order.subtotalAmount ?? order.totalAmount);
  const discount = Number(order.discountAmount ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
  const ghnLabel = tracking?.ghnStatusLabel || ghnStatusLabel[order.ghnStatus] || order.ghnStatus;
  const statusChip = ORDER_STATUS_CHIP[order.status] || ORDER_STATUS_CHIP.PENDING;

  // Mỗi dòng sản phẩm trong bảng
  const items = order.items
    .map((it, index) => {
      const cell = `${rowBorder(index)}${TD}`;
      return `
        <tr>
          <td style="${cell}font-weight:500">${esc(it.productName)}</td>
          <td style="${cell}text-align:right">${fmtVND(it.unitPrice)}</td>
          <td style="${cell}text-align:center">${it.quantity}</td>
          <td style="${cell}text-align:right;font-weight:700;color:var(--primary)">${fmtVND(it.subtotal)}</td>
        </tr>`;
    })
    .join('');

  app.innerHTML = `
    <!-- Các khối xếp dọc, cách nhau 1.5rem -->
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      ${back()}

      <!-- ===== Khối 1: Mã đơn + đổi trạng thái ===== -->
      <div style="${CARD_ELEVATED};padding:1.5rem;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:1rem">
        <div style="display:flex;align-items:flex-start;gap:1rem">
          <div style="width:3rem;height:3rem;border-radius:.5rem;background:var(--primary);color:#fff;display:grid;place-items:center">
            <i data-lucide="receipt" style="width:22px;height:22px"></i>
          </div>
          <div>
            <div style="${MONO};font-size:1.25rem;font-weight:800">#${esc(order.code)}</div>
            <div style="font-size:.875rem;${MUTED}">Tạo lúc ${fmtDate(order.createdAt)}</div>
            <div style="margin-top:.5rem">
              <span style="${statusChip}">${orderStatusLabel[order.status]}</span>
            </div>
          </div>
        </div>

        <div>
          <label for="status-select" style="${LABEL};text-transform:uppercase">Cập nhật trạng thái</label>
          <select id="status-select" style="${INPUT};min-width:200px" ${
            (STATUS_TRANSITIONS[order.status] || []).length === 0 ? 'disabled' : ''
          }>
            ${[order.status, ...(STATUS_TRANSITIONS[order.status] || [])]
              .map(
                (s) =>
                  `<option value="${s}" ${order.status === s ? 'selected' : ''}>${orderStatusLabel[s]}</option>`,
              )
              .join('')}
          </select>
        </div>
      </div>

      <!-- ===== Khối 2: Vận chuyển GHN ===== -->
      <div style="${CARD};padding:1.25rem">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1rem">
          <h2 style="display:flex;align-items:center;gap:.5rem;font-weight:700">
            <i data-lucide="truck" style="width:18px;height:18px;color:var(--primary)"></i>
            Vận chuyển GHN
          </h2>
          <div style="display:flex;gap:.5rem">
            ${
              !order.ghnOrderCode && order.toDistrictId
                ? `<button type="button" id="create-shipment" style="${BTN_PRIMARY};${BTN_SM}">
                     <i data-lucide="plus" style="width:14px;height:14px"></i>
                     ${shipmentLoading ? 'Đang tạo...' : 'Tạo vận đơn'}
                   </button>`
                : ''
            }
            ${
              order.ghnOrderCode
                ? `<button type="button" id="sync-tracking" style="${BTN_OUTLINE};${BTN_SM}">
                     <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
                     Đồng bộ GHN
                   </button>`
                : ''
            }
          </div>
        </div>

        ${
          order.ghnOrderCode
            ? `<!-- auto-fit: rộng thì 2 cột, hẹp thì 1 cột -->
               <div style="display:grid;gap:.75rem;font-size:.875rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
                 <div>
                   <span style="${MUTED}">Mã vận đơn:</span>
                   <b style="${MONO}">${esc(order.ghnOrderCode)}</b>
                 </div>
                 <div>
                   <span style="${MUTED}">Trạng thái GHN:</span>
                   <b>${esc(ghnLabel || '—')}</b>
                 </div>
                 ${
                   order.ghnExpectedDelivery
                     ? `<div style="grid-column:1/-1">
                          <span style="${MUTED}">Dự kiến giao:</span>
                          ${fmtDate(order.ghnExpectedDelivery)}
                        </div>`
                     : ''
                 }
                 ${
                   tracking?.log?.length
                     ? `<div style="grid-column:1/-1;margin-top:.5rem;padding-top:.75rem;border-top:1px solid var(--outline-variant)">
                          <p style="font-size:.75rem;font-weight:600;${MUTED};margin-bottom:.5rem">Lịch sử vận chuyển</p>
                          <div style="display:flex;flex-direction:column;gap:.25rem;max-height:10rem;overflow-y:auto">
                            ${tracking.log
                              .map(
                                (e) => `<div style="font-size:.875rem">
                                  ${e.updated_date ? fmtDate(e.updated_date) : ''} — ${esc(e.status || e.action || '')}
                                </div>`,
                              )
                              .join('')}
                          </div>
                        </div>`
                     : ''
                 }
               </div>`
            : `<p style="font-size:.875rem;${MUTED}">
                 ${
                   order.toDistrictId
                     ? 'Chưa có vận đơn GHN. Vận đơn sẽ tự tạo khi chuyển trạng thái "Đã xác nhận", hoặc bấm "Tạo vận đơn".'
                     : 'Đơn hàng cũ chưa có mã địa chỉ GHN — không thể tạo vận đơn tự động.'
                 }
               </p>`
        }
      </div>

      <!-- ===== Khối 3: Khách hàng + nhận hàng ===== -->
      <div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        <div style="${CARD};padding:1.25rem">
          <h2 style="display:flex;align-items:center;gap:.5rem;font-weight:700;margin-bottom:.75rem">
            <i data-lucide="user" style="width:18px;height:18px;color:var(--primary)"></i>
            Khách hàng
          </h2>
          <div style="display:flex;flex-direction:column;gap:.5rem;font-size:.875rem">
            <div style="font-weight:600">${esc(order.user?.fullName || '—')}</div>
            ${
              order.user?.email
                ? `<div style="display:flex;align-items:center;gap:.25rem;${MUTED}">
                     <i data-lucide="mail" style="width:14px;height:14px"></i>
                     ${esc(order.user.email)}
                   </div>`
                : ''
            }
          </div>
        </div>

        <div style="${CARD};padding:1.25rem">
          <h2 style="display:flex;align-items:center;gap:.5rem;font-weight:700;margin-bottom:.75rem">
            <i data-lucide="map-pin" style="width:18px;height:18px;color:var(--primary)"></i>
            Thông tin nhận hàng
          </h2>
          <div style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
            <div><span style="${MUTED}">Người nhận:</span> <b>${esc(order.shippingName)}</b></div>
            <div style="display:flex;align-items:center;gap:.25rem">
              <i data-lucide="phone" style="width:14px;height:14px;${MUTED}"></i>
              ${esc(order.shippingPhone)}
            </div>
            <div><span style="${MUTED}">Địa chỉ:</span> ${esc(order.shippingAddress)}</div>
            ${
              order.note
                ? `<div style="margin-top:.5rem;padding-top:.25rem;border-top:1px solid var(--outline-variant);${MUTED}">
                     <i>Ghi chú: ${esc(order.note)}</i>
                   </div>`
                : ''
            }
          </div>
        </div>
      </div>

      <!-- ===== Khối 4: Bảng sản phẩm + tổng kết ===== -->
      <div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:1rem">
        <div style="${CARD};padding:1.25rem;overflow:hidden;flex:2 1 420px;min-width:0">
          <div style="padding-bottom:1rem;margin-bottom:1rem;border-bottom:1px solid var(--outline-variant)">
            <h2 style="display:flex;align-items:center;gap:.5rem;font-weight:700">
              <i data-lucide="package" style="width:18px;height:18px;color:var(--primary)"></i>
              Chi tiết sản phẩm
            </h2>
          </div>
          <div style="overflow-x:auto">
            <table style="border-collapse:collapse;width:100%">
              <thead style="${TABLE_HEAD}">
                <tr>
                  <th style="${TH}">Tên sản phẩm</th>
                  <th style="${TH};text-align:right">Đơn giá</th>
                  <th style="${TH};text-align:center">SL</th>
                  <th style="${TH};text-align:right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${items}</tbody>
            </table>
          </div>
        </div>

        <div style="${CARD};padding:1.25rem;flex:1 1 260px">
          <h2 style="font-weight:700;margin-bottom:.75rem">Tổng kết</h2>
          <div style="display:flex;flex-direction:column;gap:.5rem;font-size:.875rem">
            <div style="display:flex;justify-content:space-between">
              <span style="${MUTED}">Số sản phẩm</span>
              <span style="font-weight:600">${order.items.length}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="${MUTED}">Tạm tính</span>
              <span style="font-weight:600">${fmtVND(subtotal)}</span>
            </div>
            ${
              discount > 0
                ? `<div style="display:flex;justify-content:space-between;color:var(--success)">
                     <span>Giảm giá ${order.voucher?.code ? `(${esc(order.voucher.code)})` : ''}</span>
                     <span style="font-weight:600">-${fmtVND(discount)}</span>
                   </div>`
                : ''
            }
            ${
              shippingFee > 0
                ? `<div style="display:flex;justify-content:space-between">
                     <span style="${MUTED}">Phí GHN</span>
                     <span style="font-weight:600">${fmtVND(shippingFee)}</span>
                   </div>`
                : ''
            }
            <div style="border-top:1px solid var(--outline-variant)"></div>
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-weight:700">Tổng cộng</span>
              <span style="font-size:1.5rem;font-weight:800;color:var(--primary)">${fmtVND(order.totalAmount)}</span>
            </div>
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
  app.innerHTML = `<div style="text-align:center;padding:5rem 0;${MUTED}">Đang tải...</div>`;

  if (!id) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${back()}
        <div style="${CARD};padding:3rem;text-align:center;${MUTED}">Không tìm thấy đơn hàng</div>
      </div>`;
    icons();
    return;
  }

  try {
    await reload();
  } catch (err) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${back()}
        <div style="${CARD};padding:3rem;text-align:center;${MUTED}">
          ${esc(err?.response?.data?.message || 'Không tải được chi tiết đơn hàng')}
        </div>
      </div>`;
    icons();
  }
}

init();
