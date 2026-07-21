import { api } from '../../api.js';
import { fileUrl } from '../../config.js';
import { fmtVND, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';

const app = document.getElementById('app');
const EMPTY = { sku: '', name: '', description: '', price: 0, discountPrice: 0, categoryId: '', initialQuantity: 0, lowStockThreshold: 5 };

let products = [];
let categories = [];
let editing = null;
let form = { ...EMPTY };
let showForm = false;

function statOf(p) {
  const qty = p.inventory?.quantity ?? 0;
  const threshold = p.inventory?.lowStockThreshold ?? 5;
  if (qty <= 0) return 'out';
  if (qty <= threshold) return 'low';
  return 'in';
}

function render() {
  const lowStock = products.filter((p) => p.inventory && p.inventory.quantity > 0 && p.inventory.quantity <= p.inventory.lowStockThreshold).length;
  const outOfStock = products.filter((p) => !p.inventory?.quantity).length;

  app.innerHTML = `
    <div class="space-y-6">
      <section class="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 class="page-title">Quản lý sản phẩm</h1>
          <div class="flex items-center gap-2 muted mt-1"><i data-lucide="package" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Thêm, sửa, xóa và upload ảnh sản phẩm.</p></div>
          <p class="text-xs muted mt-1">Hiện đang có ${products.length} sản phẩm trong hệ thống.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <div class="card stat-card" style="border-left-color:var(--tertiary)">
            <div class="stat-icon" style="background:var(--tertiary-fixed);color:var(--on-tertiary-fixed)"><i data-lucide="triangle-alert" style="width:20px;height:20px"></i></div>
            <div><p class="text-xs font-bold uppercase tracking-wide muted">Sắp hết hàng</p><p class="text-xl font-extrabold text-tertiary">${lowStock} sản phẩm</p></div>
          </div>
          <div class="card stat-card" style="border-left-color:var(--error)">
            <div class="stat-icon" style="background:var(--error-container);color:var(--error)"><i data-lucide="circle-x" style="width:20px;height:20px"></i></div>
            <div><p class="text-xs font-bold uppercase tracking-wide muted">Hết hàng</p><p class="text-xl font-extrabold text-error">${outOfStock} sản phẩm</p></div>
          </div>
        </div>
      </section>

      <section class="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm font-semibold"><i data-lucide="tag" class="text-primary" style="width:16px;height:16px"></i> Tổng cộng ${products.length} sản phẩm</div>
        <button id="open-create" class="btn btn-primary"><i data-lucide="plus" style="width:16px;height:16px"></i> Thêm sản phẩm</button>
      </section>

      <div id="form-area"></div>

      <div class="card overflow-hidden">
        <div class="px-6 py-4 flex items-center justify-between" style="border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)">
          <h3 class="text-sm font-bold">Danh sách sản phẩm</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-table">
            <thead class="table-head"><tr>
              <th class="table-cell">SKU</th><th class="table-cell">Sản phẩm</th><th class="table-cell">Danh mục</th>
              <th class="table-cell">Tồn kho</th><th class="table-cell">Đơn giá</th><th class="table-cell">Trạng thái</th><th class="table-cell text-right">Thao tác</th>
            </tr></thead>
            <tbody class="divide-y">${products.map(row).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('open-create').addEventListener('click', () => {
    editing = null;
    form = { ...EMPTY };
    showForm = true;
    renderForm();
  });
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(b.dataset.edit)));
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(b.dataset.del)));
  renderForm();
  icons();
}

function row(p) {
  const qty = p.inventory?.quantity ?? 0;
  const status = statOf(p);
  const img = p.images?.[0]
    ? `<img src="${fileUrl(p.images[0])}" style="width:3rem;height:3rem;border-radius:.5rem;object-fit:cover;background:var(--surface-low)" />`
    : `<div class="grid place-items-center muted" style="width:3rem;height:3rem;border-radius:.5rem;background:var(--surface-low)"><i data-lucide="box" style="width:20px;height:20px"></i></div>`;
  const badge =
    status === 'in'
      ? '<span class="chip chip-success">Còn hàng</span>'
      : status === 'low'
        ? '<span class="chip chip-warning">Sắp hết</span>'
        : '<span class="chip chip-danger">Hết hàng</span>';
  const qtyColor = status === 'out' ? 'var(--error)' : status === 'low' ? 'var(--tertiary)' : 'var(--on-surface)';
  return `<tr>
    <td class="table-cell font-mono text-xs muted">${esc(p.sku)}</td>
    <td class="table-cell">
      <div class="flex items-center gap-3">${img}
        <div class="min-w-0"><div class="font-bold truncate" style="max-width:20rem">${esc(p.name)}</div><div class="text-xs muted truncate" style="max-width:20rem">${esc(p.description || '')}</div></div>
      </div>
    </td>
    <td class="table-cell text-sm">${esc(p.category?.name || '—')}</td>
    <td class="table-cell"><span class="text-2xl font-extrabold" style="color:${qtyColor}">${qty}</span></td>
    <td class="table-cell font-bold">${fmtVND(p.price)}</td>
    <td class="table-cell">${badge}</td>
    <td class="table-cell text-right">
      <button data-edit="${p.id}" class="icon-btn" style="color:var(--primary)" title="Sửa"><i data-lucide="pen" style="width:16px;height:16px"></i></button>
      <button data-del="${p.id}" class="icon-btn" title="Xóa"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
    </td>
  </tr>`;
}

function renderForm() {
  const area = document.getElementById('form-area');
  if (!showForm) {
    area.innerHTML = '';
    return;
  }
  area.innerHTML = `
    <form id="product-form" class="card-elevated p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">${editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
        <button type="button" id="close-form" class="icon-btn"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        <div><label class="field-label">SKU *</label><input id="f-sku" class="input" required value="${esc(form.sku)}" /></div>
        <div class="md:col-span-2"><label class="field-label">Tên sản phẩm *</label><input id="f-name" class="input" required value="${esc(form.name)}" /></div>
        <div class="md:col-span-3"><label class="field-label">Mô tả</label><textarea id="f-desc" class="input" rows="2">${esc(form.description)}</textarea></div>
        <div><label class="field-label">Giá (VND) *</label><input id="f-price" type="number" class="input" required min="0" value="${form.price}" /></div>
        <div><label class="field-label">Giá khuyến mãi</label><input id="f-discount" type="number" class="input" min="0" value="${form.discountPrice}" /></div>
        <div><label class="field-label">Danh mục</label><select id="f-category" class="input"><option value="">-- Chọn --</option>${categories.map((c) => `<option value="${c.id}" ${form.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        ${
          !editing
            ? `<div><label class="field-label">Tồn kho ban đầu</label><input id="f-qty" type="number" class="input" min="0" value="${form.initialQuantity}" /></div>
               <div><label class="field-label">Ngưỡng cảnh báo</label><input id="f-threshold" type="number" class="input" min="0" value="${form.lowStockThreshold}" /></div>
               <div></div>`
            : ''
        }
        <div class="md:col-span-3"><label class="field-label"><i data-lucide="upload" style="width:14px;height:14px;display:inline"></i> Hình ảnh sản phẩm</label><input id="f-files" type="file" multiple accept="image/*" class="input" /></div>
      </div>
      <div class="flex gap-2 pt-4 border-t">
        <button type="submit" class="btn btn-primary">${editing ? 'Cập nhật' : 'Tạo sản phẩm'}</button>
        <button type="button" id="cancel-form" class="btn btn-outline">Hủy</button>
      </div>
    </form>`;

  const close = () => {
    showForm = false;
    editing = null;
    form = { ...EMPTY };
    renderForm();
  };
  document.getElementById('close-form').addEventListener('click', close);
  document.getElementById('cancel-form').addEventListener('click', close);
  document.getElementById('product-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('product-form'));
  icons();
}

function readForm() {
  const val = (id) => document.getElementById(id)?.value;
  const payload = {
    sku: val('f-sku'),
    name: val('f-name'),
    description: val('f-desc'),
    price: Number(val('f-price')),
    discountPrice: Number(val('f-discount')) || 0,
    categoryId: val('f-category') || undefined,
  };
  if (!editing) {
    payload.initialQuantity = Number(val('f-qty')) || 0;
    payload.lowStockThreshold = Number(val('f-threshold')) || 0;
  }
  return payload;
}

async function submit(e) {
  e.preventDefault();
  const formEl = document.getElementById('product-form');
  const fields = [
    { id: 'f-sku', label: 'SKU', rules: ['required', 'minLength:2', 'maxLength:50'] },
    { id: 'f-name', label: 'Tên sản phẩm', rules: ['required', 'minLength:2', 'maxLength:200'] },
    { id: 'f-desc', label: 'Mô tả', rules: ['maxLength:2000'] },
    { id: 'f-price', label: 'Giá', rules: ['required', 'number', 'min:0'] },
    { id: 'f-discount', label: 'Giá khuyến mãi', rules: ['number', 'min:0', 'lteField:f-price'] },
  ];
  if (!editing) {
    fields.push(
      { id: 'f-qty', label: 'Tồn kho ban đầu', rules: ['number', 'integer', 'min:0'] },
      { id: 'f-threshold', label: 'Ngưỡng cảnh báo', rules: ['number', 'integer', 'min:0'] },
    );
  }
  const check = guardForm(fields, formEl, toast);
  if (!check) return;
  const payload = readForm();
  let productId = editing?.id;
  try {
    if (editing) {
      await api.patch(`/products/${productId}`, payload);
    } else {
      const data = await api.post('/products', payload);
      productId = data.id;
    }
    const files = document.getElementById('f-files')?.files;
    if (files && files.length > 0) {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      await api.postForm(`/products/${productId}/images`, fd);
    }
    toast.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
    showForm = false;
    editing = null;
    form = { ...EMPTY };
    await reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  }
}

function edit(id) {
  const p = products.find((x) => x.id === id);
  editing = p;
  form = {
    sku: p.sku,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    discountPrice: Number(p.discountPrice) || 0,
    categoryId: p.category?.id || '',
    initialQuantity: 0,
    lowStockThreshold: 5,
  };
  showForm = true;
  renderForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function remove(id) {
  if (!confirm('Xóa sản phẩm này?')) return;
  await api.delete(`/products/${id}`);
  toast.success('Đã xóa');
  reload();
}

async function reload() {
  const data = await api.get('/products', { params: { page: 1, limit: 100 } });
  products = data.items || [];
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('products');
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  try {
    categories = await api.get('/categories');
  } catch {
    categories = [];
  }
  await reload();
}

init();
