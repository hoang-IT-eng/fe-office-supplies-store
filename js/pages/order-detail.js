/**
 * Trang khách: Chi tiết 1 đơn hàng
 * (Viết lại cho dễ hiểu — chia nhỏ hàm, chú thích tiếng Việt,
 *  dùng for/if thay map/ternary lồng nhau, CSS inline thay utility class)
 *
 * Luồng chạy:
 *   1. init()              → bắt đăng nhập, dựng header, lấy id từ URL
 *   2. taiLaiDonHang()     → GET /orders/:id → lưu vào biến order → veTrang()
 *   3. taiTracking()       → GET /shipping/orders/:id/tracking → lưu tracking → veTrang()
 *   4. veTrang()           → ghép HTML các khối → gắn sự kiện → vẽ icon
 *   5. huyDon()            → PATCH /orders/:id/cancel → tải lại
 */

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

// Khung <main id="app"> — mọi HTML sẽ được vẽ vào đây
const app = document.getElementById('app');

// id đơn lấy từ URL: order-detail.html?id=...
const id = new URLSearchParams(location.search).get('id');

// Bộ nhớ tạm trên trình duyệt
let order = null; // dữ liệu đơn từ API
let tracking = null; // dữ liệu theo dõi GHN (có thể null)

// =============================================================================
// HÀM PHỤ: Link quay lại danh sách đơn
// =============================================================================
function taoHtmlQuayLai() {
  // Link chữ + icon, flex ngang, màu muted, cách khối dưới 16px
  return `
    <!-- Link quay lại danh sách đơn -->
    <a href="orders.html" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--on-surface-variant);text-decoration:none;margin-bottom:16px;">
      <i data-lucide="arrow-left" style="width:16px;height:16px"></i>
      Quay lại danh sách đơn hàng
    </a>
  `;
}

// =============================================================================
// HÀM PHỤ: User có được hủy đơn không?
// Chỉ PENDING hoặc CONFIRMED mới hủy được (khớp backend cancel)
// =============================================================================
function coTheHuyDon() {
  if (order.status === 'PENDING') return true;
  if (order.status === 'CONFIRMED') return true;
  return false;
}

// =============================================================================
// HÀM PHỤ: Đơn đã giao xong → hiện nút đánh giá sản phẩm
// =============================================================================
function coTheDanhGia() {
  return order.status === 'COMPLETED';
}

// =============================================================================
// HÀM PHỤ: Header — mã đơn, ngày tạo, chip trạng thái, nút hủy
// =============================================================================
function taoHtmlHeader() {
  let htmlNutHuy = '';
  if (coTheHuyDon()) {
    htmlNutHuy = `
      <button id="cancel-order" class="btn btn-danger" type="button">
        <i data-lucide="circle-x" style="width:16px;height:16px"></i>
        Hủy đơn
      </button>
    `;
  }

  let htmlChipThanhToan = '';
  if (order.paymentMethod) {
    const nhan =
      paymentMethodLabel[order.paymentMethod] || order.paymentMethod;
    htmlChipThanhToan += `
      <span class="chip" style="background:var(--surface-high)">${nhan}</span>
    `;
  }
  if (order.paymentStatus) {
    const mau = paymentStatusColor[order.paymentStatus] || '';
    const nhan =
      paymentStatusLabel[order.paymentStatus] || order.paymentStatus;
    htmlChipThanhToan += `
      <span class="chip ${mau}">${nhan}</span>
    `;
  }

  const mauStatus = orderStatusColor[order.status] || '';
  const nhanStatus = orderStatusLabel[order.status] || order.status;

  // Card flex: trái = icon + mã/ngày/chip | phải = nút hủy (nếu có)
  return `
    <!-- Header đơn: card bo góc, bóng nhẹ, flex space-between -->
    <div style="
      background:var(--surface);
      border:1px solid var(--outline-variant);
      border-radius:12px;
      padding:24px;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
      display:flex;
      flex-wrap:wrap;
      justify-content:space-between;
      align-items:flex-start;
      gap:16px;
      margin-bottom:20px;
    ">
      <!-- Cột trái: icon nhận + thông tin -->
      <div style="display:flex;align-items:flex-start;gap:16px;">
        <!-- Avatar icon 48×48, nền primary -->
        <div style="
          width:48px;height:48px;border-radius:8px;
          background:var(--primary);color:#fff;
          display:flex;align-items:center;justify-content:center;
        ">
          <i data-lucide="receipt" style="width:22px;height:22px"></i>
        </div>
        <div>
          <!-- Mã đơn: monospace, đậm -->
          <div style="font-family:monospace;font-weight:800;font-size:20px;">
            #${esc(order.code)}
          </div>
          <!-- Ngày tạo: chữ nhỏ, màu muted -->
          <div style="font-size:14px;color:var(--on-surface-variant);margin-top:4px;">
            Tạo lúc ${fmtDate(order.createdAt)}
          </div>
          <!-- Hàng chip: trạng thái đơn + phương thức/trạng thái thanh toán -->
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;">
            <span class="chip ${mauStatus}">${nhanStatus}</span>
            ${htmlChipThanhToan}
          </div>
        </div>
      </div>
      <!-- Cột phải: nút Hủy (chỉ PENDING / CONFIRMED) -->
      <div>${htmlNutHuy}</div>
    </div>
  `;
}

// =============================================================================
// HÀM PHỤ: Khối theo dõi vận chuyển GHN (chỉ hiện khi đã có mã vận đơn)
// =============================================================================
function taoHtmlGhn() {
  // Ưu tiên mã từ tracking, không có thì lấy từ order
  let ghnCode = order.ghnOrderCode;
  if (tracking && tracking.ghnOrderCode) {
    ghnCode = tracking.ghnOrderCode;
  }

  // Chưa có vận đơn → không vẽ gì
  if (!ghnCode) {
    return '';
  }

  // Nhãn trạng thái GHN
  let ghnLabel = order.ghnStatus ? ghnStatusLabel[order.ghnStatus] || order.ghnStatus : '';
  if (tracking && tracking.ghnStatusLabel) {
    ghnLabel = tracking.ghnStatusLabel;
  }

  // Dự kiến giao — span full width của lưới 2 cột (grid-column: 1 / -1)
  let htmlDuKien = '';
  if (order.ghnExpectedDelivery) {
    htmlDuKien = `
      <div style="grid-column:1 / -1;">
        <span style="color:var(--on-surface-variant)">Dự kiến giao:</span>
        ${fmtDate(order.ghnExpectedDelivery)}
      </div>
    `;
  }

  // Lịch sử vận chuyển (log từ GHN)
  let htmlLichSu = '';
  if (tracking && tracking.log && tracking.log.length > 0) {
    let cacDong = '';
    for (let i = 0; i < tracking.log.length; i++) {
      const e = tracking.log[i];
      const thoiGian = e.updated_date ? fmtDate(e.updated_date) : '';
      const noiDung = e.status || e.action || e.message || '';
      // Mỗi log: flex ngang — thời gian (muted, không co) | nội dung
      cacDong += `
        <div style="font-size:14px;display:flex;gap:8px;margin-bottom:6px;">
          <span style="color:var(--on-surface-variant);flex-shrink:0;">${thoiGian}</span>
          <span>${esc(noiDung)}</span>
        </div>
      `;
    }
    // Khối lịch sử: ngăn cách border-top, danh sách cuộn nếu dài
    htmlLichSu = `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--outline-variant);">
        <p style="font-size:12px;font-weight:600;color:var(--on-surface-variant);margin:0 0 8px 0;">
          Lịch sử vận chuyển
        </p>
        <div style="max-height:12rem;overflow-y:auto;">
          ${cacDong}
        </div>
      </div>
    `;
  }

  // Card GHN: tiêu đề + nút sync | lưới 2 cột mã/trạng thái | lịch sử cuộn | link tra cứu
  return `
    <!-- Khối theo dõi vận chuyển GHN -->
    <div style="
      background:var(--surface);
      border:1px solid var(--outline-variant);
      border-radius:12px;
      padding:20px;
      margin-bottom:20px;
    ">
      <!-- Thanh tiêu đề: trái = icon truck + chữ | phải = nút làm mới tracking -->
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
        <h2 style="margin:0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <i data-lucide="truck" style="width:18px;height:18px;color:var(--primary)"></i>
          Theo dõi vận chuyển GHN
        </h2>
        <button id="sync-tracking" class="btn btn-outline btn-sm" type="button">
          <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
          Cập nhật
        </button>
      </div>

      <!-- Lưới 2 cột: mã vận đơn | trạng thái; dự kiến giao (nếu có) span full width -->
      <div style="display:grid;gap:12px;font-size:14px;grid-template-columns:1fr 1fr;">
        <div>
          <span style="color:var(--on-surface-variant)">Mã vận đơn:</span>
          <b style="font-family:monospace">${esc(ghnCode)}</b>
        </div>
        <div>
          <span style="color:var(--on-surface-variant)">Trạng thái GHN:</span>
          <b>${esc(ghnLabel || '—')}</b>
        </div>
        ${htmlDuKien}
      </div>

      <!-- Lịch sử: border-top, max-height 12rem + overflow cuộn dọc -->
      ${htmlLichSu}

      <!-- Link mở trang tra cứu GHN (tab mới) -->
      <a
        href="https://donhang.ghn.vn/?order_code=${esc(ghnCode)}"
        target="_blank"
        rel="noreferrer"
        style="display:inline-block;margin-top:16px;font-size:14px;color:var(--primary);text-decoration:underline;"
      >
        Tra cứu trên GHN →
      </a>
    </div>
  `;
}

// =============================================================================
// HÀM PHỤ: Thông tin nhận hàng + tổng tiền
// =============================================================================
function taoHtmlThongTinVaTongKet() {
  const subtotal = Number(order.subtotalAmount != null ? order.subtotalAmount : order.totalAmount);
  const discount = Number(order.discountAmount != null ? order.discountAmount : 0);
  const shippingFee = Number(order.shippingFee != null ? order.shippingFee : 0);

  // Ghi chú (nếu có)
  let htmlGhiChu = '';
  if (order.note) {
    htmlGhiChu = `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--outline-variant);color:var(--on-surface-variant);font-style:italic;">
        Ghi chú: ${esc(order.note)}
      </div>
    `;
  }

  // Dòng giảm giá (nếu có)
  let htmlGiamGia = '';
  if (discount > 0) {
    let maVoucher = '';
    if (order.voucher && order.voucher.code) {
      maVoucher = ` (${esc(order.voucher.code)})`;
    }
    htmlGiamGia = `
      <div style="display:flex;justify-content:space-between;color:var(--success, #16a34a);">
        <span>Giảm giá${maVoucher}</span>
        <span style="font-weight:600">-${fmtVND(discount)}</span>
      </div>
    `;
  }

  // Dòng phí ship (nếu có)
  let htmlPhiShip = '';
  if (shippingFee > 0) {
    htmlPhiShip = `
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--on-surface-variant)">Phí vận chuyển (GHN)</span>
        <span style="font-weight:600">${fmtVND(shippingFee)}</span>
      </div>
    `;
  }

  // Style card dùng chung cho cả 2 cột (surface + border + bo góc)
  const styleCard = `
    background:var(--surface);
    border:1px solid var(--outline-variant);
    border-radius:12px;
    padding:20px;
  `;

  // Lưới 2 cột bằng nhau: nhận hàng | tổng kết tiền
  return `
    <!-- 2 cột: thông tin nhận hàng + tổng kết -->
    <div style="display:grid;gap:16px;grid-template-columns:1fr 1fr;margin-bottom:20px;">
      <!-- Cột trái: địa chỉ giao hàng -->
      <div style="${styleCard}">
        <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <i data-lucide="map-pin" style="width:18px;height:18px;color:var(--primary)"></i>
          Thông tin nhận hàng
        </h2>
        <!-- Label muted + giá trị; line-height 1.7 cho dễ đọc -->
        <div style="font-size:14px;line-height:1.7;">
          <div>
            <span style="color:var(--on-surface-variant)">Người nhận:</span>
            <b>${esc(order.shippingName)}</b>
          </div>
          <div>
            <span style="color:var(--on-surface-variant)">Điện thoại:</span>
            ${esc(order.shippingPhone)}
          </div>
          <div>
            <span style="color:var(--on-surface-variant)">Địa chỉ:</span>
            ${esc(order.shippingAddress)}
          </div>
          <!-- Ghi chú (nếu có): italic, ngăn cách border-top -->
          ${htmlGhiChu}
        </div>
      </div>

      <!-- Cột phải: tạm tính / giảm / ship / tổng -->
      <div style="${styleCard}">
        <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <i data-lucide="package" style="width:18px;height:18px;color:var(--primary)"></i>
          Tổng kết
        </h2>
        <!-- Các dòng tiền: flex space-between (nhãn trái, số phải) -->
        <div style="font-size:14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--on-surface-variant)">Số sản phẩm</span>
            <span style="font-weight:600">${order.items.length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--on-surface-variant)">Tạm tính</span>
            <span style="font-weight:600">${fmtVND(subtotal)}</span>
          </div>
          <!-- Giảm giá (xanh) / phí ship — chỉ render khi > 0 -->
          ${htmlGiamGia}
          ${htmlPhiShip}
          <!-- Đường kẻ tách tổng cộng -->
          <hr style="border:none;border-top:1px solid var(--outline-variant);margin:4px 0;" />
          <!-- Tổng: số lớn, màu primary -->
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-weight:700">Tổng cộng</span>
            <span style="font-size:24px;font-weight:800;color:var(--primary)">
              ${fmtVND(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// HÀM PHỤ: Bảng danh sách sản phẩm trong đơn
// =============================================================================
function taoHtmlBangSanPham() {
  const choPhepDanhGia = coTheDanhGia();

  // Header cột đánh giá (chỉ khi đơn COMPLETED)
  let cotDanhGiaHeader = '';
  if (choPhepDanhGia) {
    cotDanhGiaHeader = '<th style="padding:12px 16px;text-align:right;">Đánh giá</th>';
  }

  // Từng dòng sản phẩm
  let cacDong = '';
  for (let i = 0; i < order.items.length; i++) {
    const it = order.items[i];
    let cotDanhGia = '';

    if (choPhepDanhGia) {
      const productId = it.product && it.product.id ? it.product.id : null;
      if (productId) {
        cotDanhGia = `
          <td style="padding:12px 16px;text-align:right;">
            <a
              href="product?id=${encodeURIComponent(productId)}#reviews"
              class="btn btn-outline btn-sm"
              style="display:inline-flex;align-items:center;gap:4px;"
            >
              <i data-lucide="star" style="width:14px;height:14px"></i>
              Đánh giá
            </a>
          </td>
        `;
      } else {
        cotDanhGia = `
          <td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--on-surface-variant);">
            Sản phẩm không còn
          </td>
        `;
      }
    }

    cacDong += `
      <!-- Dòng SP: border-top; tên | đơn giá (phải) | SL (giữa) | thành tiền (primary) | đánh giá? -->
      <tr style="border-top:1px solid var(--outline-variant);">
        <td style="padding:12px 16px;font-weight:500;">${esc(it.productName)}</td>
        <td style="padding:12px 16px;text-align:right;">${fmtVND(it.unitPrice)}</td>
        <td style="padding:12px 16px;text-align:center;">${it.quantity}</td>
        <td style="padding:12px 16px;text-align:right;font-weight:700;color:var(--primary);">
          ${fmtVND(it.subtotal)}
        </td>
        ${cotDanhGia}
      </tr>
    `;
  }

  // Card bảng: header tint + table full width; cột Đánh giá chỉ khi COMPLETED
  return `
    <!-- Bảng chi tiết sản phẩm trong đơn -->
    <div style="
      background:var(--surface);
      border:1px solid var(--outline-variant);
      border-radius:12px;
      overflow:hidden;
    ">
      <!-- Header danh sách: nền nhạt, border dưới -->
      <div style="
        padding:16px 24px;
        border-bottom:1px solid var(--outline-variant);
        background:rgba(241,243,252,.4);
      ">
        <h2 style="margin:0;font-size:16px;font-weight:700;">Chi tiết sản phẩm</h2>
      </div>
      <!-- overflow-x: mobile hẹp vẫn cuộn ngang được -->
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <!-- thead nền surface-low; số tiền căn phải, SL căn giữa -->
            <tr style="background:var(--surface-low, #f8f9fc);text-align:left;">
              <th style="padding:12px 16px;">Tên sản phẩm</th>
              <th style="padding:12px 16px;text-align:right;">Đơn giá</th>
              <th style="padding:12px 16px;text-align:center;">SL</th>
              <th style="padding:12px 16px;text-align:right;">Thành tiền</th>
              ${cotDanhGiaHeader}
            </tr>
          </thead>
          <!-- Mỗi dòng: border-top; thành tiền màu primary; nút Đánh giá (nếu có) -->
          <tbody>
            ${cacDong}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =============================================================================
// HÀM CHÍNH: Vẽ lại toàn bộ trang theo order + tracking hiện tại
// =============================================================================
function veTrang() {
  // Ghép các khối HTML từ trên xuống (GHN có thể rỗng nếu chưa có mã vận đơn)
  app.innerHTML = `
    <div>
      <!-- 1. Link quay lại -->
      ${taoHtmlQuayLai()}
      <!-- 2. Header: mã đơn, chip trạng thái, nút hủy -->
      ${taoHtmlHeader()}
      <!-- 3. Tracking GHN (ẩn nếu chưa có ghnOrderCode) -->
      ${taoHtmlGhn()}
      <!-- 4. 2 cột: nhận hàng + tổng tiền -->
      ${taoHtmlThongTinVaTongKet()}
      <!-- 5. Bảng sản phẩm (+ cột đánh giá nếu COMPLETED) -->
      ${taoHtmlBangSanPham()}
    </div>
  `;

  // HTML mới → phải gắn lại sự kiện click
  ganSuKien();

  // Đổi <i data-lucide="..."> thành icon SVG
  icons();
}

// =============================================================================
// HÀM PHỤ: Gắn sự kiện sau mỗi lần vẽ trang
// =============================================================================
function ganSuKien() {
  const nutHuy = document.getElementById('cancel-order');
  if (nutHuy) {
    nutHuy.addEventListener('click', huyDon);
  }

  const nutSync = document.getElementById('sync-tracking');
  if (nutSync) {
    nutSync.addEventListener('click', taiTracking);
  }
}

// =============================================================================
// HÀM: Hủy đơn (gọi API backend cancel)
// =============================================================================
async function huyDon() {
  const ok = confirm('Bạn chắc chắn muốn hủy đơn?');
  if (!ok) return;

  try {
    await api.patch(`/orders/${id}/cancel`);
    toast.success('Đã hủy đơn hàng');
    await taiLaiDonHang();
    await taiTracking();
  } catch (err) {
    const msg =
      (err && err.response && err.response.data && err.response.data.message) ||
      'Không hủy được đơn';
    toast.error(msg);
  }
}

// =============================================================================
// HÀM: Tải tracking GHN rồi vẽ lại
// =============================================================================
async function taiTracking() {
  try {
    tracking = await api.get(`/shipping/orders/${id}/tracking`);
  } catch (err) {
    tracking = null;
  }

  if (order) {
    veTrang();
  }
}

// =============================================================================
// HÀM: Tải lại thông tin đơn rồi vẽ lại
// =============================================================================
async function taiLaiDonHang() {
  order = await api.get(`/orders/${id}`);
  veTrang();
}

// =============================================================================
// HÀM: Hiện trang lỗi đơn giản
// =============================================================================
function hienLoi(noiDung) {
  // Card lỗi giữa trang: padding lớn, chữ căn giữa, màu muted
  app.innerHTML = `
    <div>
      ${taoHtmlQuayLai()}
      <!-- Thông báo lỗi / không tìm thấy đơn -->
      <div style="
        background:var(--surface);
        border:1px solid var(--outline-variant);
        border-radius:12px;
        padding:48px;
        text-align:center;
        color:var(--on-surface-variant);
      ">
        ${esc(noiDung)}
      </div>
    </div>
  `;
  icons();
}

// =============================================================================
// KHỞI ĐỘNG TRANG
// =============================================================================
async function init() {
  // Chưa đăng nhập → requireAuth tự chuyển hướng / dừng
  if (!requireAuth()) return;

  // Dựng header/nav khách, highlight mục "orders"
  mountCustomerChrome('orders');

  app.innerHTML =
    '<div style="padding:48px;text-align:center;color:var(--on-surface-variant);">Đang tải...</div>';

  // URL thiếu ?id=...
  if (!id) {
    hienLoi('Không tìm thấy đơn hàng');
    return;
  }

  try {
    await taiLaiDonHang();
    await taiTracking();
  } catch (err) {
    const msg =
      (err && err.response && err.response.data && err.response.data.message) ||
      'Không tải được chi tiết đơn hàng';
    hienLoi(msg);
  }
}

init();
