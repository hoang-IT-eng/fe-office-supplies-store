import { api } from '../../api.js';
import { toast } from '../../toast.js';
import { esc } from '../../format.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import { bindLiveClear, guardForm } from '../../validate.js';

const app = document.getElementById('app');
let categories = [];
let editingId = null;
const form = { name: '', description: '' };

function render() {
  app.innerHTML = `
    <div class="space-y-6">
      <div>
        <h1 class="page-title">Quản lý danh mục</h1>
        <div class="flex items-center gap-2 muted mt-1"><i data-lucide="folder-tree" class="text-primary" style="width:16px;height:16px"></i><p class="text-sm">Tạo và quản lý các danh mục sản phẩm.</p></div>
      </div>

      <form id="cat-form" class="card p-5 grid gap-3" style="grid-template-columns:2fr 3fr auto;align-items:end">
        <div><label class="field-label">Tên danh mục *</label><input id="name" class="input" placeholder="Ví dụ: Bút viết" required value="${esc(form.name)}" /></div>
        <div><label class="field-label">Mô tả</label><input id="description" class="input" placeholder="Mô tả ngắn..." value="${esc(form.description)}" /></div>
        <div class="flex gap-2">
          <button class="btn btn-primary"><i data-lucide="plus" style="width:16px;height:16px"></i> ${editingId ? 'Cập nhật' : 'Thêm'}</button>
          ${editingId ? '<button type="button" id="cancel-edit" class="btn btn-outline">Hủy</button>' : ''}
        </div>
      </form>

      <div class="card overflow-hidden">
        <div class="px-6 py-4" style="border-bottom:1px solid var(--outline-variant);background:rgba(241,243,252,.4)"><h3 class="text-sm font-bold">Danh sách danh mục (${categories.length})</h3></div>
        <table>
          <thead class="table-head"><tr><th class="table-cell">Tên</th><th class="table-cell">Slug</th><th class="table-cell">Mô tả</th><th class="table-cell text-right">Thao tác</th></tr></thead>
          <tbody class="divide-y">
            ${
              categories.length === 0
                ? '<tr><td colspan="4" class="text-center py-4 muted text-sm">Chưa có danh mục nào</td></tr>'
                : categories
                    .map(
                      (c) => `<tr>
                <td class="table-cell font-bold">${esc(c.name)}</td>
                <td class="table-cell text-sm font-mono muted">${esc(c.slug || '')}</td>
                <td class="table-cell text-sm muted">${esc(c.description || '—')}</td>
                <td class="table-cell text-right">
                  <button data-edit="${c.id}" class="icon-btn" style="color:var(--primary)" title="Sửa"><i data-lucide="pen" style="width:16px;height:16px"></i></button>
                  <button data-del="${c.id}" class="icon-btn" title="Xóa"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                </td>
              </tr>`,
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>`;

  document.getElementById('cat-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('cat-form'));
  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn)
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      form.name = '';
      form.description = '';
      render();
    });
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
