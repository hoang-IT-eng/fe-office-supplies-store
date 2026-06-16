import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, TriangleAlert, CircleX, Tag, Plus, X, Upload, Box, Pen, Trash2, } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, fileUrl } from '../../lib/api';
import { fmtVND } from '../../lib/format';
const EMPTY_FORM = {
    sku: '',
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    categoryId: '',
    initialQuantity: 0,
    lowStockThreshold: 5,
};
export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [files, setFiles] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const reload = () => api.get('/products', { params: { page: 1, limit: 100 } }).then((r) => setProducts(r.data.items));
    useEffect(() => {
        reload();
        api.get('/categories').then((r) => setCategories(r.data));
    }, []);
    const resetForm = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFiles(null);
        setShowForm(false);
    };
    const openCreate = () => {
        resetForm();
        setShowForm(true);
    };
    const submit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.categoryId)
                delete payload.categoryId;
            let productId = editing?.id;
            if (editing) {
                await api.patch(`/products/${productId}`, payload);
            }
            else {
                const { data } = await api.post('/products', payload);
                productId = data.id;
            }
            if (files && files.length > 0) {
                const fd = new FormData();
                Array.from(files).forEach((f) => fd.append('files', f));
                await api.post(`/products/${productId}/images`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            toast.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
            resetForm();
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi');
        }
    };
    const edit = (p) => {
        setEditing(p);
        setForm({
            sku: p.sku,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            discountPrice: Number(p.discountPrice) || 0,
            categoryId: p.category?.id || '',
            initialQuantity: 0,
            lowStockThreshold: 5,
        });
        setShowForm(true);
    };
    const remove = async (id) => {
        if (!confirm('Xóa sản phẩm này?'))
            return;
        await api.delete(`/products/${id}`);
        toast.success('Đã xóa');
        reload();
    };
    const lowStock = products.filter((p) => p.inventory && p.inventory.quantity > 0 && p.inventory.quantity <= p.inventory.lowStockThreshold).length;
    const outOfStock = products.filter((p) => !p.inventory?.quantity).length;
    return (<div className="space-y-6">
      <section className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Quản lý sản phẩm</h1>
          <div className="flex items-center gap-2 text-on-surface-variant mt-1">
            <Package size={16} className="text-primary"/>
            <p className="text-sm">Thêm, sửa, xóa và upload ảnh sản phẩm.</p>
          </div>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Hiện đang có {products.length} sản phẩm trong hệ thống.
          </p>
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

      <section className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Tag size={16} className="text-primary"/> Tổng cộng {products.length} sản phẩm
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16}/> Thêm sản phẩm
        </button>
      </section>

      {showForm && (<motion.form onSubmit={submit} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
            <button type="button" onClick={resetForm} className="p-2 rounded-lg hover:bg-surface-container-high">
              <X size={18}/>
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">SKU *</label>
              <input className="input" required value={form.sku} onChange={(ev) => setForm({ ...form, sku: ev.target.value })}/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Tên sản phẩm *</label>
              <input className="input" required value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })}/>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Mô tả</label>
              <textarea className="input" rows={2} value={form.description} onChange={(ev) => setForm({ ...form, description: ev.target.value })}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Giá (VND) *</label>
              <input type="number" className="input" required min={0} value={form.price} onChange={(ev) => setForm({ ...form, price: Number(ev.target.value) })}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Giá khuyến mãi</label>
              <input type="number" className="input" min={0} value={form.discountPrice} onChange={(ev) => setForm({ ...form, discountPrice: Number(ev.target.value) })}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Danh mục</label>
              <select className="input" value={form.categoryId} onChange={(ev) => setForm({ ...form, categoryId: ev.target.value })}>
                <option value="">-- Chọn --</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>
                    {c.name}
                  </option>))}
              </select>
            </div>
            {!editing && (<>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Tồn kho ban đầu</label>
                  <input type="number" className="input" min={0} value={form.initialQuantity} onChange={(ev) => setForm({ ...form, initialQuantity: Number(ev.target.value) })}/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Ngưỡng cảnh báo</label>
                  <input type="number" className="input" min={0} value={form.lowStockThreshold} onChange={(ev) => setForm({ ...form, lowStockThreshold: Number(ev.target.value) })}/>
                </div>
                <div />
              </>)}
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">
                <Upload size={14} className="inline mr-1"/> Hình ảnh sản phẩm
              </label>
              <input type="file" multiple accept="image/*" className="input" onChange={(ev) => setFiles(ev.target.files)}/>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-outline-variant">
            <button type="submit" className="btn-primary">
              {editing ? 'Cập nhật' : 'Tạo sản phẩm'}
            </button>
            <button type="button" onClick={resetForm} className="btn-outline">
              Hủy
            </button>
          </div>
        </motion.form>)}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <h3 className="text-sm font-bold">Danh sách sản phẩm</h3>
          <span className="chip bg-surface-container-highest text-on-surface-variant">Live Inventory</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-6 py-3 font-bold">SKU</th>
                <th className="px-6 py-3 font-bold">Sản phẩm</th>
                <th className="px-6 py-3 font-bold">Danh mục</th>
                <th className="px-6 py-3 font-bold">Tồn kho</th>
                <th className="px-6 py-3 font-bold">Đơn giá</th>
                <th className="px-6 py-3 font-bold">Trạng thái</th>
                <th className="px-6 py-3 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {products.map((p) => {
            const qty = p.inventory?.quantity ?? 0;
            const threshold = p.inventory?.lowStockThreshold ?? 5;
            let status = 'in';
            if (qty <= 0)
                status = 'out';
            else if (qty <= threshold)
                status = 'low';
            return (<tr key={p.id} className="group hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.sku}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (<img src={fileUrl(p.images[0])} className="w-12 h-12 rounded-lg object-cover bg-surface-container-low" alt=""/>) : (<div className="w-12 h-12 rounded-lg bg-surface-container-low grid place-items-center text-on-surface-variant">
                            <Box size={20}/>
                          </div>)}
                        <div className="min-w-0">
                          <div className="font-bold text-on-surface truncate max-w-xs">{p.name}</div>
                          <div className="text-xs text-on-surface-variant truncate max-w-xs">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{p.category?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-2xl font-extrabold tracking-tight ${status === 'out' ? 'text-error' : status === 'low' ? 'text-tertiary' : 'text-on-surface'}`}>
                        {qty}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{fmtVND(p.price)}</td>
                    <td className="px-6 py-4">
                      {status === 'in' && (<span className="chip-success">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"/> Còn hàng
                        </span>)}
                      {status === 'low' && (<span className="chip-warning">
                          <span className="w-2 h-2 rounded-full bg-amber-500"/> Sắp hết
                        </span>)}
                      {status === 'out' && (<span className="chip-danger">
                          <span className="w-2 h-2 rounded-full bg-red-500"/> Hết hàng
                        </span>)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => edit(p)} className="p-2 rounded-lg hover:bg-primary-fixed text-primary" title="Sửa">
                          <Pen size={16}/>
                        </button>
                        <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-error-container text-error" title="Xóa">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>);
        })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
