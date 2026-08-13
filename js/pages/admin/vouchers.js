/**
 * Trang quản lý voucher (admin)
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { fmtVND, fmtDate, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';
import {
  CARD,
  MUTED,
  MONO,
  INPUT,
  LABEL,
  CHIP,
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
  LOADING,
} from '../../admin-ui.js';

const app = document.getElementById('app');
let vouchers = [];
let editingId = null;

const typeLabel = { PERCENT: 'Phần trăm (%)', FIXED: 'Số tiền cố định' };

function emptyForm() {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    code: '',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscount: '',
    minOrderAmount: 0,
    usageLimit: 100,
    startDate: start.toISOString().slice(0, 16),
    endDate: end.toISOString().slice(0, 16),
    isActive: true,
  };
}
let form = emptyForm();

function discountLabel(v) {
  if (v.discountType === 'PERCENT') {
    const cap = v.maxDiscount ? `, tối đa ${fmtVND(v.maxDiscount)}` : '';
    return `${Number(v.discountValue)}%${cap}`;
  }
  return fmtVND(v.discountValue);
}

function render() {
  // ── 1. Dựng HTML từng dòng bảng (hoặc dòng trống nếu chưa có data) ──
  const rows =
    vouchers.length === 0
      ? `<tr><td colspan="7" style="${TD};text-align:center;${MUTED};font-size:.875rem">Chưa có voucher nào</td></tr>`
      : vouchers.map(rowTpl).join('');

  // ── 2. Vẽ toàn bộ trang vào #app (tiêu đề + form + bảng) ──
  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- 2a. Tiêu đề trang -->
      <div>
        <h1 style="${PAGE_TITLE}">Quản lý voucher</h1>
        <div style="${PAGE_SUBTITLE}">
          <i data-lucide="ticket" style="width:16px;height:16px;color:var(--primary)"></i>
          <p>Tạo và quản lý mã giảm giá cho khách hàng.</p>
        </div>
      </div>

      <!-- 2b. Form tạo / sửa — lưới auto-fit, mỗi ô tối thiểu ~160px -->
      <form id="voucher-form" style="${CARD};padding:1.25rem;display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
        <!-- Mã voucher (luôn viết hoa) -->
        <div>
          <label style="${LABEL}">Mã voucher *</label>
          <input id="f-code" style="${INPUT};text-transform:uppercase" placeholder="SALE10" required value="${esc(form.code)}" />
        </div>
        <!-- Loại: PERCENT (%) hoặc FIXED (số tiền) -->
        <div>
          <label style="${LABEL}">Loại giảm *</label>
          <select id="f-type" style="${INPUT}">
            <option value="PERCENT" ${form.discountType === 'PERCENT' ? 'selected' : ''}>Phần trăm (%)</option>
            <option value="FIXED" ${form.discountType === 'FIXED' ? 'selected' : ''}>Số tiền cố định</option>
          </select>
        </div>
        <!-- Giá trị giảm: % hoặc VND tùy loại -->
        <div>
          <label style="${LABEL}">Giá trị giảm *</label>
          <input id="f-value" type="number" min="0.01" step="0.01" style="${INPUT}" required value="${form.discountValue}" />
        </div>
        <!-- Trần giảm — chỉ hiện khi loại = PERCENT -->
        <div id="maxwrap" style="${form.discountType === 'PERCENT' ? '' : 'display:none'}">
          <label style="${LABEL}">Trần giảm tối đa</label>
          <input id="f-max" type="number" min="0" style="${INPUT}" placeholder="Không giới hạn" value="${form.maxDiscount}" />
        </div>
        <!-- Điều kiện / hạn mức -->
        <div>
          <label style="${LABEL}">Đơn tối thiểu</label>
          <input id="f-min" type="number" min="0" style="${INPUT}" value="${form.minOrderAmount}" />
        </div>
        <div>
          <label style="${LABEL}">Giới hạn lượt *</label>
          <input id="f-limit" type="number" min="1" style="${INPUT}" required value="${form.usageLimit}" />
        </div>
        <!-- Khoảng thời gian hiệu lực -->
        <div>
          <label style="${LABEL}">Bắt đầu *</label>
          <input id="f-start" type="datetime-local" style="${INPUT}" required value="${form.startDate}" />
        </div>
        <div>
          <label style="${LABEL}">Kết thúc *</label>
          <input id="f-end" type="datetime-local" style="${INPUT}" required value="${form.endDate}" />
        </div>
        <!-- Checkbox bật/tắt ngay khi tạo -->
        <div style="display:flex;align-items:flex-end">
          <label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:600;cursor:pointer">
            <input id="f-active" type="checkbox" ${form.isActive ? 'checked' : ''} />
            Đang hoạt động
          </label>
        </div>
        <!-- Nút submit: "Thêm" hoặc "Cập nhật"; hiện "Hủy" khi đang sửa -->
        <div style="grid-column:1/-1;display:flex;gap:.5rem">
          <button type="submit" style="${BTN_PRIMARY}">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            ${editingId ? 'Cập nhật' : 'Thêm voucher'}
          </button>
          ${editingId ? `<button type="button" id="cancel-edit" style="${BTN_OUTLINE}">Hủy</button>` : ''}
        </div>
      </form>

      <!-- 2c. Bảng danh sách voucher -->
      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Danh sách voucher (${vouchers.length})</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">Mã</th>
                <th style="${TH}">Giảm giá</th>
                <th style="${TH}">Đơn tối thiểu</th>
                <th style="${TH}">Lượt dùng</th>
                <th style="${TH}">Hiệu lực</th>
                <th style="${TH}">Trạng thái</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  // ── 3. Gắn lại event sau mỗi lần re-render (innerHTML xóa listener cũ) ──

  // Đổi loại giảm → ẩn/hiện ô trần giảm (#maxwrap)
  document.getElementById('f-type').addEventListener('change', (e) => {
    document.getElementById('maxwrap').style.display = e.target.value === 'PERCENT' ? '' : 'none';
  });
  // Submit form → tạo mới hoặc cập nhật
  document.getElementById('voucher-form').addEventListener('submit', submit);
  // Xóa lỗi validate khi user sửa lại từng ô
  bindLiveClear(document.getElementById('voucher-form'));

  // Nút Hủy (chỉ có khi đang edit) → reset form về trống
  const cancel = document.getElementById('cancel-edit');
  if (cancel) {
    cancel.addEventListener('click', () => {
      editingId = null;
      form = emptyForm();
      render();
    });
  }

  // Các nút thao tác trên từng dòng bảng
  document.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.toggle))); // bật/tắt
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(b.dataset.edit)));       // sửa
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(b.dataset.del)));       // xóa
  icons(); // vẽ lại icon Lucide sau khi DOM mới được gắn
}

function rowTpl(v, index) {
  const cell = `${rowBorder(index)}${TD}`;
  const statusStyle = v.isActive ? CHIP.success : CHIP.neutral;
  return `
    <tr>
      <td style="${cell}${MONO};font-weight:700;color:var(--primary)">${esc(v.code)}</td>
      <td style="${cell}font-size:.875rem">
        <div>${typeLabel[v.discountType]}</div>
        <div style="font-weight:600">${esc(discountLabel(v))}</div>
      </td>
      <td style="${cell}font-size:.875rem">${fmtVND(v.minOrderAmount)}</td>
      <td style="${cell}font-size:.875rem">${v.usedCount} / ${v.usageLimit}</td>
      <td style="${cell}font-size:.75rem;${MUTED}">
        <div>${fmtDate(v.startDate)}</div>
        <div>→ ${fmtDate(v.endDate)}</div>
      </td>
      <td style="${cell}"><span style="${statusStyle}">${v.isActive ? 'Bật' : 'Tắt'}</span></td>
      <td style="${cell}text-align:right;white-space:nowrap">
        <button type="button" data-toggle="${v.id}" style="${ICON_BTN}" title="${v.isActive ? 'Tắt' : 'Bật'}">
          <i data-lucide="${v.isActive ? 'toggle-right' : 'toggle-left'}" style="width:18px;height:18px;${v.isActive ? 'color:var(--success)' : ''}"></i>
        </button>
        <button type="button" data-edit="${v.id}" style="${ICON_BTN};color:var(--primary)" title="Sửa">
          <i data-lucide="pen" style="width:16px;height:16px"></i>
        </button>
        <button type="button" data-del="${v.id}" style="${ICON_BTN}" title="Xóa">
          <i data-lucide="trash-2" style="width:16px;height:16px"></i>
        </button>
      </td>
    </tr>`;
}

function readForm() {
  const val = (id) => document.getElementById(id).value;
  const max = val('f-max');
  return {
    code: val('f-code').trim().toUpperCase(),
    discountType: val('f-type'),
    discountValue: Number(val('f-value')),
    maxDiscount: max === '' ? undefined : Number(max),
    minOrderAmount: Number(val('f-min')) || 0,
    usageLimit: Number(val('f-limit')),
    startDate: new Date(val('f-start')).toISOString(),
    endDate: new Date(val('f-end')).toISOString(),
    isActive: document.getElementById('f-active').checked,
  };
}

async function submit(e) {
  e.preventDefault();
  const formEl = document.getElementById('voucher-form');
  const type = document.getElementById('f-type').value;
  const fields = [
    { id: 'f-code', label: 'Mã voucher', rules: ['required', 'voucherCode'] },
    { id: 'f-value', label: 'Giá trị giảm', rules: ['required', 'number', type === 'PERCENT' ? 'percent' : 'min:1'] },
    { id: 'f-min', label: 'Đơn tối thiểu', rules: ['number', 'min:0'] },
    { id: 'f-limit', label: 'Giới hạn lượt', rules: ['required', 'integer', 'min:1'] },
    { id: 'f-start', label: 'Ngày bắt đầu', rules: ['required'] },
    { id: 'f-end', label: 'Ngày kết thúc', rules: ['required', 'dateAfter:f-start'] },
  ];
  if (type === 'PERCENT') {
    fields.push({ id: 'f-max', label: 'Trần giảm tối đa', rules: ['number', 'min:0'] });
  }
  const check = guardForm(fields, formEl, toast);
  if (!check) return;
  try {
    const payload = readForm();
    if (editingId) {
      await api.patch(`/vouchers/${editingId}`, payload);
      toast.success('Đã cập nhật voucher');
    } else {
      await api.post('/vouchers', payload);
      toast.success('Đã tạo voucher');
    }
    editingId = null;
    form = emptyForm();
    await reload();
  } catch (err) {
    const msg = err?.response?.data?.message;
    toast.error(Array.isArray(msg) ? msg[0] : msg || 'Lỗi');
  }
}

function edit(id) {
  const v = vouchers.find((x) => x.id === id);
  editingId = id;
  form = {
    code: v.code,
    discountType: v.discountType,
    discountValue: Number(v.discountValue),
    maxDiscount: v.maxDiscount != null ? Number(v.maxDiscount) : '',
    minOrderAmount: Number(v.minOrderAmount),
    usageLimit: v.usageLimit,
    startDate: new Date(v.startDate).toISOString().slice(0, 16),
    endDate: new Date(v.endDate).toISOString().slice(0, 16),
    isActive: v.isActive,
  };
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function remove(id) {
  if (!confirm('Xóa voucher này?')) return;
  await api.delete(`/vouchers/${id}`);
  toast.success('Đã xóa');
  reload();
}

async function toggle(id) {
  await api.patch(`/vouchers/${id}/toggle`);
  toast.success('Đã cập nhật trạng thái');
  reload();
}

async function reload() {
  vouchers = await api.get('/vouchers');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('vouchers');
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  await reload();
}

init();
