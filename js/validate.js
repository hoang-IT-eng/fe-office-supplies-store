/**
 * Kiểm tra ràng buộc form — dùng chung cho toàn bộ frontend.
 *
 * Cách dùng ở mỗi trang:
 *   const ketQua = kiemTraForm(
 *     [{ id: 'email', label: 'Email', rules: ['required', 'email'] }],
 *     formElement,
 *     thongBao,
 *   );
 *   if (!ketQua) return;      // sai → đã tự hiện lỗi dưới ô nhập
 *   ketQua.values.email       // đúng → lấy giá trị đã đọc
 */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DIEN_THOAI = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const REGEX_MA_VOUCHER = /^[A-Z0-9_-]{2,30}$/;

/** Đổi giá trị bất kỳ thành chuỗi đã bỏ khoảng trắng hai đầu */
function chuoi(giaTri) {
  return giaTri == null ? '' : String(giaTri).trim();
}

/** Đổi giá trị thành số, chuỗi rỗng → NaN */
function so(giaTri) {
  if (giaTri === '' || giaTri == null) return NaN;
  return Number(giaTri);
}

/** Tìm khối bọc ngoài ô nhập để gắn dòng chữ lỗi vào cuối khối */
function timKhoiBocNgoai(oNhap) {
  return (
    oNhap.closest('.form-field') ||
    oNhap.closest('.input-icon-wrap')?.parentElement ||
    oNhap.parentElement
  );
}

/** Chạy 1 luật (ví dụ 'minLength:6') và trả về câu lỗi, hợp lệ thì trả null */
function kiemTraMotLuat(luat, giaTri, boiCanh) {
  const viTriHaiCham = luat.indexOf(':');
  const tenLuat = viTriHaiCham >= 0 ? luat.slice(0, viTriHaiCham) : luat;
  const thamSo = viTriHaiCham >= 0 ? luat.slice(viTriHaiCham + 1) : null;
  const nhan = boiCanh.label || 'Trường này';
  const s = typeof giaTri === 'string' ? giaTri : giaTri == null ? '' : String(giaTri);

  switch (tenLuat) {
    case 'required':
      if (chuoi(s) === '') return `${nhan} là bắt buộc`;
      break;
    case 'email':
      if (chuoi(s) && !REGEX_EMAIL.test(chuoi(s))) return `${nhan} không hợp lệ`;
      break;
    case 'minLength': {
      const n = Number(thamSo);
      if (chuoi(s).length < n) return `${nhan} phải có ít nhất ${n} ký tự`;
      break;
    }
    case 'maxLength': {
      const n = Number(thamSo);
      if (chuoi(s).length > n) return `${nhan} tối đa ${n} ký tự`;
      break;
    }
    case 'phone':
      if (chuoi(s) && !REGEX_DIEN_THOAI.test(chuoi(s).replace(/\s/g, ''))) {
        return `${nhan} không hợp lệ (VD: 0912345678)`;
      }
      break;
    case 'number': {
      const n = so(s);
      if (chuoi(s) !== '' && Number.isNaN(n)) return `${nhan} phải là số`;
      break;
    }
    case 'integer': {
      const n = so(s);
      if (chuoi(s) !== '' && (!Number.isInteger(n) || Number.isNaN(n))) {
        return `${nhan} phải là số nguyên`;
      }
      break;
    }
    case 'min': {
      const n = so(s);
      const nhoNhat = Number(thamSo);
      if (chuoi(s) !== '' && (Number.isNaN(n) || n < nhoNhat)) {
        return `${nhan} phải ≥ ${nhoNhat.toLocaleString('vi-VN')}`;
      }
      break;
    }
    case 'max': {
      const n = so(s);
      const lonNhat = Number(thamSo);
      if (chuoi(s) !== '' && (Number.isNaN(n) || n > lonNhat)) {
        return `${nhan} phải ≤ ${lonNhat.toLocaleString('vi-VN')}`;
      }
      break;
    }
    case 'percent': {
      const n = so(s);
      if (chuoi(s) !== '' && (Number.isNaN(n) || n <= 0 || n > 100)) {
        return `${nhan} phải từ 1 đến 100`;
      }
      break;
    }
    case 'match': {
      const giaTriKhac = boiCanh.values?.[thamSo] ?? document.getElementById(thamSo)?.value ?? '';
      if (s !== giaTriKhac) return `${nhan} không khớp`;
      break;
    }
    case 'lteField': {
      const giaTriKhac = so(boiCanh.values?.[thamSo] ?? document.getElementById(thamSo)?.value);
      const n = so(s);
      if (chuoi(s) !== '' && !Number.isNaN(giaTriKhac) && !Number.isNaN(n) && n > giaTriKhac) {
        return `${nhan} không được lớn hơn giá gốc`;
      }
      break;
    }
    case 'dateAfter': {
      const ngayBatDau = boiCanh.values?.[thamSo] ?? document.getElementById(thamSo)?.value;
      if (s && ngayBatDau && new Date(s) <= new Date(ngayBatDau)) {
        return `${nhan} phải sau ngày bắt đầu`;
      }
      break;
    }
    case 'voucherCode':
      if (chuoi(s) && !REGEX_MA_VOUCHER.test(chuoi(s).toUpperCase())) {
        return `${nhan} chỉ gồm chữ, số, gạch ngang (2–30 ký tự)`;
      }
      break;
    case 'select':
      if (!chuoi(s)) return `Vui lòng chọn ${nhan.toLowerCase()}`;
      break;
    default:
      break;
  }
  return null;
}

/**
 * Kiểm tra danh sách trường, trả về { ok, values, errors }.
 * @param {Array<{id:string, label?:string, value?:any, rules?:string[]}>} cacTruong
 */
export function kiemTraCacTruong(cacTruong) {
  const values = {};
  const errors = [];

  for (const truong of cacTruong) {
    const giaTriGoc = truong.value !== undefined ? truong.value : document.getElementById(truong.id)?.value;
    values[truong.id] = giaTriGoc;
    for (const luat of truong.rules || []) {
      const cauLoi = kiemTraMotLuat(luat, giaTriGoc, { ...truong, values });
      if (cauLoi) {
        errors.push({ id: truong.id, message: cauLoi });
        break; // 1 trường chỉ hiện 1 lỗi đầu tiên
      }
    }
  }

  if (errors.length) return { ok: false, errors, values };
  return { ok: true, values };
}

/** Viền đỏ ô nhập + hiện dòng chữ lỗi bên dưới */
export function hienThiLoi(danhSachLoi, phamVi) {
  xoaLoi(phamVi);
  for (const loi of danhSachLoi) {
    const oNhap = document.getElementById(loi.id);
    if (!oNhap) continue;
    oNhap.classList.add('input-invalid');
    oNhap.setAttribute('aria-invalid', 'true');
    const khoi = timKhoiBocNgoai(oNhap);
    if (!khoi) continue;
    let dongLoi = khoi.querySelector('.form-error');
    if (!dongLoi) {
      dongLoi = document.createElement('p');
      dongLoi.className = 'form-error';
      khoi.appendChild(dongLoi);
    }
    dongLoi.textContent = loi.message;
  }
}

/** Bỏ hết viền đỏ và dòng chữ lỗi trong phạm vi (mặc định cả trang) */
export function xoaLoi(phamVi) {
  const goc = phamVi || document;
  goc.querySelectorAll('.input-invalid').forEach((el) => {
    el.classList.remove('input-invalid');
    el.removeAttribute('aria-invalid');
  });
  goc.querySelectorAll('.form-error').forEach((el) => el.remove());
}

/** Tự xóa lỗi ngay khi người dùng sửa lại ô nhập */
export function tuDongXoaLoi(form) {
  if (!form) return;
  // Tắt bong bóng lỗi mặc định của trình duyệt để mọi thông báo đều là tiếng Việt.
  if (form.matches?.('form')) form.noValidate = true;

  form.querySelectorAll('input, select, textarea').forEach((oNhap) => {
    const xuLy = () => {
      oNhap.classList.remove('input-invalid');
      oNhap.removeAttribute('aria-invalid');
      timKhoiBocNgoai(oNhap)?.querySelector('.form-error')?.remove();
    };
    oNhap.addEventListener('input', xuLy);
    oNhap.addEventListener('change', xuLy);
  });
}

/** Kiểm tra nhanh khi submit: sai thì hiện lỗi + toast và trả về false */
export function kiemTraForm(cacTruong, form, thongBao) {
  const ketQua = kiemTraCacTruong(cacTruong);
  if (ketQua.ok) return ketQua;
  hienThiLoi(ketQua.errors, form);
  if (thongBao) thongBao.loi(ketQua.errors[0].message);
  return false;
}
