import { chuoiAnToan } from './format.js';

/** Tạo (nếu chưa có) khung chứa các thông báo ở góc phải trên */
function layKhungThongBao() {
  let khung = document.getElementById('toast-root');
  if (!khung) {
    khung = document.createElement('div');
    khung.id = 'toast-root';
    document.body.appendChild(khung);
  }
  return khung;
}

/** Hiện 1 thông báo rồi tự ẩn sau `thoiGian` mili giây */
function hien(noiDung, loai = 'info', thoiGian = 3000) {
  const khung = layKhungThongBao();
  const the = document.createElement('div');
  the.className = `toast toast-${loai}`;
  the.innerHTML = `<span>${chuoiAnToan(noiDung)}</span>`;
  khung.appendChild(the);
  setTimeout(() => {
    the.classList.add('toast-dang-an');
    setTimeout(() => the.remove(), 200);
  }, thoiGian);
}

export const thongBao = {
  thanhCong: (noiDung, thoiGian) => hien(noiDung, 'success', thoiGian),
  loi: (noiDung, thoiGian) => hien(noiDung, 'error', thoiGian),
  tin: (noiDung, thoiGian) => hien(noiDung, 'info', thoiGian),
};
