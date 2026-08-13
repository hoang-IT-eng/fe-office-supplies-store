/**
 * Trang Admin: Quản lý sản phẩm
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { fileUrl } from '../../config.js';
import { fmtVND, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';
import {
  CARD,
  CARD_ELEVATED,
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
  statCard,
  statIcon,
} from '../../admin-ui.js';

const app = document.getElementById('app');
const EMPTY = {
  sku: '',
  name: '',
  description: '',
  price: 0,
  discountPrice: 0,
  categoryId: '',
  initialQuantity: 0,
  lowStockThreshold: 5,
};

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

function statusBadge(status) {
  if (status === 'in') return `<span style="${CHIP.success}">Còn hàng</span>`;
  if (status === 'low') return `<span style="${CHIP.warning}">Sắp hết</span>`;
  return `<span style="${CHIP.danger}">Hết hàng</span>`;
}

function render() {
  const lowStock = products.filter(
    (p) => p.inventory && p.inventory.quantity > 0 && p.inventory.quantity <= p.inventory.lowStockThreshold,
  ).length;
  const outOfStock = products.filter((p) => !p.inventory?.quantity).length;

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- Tiêu đề + thống kê tồn kho -->
      <section style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1.5rem">
        <div>
          <h1 style="${PAGE_TITLE}">Quản lý sản phẩm</h1>
          <div style="${PAGE_SUBTITLE}">
            <i data-lucide="package" style="width:16px;height:16px;color:var(--primary)"></i>
            <p>Thêm, sửa, xóa và upload ảnh sản phẩm.</p>
          </div>
          <p style="font-size:.75rem;${MUTED};margin-top:.25rem">Hiện đang có ${products.length} sản phẩm trong hệ thống.</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.75rem">
          <div style="${statCard('var(--tertiary)')}">
            <div style="${statIcon('var(--tertiary-fixed)', 'var(--on-tertiary-fixed)')}">
              <i data-lucide="triangle-alert" style="width:20px;height:20px"></i>
            </div>
            <div>
              <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Sắp hết hàng</p>
              <p style="font-size:1.25rem;font-weight:800;color:var(--tertiary)">${lowStock} sản phẩm</p>
            </div>
          </div>
          <div style="${statCard('var(--error)')}">
            <div style="${statIcon('var(--error-container)', 'var(--error)')}">
              <i data-lucide="circle-x" style="width:20px;height:20px"></i>
            </div>
            <div>
              <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Hết hàng</p>
              <p style="font-size:1.25rem;font-weight:800;color:var(--error)">${outOfStock} sản phẩm</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Thanh thao tác nhanh -->
      <section style="${CARD};padding:1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem">
        <div style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:600">
          <i data-lucide="tag" style="width:16px;height:16px;color:var(--primary)"></i>
          Tổng cộng ${products.length} sản phẩm
        </div>
        <button type="button" id="open-create" style="${BTN_PRIMARY}">
          <i data-lucide="plus" style="width:16px;height:16px"></i> Thêm sản phẩm
        </button>
      </section>

      <div id="form-area"></div>

      <!-- Bảng sản phẩm -->
      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Danh sách sản phẩm</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%;min-width:900px">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">SKU</th>
                <th style="${TH}">Sản phẩm</th>
                <th style="${TH}">Danh mục</th>
                <th style="${TH}">Tồn kho</th>
                <th style="${TH}">Đơn giá</th>
                <th style="${TH}">Trạng thái</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${products.map(row).join('')}</tbody>
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

function row(p, index) {
  const cell = `${rowBorder(index)}${TD}`;
  const qty = p.inventory?.quantity ?? 0;
  const status = statOf(p);
  const qtyColor = status === 'out' ? 'var(--error)' : status === 'low' ? 'var(--tertiary)' : 'var(--on-surface)';

  const img = p.images?.[0]
    ? `<img src="${fileUrl(p.images[0])}" alt="" style="width:3rem;height:3rem;border-radius:.5rem;object-fit:cover;background:var(--surface-low)" />`
    : `<div style="width:3rem;height:3rem;border-radius:.5rem;background:var(--surface-low);display:grid;place-items:center;${MUTED}"><i data-lucide="box" style="width:20px;height:20px"></i></div>`;

  return `
    <tr>
      <td style="${cell}${MONO};font-size:.75rem;${MUTED}">${esc(p.sku)}</td>
      <td style="${cell}">
        <div style="display:flex;align-items:center;gap:.75rem">
          ${img}
          <div style="min-width:0">
            <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:20rem">${esc(p.name)}</div>
            <div style="font-size:.75rem;${MUTED};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:20rem">${esc(p.description || '')}</div>
          </div>
        </div>
      </td>
      <td style="${cell}font-size:.875rem">${esc(p.category?.name || '—')}</td>
      <td style="${cell}"><span style="font-size:1.5rem;font-weight:800;color:${qtyColor}">${qty}</span></td>
      <td style="${cell}font-weight:700">${fmtVND(p.price)}</td>
      <td style="${cell}">${statusBadge(status)}</td>
      <td style="${cell}text-align:right">
        <button type="button" data-edit="${p.id}" style="${ICON_BTN};color:var(--primary)" title="Sửa">
          <i data-lucide="pen" style="width:16px;height:16px"></i>
        </button>
        <button type="button" data-del="${p.id}" style="${ICON_BTN}" title="Xóa">
          <i data-lucide="trash-2" style="width:16px;height:16px"></i>
        </button>
      </td>
    </tr>`;
}

function currentImagesMarkup() {
  const images = editing?.images || [];
  if (!images.length) {
    return `<p style="font-size:.875rem;${MUTED}">Sản phẩm chưa có hình ảnh.</p>`;
  }
  return images
    .map(
      (url, index) => `
        <div style="position:relative;width:7rem;height:7rem">
          <img src="${esc(fileUrl(url))}" alt="Ảnh ${index + 1} của ${esc(editing.name)}"
            style="width:100%;height:100%;object-fit:cover;border-radius:.75rem;border:1px solid var(--outline-variant);background:var(--surface-low)" />
          <button type="button" data-remove-image="${index}" title="Xóa ảnh" aria-label="Xóa ảnh ${index + 1}"
            style="${ICON_BTN};position:absolute;top:.35rem;right:.35rem;background:var(--error);color:#fff;box-shadow:var(--shadow-soft)">
            <i data-lucide="trash-2" style="width:15px;height:15px"></i>
          </button>
        </div>`,
    )
    .join('');
}

function bindCurrentImageActions() {
  document.querySelectorAll('[data-remove-image]').forEach((button) =>
    button.addEventListener('click', () => removeProductImage(Number(button.dataset.removeImage), button)),
  );
}

function renderForm() {
  const area = document.getElementById('form-area');
  if (!showForm) {
    area.innerHTML = '';
    return;
  }

  // Lưới form: auto-fit 3 cột trên màn rộng, 1 cột trên màn hẹp
  area.innerHTML = `
    <form id="product-form" style="${CARD_ELEVATED};padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-weight:700;font-size:1.125rem">${editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
        <button type="button" id="close-form" style="${ICON_BTN}">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>

      <div style="display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        <div>
          <label style="${LABEL}">SKU *</label>
          <input id="f-sku" style="${INPUT}" required value="${esc(form.sku)}" />
        </div>
        <div style="grid-column:span 2">
          <label style="${LABEL}">Tên sản phẩm *</label>
          <input id="f-name" style="${INPUT}" required value="${esc(form.name)}" />
        </div>
        <div style="grid-column:1/-1">
          <label style="${LABEL}">Mô tả</label>
          <textarea id="f-desc" style="${INPUT};resize:vertical" rows="2">${esc(form.description)}</textarea>
        </div>
        <div>
          <label style="${LABEL}">Giá (VND) *</label>
          <input id="f-price" type="number" style="${INPUT}" required min="0" value="${form.price}" />
        </div>
        <div>
          <label style="${LABEL}">Giá khuyến mãi</label>
          <input id="f-discount" type="number" style="${INPUT}" min="0" value="${form.discountPrice}" />
        </div>
        <div>
          <label style="${LABEL}">Danh mục</label>
          <select id="f-category" style="${INPUT}">
            <option value="">-- Chọn --</option>
            ${categories.map((c) => `<option value="${c.id}" ${form.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        ${
          !editing
            ? `<div>
                 <label style="${LABEL}">Tồn kho ban đầu</label>
                 <input id="f-qty" type="number" style="${INPUT}" min="0" value="${form.initialQuantity}" />
               </div>
               <div>
                 <label style="${LABEL}">Ngưỡng cảnh báo</label>
                 <input id="f-threshold" type="number" style="${INPUT}" min="0" value="${form.lowStockThreshold}" />
               </div>`
            : ''
        }
        ${
          editing
            ? `<div style="grid-column:1/-1">
                 <label style="${LABEL}">Hình ảnh hiện tại</label>
                 <div id="current-images" style="display:flex;flex-wrap:wrap;gap:.75rem">${currentImagesMarkup()}</div>
               </div>`
            : ''
        }
        <div style="grid-column:1/-1">
          <label style="${LABEL}">
            <i data-lucide="upload" style="width:14px;height:14px;display:inline"></i>
            ${editing ? 'Thêm hình ảnh mới' : 'Hình ảnh sản phẩm'}
          </label>
          <input id="f-files" type="file" multiple accept="image/*" style="${INPUT}" />
        </div>
      </div>

      <div style="display:flex;gap:.5rem;padding-top:1rem;border-top:1px solid var(--outline-variant)">
        <button type="submit" style="${BTN_PRIMARY}">${editing ? 'Cập nhật' : 'Tạo sản phẩm'}</button>
        <button type="button" id="cancel-form" style="${BTN_OUTLINE}">Hủy</button>
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
  bindCurrentImageActions();
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

async function removeProductImage(imageIndex, button) {
  if (!editing || !confirm('Xóa hình ảnh này khỏi sản phẩm?')) return;
  button.disabled = true;
  try {
    const data = await api.delete(`/products/${editing.id}/images/${imageIndex}`);
    editing.images = data.images || [];
    document.getElementById('current-images').innerHTML = currentImagesMarkup();
    bindCurrentImageActions();
    icons();
    toast.success('Đã xóa hình ảnh');
  } catch (err) {
    button.disabled = false;
    toast.error(err?.response?.data?.message || 'Không thể xóa hình ảnh');
  }
}

async function reload() {
  const data = await api.get('/products', { params: { page: 1, limit: 100 } });
  products = data.items || [];
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('products');
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  try {
    categories = await api.get('/categories');
  } catch {
    categories = [];
  }
  await reload();
}

init();
