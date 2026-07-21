import { API_URL } from './config.js';
import { auth } from './auth.js';

// Lỗi mô phỏng cấu trúc axios: err.response.data.message
class ApiError extends Error {
  constructor(status, data) {
    super((data && data.message) || 'Request failed');
    this.response = { status, data };
  }
}

function buildQuery(params) {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

let isRefreshing = false;
let queue = [];

async function refreshToken() {
  const rt = auth.getRefreshToken();
  if (!rt) throw new Error('no refresh token');
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) throw new Error('refresh failed');
  const data = await res.json();
  auth.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request(method, path, { params, body, isForm } = {}, _retry = false) {
  const headers = {};
  const token = auth.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData: để trình duyệt tự set Content-Type
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
    method,
    headers,
    body: payload,
  });

  if (res.status === 401 && !_retry && auth.getRefreshToken()) {
    // Refresh 1 lần, các request song song xếp hàng chờ.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((newToken) => {
          if (!newToken) return reject(new ApiError(401, { message: 'Unauthorized' }));
          resolve(request(method, path, { params, body, isForm }, true));
        });
      });
    }
    isRefreshing = true;
    try {
      const newToken = await refreshToken();
      queue.forEach((cb) => cb(newToken));
      queue = [];
      return request(method, path, { params, body, isForm }, true);
    } catch (e) {
      queue.forEach((cb) => cb(null));
      queue = [];
      auth.logout();
      throw new ApiError(401, { message: 'Phiên đăng nhập đã hết hạn' });
    } finally {
      isRefreshing = false;
    }
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
  postForm: (path, formData) => request('POST', path, { body: formData, isForm: true }),
};
