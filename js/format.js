/** Định dạng số thành tiền Việt: 25000 → 25.000 ₫ */
export const dinhDangTien = (giaTri) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(giaTri) || 0,
  );

/** Định dạng ngày giờ kiểu Việt Nam: 17/08/2026 21:30:00 */
export const dinhDangNgay = (ngay) => (ngay ? new Date(ngay).toLocaleString('vi-VN', { hour12: false }) : '');

// Nhãn tiếng Việt cho enum trạng thái đơn hàng của backend
export const nhanTrangThaiDon = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy',
};

// Class chip tương ứng từng trạng thái đơn hàng
export const chipTrangThaiDon = {
  PENDING: 'chip-warning',
  CONFIRMED: 'chip-info',
  SHIPPING: 'chip-secondary',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-danger',
};

// Nhãn tiếng Việt cho trạng thái vận đơn GHN
export const nhanTrangThaiGhn = {
  ready_to_pick: 'Chờ lấy hàng',
  picking: 'Đang lấy hàng',
  picked: 'Đã lấy hàng',
  storing: 'Đang lưu kho',
  transporting: 'Đang trung chuyển',
  sorting: 'Đang phân loại',
  delivering: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  delivery_fail: 'Giao thất bại',
  waiting_to_return: 'Chờ trả hàng',
  return: 'Đang trả hàng',
  returned: 'Đã trả hàng',
  cancel: 'Đã hủy',
  lost: 'Thất lạc',
  damage: 'Hư hỏng',
};

export const nhanPhuongThucThanhToan = {
  COD: 'Thanh toán khi nhận hàng (COD)',
};

export const nhanTrangThaiThanhToan = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
};

export const chipTrangThaiThanhToan = {
  UNPAID: 'chip-warning',
  PAID: 'chip-success',
  FAILED: 'chip-danger',
};

/**
 * Biến dữ liệu người dùng thành chuỗi an toàn trước khi chèn vào innerHTML.
 * Bắt buộc dùng để chống XSS (người khác chèn thẻ <script> qua tên, nhận xét...).
 */
export function chuoiAnToan(giaTri) {
  if (giaTri == null) return '';
  return String(giaTri)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
