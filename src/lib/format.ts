export const fmtVND = (v: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(v) || 0);

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('vi-VN', { hour12: false });

export const orderStatusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

// Map sang class chip theo design system Interlock
export const orderStatusColor: Record<string, string> = {
  PENDING: 'chip-warning',
  CONFIRMED: 'chip-info',
  SHIPPING: 'bg-secondary-container text-on-secondary-container border border-secondary',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-danger',
};
