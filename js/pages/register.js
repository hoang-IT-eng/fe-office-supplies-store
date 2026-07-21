import { api } from '../api.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');

function iconInput(icon, id, attrs) {
  return `<div class="input-wrap"><i data-lucide="${icon}" class="input-icon" style="width:16px;height:16px"></i><input id="${id}" class="input pl-10" ${attrs} /></div>`;
}

function render() {
  app.innerHTML = `
    <div class="card-elevated p-8 max-w-lg mx-auto mt-4">
      <div class="text-center mb-6">
        <div class="inline-flex place-items-center grid" style="width:3rem;height:3rem;border-radius:.75rem;background:var(--primary);color:#fff;margin-bottom:.75rem"><i data-lucide="user-plus" style="width:22px;height:22px"></i></div>
        <h1 class="text-2xl font-extrabold">Đăng ký tài khoản</h1>
        <p class="text-sm muted">Tạo tài khoản để bắt đầu mua sắm</p>
      </div>
      <form id="reg-form" class="space-y-3">
        <div><label class="field-label">Họ và tên *</label>${iconInput('user', 'fullName', 'placeholder="Họ và tên" required')}</div>
        <div><label class="field-label">Email *</label>${iconInput('mail', 'email', 'type="email" placeholder="Email" required')}</div>
        <div><label class="field-label">Mật khẩu *</label>${iconInput('lock', 'password', 'type="password" placeholder="Mật khẩu (≥ 6 ký tự)" minlength="6" required')}</div>
        <div><label class="field-label">Số điện thoại</label>${iconInput('phone', 'phone', 'placeholder="0912345678"')}</div>
        <div><label class="field-label">Địa chỉ</label>${iconInput('map-pin', 'address', 'placeholder="Địa chỉ"')}</div>
        <button type="submit" id="submit" class="btn btn-primary btn-block btn-lg mt-2">Đăng ký</button>
      </form>
      <div class="text-center text-sm muted mt-5">Đã có tài khoản? <a href="login.html" class="text-primary font-semibold">Đăng nhập</a></div>
    </div>`;
  document.getElementById('reg-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('reg-form'));
  icons();
}

async function submit(e) {
  e.preventDefault();
  const form = document.getElementById('reg-form');
  const check = guardForm(
    [
      { id: 'fullName', label: 'Họ và tên', rules: ['required', 'minLength:2', 'maxLength:100'] },
      { id: 'email', label: 'Email', rules: ['required', 'email'] },
      { id: 'password', label: 'Mật khẩu', rules: ['required', 'minLength:6', 'maxLength:64'] },
      { id: 'phone', label: 'Số điện thoại', rules: ['phone'] },
      { id: 'address', label: 'Địa chỉ', rules: ['maxLength:255'] },
    ],
    form,
    toast,
  );
  if (!check) return;
  const btn = document.getElementById('submit');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';
  try {
    await api.post('/auth/register', {
      fullName: check.values.fullName.trim(),
      email: check.values.email.trim(),
      password: check.values.password,
      phone: String(check.values.phone || '').trim() || undefined,
      address: String(check.values.address || '').trim() || undefined,
    });
    toast.success('Đăng ký thành công, vui lòng kiểm tra email để xác thực');
    setTimeout(() => (location.href = 'login.html'), 1200);
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Đăng ký thất bại');
    btn.disabled = false;
    btn.textContent = 'Đăng ký';
  }
}

mountCustomerChrome('');
render();
