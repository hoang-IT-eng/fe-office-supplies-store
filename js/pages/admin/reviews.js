/**
 * Trang Admin: Quản lý đánh giá
 * CSS: style inline + admin-ui.js — không dùng utility class.
 */

import { api } from '../../api.js';
import { fmtDate, esc } from '../../format.js';
import { toast } from '../../toast.js';
import { mountAdminChrome, icons, requireAdmin } from '../../layout.js';
import {
  CARD,
  MUTED,
  INPUT,
  LABEL,
  ICON_BTN,
  AVATAR,
  TABLE_HEAD,
  TH,
  TD,
  rowBorder,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  LIST_HEADER,
  LOADING,
  statCard,
  statIcon,
} from '../../admin-ui.js';

const app = document.getElementById('app');
let reviews = [];
let filterRating = '';
let search = '';

/** 5 ngôi sao: tô vàng nếu rating >= n */
function taoHtmlSao(rating) {
  let html = '';
  for (let n = 1; n <= 5; n += 1) {
    const filled = rating >= n;
    const color = filled ? 'color:#f59e0b;fill:#f59e0b' : 'color:var(--outline-variant)';
    html += `<i data-lucide="star" style="width:14px;height:14px;${color}"></i>`;
  }
  return html;
}

function locDanhGia() {
  const tuKhoa = search.trim().toLowerCase();
  const ketQua = [];
  for (const r of reviews) {
    if (filterRating !== '' && Number(r.rating) !== Number(filterRating)) continue;
    if (tuKhoa === '') {
      ketQua.push(r);
      continue;
    }
    const haystack = [r.user?.fullName, r.user?.email, r.product?.name, r.comment]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (haystack.includes(tuKhoa)) ketQua.push(r);
  }
  return ketQua;
}

function tinhThongKe() {
  const tongSo = reviews.length;
  if (tongSo === 0) return { tongSo: 0, trungBinh: '0', soSaoThap: 0 };
  let tongDiem = 0;
  let soSaoThap = 0;
  for (const r of reviews) {
    const diem = Number(r.rating);
    tongDiem += diem;
    if (diem <= 2) soSaoThap += 1;
  }
  return { tongSo, trungBinh: (tongDiem / tongSo).toFixed(1), soSaoThap };
}

function taoHtmlThongKe(thongKe) {
  return `
    <div style="display:flex;gap:.75rem;flex-wrap:wrap">
      <div style="${statCard('var(--primary)')}">
        <div style="${statIcon('var(--primary-fixed)', 'var(--primary)')}">
          <i data-lucide="message-square" style="width:20px;height:20px"></i>
        </div>
        <div>
          <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Tổng</p>
          <p style="font-size:1.25rem;font-weight:800;color:var(--primary)">${thongKe.tongSo}</p>
        </div>
      </div>
      <div style="${statCard('#f59e0b')}">
        <div style="${statIcon('#fef3c7', '#d97706')}">
          <i data-lucide="star" style="width:20px;height:20px"></i>
        </div>
        <div>
          <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">Trung bình</p>
          <p style="font-size:1.25rem;font-weight:800;color:#d97706">${thongKe.trungBinh}</p>
        </div>
      </div>
      <div style="${statCard('var(--error)')}">
        <div style="${statIcon('#fee2e2', 'var(--error)')}">
          <i data-lucide="thumbs-down" style="width:20px;height:20px"></i>
        </div>
        <div>
          <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${MUTED}">≤ 2 sao</p>
          <p style="font-size:1.25rem;font-weight:800;color:var(--error)">${thongKe.soSaoThap}</p>
        </div>
      </div>
    </div>`;
}

function taoHtmlBoLoc() {
  let htmlCacOption = '<option value="">Tất cả</option>';
  for (let n = 5; n >= 1; n -= 1) {
    const selected = String(filterRating) === String(n) ? 'selected' : '';
    htmlCacOption += `<option value="${n}" ${selected}>${n} sao</option>`;
  }
  return `
    <div style="${CARD};padding:1rem;display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end">
      <div style="flex:1;min-width:220px">
        <label style="${LABEL}">Tìm kiếm</label>
        <input id="f-search" style="${INPUT}" placeholder="Người dùng, sản phẩm, nội dung..." value="${esc(search)}" />
      </div>
      <div style="min-width:140px">
        <label style="${LABEL}">Số sao</label>
        <select id="f-rating" style="${INPUT}">${htmlCacOption}</select>
      </div>
    </div>`;
}

function row(r, index) {
  const cell = `${rowBorder(index)}${TD}`;
  const tenKhach = esc(r.user?.fullName || '—');
  const emailKhach = esc(r.user?.email || '');
  const tenSanPham = esc(r.product?.name || '—');
  const chuCaiDau = (r.user?.fullName || 'U').charAt(0).toUpperCase();

  return `
    <tr>
      <td style="${cell}">
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="${AVATAR};width:2.5rem;height:2.5rem">${chuCaiDau}</div>
          <div>
            <div style="font-weight:700;font-size:.875rem">${tenKhach}</div>
            <div style="font-size:.75rem;${MUTED}">${emailKhach}</div>
          </div>
        </div>
      </td>
      <td style="${cell}font-size:.875rem;font-weight:600">${tenSanPham}</td>
      <td style="${cell}">
        <div style="display:flex;align-items:center;gap:.25rem">
          ${taoHtmlSao(Number(r.rating))}
          <span style="font-size:.75rem;font-weight:700;margin-left:.25rem">${r.rating}</span>
        </div>
      </td>
      <td style="${cell}font-size:.875rem;max-width:280px">${esc(r.comment)}</td>
      <td style="${cell}font-size:.75rem;${MUTED}">${fmtDate(r.createdAt)}</td>
      <td style="${cell}text-align:right">
        <button type="button" data-del="${r.id}" style="${ICON_BTN}" title="Xóa đánh giá">
          <i data-lucide="trash-2" style="width:16px;height:16px"></i>
        </button>
      </td>
    </tr>`;
}

function render() {
  const thongKe = tinhThongKe();
  const danhSachDaLoc = locDanhGia();

  const bangBody =
    danhSachDaLoc.length === 0
      ? `<tr><td colspan="6" style="${TD};text-align:center;padding:1.5rem;${MUTED};font-size:.875rem">Chưa có đánh giá nào</td></tr>`
      : danhSachDaLoc.map(row).join('');

  app.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <section style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1.5rem">
        <div>
          <h1 style="${PAGE_TITLE}">Quản lý đánh giá</h1>
          <div style="${PAGE_SUBTITLE}">
            <i data-lucide="star" style="width:16px;height:16px;color:var(--primary)"></i>
            <p>Xem và xóa đánh giá sản phẩm từ khách hàng.</p>
          </div>
        </div>
        ${taoHtmlThongKe(thongKe)}
      </section>

      ${taoHtmlBoLoc()}

      <div style="${CARD};overflow:hidden">
        <div style="${LIST_HEADER}">Danh sách đánh giá (${danhSachDaLoc.length})</div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse;width:100%;min-width:900px">
            <thead style="${TABLE_HEAD}">
              <tr>
                <th style="${TH}">Khách hàng</th>
                <th style="${TH}">Sản phẩm</th>
                <th style="${TH}">Đánh giá</th>
                <th style="${TH}">Nội dung</th>
                <th style="${TH}">Ngày</th>
                <th style="${TH};text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${bangBody}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  ganSuKien();
  icons();

  // Giữ con trỏ ở cuối ô tìm kiếm khi đang gõ
  const oTimKiem = document.getElementById('f-search');
  if (document.activeElement !== oTimKiem && search !== '') {
    oTimKiem.focus();
    const doDai = oTimKiem.value.length;
    oTimKiem.setSelectionRange(doDai, doDai);
  }
}

function ganSuKien() {
  document.getElementById('f-search').addEventListener('input', (e) => {
    search = e.target.value;
    render();
  });
  document.getElementById('f-rating').addEventListener('change', (e) => {
    filterRating = e.target.value;
    render();
  });
  document.querySelectorAll('[data-del]').forEach((nut) => {
    nut.addEventListener('click', () => remove(nut.dataset.del));
  });
}

async function remove(id) {
  if (!confirm('Xóa đánh giá này?')) return;
  try {
    await api.delete(`/reviews/${id}`);
    toast.success('Đã xóa đánh giá');
    await reload();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Không xóa được đánh giá');
  }
}

async function reload() {
  reviews = await api.get('/reviews');
  render();
}

async function init() {
  if (!requireAdmin()) return;
  mountAdminChrome('reviews');
  app.innerHTML = `<div style="${LOADING}">Đang tải...</div>`;
  try {
    await reload();
  } catch (err) {
    app.innerHTML = `<div style="${CARD};padding:3rem;text-align:center;${MUTED}">${esc(err?.response?.data?.message || 'Không tải được danh sách đánh giá.')}</div>`;
  }
}

init();
