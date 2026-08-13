/**
 * Trang Admin: Quản lý đơn hàng
 * CSS: style inline + admin-ui.js — không dùng utility class.
 *
 * Luồng:
 *   init → reload → render → gắn sự kiện lọc / mở chi tiết / đổi trạng thái
 */

import { api } from '../../api.js';
import { fmtVND, fmtDate, orderStatusLabel, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import {
  CARD,
  MUTED,
  MONO,
  INPUT,
  CHIP,
  ORDER_STATUS_CHIP,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  LOADING,
} from '../../admin-ui.js';

const app = document.getElementById('app');
const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
let orders = [];
let filter = ''; // '' = hiện tất cả

function demSoDonTheoTrangThai() {
  const soLuong = {};
  for (const status of STATUSES) {
    let dem = 0;
    for (const order of orders) {
      if (order.status === status) dem += 1;
    }
    soLuong[status] = dem;
  }
  return soLuong;
}

function locDonHangTheoTrangThai() {
  if (filter === '') return orders;
  const ketQua = [];
  for (const order of orders) {
    if (order.status === filter) ketQua.push(order);
  }
  return ketQua;
}

function taoHtmlChipLoc(soLuongTheoTrangThai) {
  // Chip đang chọn: nền primary; chưa chọn: nền xám
  const chipStyle = (selected) => (selected ? CHIP.primary : CHIP.neutral);

  let html = `
    <button type="button" data-filter="" style="${chipStyle(filter === '')}">
      Tất cả (${orders.length})
    </button>
  `;

  for (const status of STATUSES) {
    html += `
      <button type="button" data-filter="${status}" style="${chipStyle(filter === status)}">
        ${orderStatusLabel[status]} (${soLuongTheoTrangThai[status] || 0})
      </button>
    `;
  }
  return html;
}

function taoHtmlDanhSachDon(danhSachDaLoc) {
  if (danhSachDaLoc.length === 0) {
    return `<div style="${CARD};padding:3rem;text-align:center;${MUTED}">Không có đơn hàng nào</div>`;
  }
  let html = '';
  for (const order of danhSachDaLoc) {
    html += card(order);
  }
  return html;
}

function render() {
  const soLuongTheoTrangThai = demSoDonTheoTrangThai();
  const danhSachDaLoc = locDonHangTheoTrangThai();

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <div>
        <h1 style="${PAGE_TITLE}">Quản lý đơn hàng</h1>
        <div style="${PAGE_SUBTITLE}">
          <i data-lucide="receipt" style="width:16px;height:16px;color:var(--primary)"></i>
          <p>Theo dõi và cập nhật trạng thái đơn hàng.</p>
        </div>
      </div>

      <!-- Hàng chip lọc trạng thái -->
      <div style="${CARD};padding:1rem;display:flex;flex-wrap:wrap;gap:.5rem">
        ${taoHtmlChipLoc(soLuongTheoTrangThai)}
      </div>

      <!-- Danh sách đơn (mỗi đơn = 1 card) -->
      <div style="display:flex;flex-direction:column;gap:.75rem">
        ${taoHtmlDanhSachDon(danhSachDaLoc)}
      </div>
    </div>`;

  ganSuKien();
  icons();
}

function ganSuKien() {
  for (const nut of document.querySelectorAll('[data-filter]')) {
    nut.addEventListener('click', () => {
      filter = nut.dataset.filter;
      render();
    });
  }

  for (const dong of document.querySelectorAll('[data-open]')) {
    dong.addEventListener('click', () => {
      location.href = `order-detail?id=${dong.dataset.open}`;
    });
  }

  for (const dropdown of document.querySelectorAll('[data-status]')) {
    // Chặn click lan ra card cha (tránh nhảy sang trang chi tiết)
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    dropdown.addEventListener('change', (e) => {
      e.stopPropagation();
      updateStatus(dropdown.dataset.status, dropdown.value);
    });
  }
}

function card(order) {
  const allowedNext = STATUS_TRANSITIONS[order.status] || [];
  const options = [order.status, ...allowedNext];
  let htmlCacOption = '';
  for (const status of options) {
    const selected = order.status === status ? 'selected' : '';
    htmlCacOption += `<option value="${status}" ${selected}>${orderStatusLabel[status]}</option>`;
  }

  const terminal = allowedNext.length === 0;
  const maDon = esc(order.code);
  const tenKhach = esc(order.user?.fullName || '');
  const soDienThoai = esc(order.shippingPhone || '');
  const diaChi = esc(order.shippingAddress || '');
  const statusChip = ORDER_STATUS_CHIP[order.status] || CHIP.neutral;

  // auto-fit: màn rộng ~5 cột, màn hẹp tự xuống dòng
  return `
    <div
      data-open="${order.id}"
      style="${CARD};padding:1.25rem;display:grid;gap:1rem;align-items:center;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));cursor:pointer"
    >
      <div>
        <div style="${MONO};font-weight:700">#${maDon}</div>
        <div style="font-size:.75rem;${MUTED};margin-top:.25rem">${fmtDate(order.createdAt)}</div>
      </div>

      <div style="font-size:.875rem">
        <div style="display:flex;align-items:center;gap:.25rem">
          <i data-lucide="user" style="width:14px;height:14px;${MUTED}"></i>
          ${tenKhach}
        </div>
        <div style="display:flex;align-items:center;gap:.25rem;font-size:.75rem;${MUTED}">
          <i data-lucide="phone" style="width:12px;height:12px"></i>
          ${soDienThoai}
        </div>
      </div>

      <div style="font-size:.875rem;display:flex;align-items:flex-start;gap:.25rem;${MUTED}">
        <i data-lucide="map-pin" style="width:14px;height:14px;margin-top:2px;flex-shrink:0"></i>
        <span style="display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${diaChi}</span>
      </div>

      <div style="text-align:right">
        <div style="font-weight:800;color:var(--primary)">${fmtVND(order.totalAmount)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:.5rem">
        <select style="${INPUT}" data-status="${order.id}" ${terminal ? 'disabled' : ''}>${htmlCacOption}</select>
        <div style="text-align:center">
          <span style="${statusChip}">${orderStatusLabel[order.status]}</span>
        </div>
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
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  await reload();
}

init();
