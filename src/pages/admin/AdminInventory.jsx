import { useEffect, useState } from 'react';
import { Warehouse, TriangleAlert, CircleX, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
function InventoryRowEditor({ inv, onSave, }) {
    const [quantity, setQuantity] = useState(inv.quantity);
    const [threshold, setThreshold] = useState(inv.lowStockThreshold);
    const isLow = quantity > 0 && quantity <= threshold;
    const isOut = quantity <= 0;
    return (<tr className={`transition-colors ${isOut ? 'bg-error-container/30' : isLow ? 'bg-tertiary-fixed/30' : 'hover:bg-surface-container-low/30'}`}>
      <td className="px-6 py-4 font-bold text-on-surface">{inv.product.name}</td>
      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{inv.product.sku}</td>
      <td className="px-6 py-4">
        <input type="number" className="input w-24" value={quantity} onChange={(ev) => setQuantity(Number(ev.target.value))}/>
      </td>
      <td className="px-6 py-4">
        <input type="number" className="input w-24" value={threshold} onChange={(ev) => setThreshold(Number(ev.target.value))}/>
      </td>
      <td className="px-6 py-4">
        {isOut && <span className="chip-danger">Hết hàng</span>}
        {!isOut && isLow && <span className="chip-warning">Sắp hết</span>}
        {!isOut && !isLow && <span className="chip-success">Ổn định</span>}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="btn-primary px-4 py-1.5" onClick={() => onSave(inv.product.id, quantity, threshold)}>
          <Save size={14}/> Lưu
        </button>
      </td>
    </tr>);
}
export default function AdminInventory() {
    const [items, setItems] = useState([]);
    const reload = () => api.get('/inventory').then((r) => setItems(r.data));
    useEffect(() => {
        reload();
    }, []);
    const save = async (productId, quantity, lowStockThreshold) => {
        try {
            await api.patch(`/inventory/${productId}`, { quantity, lowStockThreshold });
            toast.success('Đã cập nhật tồn kho');
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi');
        }
    };
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
    const outOfStock = items.filter((i) => i.quantity <= 0).length;
    return (<div className="space-y-6">
      <section className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý kho hàng</h1>
          <div className="flex items-center gap-2 text-on-surface-variant mt-1">
            <Warehouse size={16} className="text-primary"/>
            <p className="text-sm">Quản lý tồn kho và nhận cảnh báo khi xuống dưới ngưỡng tối thiểu.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="card p-4 flex items-center gap-3 border-l-4 border-tertiary min-w-[200px]">
            <div className="p-2.5 bg-tertiary-fixed rounded-lg text-on-tertiary-fixed">
              <TriangleAlert size={20}/>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sắp hết hàng</p>
              <p className="text-xl font-extrabold text-tertiary">{lowStock} sản phẩm</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 border-l-4 border-error min-w-[200px]">
            <div className="p-2.5 bg-error-container rounded-lg text-error">
              <CircleX size={20}/>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hết hàng</p>
              <p className="text-xl font-extrabold text-error">{outOfStock} sản phẩm</p>
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
            {items.map((inv) => (<InventoryRowEditor key={inv.id} inv={inv} onSave={save}/>))}
          </tbody>
        </table>
      </div>
    </div>);
}
