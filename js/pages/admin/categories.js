/**
 * Trang quản lý danh mục (admin)
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { toast } from '../../toast.js';
import { esc } from '../../format.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';
import {
  CARD,
  MUTED,
  MONO,
  INPUT,
  LABEL,
  BTN_PRIMARY,
  BTN_OUTLINE,
  ICON_BTN,
  TABLE_HEAD,
  TH,
  TD,
  rowBorder,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  LIST_HEADER,
} from '../../admin-ui.js';

const app = document.getElementById('app');
let categories = [];
let editingId = null;
const form = { name: '', description: '' };

function render() {
  // Các dòng bảng danh mục
  const rows =
    categories.length === 0
      ? `<tr><td colspan="4" style="${TD};text-align:center;${MUTED};font-size:.875rem">Chưa có danh mục nào</td></tr>`
      : categories
          .map((c, index) => {
            const cell = `${rowBorder(index)}${TD}`;
            return `
              <tr>
                <td style="${cell}font-weight:700">${esc(c.name)}</td>
                <td style="${cell}font-size:.875rem;${MONO};${MUTED}">${esc(c.slug || '')}</td>
                <td style="${cell}font-size:.875rem;${MUTED}">${esc(c.description || '—')}</td>
                <td style="${cell}text-align:right">
                  <button type="button" data-edit="${c.id}" style="${ICON_BTN};color:var(--primary)" title="Sửa">
                    <i data-lucide="pen" style="width:16px;height:16px"></i>
                  </button>
                  <button type="button" data-del="${c.id}" style="${ICON_BTN}" title="Xóa">
                    <i data-lucide="trash-2" style="width:16px;height:16px"></i>
                  </button>
                </td>
              </tr>`;
          })
          .join('');

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- Tiêu đề trang -->
      <div>
        <h1 style="${PAGE_TITLE}">Quản lý danh mục</h1>
        <div style="${PAGE_SUBTITLE}">
          <i data-lucide="folder-tree" style="width:16px;height:16px;color:var(--primary)"></i>
          <p>Tạo và quản lý các danh mục sản phẩm.</p>
        </div>
      </div>

      <!-- Form thêm / sửa: 3 cột (tên, mô tả, nút) — hẹp thì tự xuống -->
      <form id="cat-form" style="${CARD};padding:1.25rem;display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));align-items:end">
        <div>
          <label style="${LABEL}">Tên danh mục *</label>
          <input id="name" style="${INPUT}" placeholder="Ví dụ: Bút viết" required value="${esc(form.name)}" />
        </div>
        <div>
          <label style="${LABEL}">Mô tả</label>
          <input id="description" style="${INPUT}" placeholder="Mô tả ngắn..." value="${esc(form.description)}" />
        </div>
        <div style="display:flex;gap:.5rem">
          <button type="submit" style="${BTN_PRIMARY}">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            ${editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          ${
            editingId
              ? `<button type="button" id="cancel-edit" style="${BTN_OUTLINE}">Hủy</button>`
              : ''
          }
        </div>
      </form>

      <!-- Bảng danh sách -->
      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Danh sách danh mục (${categories.length})</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">Tên</th>
                <th style="${TH}">Slug</th>
                <th style="${TH}">Mô tả</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('cat-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('cat-form'));

  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      form.name = '';
      form.description = '';
      render();
    });
  }

  document.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const c = categories.find((x) => x.id === b.dataset.edit);
      editingId = c.id;
      form.name = c.name;
      form.description = c.description || '';
      render();
    }),
  );
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(b.dataset.del)));
  icons();
}

async function submit(e) {
  e.preventDefault();
  const formEl = document.getElementById('cat-form');
  const check = guardForm(
    [
      { id: 'name', label: 'Tên danh mục', rules: ['required', 'minLength:2', 'maxLength:100'] },
      { id: 'description', label: 'Mô tả', rules: ['maxLength:500'] },
    ],
    formEl,
    toast,
  );
  if (!check) return;
  const payload = { name: check.values.name.trim(), description: String(check.values.description || '').trim() };
  try {
    if (editingId) {
      await api.patch(`/categories/${editingId}`, payload);
      toast.success('Đã cập nhật');
    } else {
      await api.post('/categories', payload);
      toast.success('Đã thêm danh mục');
    }
    editingId = null;
    form.name = '';
    form.description = '';
    await reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  }
}

async function remove(id) {
  if (!confirm('Xóa danh mục?')) return;
  await api.delete(`/categories/${id}`);
  toast.success('Đã xóa');
  reload();
}

async function reload() {
  categories = await api.get('/categories');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('categories');
  render();
  reload();
}

init();
