import { api } from '../api.js';
import { fileUrl } from '../config.js';
import { fmtVND, fmtDate, esc } from '../format.js';
import { cart } from '../cart.js';
import { auth } from '../auth.js';
import { toast } from '../toast.js';
import { mountCustomerChrome, icons, requireAuth } from '../layout.js';
import { bindLiveClear, guardForm } from '../validate.js';

const app = document.getElementById('app');
const user = auth.getUser();

const form = {
  shippingName: user?.fullName || '',
  shippingPhone: '',
  shippingAddressLine: '',
  provinceId: '',
  toDistrictId: '',
  toWardCode: '',
  shippingProvince: '',
  shippingDistrict: '',
  shippingWard: '',
  note: '',
};

let provinces = [];
let districts = [];
let wards = [];
let voucherCode = '';
let appliedVoucher = null;
let availableVouchers = [];
let vouchersLoading = false;
let shippingFee = 0;
let quoteLoading = false;
let submitting = false;

const subtotal = () => cart.total();

function shell() {
  app.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center gap-3"><i data-lucide="credit-card" class="text-primary" style="width:24px;height:24px"></i><h1 class="section-title">Thanh toán</h1></div>
      <form id="checkout-form" class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
        <div class="card p-6 space-y-4">
          <h2 class="font-bold flex items-center gap-2"><i data-lucide="map-pin" class="text-primary" style="width:18px;height:18px"></i> Thông tin giao hàng (GHN)</h2>
          <div class="grid gap-3 md:grid-cols-2">
            <div><label class="field-label">Họ tên người nhận</label>
              <div class="input-wrap"><i data-lucide="user" class="input-icon" style="width:16px;height:16px"></i><input id="shippingName" class="input pl-10" required value="${esc(form.shippingName)}" /></div></div>
            <div><label class="field-label">Số điện thoại</label>
              <div class="input-wrap"><i data-lucide="phone" class="input-icon" style="width:16px;height:16px"></i><input id="shippingPhone" class="input pl-10" required /></div></div>
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <div><label class="field-label">Tỉnh / Thành phố</label><select id="province" class="input" required><option value="">-- Chọn tỉnh --</option></select></div>
            <div><label class="field-label">Quận / Huyện</label><select id="district" class="input" required disabled><option value="">-- Chọn quận --</option></select></div>
            <div><label class="field-label">Phường / Xã</label><select id="ward" class="input" required disabled><option value="">-- Chọn phường --</option></select></div>
          </div>
          <div><label class="field-label">Số nhà, tên đường</label><textarea id="addressLine" class="input" rows="2" required placeholder="VD: 123 Nguyễn Trãi"></textarea></div>
          <div><label class="field-label flex items-center gap-1"><i data-lucide="file-text" style="width:14px;height:14px"></i> Ghi chú (tùy chọn)</label><textarea id="note" class="input" rows="2" placeholder="Ghi chú cho người giao hàng..."></textarea></div>
        </div>

        <div class="card p-6 space-y-2">
          <h2 class="font-bold flex items-center gap-2"><i data-lucide="wallet" class="text-primary" style="width:18px;height:18px"></i> Phương thức thanh toán</h2>
          <p class="text-sm flex items-center gap-2"><i data-lucide="banknote" style="width:16px;height:16px"></i> <span><b>COD</b> — Thanh toán tiền mặt khi nhận hàng</span></p>
        </div>
        </div>

        <div class="card-elevated p-6 h-fit lg:sticky">
          <h3 class="font-bold flex items-center gap-2 mb-4"><i data-lucide="package" class="text-primary" style="width:18px;height:18px"></i> Đơn hàng của bạn</h3>
          <div id="summary-items" class="space-y-3 overflow-y-auto" style="max-height:18rem;padding-right:.25rem"></div>
          <div class="border-t mt-4 pt-4 space-y-2 text-sm">
            <div class="font-semibold flex items-center gap-2 mb-2"><i data-lucide="ticket" class="text-primary" style="width:16px;height:16px"></i> Mã giảm giá</div>
            <div id="voucher-area"></div>
          </div>
          <div class="border-t mt-4 pt-4 space-y-2 text-sm" id="totals"></div>
          <button type="submit" id="submit-btn" class="btn btn-primary btn-block btn-lg mt-5">Đặt hàng</button>
        </div>
      </form>
    </div>`;
}

function renderSummaryItems() {
  const el = document.getElementById('summary-items');
  el.innerHTML = cart.items
    .map((item) => {
      const price = Number(item.product.discountPrice) > 0 ? Number(item.product.discountPrice) : Number(item.product.price);
      const stock = item.product.inventory?.quantity ?? 0;
      return `<div class="flex gap-3 text-sm">
        <img src="${fileUrl(item.product.images?.[0])}" style="width:3rem;height:3rem;border-radius:.5rem;object-fit:cover;background:var(--surface-low);flex-shrink:0" />
        <div class="flex-1 min-w-0"><div class="font-semibold truncate">${esc(item.product.name)}</div><div class="text-xs muted">SL: ${item.quantity} · Tồn kho: ${stock}</div></div>
        <div class="font-bold" style="white-space:nowrap">${fmtVND(price * item.quantity)}</div>
      </div>`;
    })
    .join('');
}

function renderVoucher() {
  const el = document.getElementById('voucher-area');
  if (appliedVoucher) {
    el.innerHTML = `<div class="flex items-center justify-between gap-2 p-3 rounded-lg" style="background:rgba(213,245,223,.4);border:1px solid rgba(22,163,74,.2)">
      <div><div class="font-mono font-bold text-success">${esc(appliedVoucher.code)}</div><div class="text-xs muted">Giảm ${fmtVND(appliedVoucher.discountAmount)}</div></div>
      <button type="button" id="clear-voucher" class="icon-btn" title="Gỡ mã"><i data-lucide="x" style="width:16px;height:16px"></i></button>
    </div>`;
    document.getElementById('clear-voucher').addEventListener('click', () => {
      appliedVoucher = null;
      voucherCode = '';
      renderVoucher();
      renderTotals();
    });
  } else {
    const list = vouchersLoading
      ? '<p class="text-xs muted">Đang tải mã giảm giá...</p>'
      : availableVouchers.length === 0
        ? '<p class="text-xs muted">Hiện chưa có mã giảm giá nào.</p>'
        : `<div class="space-y-2 overflow-y-auto" style="max-height:10rem;padding-right:.25rem">${availableVouchers
            .map(
              (v) => `<button type="button" data-voucher="${esc(v.code)}" ${!v.canApply ? 'disabled' : ''} class="w-full text-left p-3 rounded-lg" style="border:1px solid ${v.canApply ? 'rgba(0,90,180,.3)' : 'rgba(193,198,213,.5)'};background:${v.canApply ? 'rgba(214,227,255,.2)' : 'rgba(241,243,252,.5)'};${v.canApply ? 'cursor:pointer' : 'opacity:.7;cursor:not-allowed'}">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-mono font-bold text-primary">${esc(v.code)}</div>
                    <div class="text-xs muted mt-1">${esc(v.discountLabel)}</div>
                    <div class="text-xs muted mt-1">${v.minOrderAmount > 0 ? `Đơn tối thiểu ${fmtVND(v.minOrderAmount)} · ` : ''}HSD: ${fmtDate(v.endDate)}</div>
                    ${!v.canApply && v.reason ? `<div class="text-xs text-error mt-1">${esc(v.reason)}</div>` : ''}
                  </div>
                  ${v.canApply ? `<div class="text-right shrink-0"><div class="text-xs font-bold text-success">-${fmtVND(v.estimatedDiscount)}</div></div>` : ''}
                </div>
              </button>`,
            )
            .join('')}</div>`;
    el.innerHTML = `<div class="space-y-3">
      <div class="flex gap-2">
        <input id="voucher-input" class="input uppercase" placeholder="Nhập mã voucher" value="${esc(voucherCode)}" />
        <button type="button" id="apply-voucher" class="btn btn-outline shrink-0">Áp dụng</button>
      </div>
      <div><p class="text-xs font-semibold muted mb-2">Mã khả dụng — chọn để áp dụng</p>${list}</div>
    </div>`;
    document.getElementById('apply-voucher').addEventListener('click', () => {
      voucherCode = document.getElementById('voucher-input').value.trim().toUpperCase();
      applyVoucher(voucherCode);
    });
    el.querySelectorAll('[data-voucher]').forEach((b) => b.addEventListener('click', () => applyVoucher(b.dataset.voucher)));
  }
  icons();
}

function renderTotals() {
  const el = document.getElementById('totals');
  const discount = appliedVoucher?.discountAmount ?? 0;
  const afterDiscount = appliedVoucher?.finalAmount ?? subtotal();
  const finalTotal = afterDiscount + shippingFee;
  el.innerHTML = `
    <div class="flex justify-between"><span class="muted">Tạm tính</span><span class="font-semibold">${fmtVND(subtotal())}</span></div>
    ${discount > 0 ? `<div class="flex justify-between text-success"><span>Giảm giá voucher</span><span class="font-semibold">-${fmtVND(discount)}</span></div>` : ''}
    <div class="flex justify-between items-center"><span class="muted flex items-center gap-1"><i data-lucide="truck" style="width:14px;height:14px"></i> Vận chuyển (GHN)</span><span class="font-semibold">${quoteLoading ? 'Đang tính...' : form.toWardCode ? fmtVND(shippingFee) : 'Chọn địa chỉ'}</span></div>
    <div class="divider"></div>
    <div class="flex justify-between items-baseline"><span class="font-bold">Tổng</span><span class="text-2xl font-extrabold text-primary">${fmtVND(finalTotal)}</span></div>`;
  icons();
}

async function applyVoucher(code) {
  code = (code || '').trim().toUpperCase();
  if (!code) return toast.error('Nhập mã voucher');
  const vCheck = guardForm([{ id: 'voucher-input', label: 'Mã voucher', value: code, rules: ['voucherCode'] }]);
  if (!vCheck) return toast.error('Mã voucher không hợp lệ');
  try {
    const data = await api.post('/vouchers/validate', { code, subtotal: subtotal() });
    appliedVoucher = data;
    voucherCode = data.code.toUpperCase();
    toast.success(`Áp dụng mã ${data.code} thành công`);
  } catch (err) {
    const msg = err?.response?.data?.message;
    toast.error(Array.isArray(msg) ? msg[0] : msg || 'Mã voucher không hợp lệ');
    appliedVoucher = null;
  }
  renderVoucher();
  renderTotals();
}

async function loadAvailableVouchers() {
  if (subtotal() <= 0) {
    availableVouchers = [];
    renderVoucher();
    return;
  }
  vouchersLoading = true;
  renderVoucher();
  try {
    availableVouchers = await api.get('/vouchers/available', { params: { subtotal: subtotal() } });
  } catch {
    availableVouchers = [];
  }
  vouchersLoading = false;
  renderVoucher();
}

async function quote() {
  if (!form.toDistrictId || !form.toWardCode || cart.items.length === 0) {
    shippingFee = 0;
    renderTotals();
    return;
  }
  quoteLoading = true;
  renderTotals();
  try {
    const data = await api.post('/shipping/quote', {
      toDistrictId: Number(form.toDistrictId),
      toWardCode: form.toWardCode,
      items: cart.items.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
    });
    shippingFee = data.total || 0;
  } catch (err) {
    shippingFee = 0;
    const msg = err?.response?.data?.message;
    if (msg) toast.error(typeof msg === 'string' ? msg : 'Không tính được phí vận chuyển');
  }
  quoteLoading = false;
  renderTotals();
}

function fillSelect(id, opts, valueKey, labelKey, placeholder) {
  const sel = document.getElementById(id);
  sel.innerHTML =
    `<option value="">${placeholder}</option>` +
    opts.map((o) => `<option value="${o[valueKey]}">${esc(o[labelKey])}</option>`).join('');
}

function bind() {
  document.getElementById('shippingName').addEventListener('input', (e) => (form.shippingName = e.target.value));
  document.getElementById('shippingPhone').addEventListener('input', (e) => (form.shippingPhone = e.target.value));
  document.getElementById('addressLine').addEventListener('input', (e) => (form.shippingAddressLine = e.target.value));
  document.getElementById('note').addEventListener('input', (e) => (form.note = e.target.value));

  document.getElementById('province').addEventListener('change', async (e) => {
    const provinceId = e.target.value;
    const p = provinces.find((x) => String(x.ProvinceID) === provinceId);
    form.provinceId = provinceId;
    form.shippingProvince = p?.ProvinceName || '';
    form.toDistrictId = '';
    form.toWardCode = '';
    form.shippingDistrict = '';
    form.shippingWard = '';
    wards = [];
    document.getElementById('ward').disabled = true;
    fillSelect('ward', [], 'WardCode', 'WardName', '-- Chọn phường --');
    if (!provinceId) {
      districts = [];
      document.getElementById('district').disabled = true;
      fillSelect('district', [], 'DistrictID', 'DistrictName', '-- Chọn quận --');
      quote();
      return;
    }
    try {
      districts = (await api.get('/shipping/districts', { params: { provinceId } })) || [];
    } catch {
      districts = [];
    }
    fillSelect('district', districts, 'DistrictID', 'DistrictName', '-- Chọn quận --');
    document.getElementById('district').disabled = false;
    quote();
  });

  document.getElementById('district').addEventListener('change', async (e) => {
    const districtId = e.target.value;
    const d = districts.find((x) => String(x.DistrictID) === districtId);
    form.toDistrictId = districtId;
    form.shippingDistrict = d?.DistrictName || '';
    form.toWardCode = '';
    form.shippingWard = '';
    if (!districtId) {
      wards = [];
      document.getElementById('ward').disabled = true;
      fillSelect('ward', [], 'WardCode', 'WardName', '-- Chọn phường --');
      quote();
      return;
    }
    try {
      wards = (await api.get('/shipping/wards', { params: { districtId } })) || [];
    } catch {
      wards = [];
    }
    fillSelect('ward', wards, 'WardCode', 'WardName', '-- Chọn phường --');
    document.getElementById('ward').disabled = false;
    quote();
  });

  document.getElementById('ward').addEventListener('change', (e) => {
    const wardCode = e.target.value;
    const w = wards.find((x) => x.WardCode === wardCode);
    form.toWardCode = wardCode;
    form.shippingWard = w?.WardName || '';
    quote();
  });

  document.getElementById('checkout-form').addEventListener('submit', submit);
  bindLiveClear(document.getElementById('checkout-form'));
}

async function submit(e) {
  e.preventDefault();
  if (submitting) return;
  if (cart.items.length === 0) return toast.error('Giỏ hàng trống');

  const formEl = document.getElementById('checkout-form');
  const check = guardForm(
    [
      { id: 'shippingName', label: 'Họ tên người nhận', rules: ['required', 'minLength:2', 'maxLength:100'] },
      { id: 'shippingPhone', label: 'Số điện thoại', rules: ['required', 'phone'] },
      { id: 'province', label: 'Tỉnh/Thành phố', rules: ['select'] },
      { id: 'district', label: 'Quận/Huyện', rules: ['select'] },
      { id: 'ward', label: 'Phường/Xã', rules: ['select'] },
      { id: 'addressLine', label: 'Địa chỉ chi tiết', rules: ['required', 'minLength:5', 'maxLength:255'] },
      { id: 'note', label: 'Ghi chú', rules: ['maxLength:500'] },
    ],
    formEl,
    toast,
  );
  if (!check) return;

  form.shippingName = check.values.shippingName.trim();
  form.shippingPhone = check.values.shippingPhone.trim().replace(/\s/g, '');
  form.shippingAddressLine = check.values.addressLine.trim();
  form.note = (check.values.note || '').trim();

  if (!form.toDistrictId || !form.toWardCode) return toast.error('Vui lòng chọn đầy đủ Tỉnh/Quận/Phường');
  if (shippingFee <= 0 && !quoteLoading) return toast.error('Không tính được phí vận chuyển. Kiểm tra lại địa chỉ.');
  submitting = true;
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';
  try {
    const payload = {
      shippingName: form.shippingName,
      shippingPhone: form.shippingPhone,
      shippingAddressLine: form.shippingAddressLine,
      toDistrictId: Number(form.toDistrictId),
      toWardCode: form.toWardCode,
      shippingProvince: form.shippingProvince,
      shippingDistrict: form.shippingDistrict,
      shippingWard: form.shippingWard,
      note: form.note,
      items: cart.items.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
      paymentMethod: 'COD',
    };
    if (appliedVoucher?.code) payload.voucherCode = appliedVoucher.code;
    const data = await api.post('/orders', payload);
    await cart.fetch();
    toast.success('Đặt hàng thành công');
    location.href = `order-detail?id=${data.id}`;
  } catch (err) {
    const msg = err?.response?.data?.message;
    toast.error(Array.isArray(msg) ? msg[0] : msg || 'Đặt hàng thất bại');
    submitting = false;
    btn.disabled = false;
    btn.textContent = 'Đặt hàng';
  }
}

async function init() {
  if (!requireAuth()) return;
  mountCustomerChrome('');
  shell();
  bind();
  icons();
  try {
    await cart.fetch();
  } catch {
    /* ignore */
  }
  renderSummaryItems();
  renderTotals();
  try {
    provinces = (await api.get('/shipping/provinces')) || [];
    fillSelect('province', provinces, 'ProvinceID', 'ProvinceName', '-- Chọn tỉnh --');
  } catch {
    toast.error('Không tải được danh sách tỉnh/thành');
  }
  loadAvailableVouchers();
}

init();
