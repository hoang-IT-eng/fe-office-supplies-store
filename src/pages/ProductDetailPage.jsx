import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, Star, Box, ShoppingCart, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, fileUrl } from '../lib/api';
import { fmtVND, fmtDate } from '../lib/format';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [imageIdx, setImageIdx] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const cart = useCartStore();
    const { user } = useAuthStore();
    const reload = () => api.get(`/products/${id}`).then((r) => {
        setProduct(r.data);
        setImageIdx(0);
    });
    useEffect(() => {
        reload();
    }, [id]);
    const addToCart = async () => {
        if (!user)
            return toast.error('Vui lòng đăng nhập');
        try {
            await cart.add(product.id, quantity);
            toast.success('Đã thêm vào giỏ hàng');
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi khi thêm giỏ hàng');
        }
    };
    const submitReview = async () => {
        if (!comment.trim())
            return toast.error('Vui lòng nhập nhận xét');
        try {
            await api.post('/reviews', { productId: product.id, rating, comment });
            toast.success('Đã gửi đánh giá');
            setComment('');
            reload();
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Không gửi được đánh giá');
        }
    };
    if (!product) {
        return <div className="text-center py-20 text-on-surface-variant">Đang tải...</div>;
    }
    const stock = product.inventory?.quantity ?? 0;
    const price = Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Number(product.price);
    const discountPct = Number(product.discountPrice) > 0
        ? Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)
        : 0;
    const avgRating = product.reviews?.length
        ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
        : '0';
    return (<div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft size={16}/> Quay lại danh sách
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-square bg-surface-container-low rounded-xl overflow-hidden card">
            {product.images?.[imageIdx] ? (<motion.img key={imageIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={fileUrl(product.images[imageIdx])} alt={product.name} className="w-full h-full object-cover"/>) : (<div className="w-full h-full grid place-items-center text-on-surface-variant">
                <Box size={64}/>
              </div>)}
          </div>
          {(product.images?.length ?? 0) > 1 && (<div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (<button key={idx} onClick={() => setImageIdx(idx)} className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${imageIdx === idx ? 'border-primary shadow-soft' : 'border-transparent hover:border-outline-variant'}`}>
                  <img src={fileUrl(img)} className="w-full h-full object-cover" alt=""/>
                </button>))}
            </div>)}
        </div>

        <div>
          {product.category && (<div className="chip-info mb-3 inline-flex">
              <Tag size={12}/> {product.category.name}
            </div>)}
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{product.name}</h1>
          <div className="text-xs text-on-surface-variant mt-1">SKU: {product.sku}</div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={16} className={Number(avgRating) >= n ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}/>))}
            </div>
            <span className="text-sm font-semibold text-on-surface">{avgRating}</span>
            <span className="text-sm text-on-surface-variant">({product.reviews?.length || 0} đánh giá)</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-primary tracking-tight">{fmtVND(price)}</span>
            {Number(product.discountPrice) > 0 && (<>
                <span className="text-on-surface-variant line-through">{fmtVND(product.price)}</span>
                <span className="chip bg-tertiary text-white">-{discountPct}%</span>
              </>)}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-on-surface-variant">Tồn kho:</span>
            {stock > 0 ? (<span className="chip-success">Còn {stock} sản phẩm</span>) : (<span className="chip-danger">Hết hàng</span>)}
          </div>

          {product.description && (<div className="mt-6 p-4 rounded-lg bg-surface-container-low text-on-surface text-sm whitespace-pre-line">
              {product.description}
            </div>)}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2.5 hover:bg-surface-container-high text-lg font-bold">
                −
              </button>
              <input type="number" min={1} max={stock} value={quantity} onChange={(ev) => setQuantity(Number(ev.target.value))} className="w-14 text-center border-0 bg-transparent focus:outline-none font-semibold"/>
              <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="px-3 py-2.5 hover:bg-surface-container-high text-lg font-bold">
                +
              </button>
            </div>
            <button className="btn-primary flex-1 py-3" disabled={stock <= 0} onClick={addToCart}>
              <ShoppingCart size={18}/>
              {stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
          </div>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare size={20} className="text-primary"/>
          <h2 className="font-bold text-lg">Đánh giá ({product.reviews?.length || 0})</h2>
        </div>

        {user && (<div className="bg-surface-container-low rounded-lg p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold">Đánh giá của bạn:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (<button key={n} type="button" onClick={() => setRating(n)}>
                    <Star size={20} className={n <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-outline-variant hover:text-amber-300'}/>
                  </button>))}
              </div>
            </div>
            <textarea className="input" rows={3} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." value={comment} onChange={(ev) => setComment(ev.target.value)}/>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-on-surface-variant">* Chỉ đánh giá được khi đã mua sản phẩm này</p>
              <button className="btn-primary" onClick={submitReview}>
                <Send size={16}/> Gửi đánh giá
              </button>
            </div>
          </div>)}

        <div className="space-y-3">
          {product.reviews?.length === 0 && (<div className="text-center py-8 text-on-surface-variant text-sm">Chưa có đánh giá nào.</div>)}
          {product.reviews?.map((review) => (<div key={review.id} className="p-4 rounded-lg border border-outline-variant/60 bg-surface-container-lowest">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary grid place-items-center font-bold text-sm">
                  {review.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{review.user?.fullName}</div>
                  <div className="text-xs text-on-surface-variant">{fmtDate(review.createdAt)}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={14} className={review.rating >= n ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}/>))}
                </div>
              </div>
              <p className="text-sm text-on-surface mt-2">{review.comment}</p>
            </div>))}
        </div>
      </section>
    </div>);
}
