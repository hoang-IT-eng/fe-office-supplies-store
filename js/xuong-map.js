/** Sơ đồ xưởng trên trang chủ. Không gọi API. */

const CAC_BUOC_XUONG = [
  {
    id: 'chon-da',
    ten: 'Chọn da',
    anh: 'images/folio/story-xuong-dong-so.webp',
    moTa: 'Mỗi tấm da được chọn tay theo độ dày và vân. Chỉ những tấm đều màu mới vào xưởng.',
  },
  {
    id: 'khau-chi',
    ten: 'Khâu chỉ',
    anh: 'images/folio/story-da-chi-khau.webp',
    moTa: 'Từng mũi khâu bằng tay, chỉ sáp, đều khoảng cách để sổ bền và đẹp theo năm tháng.',
  },
  {
    id: 'ep-chu',
    ten: 'Ép chữ vàng',
    anh: 'images/folio/story-ngoi-but.webp',
    moTa: 'Chữ và họa tiết được ép nóng lên da bằng lá vàng hoặc bạc, hoặc dập chìm không màu.',
  },
  {
    id: 'goi-qua',
    ten: 'Gói quà',
    anh: 'images/folio/story-goi-qua.webp',
    moTa: 'Sổ được gói giấy kem, buộc ruy băng và kèm thiệp trước khi giao.',
  },
];

function giamChuyenDong() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function khoiDongBanDoXuong() {
  const section = document.getElementById('cau-chuyen');
  const anh = document.getElementById('xuong-anh');
  const ten = document.getElementById('xuong-ten');
  const moTa = document.getElementById('xuong-mota');
  if (!section || !anh || !ten || !moTa) return;

  CAC_BUOC_XUONG.forEach((buoc) => {
    const tam = new Image();
    tam.src = buoc.anh;
  });

  let dangChon = 0;
  let henDoi = 0;

  const datTrangThai = (chiSo) => {
    section.querySelectorAll('[data-buoc]').forEach((nut) => {
      if (Number(nut.dataset.buoc) === chiSo) nut.setAttribute('aria-current', 'true');
      else nut.removeAttribute('aria-current');
    });
  };

  const hien = (chiSo) => {
    const buoc = CAC_BUOC_XUONG[chiSo];
    if (!buoc) return;
    dangChon = chiSo;
    datTrangThai(chiSo);
    ten.textContent = buoc.ten;
    moTa.textContent = buoc.moTa;
    anh.alt = buoc.ten;
    if (anh.getAttribute('src') === buoc.anh) return;

    if (giamChuyenDong()) {
      anh.src = buoc.anh;
      anh.style.opacity = '1';
      return;
    }

    clearTimeout(henDoi);
    anh.style.opacity = '0';
    henDoi = setTimeout(() => {
      anh.src = buoc.anh;
      anh.style.opacity = '1';
    }, 180);
  };

  section.querySelectorAll('[data-buoc]').forEach((nut) => {
    nut.addEventListener('click', () => hien(Number(nut.dataset.buoc)));
  });

  section.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (!e.target.closest('.xuong-ban-do, .xuong-nut-hang')) return;
    e.preventDefault();
    const lech = e.key === 'ArrowRight' ? 1 : -1;
    const moi = (dangChon + lech + CAC_BUOC_XUONG.length) % CAC_BUOC_XUONG.length;
    hien(moi);
    const vung = e.target.closest('.xuong-ban-do, .xuong-nut-hang');
    vung?.querySelector(`[data-buoc="${moi}"]`)?.focus();
  });
}
