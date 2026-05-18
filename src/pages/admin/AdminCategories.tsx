import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FolderTree, Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminCategories() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => api.get('/categories').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/categories/${editId}`, form);
        toast.success('Đã cập nhật');
      } else {
        await api.post('/categories', form);
        toast.success('Đã thêm danh mục');
      }
      setForm({ name: '', description: '' });
      setEditId(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Lỗi'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa danh mục?')) return;
    await api.delete(`/categories/${id}`);
    toast.success('Đã xóa');
    load();
  };

  const startEdit = (c: any) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description || '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý danh mục</h1>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <FolderTree size={16} className="text-primary" />
          <p className="text-sm">Tạo và quản lý các danh mục sản phẩm.</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-5 grid md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Tên danh mục *</label>
          <input className="input" placeholder="Ví dụ: Bút viết" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="md:col-span-6">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mô tả</label>
          <input className="input" placeholder="Mô tả ngắn..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2 flex items-end gap-2">
          <button className="btn-primary flex-1">
            <Plus size={16} /> {editId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }} className="btn-outline">
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Danh sách danh mục ({items.length})</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <th className="px-6 py-3 font-bold">Tên</th>
              <th className="px-6 py-3 font-bold">Slug</th>
              <th className="px-6 py-3 font-bold">Mô tả</th>
              <th className="px-6 py-3 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container-low/30">
                <td className="px-6 py-4 font-bold text-on-surface">{c.name}</td>
                <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{c.slug}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{c.description || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-primary-fixed text-primary" title="Sửa">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-error-container text-error" title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-on-surface-variant text-sm">Chưa có danh mục nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
