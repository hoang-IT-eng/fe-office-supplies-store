import { API_URL } from './config.js';
import { taiKhoan } from './auth.js';

// Lỗi API mô phỏng cấu trúc axios để mọi trang đọc được: err.response.data.message
class LoiApi extends Error {
  constructor(status, duLieu) {
    super((duLieu && duLieu.message) || 'Request failed');
    this.response = { status, data: duLieu };
  }
}

/** Ghép object thành query string ?a=1&b=2 (bỏ giá trị rỗng) */
function taoQueryString(thamSo) {
  if (!thamSo) return '';
  const usp = new URLSearchParams();
  Object.entries(thamSo).forEach(([khoa, giaTri]) => {
    if (giaTri !== undefined && giaTri !== null && giaTri !== '') usp.append(khoa, giaTri);
  });
  const chuoi = usp.toString();
  return chuoi ? `?${chuoi}` : '';
}

let dangLamMoiToken = false;
let hangCho = [];

/** Gọi /auth/refresh để lấy access token mới */
async function lamMoiToken() {
  const refreshToken = taiKhoan.layRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('refresh failed');
  const duLieu = await res.json();
  taiKhoan.luuToken(duLieu.accessToken, duLieu.refreshToken);
  return duLieu.accessToken;
}

/** Gửi 1 request đến backend, tự gắn Bearer token và tự refresh khi hết hạn */
async function guiYeuCau(phuongThuc, duongDan, { params, body, laFormData } = {}, thuLai = false) {
  const headers = {};
  const token = taiKhoan.layAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let noiDung;
  if (laFormData) {
    noiDung = body; // FormData: để trình duyệt tự set Content-Type
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    noiDung = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${duongDan}${taoQueryString(params)}`, {
    method: phuongThuc,
    headers,
    body: noiDung,
  });

  if (res.status === 401 && !thuLai && taiKhoan.layRefreshToken()) {
    // Chỉ refresh 1 lần; các request song song xếp hàng chờ token mới.
    if (dangLamMoiToken) {
      return new Promise((thanhCong, thatBai) => {
        hangCho.push((tokenMoi) => {
          if (!tokenMoi) return thatBai(new LoiApi(401, { message: 'Unauthorized' }));
          thanhCong(guiYeuCau(phuongThuc, duongDan, { params, body, laFormData }, true));
        });
      });
    }
    dangLamMoiToken = true;
    try {
      const tokenMoi = await lamMoiToken();
      hangCho.forEach((tiepTuc) => tiepTuc(tokenMoi));
      hangCho = [];
      return guiYeuCau(phuongThuc, duongDan, { params, body, laFormData }, true);
    } catch {
      hangCho.forEach((tiepTuc) => tiepTuc(null));
      hangCho = [];
      taiKhoan.dangXuat();
      throw new LoiApi(401, { message: 'Phiên đăng nhập đã hết hạn' });
    } finally {
      dangLamMoiToken = false;
    }
  }

  let duLieu = null;
  const vanBan = await res.text();
  if (vanBan) {
    try {
      duLieu = JSON.parse(vanBan);
    } catch {
      duLieu = vanBan;
    }
  }

  if (!res.ok) throw new LoiApi(res.status, duLieu);
  return duLieu;
}

// Giữ tên "api" và các phương thức HTTP theo chuẩn (get/post/patch/delete).
export const api = {
  get: (duongDan, tuyChon) => guiYeuCau('GET', duongDan, tuyChon),
  post: (duongDan, body, tuyChon) => guiYeuCau('POST', duongDan, { ...tuyChon, body }),
  patch: (duongDan, body, tuyChon) => guiYeuCau('PATCH', duongDan, { ...tuyChon, body }),
  delete: (duongDan, tuyChon) => guiYeuCau('DELETE', duongDan, tuyChon),
  postForm: (duongDan, formData) => guiYeuCau('POST', duongDan, { body: formData, laFormData: true }),
};
