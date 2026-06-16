import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User, FileText, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, fileUrl } from '../lib/api';
import { fmtVND } from '../lib/format';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
export default function CheckoutPage() {
    const cart = useCartStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        shippingName: user?.fullName || '',
        shippingPhone: '',
        shippingAddress: '',
        note: '',
    });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        cart.fetch();
    }, []);
    const submit = async (e) => {
        e.preventDefault();
        if (cart.items.length === 0)
            return toast.error('Giỏ hàng trống');
        setLoading(true);
        try {
            const { data } = await api.post('/orders', {
                ...form,
                items: cart.items.map((it) => ({
                    productId: it.product.id,
                    quantity: it.quantity,
                })),
            });
            toast.success('Đặt hàng thành công');
            await cart.fetch();
            navigate(`/orders/${data.id}`);
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Đặt hàng thất bại');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard size={24} className="text-primary"/>
        <h1 className="section-title">Thanh toán</h1>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <MapPin size={18} className="text-primary"/> Thông tin giao hàng
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">
                Họ tên người nhận
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
                <input className="input pl-10" required value={form.shippingName} onChange={(ev) => setForm({ ...form, shippingName: ev.target.value })}/>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
                <input className="input pl-10" required value={form.shippingPhone} onChange={(ev) => setForm({ ...form, shippingPhone: ev.target.value })}/>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Địa chỉ giao hàng</label>
            <textarea className="input" rows={2} required placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" value={form.shippingAddress} onChange={(ev) => setForm({ ...form, shippingAddress: ev.target.value })}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5 flex items-center gap-1">
              <FileText size={14}/> Ghi chú (tùy chọn)
            </label>
            <textarea className="input" rows={2} placeholder="Ghi chú cho người giao hàng..." value={form.note} onChange={(ev) => setForm({ ...form, note: ev.target.value })}/>
          </div>
        </div>

        <div className="card-elevated p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary"/> Đơn hàng của bạn
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.items.map((item) => {
            const price = Number(item.product.discountPrice) > 0
                ? Number(item.product.discountPrice)
                : Number(item.product.price);
            return (<div key={item.id} className="flex gap-3 text-sm">
                  <img src={fileUrl(item.product.images?.[0])} className="w-12 h-12 rounded-lg object-cover bg-surface-container-low shrink-0" alt=""/>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.product.name}</div>
                    <div className="text-xs text-on-surface-variant">SL: {item.quantity}</div>
                  </div>
                  <div className="font-bold whitespace-nowrap">{fmtVND(price * item.quantity)}</div>
                </div>);
        })}
          </div>
          <div className="border-t border-outline-variant mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tạm tính</span>
              <span className="font-semibold">{fmtVND(cart.total())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Vận chuyển</span>
              <span className="font-semibold text-success">Miễn phí</span>
            </div>
            <div className="border-t border-outline-variant my-2"/>
            <div className="flex justify-between items-baseline">
              <span className="font-bold">Tổng</span>
              <span className="text-2xl font-extrabold text-primary">{fmtVND(cart.total())}</span>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-5 py-3">
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </form>
    </div>);
}
