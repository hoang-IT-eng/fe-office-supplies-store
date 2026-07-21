import { api } from '../api.js';
import { auth } from '../auth.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

function render() {
  app.innerHTML = `
    <div class="auth-split">
      <div class="auth-side">
        <div style="width:3.5rem;height:3.5rem;border-radius:.75rem;background:rgba(255,255,255,.15);display:grid;place-items:center;margin-bottom:1.5rem">
          <i data-lucide="pencil" style="width:28px;height:28px"></i>
        </div>
        <h2 class="text-4xl font-extrabold mb-3">Chào mừng trở lại!</h2>
        <p style="opacity:.9;max-width:24rem">Đăng nhập để theo dõi đơn hàng, đánh giá sản phẩm và nhận ưu đãi từ Văn phòng phẩm Trần Huy Hoàng.</p>
      </div>
      <div class="card-elevated p-8 max-w-md w-full mx-auto">
        <div class="text-center mb-6">
          <div class="inline-flex place-items-center grid" style="width:3rem;height:3rem;border-radius:.75rem;background:var(--primary);color:#fff;margin-bottom:.75rem"><i data-lucide="log-in" style="width:22px;height:22px"></i></div>
          <h1 class="text-2xl font-extrabold">Đăng nhập</h1>
          <p class="text-sm muted">Nhập thông tin để truy cập tài khoản</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="field-label">Email</label>
            <div class="input-wrap"><i data-lucide="mail" class="input-icon" style="width:16px;height:16px"></i>
              <input id="email" class="input pl-10" type="email" placeholder="email@example.com" required /></div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label" style="margin:0">Mật khẩu</label>
              <a href="forgot-password.html" class="text-xs text-primary font-semibold">Quên mật khẩu?</a>
            </div>
            <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
              <input id="password" class="input pl-10" type="password" placeholder="••••••••" required /></div>
          </div>
          <button type="submit" id="submit" class="btn btn-primary btn-block btn-lg">Đăng nhập</button>
        </form>
        <div class="text-center text-sm muted mt-5">Chưa có tài khoản? <a href="register.html" class="text-primary font-semibold">Đăng ký ngay</a></div>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('login-form'));
  icons();
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
