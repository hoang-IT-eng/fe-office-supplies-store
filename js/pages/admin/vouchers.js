import { api } from '../../api.js';
import { fmtVND, fmtDate, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';

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
  app.innerHTML = `
    <div class="space-y-6">
      <div>
        <h1 class="page-title">Quản lý voucher</h1>
        <div class="flex items-center gap-2 muted mt-1"><i data-lucide="ticket" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Tạo và quản lý mã giảm giá cho khách hàng.</p></div>
      </div>

      <form id="voucher-form" class="card p-5 grid gap-3" style="grid-template-columns:repeat(6,1fr)">
        <div style="grid-column:span 1"><label class="field-label">Mã voucher *</label><input id="f-code" class="input uppercase" placeholder="SALE10" required value="${esc(form.code)}" /></div>
        <div style="grid-column:span 1"><label class="field-label">Loại giảm *</label><select id="f-type" class="input"><option value="PERCENT" ${form.discountType === 'PERCENT' ? 'selected' : ''}>Phần trăm (%)</option><option value="FIXED" ${form.discountType === 'FIXED' ? 'selected' : ''}>Số tiền cố định</option></select></div>
        <div style="grid-column:span 1"><label class="field-label">Giá trị giảm *</label><input id="f-value" type="number" min="0.01" step="0.01" class="input" required value="${form.discountValue}" /></div>
        <div id="maxwrap" style="grid-column:span 1;${form.discountType === 'PERCENT' ? '' : 'display:none'}"><label class="field-label">Trần giảm tối đa</label><input id="f-max" type="number" min="0" class="input" placeholder="Không giới hạn" value="${form.maxDiscount}" /></div>
        <div style="grid-column:span 1"><label class="field-label">Đơn tối thiểu</label><input id="f-min" type="number" min="0" class="input" value="${form.minOrderAmount}" /></div>
        <div style="grid-column:span 1"><label class="field-label">Giới hạn lượt *</label><input id="f-limit" type="number" min="1" class="input" required value="${form.usageLimit}" /></div>
        <div style="grid-column:span 2"><label class="field-label">Bắt đầu *</label><input id="f-start" type="datetime-local" class="input" required value="${form.startDate}" /></div>
        <div style="grid-column:span 2"><label class="field-label">Kết thúc *</label><input id="f-end" type="datetime-local" class="input" required value="${form.endDate}" /></div>
        <div style="grid-column:span 2;display:flex;align-items:flex-end"><label class="flex items-center gap-2 text-sm font-semibold" style="cursor:pointer"><input id="f-active" type="checkbox" ${form.isActive ? 'checked' : ''} /> Đang hoạt động</label></div>
        <div style="grid-column:span 6" class="flex gap-2">
          <button class="btn btn-primary"><i data-lucide="plus" style="width:16px;height:16px"></i> ${editingId ? 'Cập nhật' : 'Thêm voucher'}</button>
          ${editingId ? '<button type="button" id="cancel-edit" class="btn btn-outline">Hủy</button>' : ''}
        </div>
      </form>

      <div class="card overflow-hidden">
        <div class="px-6 py-4" style="border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)"><h3 class="text-sm font-bold">Danh sách voucher (${vouchers.length})</h3></div>
        <div class="overflow-x-auto"><table>
          <thead class="table-head"><tr>
            <th class="table-cell">Mã</th><th class="table-cell">Giảm giá</th><th class="table-cell">Đơn tối thiểu</th>
            <th class="table-cell">Lượt dùng</th><th class="table-cell">Hiệu lực</th><th class="table-cell">Trạng thái</th><th class="table-cell text-right">Thao tác</th>
          </tr></thead>
          <tbody class="divide-y">
            ${
              vouchers.length === 0
                ? '<tr><td colspan="7" class="text-center py-4 muted text-sm">Chưa có voucher nào</td></tr>'
                : vouchers.map(rowTpl).join('')
            }
          </tbody>
        </table></div>
      </div>
    </div>`;

  document.getElementById('f-type').addEventListener('change', (e) => {
    document.getElementById('maxwrap').style.display = e.target.value === 'PERCENT' ? '' : 'none';
  });
  document.getElementById('voucher-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('voucher-form'));
  const cancel = document.getElementById('cancel-edit');
  if (cancel)
    cancel.addEventListener('click', () => {
      editingId = null;
      form = emptyForm();
      render();
    });
  document.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.toggle)));
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(b.dataset.edit)));
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(b.dataset.del)));
  icons();
}

function rowTpl(v) {
  return `<tr>
    <td class="table-cell font-mono font-bold text-primary">${esc(v.code)}</td>
    <td class="table-cell text-sm"><div>${typeLabel[v.discountType]}</div><div class="font-semibold">${esc(discountLabel(v))}</div></td>
    <td class="table-cell text-sm">${fmtVND(v.minOrderAmount)}</td>
    <td class="table-cell text-sm">${v.usedCount} / ${v.usageLimit}</td>
    <td class="table-cell text-xs muted"><div>${fmtDate(v.startDate)}</div><div>→ ${fmtDate(v.endDate)}</div></td>
    <td class="table-cell"><span class="chip ${v.isActive ? 'chip-success' : 'chip-neutral'}">${v.isActive ? 'Bật' : 'Tắt'}</span></td>
    <td class="table-cell text-right" style="white-space:nowrap">
      <button data-toggle="${v.id}" class="icon-btn" title="${v.isActive ? 'Tắt' : 'Bật'}"><i data-lucide="${v.isActive ? 'toggle-right' : 'toggle-left'}" style="width:18px;height:18px;${v.isActive ? 'color:var(--success)' : ''}"></i></button>
      <button data-edit="${v.id}" class="icon-btn" style="color:var(--primary)" title="Sửa"><i data-lucide="pen" style="width:16px;height:16px"></i></button>
      <button data-del="${v.id}" class="icon-btn" title="Xóa"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
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
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  await reload();
}

init();
