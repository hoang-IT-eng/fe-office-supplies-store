import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Box, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cart';
import { fileUrl } from '../lib/api';
import { fmtVND } from '../lib/format';
export default function CartPage() {
    const cart = useCartStore();
    useEffect(() => {
        cart.fetch();
    }, []);
    const updateQty = async (itemId, quantity) => {
        if (quantity < 1)
            return;
        try {
            await cart.update(itemId, quantity);
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Lỗi cập nhật');
        }
    };
    return (<div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart size={24} className="text-primary"/>
        <h1 className="section-title">Giỏ hàng của bạn</h1>
        <span className="chip-info">{cart.count()} sản phẩm</span>
      </div>

      {cart.items.length === 0 ? (<div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low grid place-items-center text-on-surface-variant mb-4">
            <ShoppingCart size={32}/>
          </div>
          <h2 className="font-bold text-lg">Giỏ hàng trống</h2>
          <p className="text-on-surface-variant text-sm mt-1">Hãy khám phá sản phẩm và thêm vào giỏ hàng</p>
          <Link to="/" className="btn-primary mt-5 inline-flex">
            Tiếp tục mua sắm
          </Link>
        </div>) : (<div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => {
                const price = Number(item.product.discountPrice) > 0
                    ? Number(item.product.discountPrice)
                    : Number(item.product.price);
                return (<div key={item.id} className="card p-4 flex gap-4 items-center">
                  <Link to={`/products/${item.product.id}`} className="shrink-0">
                    {item.product.images?.[0] ? (<img src={fileUrl(item.product.images[0])} className="w-20 h-20 rounded-lg object-cover bg-surface-container-low" alt=""/>) : (<div className="w-20 h-20 rounded-lg bg-surface-container-low grid place-items-center text-on-surface-variant">
                        <Box size={28}/>
                      </div>)}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`} className="font-semibold hover:text-primary block truncate">
                      {item.product.name}
                    </Link>
                    <div className="text-primary text-sm font-bold mt-0.5">{fmtVND(price)}</div>
                  </div>
                  <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-3 py-1.5 hover:bg-surface-container-high font-bold">
                      −
                    </button>
                    <input type="number" className="w-12 text-center border-0 bg-transparent font-semibold text-sm focus:outline-none" min={1} value={item.quantity} onChange={(ev) => updateQty(item.id, Number(ev.target.value))}/>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-3 py-1.5 hover:bg-surface-container-high font-bold">
                      +
                    </button>
                  </div>
                  <div className="w-32 text-right font-bold text-on-surface">{fmtVND(price * item.quantity)}</div>
                  <button onClick={() => cart.remove(item.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors" title="Xóa">
                    <Trash2 size={18}/>
                  </button>
                </div>);
            })}
          </div>

          <div className="card-elevated p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-bold text-lg mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tạm tính</span>
                <span className="font-semibold">{fmtVND(cart.total())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phí vận chuyển</span>
                <span className="font-semibold text-success">Miễn phí</span>
              </div>
              <div className="border-t border-outline-variant my-3"/>
              <div className="flex justify-between items-baseline">
                <span className="font-bold">Tổng cộng</span>
                <span className="text-2xl font-extrabold text-primary">{fmtVND(cart.total())}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-5 py-3">
              Tiến hành thanh toán <ArrowRight size={18}/>
            </Link>
          </div>
        </div>)}
    </div>);
}
