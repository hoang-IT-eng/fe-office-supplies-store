import { api } from './api.js';

// Giỏ hàng thật nằm ở backend; ở đây chỉ giữ một bản sao trong bộ nhớ trang.
const trangThai = { danhSach: [] };
const nhungHamLangNghe = new Set();

/** Thông báo cho mọi nơi đang lắng nghe biết giỏ hàng vừa đổi */
function phatTinHieu() {
  nhungHamLangNghe.forEach((ham) => ham(trangThai.danhSach));
}

export const gioHang = {
  /** Danh sách dòng hàng hiện tại */
  get danhSach() {
    return trangThai.danhSach;
  },

  /** Đăng ký hàm chạy lại mỗi khi giỏ hàng đổi (trả về hàm để hủy đăng ký) */
  theoDoi(ham) {
    nhungHamLangNghe.add(ham);
    return () => nhungHamLangNghe.delete(ham);
  },

  /** Tải giỏ hàng từ API */
  async tai() {
    const duLieu = await api.get('/cart');
    trangThai.danhSach = duLieu || [];
    phatTinHieu();
    return trangThai.danhSach;
  },

  /** Thêm sản phẩm vào giỏ */
  async them(sanPhamId, soLuong = 1) {
    await api.post('/cart', { productId: sanPhamId, quantity: soLuong });
    await this.tai();
  },

  /** Đổi số lượng của 1 dòng hàng */
  async capNhat(dongHangId, soLuong) {
    await api.patch(`/cart/${dongHangId}`, { quantity: soLuong });
    await this.tai();
  },

  /** Xóa 1 dòng hàng khỏi giỏ */
  async xoa(dongHangId) {
    await api.delete(`/cart/${dongHangId}`);
    await this.tai();
  },

  /** Xóa sạch giỏ hàng */
  async xoaTatCa() {
    await api.delete('/cart');
    trangThai.danhSach = [];
    phatTinHieu();
  },

  /** Tổng tiền tạm tính (ưu tiên giá khuyến mãi nếu có) */
  tongTien() {
    return trangThai.danhSach.reduce((tong, dong) => {
      const gia =
        Number(dong.product.discountPrice) > 0 ? Number(dong.product.discountPrice) : Number(dong.product.price);
      return tong + gia * dong.quantity;
    }, 0);
  },

  /** Tổng số sản phẩm (để hiện badge trên header) */
  demSoLuong() {
    return trangThai.danhSach.reduce((tong, dong) => tong + dong.quantity, 0);
  },
};
