/**
 * Trang quản lý kho hàng (admin)
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { validateFields } from '../../validate.js';
import {
  CARD,
  MUTED,
  MONO,
  INPUT,
  CHIP,
  BTN_PRIMARY,
  BTN_SM,
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
let items = [];

function statusBadge(qty, threshold) {
  if (qty <= 0) return `<span style="${CHIP.danger}">Hết hàng</span>`;
  if (qty <= threshold) return `<span style="${CHIP.warning}">Sắp hết</span>`;
  return `<span style="${CHIP.success}">Ổn định</span>`;
}

function render() {
  const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
  const outOfStock = items.filter((i) => i.quantity <= 0).length;

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- Tiêu đề + 2 ô cảnh báo -->
      <section style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1.5rem">
        <div>
          <h1 style="${PAGE_TITLE}">Quản lý kho hàng</h1>
          <div style="${PAGE_SUBTITLE}">
            <i data-lucide="warehouse" style="width:16px;height:16px;color:var(--primary)"></i>
            <p>Quản lý tồn kho và nhận cảnh báo khi xuống dưới ngưỡng tối thiểu.</p>
          </div>
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

      <!-- Bảng tồn kho -->
      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Bảng tồn kho (${items.length})</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">Sản phẩm</th>
                <th style="${TH}">SKU</th>
                <th style="${TH}">Số lượng</th>
                <th style="${TH}">Ngưỡng cảnh báo</th>
                <th style="${TH}">Trạng thái</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${items.map(row).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  // Gắn sự kiện cho từng dòng: đổi số → cập nhật badge; bấm Lưu → gọi API
  items.forEach((inv) => {
    const pid = inv.product.id;
    const qtyInput = document.getElementById(`qty-${pid}`);
    const thInput = document.getElementById(`th-${pid}`);
    const refresh = () => {
      const cell = document.getElementById(`status-${pid}`);
      cell.innerHTML = statusBadge(Number(qtyInput.value), Number(thInput.value));
      icons();
    };
    qtyInput.addEventListener('input', refresh);
    thInput.addEventListener('input', refresh);
    document.getElementById(`save-${pid}`).addEventListener('click', () => save(pid, Number(qtyInput.value), Number(thInput.value)));
  });
  icons();
}

function row(inv, index) {
  const pid = inv.product.id;
  const cell = `${rowBorder(index)}${TD}`;
  return `
    <tr>
      <td style="${cell}font-weight:700">${esc(inv.product.name)}</td>
      <td style="${cell}${MONO};font-size:.75rem;${MUTED}">${esc(inv.product.sku)}</td>
      <td style="${cell}">
        <input id="qty-${pid}" type="number" style="${INPUT};width:6rem" min="0" value="${inv.quantity}" />
      </td>
      <td style="${cell}">
        <input id="th-${pid}" type="number" style="${INPUT};width:6rem" min="0" value="${inv.lowStockThreshold}" />
      </td>
      <td style="${cell}" id="status-${pid}">${statusBadge(inv.quantity, inv.lowStockThreshold)}</td>
      <td style="${cell}text-align:right">
        <button type="button" id="save-${pid}" style="${BTN_PRIMARY};${BTN_SM}">
          <i data-lucide="save" style="width:14px;height:14px"></i> Lưu
        </button>
      </td>
    </tr>`;
}

async function save(productId, quantity, lowStockThreshold) {
  const check = validateFields([
    { id: 'qty', label: 'Số lượng', value: quantity, rules: ['required', 'integer', 'min:0'] },
    { id: 'th', label: 'Ngưỡng cảnh báo', value: lowStockThreshold, rules: ['required', 'integer', 'min:0'] },
  ]);
  if (!check.ok) return toast.error(check.errors[0].message);
  try {
    await api.patch(`/inventory/${productId}`, { quantity, lowStockThreshold });
    toast.success('Đã cập nhật tồn kho');
    reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Lỗi');
  }
}

async function reload() {
  items = await api.get('/inventory');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('inventory');
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  await reload();
}

init();
