import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Warehouse, AlertTriangle, Save, XCircle } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminInventory() {
  const [items, setItems] = useState<any[]>([]);

  const load = () => api.get('/inventory').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const update = async (productId: string, quantity: number, threshold: number) => {
    try {
      await api.patch(`/inventory/${productId}`, { quantity, lowStockThreshold: threshold });
      toast.success('Đã cập nhật tồn kho');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Lỗi'); }
  };

  const lowCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
  const outCount = items.filter((i) => i.quantity <= 0).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý kho hàng</h1>
          <div className="flex items-center gap-2 text-on-surface-variant mt-1">
            <Warehouse size={16} className="text-primary" />
            <p className="text-sm">Quản lý tồn kho và nhận cảnh báo khi xuống dưới ngưỡng tối thiểu.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="card p-4 flex items-center gap-3 border-l-4 border-tertiary min-w-[200px]">
            <div className="p-2.5 bg-tertiary-fixed rounded-lg text-on-tertiary-fixed">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sắp hết hàng</p>
              <p className="text-xl font-extrabold text-tertiary">{lowCount} sản phẩm</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 border-l-4 border-error min-w-[200px]">
            <div className="p-2.5 bg-error-container rounded-lg text-error">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hết hàng</p>
              <p className="text-xl font-extrabold text-error">{outCount} sản phẩm</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Bảng tồn kho ({items.length})</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <th className="px-6 py-3 font-bold">Sản phẩm</th>
              <th className="px-6 py-3 font-bold">SKU</th>
              <th className="px-6 py-3 font-bold">Số lượng</th>
              <th className="px-6 py-3 font-bold">Ngưỡng cảnh báo</th>
              <th className="px-6 py-3 font-bold">Trạng thái</th>
              <th className="px-6 py-3 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {items.map((inv) => (
              <Row key={inv.id} inv={inv} onSave={update} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ inv, onSave }: any) {
  const [q, setQ] = useState(inv.quantity);
  const [t, setT] = useState(inv.lowStockThreshold);
  const isLow = q > 0 && q <= t;
  const isOut = q <= 0;

  return (
    <tr className={`transition-colors ${isOut ? 'bg-error-container/30' : isLow ? 'bg-tertiary-fixed/30' : 'hover:bg-surface-container-low/30'}`}>
      <td className="px-6 py-4 font-bold text-on-surface">{inv.product?.name}</td>
      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{inv.product?.sku}</td>
      <td className="px-6 py-4">
        <input type="number" className="input w-24" value={q} onChange={(e) => setQ(Number(e.target.value))} />
      </td>
      <td className="px-6 py-4">
        <input type="number" className="input w-24" value={t} onChange={(e) => setT(Number(e.target.value))} />
      </td>
      <td className="px-6 py-4">
        {isOut && <span className="chip-danger">Hết hàng</span>}
        {!isOut && isLow && <span className="chip-warning">Sắp hết</span>}
        {!isOut && !isLow && <span className="chip-success">Ổn định</span>}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="btn-primary px-4 py-1.5" onClick={() => onSave(inv.product.id, q, t)}>
          <Save size={14} /> Lưu
        </button>
      </td>
    </tr>
  );
}
