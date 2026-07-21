import { api } from '../api.js';
import { toast } from '../toast.js';
import { esc } from '../format.js';
import { mountCustomerChrome, icons } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
let sent = false;
let email = '';

function render() {
  app.innerHTML = `
    <div class="card-elevated p-8 max-w-md mx-auto mt-8" style="width:100%">
      <div class="text-center mb-6">
        <div class="inline-flex place-items-center grid" style="width:3rem;height:3rem;border-radius:.75rem;background:var(--primary);color:#fff;margin-bottom:.75rem"><i data-lucide="key-round" style="width:22px;height:22px"></i></div>
        <h1 class="text-2xl font-extrabold">Quên mật khẩu</h1>
        <p class="text-sm muted">${sent ? 'Kiểm tra hộp thư của bạn để đặt lại mật khẩu' : 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu'}</p>
      </div>
      ${
        sent
          ? `<div class="text-center space-y-4">
               <p class="text-sm muted">Nếu email <b>${esc(email)}</b> tồn tại, bạn sẽ nhận được hướng dẫn trong vài phút. Liên kết có hiệu lực <b>1 giờ</b>.</p>
               <button id="resend" class="btn btn-outline btn-block">Gửi lại</button>
             </div>`
          : `<form id="fp-form" class="space-y-4">
               <div>
                 <label class="field-label">Email</label>
                 <div class="input-wrap"><i data-lucide="mail" class="input-icon" style="width:16px;height:16px"></i>
                   <input id="email" class="input pl-10" type="email" placeholder="email@example.com" required /></div>
               </div>
               <button type="submit" id="submit" class="btn btn-primary btn-block btn-lg">Gửi liên kết đặt lại</button>
             </form>`
      }
      <div class="text-center text-sm muted mt-5"><a href="login.html" class="inline-flex items-center gap-1 text-primary font-semibold"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Quay lại đăng nhập</a></div>
    </div>`;

  if (sent) {
    document.getElementById('resend').addEventListener('click', () => {
      sent = false;
      render();
    });
  } else {
    document.getElementById('fp-form').addEventListener('submit', submit);
    bindLiveClear(document.getElementById('fp-form'));
  }
  icons();
}

async function submit(e) {
  e.preventDefault();
  const form = document.getElementById('fp-form');
  const check = guardForm([{ id: 'email', label: 'Email', rules: ['required', 'email'] }], form, toast);
  if (!check) return;
  email = check.values.email.trim();
  const btn = document.getElementById('submit');
  btn.disabled = true;
  btn.textContent = 'Đang gửi...';
  try {
    const data = await api.post('/auth/forgot-password', { email });
    sent = true;
    toast.success(data.message);
    render();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Gửi yêu cầu thất bại');
    btn.disabled = false;
    btn.textContent = 'Gửi liên kết đặt lại';
  }
}

mountCustomerChrome('');
render();
