import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Mail, Lock, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);
    useEffect(() => {
        if (params.get('verified'))
            toast.success('Đã xác thực email, mời đăng nhập');
    }, [params]);
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', form);
            setSession(data.user, data.accessToken, data.refreshToken);
            toast.success('Đăng nhập thành công');
            navigate(params.get('next') || '/');
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Đăng nhập thất bại');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-primary to-primary-container rounded-xl p-12 text-on-primary h-full shadow-elevated relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-tertiary-fixed/20 rounded-full blur-3xl"/>
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur grid place-items-center mb-6">
            <Pencil size={28}/>
          </div>
          <h2 className="text-4xl font-extrabold mb-3 tracking-tight">Chào mừng trở lại!</h2>
          <p className="text-on-primary/90 max-w-sm">
            Đăng nhập để theo dõi đơn hàng, đánh giá sản phẩm và nhận ưu đãi từ Stationery Shop.
          </p>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto card-elevated p-8">
        <div className="text-center mb-6">
          <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary text-on-primary shadow-soft mb-3">
            <LogIn size={22}/>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Đăng nhập</h1>
          <p className="text-sm text-on-surface-variant">Nhập thông tin để truy cập tài khoản</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
              <input className="input pl-10" type="email" placeholder="email@example.com" required value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })}/>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Mật khẩu</label>
              <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
              <input className="input pl-10" type="password" placeholder="••••••••" required value={form.password} onChange={(ev) => setForm({ ...form, password: ev.target.value })}/>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="text-center text-sm text-on-surface-variant mt-5">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>);
}
