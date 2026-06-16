import { useEffect, useState } from 'react';
import { Mail, User, Phone, MapPin, Save, KeyRound, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const [profile, setProfile] = useState({ fullName: '', phone: '', address: '' });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirm: '',
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    useEffect(() => {
        api.get('/users/me').then((r) => {
            setProfile({
                fullName: r.data.fullName || '',
                phone: r.data.phone || '',
                address: r.data.address || '',
            });
        });
    }, []);
    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const { data } = await api.patch('/users/me', profile);
            setUser(data);
            toast.success('Đã cập nhật thông tin');
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi');
        }
        finally {
            setSavingProfile(false);
        }
    };
    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirm) {
            return toast.error('Mật khẩu xác nhận không khớp');
        }
        setChangingPassword(true);
        try {
            const { data } = await api.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            toast.success(data.message);
            setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Đổi mật khẩu thất bại');
        }
        finally {
            setChangingPassword(false);
        }
    };
    return (<div className="max-w-2xl mx-auto space-y-6">
      <div className="card-elevated p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary grid place-items-center text-2xl font-extrabold">
          {user?.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.fullName}</h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
            <Mail size={14}/> {user?.email}
          </p>
          <span className="chip-info mt-1.5 inline-flex">
            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
          </span>
        </div>
      </div>

      <form onSubmit={saveProfile} className="card p-6 space-y-4">
        <h2 className="font-bold mb-2">Thông tin cá nhân</h2>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Họ và tên</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" value={profile.fullName} onChange={(ev) => setProfile({ ...profile, fullName: ev.target.value })}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Số điện thoại</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" value={profile.phone} onChange={(ev) => setProfile({ ...profile, phone: ev.target.value })}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Địa chỉ</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" value={profile.address} onChange={(ev) => setProfile({ ...profile, address: ev.target.value })}/>
          </div>
        </div>
        <button className="btn-primary" disabled={savingProfile}>
          <Save size={16}/> {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <form onSubmit={changePassword} className="card p-6 space-y-4">
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <KeyRound size={18} className="text-primary"/> Đổi mật khẩu
        </h2>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mật khẩu hiện tại</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" type="password" required value={passwordForm.currentPassword} onChange={(ev) => setPasswordForm({ ...passwordForm, currentPassword: ev.target.value })}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" type="password" minLength={6} required value={passwordForm.newPassword} onChange={(ev) => setPasswordForm({ ...passwordForm, newPassword: ev.target.value })}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" type="password" minLength={6} required value={passwordForm.confirm} onChange={(ev) => setPasswordForm({ ...passwordForm, confirm: ev.target.value })}/>
          </div>
        </div>
        <button className="btn-primary" disabled={changingPassword}>
          <KeyRound size={16}/> {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>);
}
