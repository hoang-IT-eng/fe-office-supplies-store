import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Receipt, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtVND, orderStatusColor, orderStatusLabel } from '../../lib/format';

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');

  const load = () => api.get('/orders').then((r) => setOrders(r.data));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Đã cập nhật trạng thái');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Lỗi'); }
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý đơn hàng</h1>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <Receipt size={16} className="text-primary" />
          <p className="text-sm">Theo dõi và cập nhật trạng thái đơn hàng.</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="card p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`chip ${filter === '' ? 'bg-primary text-on-primary' : 'chip-neutral'}`}
        >
          Tất cả ({orders.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip ${filter === s ? 'bg-primary text-on-primary' : 'chip-neutral'}`}
          >
            {orderStatusLabel[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="card p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3">
              <div className="font-mono font-bold text-on-surface">#{o.code}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">{fmtDate(o.createdAt)}</div>
            </div>
            <div className="md:col-span-3 text-sm">
              <div className="flex items-center gap-1.5"><UserIcon size={14} className="text-on-surface-variant" /> {o.user?.fullName}</div>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs"><Phone size={12} /> {o.shippingPhone}</div>
            </div>
            <div className="md:col-span-3 text-sm flex items-start gap-1.5 text-on-surface-variant">
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <span className="line-clamp-2">{o.shippingAddress}</span>
            </div>
            <div className="md:col-span-1 text-right">
              <div className="font-extrabold text-primary">{fmtVND(o.totalAmount)}</div>
            </div>
            <div className="md:col-span-2">
              <select
                className="input"
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{orderStatusLabel[s]}</option>)}
              </select>
              <div className="mt-1.5 text-center">
                <span className={`chip ${orderStatusColor[o.status]}`}>{orderStatusLabel[o.status]}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center text-on-surface-variant">Không có đơn hàng nào</div>
        )}
      </div>
    </div>
  );
}
