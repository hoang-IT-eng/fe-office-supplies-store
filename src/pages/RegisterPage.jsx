import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
function IconInput({ icon: Icon, ...props }) {
    return (<div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
      <input className="input pl-10" {...props}/>
    </div>);
}
export default function RegisterPage() {
    const [form, setForm] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            toast.success('Đăng ký thành công, vui lòng kiểm tra email để xác thực');
            navigate('/login');
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Đăng ký thất bại');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="max-w-lg mx-auto card-elevated p-8 mt-4">
      <div className="text-center mb-6">
        <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary text-on-primary shadow-soft mb-3">
          <UserPlus size={22}/>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Đăng ký tài khoản</h1>
        <p className="text-sm text-on-surface-variant">Tạo tài khoản để bắt đầu mua sắm</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <IconInput icon={User} placeholder="Họ và tên" required value={form.fullName} onChange={(ev) => setForm({ ...form, fullName: ev.target.value })}/>
        <IconInput icon={Mail} type="email" placeholder="Email" required value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })}/>
        <IconInput icon={Lock} type="password" placeholder="Mật khẩu (≥ 6 ký tự)" minLength={6} required value={form.password} onChange={(ev) => setForm({ ...form, password: ev.target.value })}/>
        <IconInput icon={Phone} placeholder="Số điện thoại" value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })}/>
        <IconInput icon={MapPin} placeholder="Địa chỉ" value={form.address} onChange={(ev) => setForm({ ...form, address: ev.target.value })}/>
        <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>

      <div className="text-center text-sm text-on-surface-variant mt-5">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>);
}
