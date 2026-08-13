/**
 * Style dùng chung cho trang admin.
 *
 * Vì không dùng utility CSS / class component, mọi kiểu nhìn được viết bằng
 * chuỗi style inline. File này gom các chuỗi lặp lại để từng trang admin
 * không phải gõ lại dài dòng, và người mới chỉ cần đọc 1 chỗ.
 *
 * Lưu ý: inline CSS không hỗ trợ :hover / :focus — chấp nhận theo kế hoạch.
 */

// ----- Khối khung trắng (card) -----
export const CARD =
  'background:var(--surface-lowest);border:1px solid rgba(193,198,213,.5);border-radius:var(--radius-lg);box-shadow:var(--shadow-soft)';

export const CARD_ELEVATED =
  'background:var(--surface-lowest);border:1px solid rgba(193,198,213,.5);border-radius:var(--radius-lg);box-shadow:var(--shadow-elevated)';

// ----- Chữ -----
export const MUTED = 'color:var(--on-surface-variant)';
export const MONO = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace';

// ----- Ô nhập liệu -----
export const INPUT =
  'width:100%;padding:.625rem 1rem;background:var(--surface-low);border:1px solid var(--outline-variant);border-radius:var(--radius);font-size:.875rem;color:var(--on-surface);box-sizing:border-box';

export const LABEL =
  'display:block;font-size:.75rem;font-weight:600;color:var(--on-surface-variant);margin-bottom:.375rem';

// ----- Nút bấm -----
const BTN_BASE =
  'display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.625rem 1.25rem;border-radius:var(--radius);font-weight:600;font-size:.875rem;cursor:pointer;white-space:nowrap;font-family:inherit';

export const BTN_PRIMARY = `${BTN_BASE};border:none;background:var(--primary);color:#fff;box-shadow:var(--shadow-soft)`;
export const BTN_OUTLINE = `${BTN_BASE};background:var(--surface-lowest);border:1px solid var(--outline-variant);color:var(--on-surface)`;
export const BTN_DANGER = `${BTN_BASE};border:none;background:var(--error);color:#fff;box-shadow:var(--shadow-soft)`;
export const BTN_SM = 'padding:.375rem .75rem;font-size:.8125rem';

// Nút chỉ có icon (sửa / xóa / khóa...)
export const ICON_BTN =
  'padding:.5rem;border-radius:var(--radius);border:none;background:none;cursor:pointer;color:var(--on-surface-variant);display:inline-flex;align-items:center;justify-content:center;font-family:inherit';

// ----- Chip / badge tròn -----
const CHIP_BASE =
  'display:inline-flex;align-items:center;gap:.375rem;padding:.25rem .75rem;border-radius:9999px;font-size:.75rem;font-weight:600';

export const CHIP = {
  success: `${CHIP_BASE};background:#ecfdf5;color:#047857;border:1px solid #a7f3d0`,
  warning: `${CHIP_BASE};background:#fffbeb;color:#b45309;border:1px solid #fde68a`,
  danger: `${CHIP_BASE};background:#fef2f2;color:#b91c1c;border:1px solid #fecaca`,
  info: `${CHIP_BASE};background:#eff6ff;color:var(--primary);border:1px solid #bfdbfe`,
  neutral: `${CHIP_BASE};background:var(--surface-high);color:var(--on-surface-variant);border:1px solid var(--outline-variant)`,
  secondary: `${CHIP_BASE};background:var(--secondary-container);color:var(--on-secondary-container);border:1px solid var(--secondary)`,
  primary: `${CHIP_BASE};background:var(--primary);color:#fff;border:none`,
};

/** Map trạng thái đơn hàng → style chip */
export const ORDER_STATUS_CHIP = {
  PENDING: CHIP.warning,
  CONFIRMED: CHIP.info,
  SHIPPING: CHIP.secondary,
  COMPLETED: CHIP.success,
  CANCELLED: CHIP.danger,
};

/** Map trạng thái thanh toán → style chip */
export const PAYMENT_STATUS_CHIP = {
  UNPAID: CHIP.warning,
  PAID: CHIP.success,
  FAILED: CHIP.danger,
};

// ----- Bảng -----
export const TABLE_HEAD =
  'background:rgba(241,243,252,.5);font-size:.625rem;text-transform:uppercase;letter-spacing:.1em;color:var(--on-surface-variant)';

export const TH = 'padding:.75rem 1.5rem;font-weight:700;text-align:left';
export const TD = 'padding:1rem 1.5rem';

/** Vạch kẻ trên dòng bảng (bỏ qua dòng đầu) */
export function rowBorder(index) {
  return index === 0 ? '' : 'border-top:1px solid rgba(193,198,213,.4);';
}

// ----- Tiêu đề trang -----
export const PAGE_TITLE = 'font-size:1.875rem;font-weight:800;letter-spacing:-.02em';

export const PAGE_SUBTITLE =
  'display:flex;align-items:center;gap:.5rem;color:var(--on-surface-variant);margin-top:.25rem;font-size:.875rem';

// ----- Ô thống kê nhỏ (stat card) -----
export function statCard(borderColor) {
  return `${CARD};display:flex;align-items:center;gap:.75rem;padding:1rem;min-width:180px;border-left:4px solid ${borderColor}`;
}

export function statIcon(bg, color) {
  return `padding:.625rem;border-radius:var(--radius);display:grid;place-items:center;background:${bg};color:${color}`;
}

// ----- Avatar tròn -----
export const AVATAR =
  'width:2rem;height:2rem;border-radius:9999px;background:var(--primary-fixed);color:var(--primary);display:grid;place-items:center;font-weight:700;font-size:.875rem';

// ----- Loading / empty -----
export const LOADING = `text-align:center;padding:5rem 0;${MUTED}`;
export const EMPTY = `text-align:center;padding:3rem;${MUTED}`;

// ----- Header bảng danh sách -----
export const LIST_HEADER =
  'padding:1rem 1.5rem;border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4);font-size:.875rem;font-weight:700';
