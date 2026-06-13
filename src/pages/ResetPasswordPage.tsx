import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Liên kết không hợp lệ');
    if (form.password !== form.confirm) return toast.error('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        password: form.password,
      });
      toast.success(data.message);
      nav('/login');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full mx-auto card-elevated p-8 mt-8 text-center space-y-4">
        <KeyRound size={40} className="mx-auto text-error" />
        <h1 className="text-xl font-bold">Liên kết không hợp lệ</h1>
        <p className="text-sm text-on-surface-variant">
          Liên kết đặt lại mật khẩu bị thiếu hoặc hết hạn. Vui lòng yêu cầu liên kết mới.
        </p>
        <Link to="/forgot-password" className="btn-primary inline-block">
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto card-elevated p-8 mt-8">
      <div className="text-center mb-6">
        <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary text-on-primary shadow-soft mb-3">
          <KeyRound size={22} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Đặt lại mật khẩu</h1>
        <p className="text-sm text-on-surface-variant">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              type="password"
              placeholder="≥ 6 ký tự"
              minLength={6}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input pl-10"
              type="password"
              placeholder="Nhập lại mật khẩu"
              minLength={6}
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>

      <div className="text-center text-sm text-on-surface-variant mt-5">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
          <ArrowLeft size={14} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
