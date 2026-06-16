import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, CircleX, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fmtVND, fmtDate, orderStatusLabel, orderStatusColor } from '../lib/format';
export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const reload = () => api.get(`/orders/${id}`).then((r) => setOrder(r.data));
    useEffect(() => {
        reload();
    }, [id]);
    const cancel = async () => {
        if (!confirm('Bạn chắc chắn muốn hủy đơn?'))
            return;
        try {
            await api.patch(`/orders/${id}/cancel`);
            toast.success('Đã hủy đơn hàng');
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Không hủy được đơn');
        }
    };
    if (!order) {
        return <div className="text-center py-20 text-on-surface-variant">Đang tải...</div>;
    }
    const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
    return (<div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft size={16}/> Quay lại danh sách đơn hàng
      </Link>

      <div className="card-elevated p-6 flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary text-on-primary grid place-items-center">
            <Receipt size={22}/>
          </div>
          <div>
            <div className="font-mono font-extrabold text-xl">#{order.code}</div>
            <div className="text-sm text-on-surface-variant">Tạo lúc {fmtDate(order.createdAt)}</div>
            <div className="mt-2">
              <span className={`chip ${orderStatusColor[order.status]}`}>
                {orderStatusLabel[order.status]}
              </span>
            </div>
          </div>
        </div>
        {canCancel && (<button onClick={cancel} className="btn-danger">
            <CircleX size={16}/> Hủy đơn
          </button>)}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-primary"/> Thông tin nhận hàng
          </h2>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-on-surface-variant">Người nhận:</span> <b>{order.shippingName}</b>
            </div>
            <div>
              <span className="text-on-surface-variant">Điện thoại:</span> {order.shippingPhone}
            </div>
            <div>
              <span className="text-on-surface-variant">Địa chỉ:</span> {order.shippingAddress}
            </div>
            {order.note && (<div className="pt-1 mt-2 border-t border-outline-variant/50 text-on-surface-variant">
                <i>Ghi chú: {order.note}</i>
              </div>)}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold flex items-center gap-2 mb-3">
            <Package size={18} className="text-primary"/> Tổng kết
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Số sản phẩm</span>
              <span className="font-semibold">{order.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tạm tính</span>
              <span className="font-semibold">{fmtVND(order.totalAmount)}</span>
            </div>
            <div className="border-t border-outline-variant my-2"/>
            <div className="flex justify-between items-baseline">
              <span className="font-bold">Tổng cộng</span>
              <span className="text-2xl font-extrabold text-primary">{fmtVND(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h2 className="font-bold">Chi tiết sản phẩm</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low/40 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-left">Tên sản phẩm</th>
                <th className="px-6 py-3 text-right">Đơn giá</th>
                <th className="px-6 py-3 text-center">SL</th>
                <th className="px-6 py-3 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {order.items.map((item) => (<tr key={item.id} className="hover:bg-surface-container-low/30">
                  <td className="px-6 py-4 font-medium">{item.productName}</td>
                  <td className="px-6 py-4 text-right">{fmtVND(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{fmtVND(item.subtotal)}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
