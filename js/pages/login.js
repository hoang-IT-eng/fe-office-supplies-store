import { api } from '../api.js';
import { auth } from '../auth.js';
import { toast } from '../toast.js';
import { mountCustomerChrome } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

function render() {
  app.innerHTML = `
    <div class="card-elevated p-8 max-w-md w-full mx-auto">
      <h1 class="text-2xl font-extrabold text-center mb-6">Đăng nhập</h1>
      <form id="login-form" class="space-y-4">
        <div>
          <label class="field-label">Email</label>
          <input id="email" class="input" type="email" placeholder="email@example.com" required />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label" style="margin:0">Mật khẩu</label>
            <a href="forgot-password.html" class="text-xs text-primary font-semibold">Quên mật khẩu?</a>
          </div>
          <input id="password" class="input" type="password" placeholder="••••••••" required />
        </div>
        <button type="submit" id="submit" class="btn btn-primary btn-block">Đăng nhập</button>
      </form>
      <!-- Chữ nhỏ, căn giữa, cách nút một khoảng; link sang trang đăng ký -->
      <p style="text-align: center; font-size: 0.875rem; color: #64748b; margin-top: 1.25rem">
        Chưa có tài khoản?
        <a href="register.html" style="color: var(--primary); font-weight: 600">Đăng ký ngay</a>
      </p>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('login-form'));
}

async function submit(e) {
  e.preventDefault();
  const form = document.getElementById('login-form');
  const check = guardForm(
    [
      { id: 'email', label: 'Email', rules: ['required', 'email'] },
      { id: 'password', label: 'Mật khẩu', rules: ['required', 'minLength:1'] },
    ],
    form,
    toast,
  );
  if (!check) return;
  const btn = document.getElementById('submit');
  btn.disabled = true;
  btn.textContent = 'Đang đăng nhập...';
  try {
    const data = await api.post('/auth/login', {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    });
    auth.setSession(data.user, data.accessToken, data.refreshToken);
    toast.success('Đăng nhập thành công');
    location.href = params.get('next') || 'index.html';
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  }
}

mountCustomerChrome('');
render();
if (params.get('verified')) toast.success('Đã xác thực email, mời đăng nhập');
