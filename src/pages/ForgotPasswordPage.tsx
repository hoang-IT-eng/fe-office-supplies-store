import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(data.message);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto card-elevated p-8 mt-8">
      <div className="text-center mb-6">
        <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary text-on-primary shadow-soft mb-3">
          <KeyRound size={22} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Quên mật khẩu</h1>
        <p className="text-sm text-on-surface-variant">
          {sent
            ? 'Kiểm tra hộp thư của bạn để đặt lại mật khẩu'
            : 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu'}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="input pl-10"
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-sm text-on-surface-variant">
            Nếu email <b>{email}</b> tồn tại, bạn sẽ nhận được hướng dẫn trong vài phút.
            Liên kết có hiệu lực <b>1 giờ</b>.
          </p>
          <button type="button" className="btn-outline w-full" onClick={() => setSent(false)}>
            Gửi lại
          </button>
        </div>
      )}

      <div className="text-center text-sm text-on-surface-variant mt-5">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
          <ArrowLeft size={14} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
