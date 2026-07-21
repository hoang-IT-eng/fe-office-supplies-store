export const fmtVND = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(v) || 0,
  );

export const fmtDate = (d) => (d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '');

export const orderStatusLabel = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export const ghnStatusLabel = {
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

export const orderStatusColor = {
  PENDING: 'chip-warning',
  CONFIRMED: 'chip-info',
  SHIPPING: 'chip-secondary',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-danger',
};

export const paymentMethodLabel = {
  COD: 'Thanh toán khi nhận hàng (COD)',
};

export const paymentStatusLabel = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
};

export const paymentStatusColor = {
  UNPAID: 'chip-warning',
  PAID: 'chip-success',
  FAILED: 'chip-danger',
};

// Chống XSS khi chèn dữ liệu vào innerHTML.
export function esc(v) {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
