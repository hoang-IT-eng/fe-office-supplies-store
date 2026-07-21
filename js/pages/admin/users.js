import { api } from '../../api.js';
import { fmtDate, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';

const app = document.getElementById('app');
let users = [];

function render() {
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;

  app.innerHTML = `
    <div class="space-y-6">
      <section class="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 class="page-title">Quản lý tài khoản</h1>
          <div class="flex items-center gap-2 muted mt-1"><i data-lucide="users" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Quản lý người dùng, khóa/mở khóa hoặc xóa tài khoản.</p></div>
        </div>
        <div class="flex gap-3">
          <div class="card stat-card" style="border-left-color:var(--primary);min-width:180px">
            <div class="stat-icon" style="background:var(--primary-fixed);color:var(--primary)"><i data-lucide="shield-check" style="width:20px;height:20px"></i></div>
            <div><p class="text-xs font-bold uppercase tracking-wide muted">Admin</p><p class="text-xl font-extrabold text-primary">${adminCount}</p></div>
          </div>
          <div class="card stat-card" style="border-left-color:var(--secondary);min-width:180px">
            <div class="stat-icon" style="background:var(--secondary-container);color:var(--on-secondary-container)"><i data-lucide="users" style="width:20px;height:20px"></i></div>
            <div><p class="text-xs font-bold uppercase tracking-wide muted">Khách hàng</p><p class="text-xl font-extrabold" style="color:var(--secondary)">${customerCount}</p></div>
          </div>
        </div>
      </section>

      <div class="card overflow-hidden">
        <div class="px-6 py-4" style="border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)"><h3 class="text-sm font-bold">Danh sách tài khoản (${users.length})</h3></div>
        <div class="overflow-x-auto">
          <table class="min-w-table">
            <thead class="table-head"><tr>
              <th class="table-cell">Người dùng</th><th class="table-cell">Email</th><th class="table-cell">SĐT</th>
              <th class="table-cell">Vai trò</th><th class="table-cell">Trạng thái</th><th class="table-cell">Ngày tạo</th><th class="table-cell text-right">Thao tác</th>
            </tr></thead>
            <tbody class="divide-y">${users.map(row).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('[data-toggle]').forEach((b) =>
    b.addEventListener('click', () => toggleActive(b.dataset.toggle, b.dataset.active === 'true')),
  );
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(b.dataset.del)));
  icons();
}

function row(u) {
  return `<tr>
    <td class="table-cell"><div class="flex items-center gap-3"><div class="avatar" style="width:2.5rem;height:2.5rem">${(u.fullName || 'U').charAt(0).toUpperCase()}</div><div class="font-bold">${esc(u.fullName || '')}</div></div></td>
    <td class="table-cell text-sm">${esc(u.email)}</td>
    <td class="table-cell text-sm muted">${esc(u.phone || '—')}</td>
    <td class="table-cell">${u.role === 'ADMIN' ? '<span class="chip chip-info"><i data-lucide="shield-check" style="width:12px;height:12px"></i> Admin</span>' : '<span class="chip chip-neutral">Khách hàng</span>'}</td>
    <td class="table-cell">${u.isActive ? '<span class="chip chip-success">Hoạt động</span>' : '<span class="chip chip-danger">Bị khóa</span>'}</td>
    <td class="table-cell text-xs muted">${fmtDate(u.createdAt)}</td>
    <td class="table-cell text-right">
      <button data-toggle="${u.id}" data-active="${u.isActive}" class="icon-btn" style="color:var(--primary)" title="${u.isActive ? 'Khóa' : 'Mở khóa'}"><i data-lucide="${u.isActive ? 'lock' : 'lock-open'}" style="width:16px;height:16px"></i></button>
      <button data-del="${u.id}" class="icon-btn" title="Xóa"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
    </td>
  </tr>`;
}

async function toggleActive(id, isActive) {
  try {
    await api.patch(`/users/${id}/active`, { isActive: !isActive });
    toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa');
    reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  }
}

async function remove(id) {
  if (!confirm('Xóa người dùng này?')) return;
  await api.delete(`/users/${id}`);
  toast.success('Đã xóa');
  reload();
}

async function reload() {
  users = await api.get('/users');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('users');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  await reload();
}

init();
