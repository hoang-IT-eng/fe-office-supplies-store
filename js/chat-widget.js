// Widget chat nổi góc dưới phải — gắn một lần qua dungKhungKhachHang().
import { api } from './api.js';
import { duongDanTapTin, duongDanTrang } from './config.js';
import { chuoiAnToan, dinhDangTien } from './format.js';

const lichSuHoiDap = [];
let dangHoi = false;

function laTrangSanPham() {
  return /\/product(\.html)?$/i.test(location.pathname);
}

function layProductId() {
  if (!laTrangSanPham()) return null;
  const id = new URLSearchParams(location.search).get('id');
  return id && id.trim() ? id.trim() : null;
}

function veIconChat() {
  if (window.lucide) window.lucide.createIcons();
}

function cuonXuongCuoi() {
  const khung = document.getElementById('hoi-dap-log');
  if (khung) khung.scrollTop = khung.scrollHeight;
}

function veTheSanPham(danhSach) {
  if (!Array.isArray(danhSach) || !danhSach.length) return null;
  const ds = document.createElement('div');
  ds.className = 'ask-product-list';
  danhSach.slice(0, 6).forEach((sp) => {
    if (!sp?.productId) return;
    const the = document.createElement('div');
    the.className = 'ask-product-card';
    const anh = sp.anh ? duongDanTapTin(sp.anh) : '';
    const anhHtml = anh
      ? `<img src="${chuoiAnToan(anh)}" alt="" loading="lazy" onerror="this.className='ask-product-placeholder';this.removeAttribute('src')" />`
      : '<div class="ask-product-placeholder" aria-hidden="true"></div>';
    the.innerHTML = `
      ${anhHtml}
      <div class="ask-product-meta">
        <p class="ask-product-name">${chuoiAnToan(sp.ten || 'Sản phẩm')}</p>
        <p class="ask-product-price">${chuoiAnToan(dinhDangTien(sp.giaBan))}</p>
      </div>
      <a class="ask-product-xem" href="${chuoiAnToan(duongDanTrang('product.html', { id: sp.productId }))}">Xem</a>`;
    ds.appendChild(the);
  });
  return ds.children.length ? ds : null;
}

function themTinNhan(vaiTro, noiDung, tuyChon = {}) {
  const khung = document.getElementById('hoi-dap-log');
  const bai = document.createElement('div');
  bai.className = `ask-msg ${vaiTro === 'user' ? 'ask-msg-user' : 'ask-msg-bot'}`;
  if (tuyChon.id) bai.id = tuyChon.id;

  if (tuyChon.dangGo) {
    bai.innerHTML = '<div class="ask-typing" aria-label="Đang gõ"><span></span><span></span><span></span></div>';
  } else {
    const vanBan = document.createElement('p');
    vanBan.className = 'ask-msg-text';
    vanBan.textContent = noiDung || '';
    bai.appendChild(vanBan);

    if (Array.isArray(tuyChon.daTraCuu) && tuyChon.daTraCuu.length) {
      const nguon = document.createElement('p');
      nguon.className = 'ask-tools';
      nguon.textContent = `Đã tra cứu: ${tuyChon.daTraCuu.join(', ')}`;
      bai.appendChild(nguon);
    }

    const theSp = veTheSanPham(tuyChon.sanPham);
    if (theSp) bai.appendChild(theSp);
  }

  khung.appendChild(bai);
  cuonXuongCuoi();
  return bai;
}

function xoaTinDangGo() {
  document.getElementById('tin-dang-go')?.remove();
}

function ganGoiY() {
  const goiY = ['Tìm bút bi', 'Chính sách đổi trả', 'Đơn hàng của tôi'];
  if (layProductId()) {
    goiY.unshift('Sản phẩm này còn hàng không?');
  }

  const khung = document.getElementById('goi-y-hoi-dap');
  khung.replaceChildren();
  goiY.forEach((cau) => {
    const nut = document.createElement('button');
    nut.type = 'button';
    nut.className = 'chip chip-button chip-neutral';
    nut.textContent = cau;
    nut.addEventListener('click', () => {
      document.getElementById('cau-hoi').value = cau;
      document.getElementById('form-hoi-dap').requestSubmit();
    });
    khung.appendChild(nut);
  });
}

async function guiCauHoi(cauHoi) {
  if (dangHoi) return;
  const noiDung = String(cauHoi || '').trim();
  if (!noiDung) return;

  dangHoi = true;
  const nut = document.getElementById('nut-hoi');
  const oNhap = document.getElementById('cau-hoi');
  nut.disabled = true;
  oNhap.disabled = true;
  themTinNhan('user', noiDung);
  oNhap.value = '';
  themTinNhan('assistant', '', { id: 'tin-dang-go', dangGo: true });

  try {
    const ketQua = await api.post('/assistant/chat', {
      message: noiDung,
      productId: layProductId(),
      history: lichSuHoiDap.slice(-8),
    });
    xoaTinDangGo();
    const traLoi = ketQua?.answer || 'Mình chưa trả lời được câu này.';
    themTinNhan('assistant', traLoi, {
      daTraCuu: ketQua?.daTraCuu,
      sanPham: ketQua?.sanPham,
    });
    lichSuHoiDap.push({ role: 'user', content: noiDung }, { role: 'assistant', content: traLoi });
  } catch (loi) {
    xoaTinDangGo();
    const msg = loi?.response?.data?.message;
    const text = Array.isArray(msg) ? msg.join(', ') : msg || 'Không hỏi được lúc này';
    themTinNhan('assistant', text);
  } finally {
    dangHoi = false;
    nut.disabled = false;
    oNhap.disabled = false;
    oNhap.focus();
  }
}

function moHop(mo) {
  const hop = document.getElementById('hop-chat');
  const nut = document.getElementById('nut-chat-bot');
  const dock = document.getElementById('chat-dock');
  hop.hidden = !mo;
  nut.hidden = mo;
  nut.setAttribute('aria-expanded', mo ? 'true' : 'false');
  dock.classList.toggle('chat-dock-mo', mo);
  document.body.classList.toggle('chat-mo', mo);
  veIconChat();
  if (mo) {
    cuonXuongCuoi();
    document.getElementById('cau-hoi').focus();
  }
}

/** Gắn nút tròn góc phải. Gọi lại nhiều lần thì không tạo thêm nút. */
export function ganHopThoai() {
  if (document.getElementById('nut-chat-bot')) return;

  const goc = document.createElement('div');
  goc.className = 'chat-dock';
  goc.id = 'chat-dock';
  goc.innerHTML = `
    <section class="chat-panel" id="hop-chat" hidden aria-label="Trợ lý Folio & Quill">
      <div class="chat-panel-head">
        <h2 class="chat-panel-title"><i data-lucide="message-circle"></i> Trợ lý Folio & Quill</h2>
        <button type="button" class="icon-btn" id="nut-dong-chat" aria-label="Thu nhỏ khung chat" title="Thu nhỏ">
          <i data-lucide="chevron-down"></i>
        </button>
      </div>
      <div class="ask-log" id="hoi-dap-log" role="log" aria-live="polite"></div>
      <div class="ask-suggestions" id="goi-y-hoi-dap"></div>
      <form class="ask-form" id="form-hoi-dap">
        <input id="cau-hoi" class="form-input" type="text" maxlength="500" autocomplete="off"
          placeholder="Nhập câu hỏi..." aria-label="Câu hỏi cho trợ lý" />
        <button type="submit" id="nut-hoi" class="btn btn-primary" aria-label="Gửi">
          <i data-lucide="send"></i>
        </button>
      </form>
    </section>
    <button type="button" id="nut-chat-bot" class="chat-launcher" aria-expanded="false"
      aria-controls="hop-chat" title="Hỏi trợ lý" aria-label="Mở trợ lý chat">
      <i data-lucide="message-circle"></i>
    </button>`;

  document.body.appendChild(goc);
  ganGoiY();
  themTinNhan(
    'assistant',
    'Xin chào! Mình có thể giúp bạn tìm sản phẩm, xem chính sách đổi trả hoặc theo dõi đơn hàng.',
  );
  veIconChat();

  document.getElementById('nut-chat-bot').addEventListener('click', () => moHop(true));
  document.getElementById('nut-dong-chat').addEventListener('click', () => moHop(false));
  document.getElementById('form-hoi-dap').addEventListener('submit', (suKien) => {
    suKien.preventDefault();
    guiCauHoi(document.getElementById('cau-hoi').value);
  });
  document.addEventListener('keydown', (suKien) => {
    if (suKien.key === 'Escape' && !document.getElementById('hop-chat').hidden) moHop(false);
  });
}
