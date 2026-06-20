import { useEffect, useState } from 'react';
import { Ticket, Plus, Pen, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { fmtVND, fmtDate } from '../../lib/format';

const emptyForm = () => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return {
        code: '',
        discountType: 'PERCENT',
        discountValue: 10,
        maxDiscount: '',
        minOrderAmount: 0,
        usageLimit: 100,
        startDate: start.toISOString().slice(0, 16),
        endDate: end.toISOString().slice(0, 16),
        isActive: true,
    };
};

const typeLabel = {
    PERCENT: 'Phần trăm (%)',
    FIXED: 'Số tiền cố định',
};

function discountLabel(v) {
    if (v.discountType === 'PERCENT') {
        const cap = v.maxDiscount ? `, tối đa ${fmtVND(v.maxDiscount)}` : '';
        return `${Number(v.discountValue)}%${cap}`;
    }
    return fmtVND(v.discountValue);
}

export default function AdminVouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState(null);

    const reload = () => api.get('/vouchers').then((r) => setVouchers(r.data));

    useEffect(() => {
        reload();
    }, []);

    const toPayload = (data) => ({
        ...data,
        code: data.code.trim().toUpperCase(),
        discountValue: Number(data.discountValue),
        maxDiscount: data.maxDiscount === '' ? undefined : Number(data.maxDiscount),
        minOrderAmount: Number(data.minOrderAmount) || 0,
        usageLimit: Number(data.usageLimit),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
    });

    const submit = async (e) => {
        e.preventDefault();
        try {
            const payload = toPayload(form);
            if (editingId) {
                await api.patch(`/vouchers/${editingId}`, payload);
                toast.success('Đã cập nhật voucher');
            }
            else {
                await api.post('/vouchers', payload);
                toast.success('Đã tạo voucher');
            }
            setForm(emptyForm());
            setEditingId(null);
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg[0] : msg || 'Lỗi');
        }
    };

    const edit = (v) => {
        setEditingId(v.id);
        setForm({
            code: v.code,
            discountType: v.discountType,
            discountValue: Number(v.discountValue),
            maxDiscount: v.maxDiscount != null ? Number(v.maxDiscount) : '',
            minOrderAmount: Number(v.minOrderAmount),
            usageLimit: v.usageLimit,
            startDate: new Date(v.startDate).toISOString().slice(0, 16),
            endDate: new Date(v.endDate).toISOString().slice(0, 16),
            isActive: v.isActive,
        });
    };

    const remove = async (id) => {
        if (!confirm('Xóa voucher này?'))
            return;
        await api.delete(`/vouchers/${id}`);
        toast.success('Đã xóa');
        reload();
    };

    const toggle = async (id) => {
        await api.patch(`/vouchers/${id}/toggle`);
        toast.success('Đã cập nhật trạng thái');
        reload();
    };

    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý voucher</h1>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <Ticket size={16} className="text-primary"/>
          <p className="text-sm">Tạo và quản lý mã giảm giá cho khách hàng.</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-5 grid md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mã voucher *</label>
          <input className="input uppercase" placeholder="SALE10" required value={form.code} onChange={(ev) => setForm({ ...form, code: ev.target.value.toUpperCase() })}/>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Loại giảm *</label>
          <select className="input" value={form.discountType} onChange={(ev) => setForm({ ...form, discountType: ev.target.value })}>
            <option value="PERCENT">Phần trăm (%)</option>
            <option value="FIXED">Số tiền cố định</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">
            Giá trị giảm *
          </label>
          <input type="number" min="0.01" step="0.01" className="input" required value={form.discountValue} onChange={(ev) => setForm({ ...form, discountValue: ev.target.value })}/>
        </div>
        {form.discountType === 'PERCENT' && (<div className="md:col-span-2">
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Trần giảm tối đa</label>
            <input type="number" min="0" className="input" placeholder="Không giới hạn" value={form.maxDiscount} onChange={(ev) => setForm({ ...form, maxDiscount: ev.target.value })}/>
          </div>)}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Đơn tối thiểu</label>
          <input type="number" min="0" className="input" value={form.minOrderAmount} onChange={(ev) => setForm({ ...form, minOrderAmount: ev.target.value })}/>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Giới hạn lượt dùng *</label>
          <input type="number" min="1" className="input" required value={form.usageLimit} onChange={(ev) => setForm({ ...form, usageLimit: ev.target.value })}/>
        </div>
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Bắt đầu *</label>
          <input type="datetime-local" className="input" required value={form.startDate} onChange={(ev) => setForm({ ...form, startDate: ev.target.value })}/>
        </div>
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Kết thúc *</label>
          <input type="datetime-local" className="input" required value={form.endDate} onChange={(ev) => setForm({ ...form, endDate: ev.target.value })}/>
        </div>
        <div className="md:col-span-2 flex items-end">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(ev) => setForm({ ...form, isActive: ev.target.checked })}/>
            Đang hoạt động
          </label>
        </div>
        <div className="md:col-span-4 flex items-end gap-2">
          <button className="btn-primary flex-1">
            <Plus size={16}/> {editingId ? 'Cập nhật' : 'Thêm voucher'}
          </button>
          {editingId && (<button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="btn-outline">
              Hủy
            </button>)}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Danh sách voucher ({vouchers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-6 py-3 font-bold">Mã</th>
                <th className="px-6 py-3 font-bold">Giảm giá</th>
                <th className="px-6 py-3 font-bold">Đơn tối thiểu</th>
                <th className="px-6 py-3 font-bold">Lượt dùng</th>
                <th className="px-6 py-3 font-bold">Hiệu lực</th>
                <th className="px-6 py-3 font-bold">Trạng thái</th>
                <th className="px-6 py-3 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {vouchers.map((v) => (<tr key={v.id} className="hover:bg-surface-container-low/30">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{v.code}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>{typeLabel[v.discountType]}</div>
                    <div className="font-semibold">{discountLabel(v)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{fmtVND(v.minOrderAmount)}</td>
                  <td className="px-6 py-4 text-sm">{v.usedCount} / {v.usageLimit}</td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">
                    <div>{fmtDate(v.startDate)}</div>
                    <div>→ {fmtDate(v.endDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`chip ${v.isActive ? 'bg-success-container text-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {v.isActive ? 'Bật' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => toggle(v.id)} className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant" title={v.isActive ? 'Tắt' : 'Bật'}>
                      {v.isActive ? <ToggleRight size={18} className="text-success"/> : <ToggleLeft size={18}/>}
                    </button>
                    <button onClick={() => edit(v)} className="p-2 rounded-lg hover:bg-primary-fixed text-primary" title="Sửa">
                      <Pen size={16}/>
                    </button>
                    <button onClick={() => remove(v.id)} className="p-2 rounded-lg hover:bg-error-container text-error" title="Xóa">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>))}
              {vouchers.length === 0 && (<tr>
                  <td colSpan={7} className="text-center py-8 text-on-surface-variant text-sm">
                    Chưa có voucher nào
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
