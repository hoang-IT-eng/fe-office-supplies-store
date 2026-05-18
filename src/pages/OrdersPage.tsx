import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDate, fmtVND, orderStatusColor, orderStatusLabel } from '../lib/format';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/me')
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package size={24} className="text-primary" />
        <h1 className="section-title">Đơn hàng của tôi</h1>
        <span className="chip-info">{orders.length} đơn</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low grid place-items-center text-on-surface-variant mb-4">
            <Package size={32} />
          </div>
          <h2 className="font-bold text-lg">Chưa có đơn hàng nào</h2>
          <p className="text-on-surface-variant text-sm mt-1">Hãy bắt đầu mua sắm và quay lại đây!</p>
          <Link to="/" className="btn-primary mt-5 inline-flex">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              to={`/orders/${o.id}`}
              key={o.id}
              className="card p-5 flex items-center gap-4 hover:shadow-elevated hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-fixed text-primary grid place-items-center shrink-0">
                <Package size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-on-surface">#{o.code}</span>
                  <span className={`chip ${orderStatusColor[o.status]}`}>{orderStatusLabel[o.status]}</span>
                </div>
                <div className="text-xs text-on-surface-variant mt-1">{fmtDate(o.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-primary text-lg">{fmtVND(o.totalAmount)}</div>
              </div>
              <ArrowRight size={18} className="text-on-surface-variant" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
