import { useEffect, useState } from 'react';
import { FolderTree, Plus, Pen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const reload = () => api.get('/categories').then((r) => setCategories(r.data));
    useEffect(() => {
        reload();
    }, []);
    const submit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/categories/${editingId}`, form);
                toast.success('Đã cập nhật');
            }
            else {
                await api.post('/categories', form);
                toast.success('Đã thêm danh mục');
            }
            setForm({ name: '', description: '' });
            setEditingId(null);
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi');
        }
    };
    const remove = async (id) => {
        if (!confirm('Xóa danh mục?'))
            return;
        await api.delete(`/categories/${id}`);
        toast.success('Đã xóa');
        reload();
    };
    const edit = (cat) => {
        setEditingId(cat.id);
        setForm({ name: cat.name, description: cat.description || '' });
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý danh mục</h1>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <FolderTree size={16} className="text-primary"/>
          <p className="text-sm">Tạo và quản lý các danh mục sản phẩm.</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-5 grid md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Tên danh mục *</label>
          <input className="input" placeholder="Ví dụ: Bút viết" required value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })}/>
        </div>
        <div className="md:col-span-6">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mô tả</label>
          <input className="input" placeholder="Mô tả ngắn..." value={form.description} onChange={(ev) => setForm({ ...form, description: ev.target.value })}/>
        </div>
        <div className="md:col-span-2 flex items-end gap-2">
          <button className="btn-primary flex-1">
            <Plus size={16}/> {editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (<button type="button" onClick={() => {
                setEditingId(null);
                setForm({ name: '', description: '' });
            }} className="btn-outline">
              Hủy
            </button>)}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Danh sách danh mục ({categories.length})</h3>
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
            {categories.map((cat) => (<tr key={cat.id} className="hover:bg-surface-container-low/30">
                <td className="px-6 py-4 font-bold text-on-surface">{cat.name}</td>
                <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{cat.slug}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{cat.description || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => edit(cat)} className="p-2 rounded-lg hover:bg-primary-fixed text-primary" title="Sửa">
                    <Pen size={16}/>
                  </button>
                  <button onClick={() => remove(cat.id)} className="p-2 rounded-lg hover:bg-error-container text-error" title="Xóa">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>))}
            {categories.length === 0 && (<tr>
                <td colSpan={4} className="text-center py-8 text-on-surface-variant text-sm">
                  Chưa có danh mục nào
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
