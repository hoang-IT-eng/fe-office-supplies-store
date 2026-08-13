/**
 * Trang quản lý tài khoản (admin)
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { fmtDate, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import {
  CARD,
  MUTED,
  CHIP,
  ICON_BTN,
  AVATAR,
  TABLE_HEAD,
  TH,
  TD,
  rowBorder,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  LIST_HEADER,
  LOADING,
  statCard,
  statIcon,
} from '../../admin-ui.js';

const app = document.getElementById('app');
let users = [];

function render() {
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const customers = users.filter((u) => u.role !== 'ADMIN');
  const customerCount = customers.length;

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- Tiêu đề + 2 ô thống kê -->
      <section style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1.5rem">
        <div>
          <h1 style="${PAGE_TITLE}">Quản lý tài khoản</h1>
          <div style="${PAGE_SUBTITLE}">
            <i data-lucide="users" style="width:16px;height:16px;color:var(--primary)"></i>
            <p>Quản lý người dùng, khóa/mở khóa hoặc xóa tài khoản.</p>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.75rem">
          <div style="${statCard('var(--primary)')}">
            <div style="${statIcon('var(--primary-fixed)', 'var(--primary)')}">
              <i data-lucide="shield-check" style="width:20px;height:20px"></i>
            </div>
            <div>
              <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Admin</p>
              <p style="font-size:1.25rem;font-weight:800;color:var(--primary)">${adminCount}</p>
            </div>
          </div>
          <div style="${statCard('var(--secondary)')}">
            <div style="${statIcon('var(--secondary-container)', 'var(--on-secondary-container)')}">
              <i data-lucide="users" style="width:20px;height:20px"></i>
            </div>
            <div>
              <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Khách hàng</p>
              <p style="font-size:1.25rem;font-weight:800;color:var(--secondary)">${customerCount}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Bảng tài khoản -->
      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Danh sách tài khoản (${customers.length})</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%;min-width:900px">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">Người dùng</th>
                <th style="${TH}">Email</th>
                <th style="${TH}">SĐT</th>
                <th style="${TH}">Vai trò</th>
                <th style="${TH}">Trạng thái</th>
                <th style="${TH}">Ngày tạo</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${customers.map(row).join('')}</tbody>
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

function row(u, index) {
  const cell = `${rowBorder(index)}${TD}`;
  const roleChip =
    u.role === 'ADMIN'
      ? `<span style="${CHIP.info}"><i data-lucide="shield-check" style="width:12px;height:12px"></i> Admin</span>`
      : `<span style="${CHIP.neutral}">Khách hàng</span>`;
  const statusChip = u.isActive
    ? `<span style="${CHIP.success}">Hoạt động</span>`
    : `<span style="${CHIP.danger}">Bị khóa</span>`;

  return `
    <tr>
      <td style="${cell}">
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="${AVATAR};width:2.5rem;height:2.5rem">${(u.fullName || 'U').charAt(0).toUpperCase()}</div>
          <div style="font-weight:700">${esc(u.fullName || '')}</div>
        </div>
      </td>
      <td style="${cell}font-size:.875rem">${esc(u.email)}</td>
      <td style="${cell}font-size:.875rem;${MUTED}">${esc(u.phone || '—')}</td>
      <td style="${cell}">${roleChip}</td>
      <td style="${cell}">${statusChip}</td>
      <td style="${cell}font-size:.75rem;${MUTED}">${fmtDate(u.createdAt)}</td>
      <td style="${cell}text-align:right">
        <button type="button" data-toggle="${u.id}" data-active="${u.isActive}" style="${ICON_BTN};color:var(--primary)" title="${u.isActive ? 'Khóa' : 'Mở khóa'}">
          <i data-lucide="${u.isActive ? 'lock' : 'lock-open'}" style="width:16px;height:16px"></i>
        </button>
        <button type="button" data-del="${u.id}" style="${ICON_BTN}" title="Xóa">
          <i data-lucide="trash-2" style="width:16px;height:16px"></i>
        </button>
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
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  await reload();
}

init();
