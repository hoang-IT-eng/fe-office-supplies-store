import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Trash2, Box, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { fileUrl } from '../lib/api';
import { fmtVND } from '../lib/format';

export default function CartPage() {
  const cart = useCartStore();
  useEffect(() => { cart.fetch(); }, []);

  const onUpdate = async (id: string, q: number) => {
    if (q < 1) return;
    try {
      await cart.update(id, q);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart size={24} className="text-primary" />
        <h1 className="section-title">Giỏ hàng của bạn</h1>
        <span className="chip-info">{cart.count()} sản phẩm</span>
      </div>

      {cart.items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low grid place-items-center text-on-surface-variant mb-4">
            <ShoppingCart size={32} />
          </div>
          <h2 className="font-bold text-lg">Giỏ hàng trống</h2>
          <p className="text-on-surface-variant text-sm mt-1">Hãy khám phá sản phẩm và thêm vào giỏ hàng</p>
          <Link to="/" className="btn-primary mt-5 inline-flex">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((it) => {
              const price = Number(it.product.discountPrice) > 0
                ? Number(it.product.discountPrice)
                : Number(it.product.price);
              return (
                <div key={it.id} className="card p-4 flex gap-4 items-center">
                  <Link to={`/products/${it.product.id}`} className="shrink-0">
                    {it.product.images?.[0] ? (
                      <img
                        src={fileUrl(it.product.images[0])}
                        className="w-20 h-20 rounded-lg object-cover bg-surface-container-low"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-surface-container-low grid place-items-center text-on-surface-variant">
                        <Box size={28} />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${it.product.id}`} className="font-semibold hover:text-primary block truncate">
                      {it.product.name}
                    </Link>
                    <div className="text-primary text-sm font-bold mt-0.5">{fmtVND(price)}</div>
                  </div>

                  <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                    <button
                      onClick={() => onUpdate(it.id, it.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-surface-container-high font-bold"
                    >−</button>
                    <input
                      type="number"
                      className="w-12 text-center border-0 bg-transparent font-semibold text-sm focus:outline-none"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => onUpdate(it.id, Number(e.target.value))}
                    />
                    <button
                      onClick={() => onUpdate(it.id, it.quantity + 1)}
                      className="px-3 py-1.5 hover:bg-surface-container-high font-bold"
                    >+</button>
                  </div>

                  <div className="w-32 text-right font-bold text-on-surface">
                    {fmtVND(price * it.quantity)}
                  </div>

                  <button
                    onClick={() => cart.remove(it.id)}
                    className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
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
              <div className="border-t border-outline-variant my-3" />
              <div className="flex justify-between items-baseline">
                <span className="font-bold">Tổng cộng</span>
                <span className="text-2xl font-extrabold text-primary">{fmtVND(cart.total())}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-5 py-3">
              Tiến hành thanh toán <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
