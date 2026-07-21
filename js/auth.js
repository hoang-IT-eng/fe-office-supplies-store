// Quản lý phiên đăng nhập, lưu vào localStorage (thay cho zustand persist).
const KEY = 'auth-store';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const auth = {
  getUser() {
    return read().user || null;
  },
  getAccessToken() {
    return read().accessToken || null;
  },
  getRefreshToken() {
    return read().refreshToken || null;
  },
  setSession(user, accessToken, refreshToken) {
    write({ user, accessToken, refreshToken });
  },
  setTokens(accessToken, refreshToken) {
    write({ ...read(), accessToken, refreshToken });
  },
  setUser(user) {
    write({ ...read(), user });
  },
  logout() {
    localStorage.removeItem(KEY);
  },
  isAdmin() {
    return read().user?.role === 'ADMIN';
  },
};
