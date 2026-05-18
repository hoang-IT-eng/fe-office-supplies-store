import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User as UserIcon, Phone, MapPin, Mail, Save } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/me').then((r) => {
      setForm({
        fullName: r.data.fullName || '',
        phone: r.data.phone || '',
        address: r.data.address || '',
      });
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', form);
      setUser(data);
      toast.success('Đã cập nhật thông tin');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card-elevated p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary grid place-items-center text-2xl font-extrabold">
          {user?.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.fullName}</h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
            <Mail size={14} /> {user?.email}
          </p>
          <span className="chip-info mt-1.5 inline-flex">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span>
        </div>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <h2 className="font-bold mb-2">Thông tin cá nhân</h2>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Họ và tên</label>
          <div className="relative">
            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Số điện thoại</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Địa chỉ</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>

        <button className="btn-primary" disabled={loading}>
          <Save size={16} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
