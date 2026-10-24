// Cấu hình endpoint backend. Đổi tại đây nếu backend chạy ở địa chỉ khác.
export const API_URL = 'http://localhost:3000/api';
export const API_BASE = 'http://localhost:3000';

/** Ghép đường dẫn ảnh/tệp tĩnh do backend trả về thành URL đầy đủ */
export function duongDanTapTin(duongDan) {
  if (!duongDan) return '';
  if (duongDan.startsWith('http')) return duongDan;
  return `${API_BASE}${duongDan}`;
}

/**
 * Tạo URL trang HTML kèm query.
 * Với `npx serve`, link `product.html?id=` bị 301 thành `/product` và mất `id`.
 * Khi URL hiện tại không có `.html` thì bỏ đuôi để đi thẳng `/product?id=` (rewrite giữ query).
 */
export function duongDanTrang(fileHtml, params = {}, hash = '') {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([ten, giaTri]) => {
    if (giaTri != null && giaTri !== '') qs.set(ten, String(giaTri));
  });
  const query = qs.toString();
  const file = /\.html$/i.test(location.pathname) ? fileHtml : fileHtml.replace(/\.html$/i, '');
  return `${file}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}
