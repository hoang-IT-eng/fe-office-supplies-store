// Cấu hình endpoint backend. Đổi tại đây nếu backend chạy ở địa chỉ khác.
export const API_URL = 'http://localhost:3000/api';
export const API_BASE = 'http://localhost:3000';

// Ghép đường dẫn ảnh/tĩnh từ backend.
export function fileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}
