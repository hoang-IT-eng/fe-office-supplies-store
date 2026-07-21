import { api } from '../api.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
const token = new URLSearchParams(location.search).get('token') || '';

function renderInvalid() {
  app.innerHTML = `
    <div class="card-elevated p-8 max-w-md mx-auto mt-8 text-center space-y-4" style="width:100%">
      <i data-lucide="key-round" class="text-error mx-auto" style="width:40px;height:40px"></i>
      <h1 class="text-xl font-bold">Liên kết không hợp lệ</h1>
      <p class="text-sm muted">Liên kết đặt lại mật khẩu bị thiếu hoặc hết hạn. Vui lòng yêu cầu liên kết mới.</p>
      <a href="forgot-password.html" class="btn btn-primary">Yêu cầu liên kết mới</a>
    </div>`;
  icons();
}

function render() {
  app.innerHTML = `
    <div class="card-elevated p-8 max-w-md mx-auto mt-8" style="width:100%">
      <div class="text-center mb-6">
        <div class="inline-flex place-items-center grid" style="width:3rem;height:3rem;border-radius:.75rem;background:var(--primary);color:#fff;margin-bottom:.75rem"><i data-lucide="key-round" style="width:22px;height:22px"></i></div>
        <h1 class="text-2xl font-extrabold">Đặt lại mật khẩu</h1>
        <p class="text-sm muted">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>
      <form id="rp-form" class="space-y-4">
        <div>
          <label class="field-label">Mật khẩu mới</label>
          <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
            <input id="password" class="input pl-10" type="password" placeholder="≥ 6 ký tự" minlength="6" required /></div>
        </div>
        <div>
          <label class="field-label">Xác nhận mật khẩu</label>
          <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
            <input id="confirm" class="input pl-10" type="password" placeholder="Nhập lại mật khẩu" minlength="6" required /></div>
        </div>
        <button type="submit" id="submit" class="btn btn-primary btn-block btn-lg">Đặt lại mật khẩu</button>
      </form>
      <div class="text-center text-sm muted mt-5"><a href="login.html" class="inline-flex items-center gap-1 text-primary font-semibold"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Quay lại đăng nhập</a></div>
    </div>`;
  document.getElementById('rp-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('rp-form'));
  icons();
}

async function submit(e) {
  e.preventDefault();
  const form = document.getElementById('rp-form');
  const check = guardForm(
    [
      { id: 'password', label: 'Mật khẩu mới', rules: ['required', 'minLength:6', 'maxLength:64'] },
      { id: 'confirm', label: 'Xác nhận mật khẩu', rules: ['required', 'match:password'] },
    ],
    form,
    toast,
  );
  if (!check) return;
  const password = check.values.password;
  const btn = document.getElementById('submit');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';
  try {
    const data = await api.post('/auth/reset-password', { token, password });
    toast.success(data.message);
    setTimeout(() => (location.href = 'login.html'), 1000);
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    btn.disabled = false;
    btn.textContent = 'Đặt lại mật khẩu';
  }
}

mountCustomerChrome('');
if (!token) renderInvalid();
else render();
