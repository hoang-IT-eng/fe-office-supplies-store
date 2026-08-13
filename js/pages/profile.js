import { api } from '../api.js';
import { auth } from '../auth.js';
import { toast } from '../toast.js';
import { esc } from '../format.js';
import { mountCustomerChrome, icons, requireAuth } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');

function render(profile) {
  const user = auth.getUser();
  app.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="card-elevated p-6 flex items-center gap-4">
        <div class="avatar avatar-lg">${(user?.fullName || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <h1 class="text-xl font-bold">${esc(user?.fullName || '')}</h1>
          <p class="text-sm muted flex items-center gap-1"><i data-lucide="mail" style="width:14px;height:14px"></i> ${esc(user?.email || '')}</p>
          <span class="chip chip-info mt-1">${user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span>
        </div>
      </div>

      <form id="profile-form" class="card p-6 space-y-4">
        <h2 class="font-bold mb-2">Thông tin cá nhân</h2>
        <div>
          <label class="field-label">Họ và tên</label>
          <div class="input-wrap"><i data-lucide="user" class="input-icon" style="width:16px;height:16px"></i>
            <input id="fullName" class="input pl-10" value="${esc(profile.fullName)}" required /></div>
        </div>
        <div>
          <label class="field-label">Số điện thoại</label>
          <div class="input-wrap"><i data-lucide="phone" class="input-icon" style="width:16px;height:16px"></i>
            <input id="phone" class="input pl-10" value="${esc(profile.phone)}" /></div>
        </div>
        <div>
          <label class="field-label">Địa chỉ</label>
          <div class="input-wrap"><i data-lucide="map-pin" class="input-icon" style="width:16px;height:16px"></i>
            <input id="address" class="input pl-10" value="${esc(profile.address)}" /></div>
        </div>
        <button id="save-profile" class="btn btn-primary"><i data-lucide="save" style="width:16px;height:16px"></i> Lưu thay đổi</button>
      </form>

      <form id="password-form" class="card p-6 space-y-4">
        <h2 class="font-bold mb-2 flex items-center gap-2"><i data-lucide="key-round" class="text-primary" style="width:18px;height:18px"></i> Đổi mật khẩu</h2>
        <div>
          <label class="field-label">Mật khẩu hiện tại</label>
          <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
            <input id="currentPassword" class="input pl-10" type="password" required /></div>
        </div>
        <div>
          <label class="field-label">Mật khẩu mới</label>
          <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
            <input id="newPassword" class="input pl-10" type="password" minlength="6" required /></div>
        </div>
        <div>
           <label class="field-label">Xác nhận mật khẩu mới</label>
           <div class="input-wrap"><i data-lucide="lock" class="input-icon" style="width:16px;height:16px"></i>
            <input id="confirm" class="input pl-10" type="password" minlength="6" required /></div>
        </div>
        <button id="save-password" class="btn btn-primary"><i data-lucide="key-round" style="width:16px;height:16px"></i> Đổi mật khẩu</button>
      </form>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', saveProfile);
  document.getElementById('password-form').addEventListener('submit', changePassword);
  bindLiveClear(document.getElementById('profile-form'));
  bindLiveClear(document.getElementById('password-form'));
  icons();
}

async function saveProfile(e) {
  e.preventDefault();
  const form = document.getElementById('profile-form');
  const check = guardForm(
    [
      { id: 'fullName', label: 'Họ và tên', rules: ['required', 'minLength:2', 'maxLength:100'] },
      { id: 'phone', label: 'Số điện thoại', rules: ['phone'] },
      { id: 'address', label: 'Địa chỉ', rules: ['maxLength:255'] },
    ],
    form,
    toast,
  );
  if (!check) return;
  const btn = document.getElementById('save-profile');
  btn.disabled = true;
  try {
    const data = await api.patch('/users/me', {
      fullName: check.values.fullName.trim(),
      phone: String(check.values.phone || '').trim() || undefined,
      address: String(check.values.address || '').trim() || undefined,
    });
    auth.setUser(data);
    toast.success('Đã cập nhật thông tin');
    mountCustomerChrome('');
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  } finally {
    btn.disabled = false;
  }
}

async function changePassword(e) {
  e.preventDefault();
  const form = document.getElementById('password-form');
  const check = guardForm(
    [
      { id: 'currentPassword', label: 'Mật khẩu hiện tại', rules: ['required'] },
      { id: 'newPassword', label: 'Mật khẩu mới', rules: ['required', 'minLength:6', 'maxLength:64'] },
      { id: 'confirm', label: 'Xác nhận mật khẩu', rules: ['required', 'match:newPassword'] },
    ],
    form,
    toast,
  );
  if (!check) return;
  const newPassword = check.values.newPassword;
  const btn = document.getElementById('save-password');
  btn.disabled = true;
  try {
    const data = await api.post('/auth/change-password', {
      currentPassword: document.getElementById('currentPassword').value,
      newPassword,
    });
    toast.success(data.message);
    document.getElementById('password-form').reset();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
  } finally {
    btn.disabled = false;
  }
}

async function init() {
  if (!requireAuth()) return;
  mountCustomerChrome('');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  try {
    const data = await api.get('/users/me');
    render({ fullName: data.fullName || '', phone: data.phone || '', address: data.address || '' });
  } catch {
    render({ fullName: '', phone: '', address: '' });
  }
}

init();
