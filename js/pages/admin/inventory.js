import { api } from '../../api.js';
import { esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { validateFields } from '../../validate.js';

const app = document.getElementById('app');
let items = [];

function statusBadge(qty, threshold) {
  if (qty <= 0) return '<span class="chip chip-danger">Hết hàng</span>';
  if (qty <= threshold) return '<span class="chip chip-warning">Sắp hết</span>';
  return '<span class="chip chip-success">Ổn định</span>';
}

function render() {
  const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
  const outOfStock = items.filter((i) => i.quantity <= 0).length;

  app.innerHTML = `
    <div class="space-y-6">
      <section class="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 class="page-title">Quản lý kho hàng</h1>
          <div class="flex items-center gap-2 muted mt-1"><i data-lucide="warehouse" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Quản lý tồn kho và nhận cảnh báo khi xuống dưới ngưỡng tối thiểu.</p></div>
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

      <div class="card overflow-hidden">
        <div class="px-6 py-4" style="border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)"><h3 class="text-sm font-bold">Bảng tồn kho (${items.length})</h3></div>
        <table>
          <thead class="table-head"><tr>
            <th class="table-cell">Sản phẩm</th><th class="table-cell">SKU</th><th class="table-cell">Số lượng</th>
            <th class="table-cell">Ngưỡng cảnh báo</th><th class="table-cell">Trạng thái</th><th class="table-cell text-right">Thao tác</th>
          </tr></thead>
          <tbody class="divide-y">${items.map(row).join('')}</tbody>
        </table>
      </div>
    </div>`;

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

function row(inv) {
  const pid = inv.product.id;
  return `<tr>
    <td class="table-cell font-bold">${esc(inv.product.name)}</td>
    <td class="table-cell font-mono text-xs muted">${esc(inv.product.sku)}</td>
    <td class="table-cell"><input id="qty-${pid}" type="number" class="input" style="width:6rem" min="0" value="${inv.quantity}" /></td>
    <td class="table-cell"><input id="th-${pid}" type="number" class="input" style="width:6rem" min="0" value="${inv.lowStockThreshold}" /></td>
    <td class="table-cell" id="status-${pid}">${statusBadge(inv.quantity, inv.lowStockThreshold)}</td>
    <td class="table-cell text-right"><button id="save-${pid}" class="btn btn-primary btn-sm"><i data-lucide="save" style="width:14px;height:14px"></i> Lưu</button></td>
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
  app.innerHTML = '<div class="loading-block">Đang tải...</div>';
  await reload();
}

init();
