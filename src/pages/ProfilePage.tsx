import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User as UserIcon, Phone, MapPin, Mail, Save, Lock, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

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

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    setPwdLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success(data.message);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdLoading(false);
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

      <form onSubmit={changePassword} className="card p-6 space-y-4">
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <KeyRound size={18} className="text-primary" /> Đổi mật khẩu
        </h2>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mật khẩu hiện tại</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              type="password"
              minLength={6}
              required
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              type="password"
              minLength={6}
              required
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
            />
          </div>
        </div>

        <button className="btn-primary" disabled={pwdLoading}>
          <KeyRound size={16} /> {pwdLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
