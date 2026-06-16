export const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(v) || 0);
export const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', { hour12: false });
export const orderStatusLabel = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Đã giao',
    CANCELLED: 'Đã hủy',
};
// Map sang class chip theo design system Interlock
export const orderStatusColor = {
    PENDING: 'chip-warning',
    CONFIRMED: 'chip-info',
    SHIPPING: 'bg-secondary-container text-on-secondary-container border border-secondary',
    COMPLETED: 'chip-success',
    CANCELLED: 'chip-danger',
};
