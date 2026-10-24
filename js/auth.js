// Quản lý phiên đăng nhập: lưu người dùng + token vào localStorage.
const KHOA_LUU = 'auth-store'; // tên khóa trong localStorage (giữ nguyên để không mất phiên cũ)

/** Đọc dữ liệu phiên từ localStorage (lỗi thì trả object rỗng) */
function docPhien() {
  try {
    return JSON.parse(localStorage.getItem(KHOA_LUU)) || {};
  } catch {
    return {};
  }
}

/** Ghi dữ liệu phiên vào localStorage */
function ghiPhien(duLieu) {
  localStorage.setItem(KHOA_LUU, JSON.stringify(duLieu));
}

export const taiKhoan = {
  /** Người dùng đang đăng nhập, chưa đăng nhập thì null */
  layNguoiDung() {
    return docPhien().user || null;
  },

  layAccessToken() {
    return docPhien().accessToken || null;
  },

  layRefreshToken() {
    return docPhien().refreshToken || null;
  },

  /** Lưu phiên mới sau khi đăng nhập thành công */
  luuPhien(nguoiDung, accessToken, refreshToken) {
    ghiPhien({ user: nguoiDung, accessToken, refreshToken });
  },

  /** Chỉ thay token (dùng khi refresh token) */
  luuToken(accessToken, refreshToken) {
    ghiPhien({ ...docPhien(), accessToken, refreshToken });
  },

  /** Chỉ thay thông tin người dùng (dùng khi sửa profile) */
  luuNguoiDung(nguoiDung) {
    ghiPhien({ ...docPhien(), user: nguoiDung });
  },

  dangXuat() {
    localStorage.removeItem(KHOA_LUU);
  },

  laAdmin() {
    return docPhien().user?.role === 'ADMIN';
  },
};
