import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Lock, Unlock, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${id}/active`, { isActive: !isActive });
      toast.success(!isActive ? 'Đã mở khóa' : 'Đã khóa tài khoản');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Lỗi'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa người dùng này?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Đã xóa');
    load();
  };

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý tài khoản</h1>
          <div className="flex items-center gap-2 text-on-surface-variant mt-1">
            <Users size={16} className="text-primary" />
            <p className="text-sm">Quản lý người dùng, khóa/mở khóa hoặc xóa tài khoản.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="card p-4 flex items-center gap-3 border-l-4 border-primary min-w-[180px]">
            <div className="p-2.5 bg-primary-fixed rounded-lg text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Admin</p>
              <p className="text-xl font-extrabold text-primary">{adminCount}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 border-l-4 border-secondary min-w-[180px]">
            <div className="p-2.5 bg-secondary-container rounded-lg text-on-secondary-container">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Khách hàng</p>
              <p className="text-xl font-extrabold text-secondary">{customerCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Danh sách tài khoản ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-6 py-3 font-bold">Người dùng</th>
                <th className="px-6 py-3 font-bold">Email</th>
                <th className="px-6 py-3 font-bold">SĐT</th>
                <th className="px-6 py-3 font-bold">Vai trò</th>
                <th className="px-6 py-3 font-bold">Trạng thái</th>
                <th className="px-6 py-3 font-bold">Ngày tạo</th>
                <th className="px-6 py-3 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center font-bold">
                        {u.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="font-bold">{u.fullName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{u.phone || '—'}</td>
                  <td className="px-6 py-4">
                    {u.role === 'ADMIN' ? (
                      <span className="chip-info"><ShieldCheck size={12} /> Admin</span>
                    ) : (
                      <span className="chip-neutral">Khách hàng</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? <span className="chip-success">Hoạt động</span> : <span className="chip-danger">Bị khóa</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">{fmtDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggle(u.id, u.isActive)}
                        className="p-2 rounded-lg hover:bg-primary-fixed text-primary"
                        title={u.isActive ? 'Khóa' : 'Mở khóa'}
                      >
                        {u.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        className="p-2 rounded-lg hover:bg-error-container text-error"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
