import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, Search, Tag, ShoppingBag } from 'lucide-react';
import { api, fileUrl } from '../lib/api';
import { fmtVND } from '../lib/format';
export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const params = { page: 1, limit: 24 };
            if (search)
                params.search = search;
            if (categoryId)
                params.categoryId = categoryId;
            if (minPrice)
                params.minPrice = minPrice;
            if (maxPrice)
                params.maxPrice = maxPrice;
            const { data } = await api.get('/products', { params });
            setProducts(data.items);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        api.get('/categories').then((r) => setCategories(r.data));
        load();
    }, []);
    useEffect(() => {
        load();
    }, [categoryId]);
    return (<div className="space-y-8">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary p-10 shadow-elevated">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-tertiary-fixed/20 rounded-full blur-3xl"/>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-4">
            <Sparkles size={14}/> Văn phòng phẩm chính hãng
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl">
            Mua sắm văn phòng phẩm <br />
            <span className="text-tertiary-fixed">nhanh chóng & tin cậy</span>
          </h1>
          <p className="mt-3 max-w-xl text-on-primary/85">
            Hơn 1,000+ sản phẩm chất lượng — bút viết, sổ tay, dụng cụ học tập, đồ dùng văn phòng.
          </p>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={18} className="text-primary"/>
          <h2 className="font-bold text-on-surface">Tìm kiếm & lọc sản phẩm</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input className="input pl-10" placeholder="Tìm kiếm sản phẩm..." value={search} onChange={(ev) => setSearch(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && load()}/>
          </div>
          <select className="input md:col-span-3" value={categoryId} onChange={(ev) => setCategoryId(ev.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>
                {c.name}
              </option>))}
          </select>
          <input className="input md:col-span-2" placeholder="Giá từ" type="number" value={minPrice} onChange={(ev) => setMinPrice(ev.target.value)}/>
          <input className="input md:col-span-2" placeholder="Giá đến" type="number" value={maxPrice} onChange={(ev) => setMaxPrice(ev.target.value)}/>
          <button className="btn-primary md:col-span-1" onClick={load}>
            Lọc
          </button>
        </div>
        {categories.length > 0 && (<div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setCategoryId('')} className={`chip ${categoryId === '' ? 'bg-primary text-on-primary' : 'chip-neutral'}`}>
              <Tag size={12}/> Tất cả
            </button>
            {categories.map((c) => (<button key={c.id} onClick={() => setCategoryId(c.id)} className={`chip ${categoryId === c.id ? 'bg-primary text-on-primary' : 'chip-neutral'}`}>
                {c.name}
              </button>))}
          </div>)}
      </section>

      <section>
        {loading ? (<div className="text-center py-16 text-on-surface-variant">Đang tải...</div>) : products.length === 0 ? (<div className="text-center py-16 text-on-surface-variant card">Không có sản phẩm phù hợp.</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, idx) => {
                const price = Number(p.discountPrice) > 0 ? Number(p.discountPrice) : Number(p.price);
                const stock = p.inventory?.quantity ?? 0;
                const discountPct = Number(p.discountPrice) > 0
                    ? Math.round((1 - Number(p.discountPrice) / Number(p.price)) * 100)
                    : 0;
                return (<motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Link to={`/products/${p.id}`} className="card group overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 block">
                    <div className="relative aspect-square bg-surface-container-low overflow-hidden">
                      {p.images?.[0] ? (<img src={fileUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>) : (<div className="w-full h-full grid place-items-center text-on-surface-variant">
                          <ShoppingBag size={48}/>
                        </div>)}
                      {discountPct > 0 && (<span className="absolute top-2 left-2 chip bg-tertiary text-white shadow-soft">
                          -{discountPct}%
                        </span>)}
                      {stock <= 0 && (<span className="absolute top-2 right-2 chip-danger">Hết hàng</span>)}
                    </div>
                    <div className="p-3.5">
                      {p.category && (<div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                          {p.category.name}
                        </div>)}
                      <h3 className="font-semibold text-on-surface mt-0.5 line-clamp-2 group-hover:text-primary transition-colors min-h-[44px]">
                        {p.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-primary font-bold text-lg">{fmtVND(price)}</span>
                        {Number(p.discountPrice) > 0 && (<span className="text-xs text-on-surface-variant line-through">
                            {fmtVND(p.price)}
                          </span>)}
                      </div>
                    </div>
                  </Link>
                </motion.div>);
            })}
          </div>)}
      </section>
    </div>);
}
