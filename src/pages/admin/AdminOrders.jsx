import { useEffect, useState } from 'react';
import { Receipt, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { fmtVND, fmtDate, orderStatusLabel, orderStatusColor } from '../../lib/format';
const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const reload = () => api.get('/orders').then((r) => setOrders(r.data));
    useEffect(() => {
        reload();
    }, []);
    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/orders/${id}/status`, { status });
            toast.success('Đã cập nhật trạng thái');
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi');
        }
    };
    const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
    const counts = STATUSES.reduce((acc, s) => {
        acc[s] = orders.filter((o) => o.status === s).length;
        return acc;
    }, {});
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý đơn hàng</h1>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <Receipt size={16} className="text-primary"/>
          <p className="text-sm">Theo dõi và cập nhật trạng thái đơn hàng.</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`chip ${filter === '' ? 'bg-primary text-on-primary' : 'chip-neutral'}`}>
          Tất cả ({orders.length})
        </button>
        {STATUSES.map((s) => (<button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? 'bg-primary text-on-primary' : 'chip-neutral'}`}>
            {orderStatusLabel[s]} ({counts[s] || 0})
          </button>))}
      </div>

      <div className="space-y-3">
        {filtered.map((order) => (<div key={order.id} className="card p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3">
              <div className="font-mono font-bold text-on-surface">#{order.code}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">{fmtDate(order.createdAt)}</div>
            </div>
            <div className="md:col-span-3 text-sm">
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-on-surface-variant"/> {order.user?.fullName}
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                <Phone size={12}/> {order.shippingPhone}
              </div>
            </div>
            <div className="md:col-span-3 text-sm flex items-start gap-1.5 text-on-surface-variant">
              <MapPin size={14} className="shrink-0 mt-0.5"/>
              <span className="line-clamp-2">{order.shippingAddress}</span>
            </div>
            <div className="md:col-span-1 text-right">
              <div className="font-extrabold text-primary">{fmtVND(order.totalAmount)}</div>
            </div>
            <div className="md:col-span-2">
              <select className="input" value={order.status} onChange={(ev) => updateStatus(order.id, ev.target.value)}>
                {STATUSES.map((s) => (<option key={s} value={s}>
                    {orderStatusLabel[s]}
                  </option>))}
              </select>
              <div className="mt-1.5 text-center">
                <span className={`chip ${orderStatusColor[order.status]}`}>
                  {orderStatusLabel[order.status]}
                </span>
              </div>
            </div>
          </div>))}
        {filtered.length === 0 && (<div className="card p-12 text-center text-on-surface-variant">Không có đơn hàng nào</div>)}
      </div>
    </div>);
}
