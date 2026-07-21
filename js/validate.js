/** Tiện ích kiểm tra ràng buộc form — dùng chung toàn bộ frontend. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const VOUCHER_RE = /^[A-Z0-9_-]{2,30}$/;

function str(v) {
  return v == null ? '' : String(v).trim();
}

function num(v) {
  if (v === '' || v == null) return NaN;
  return Number(v);
}

function fieldWrap(input) {
  return (
    input.closest('.field') ||
    input.closest('.input-wrap')?.parentElement ||
    input.parentElement
  );
}

function runRule(rule, value, ctx) {
  const colon = rule.indexOf(':');
  const name = colon >= 0 ? rule.slice(0, colon) : rule;
  const param = colon >= 0 ? rule.slice(colon + 1) : null;
  const label = ctx.label || 'Trường này';
  const s = typeof value === 'string' ? value : value == null ? '' : String(value);

  switch (name) {
    case 'required':
      if (str(s) === '') return `${label} là bắt buộc`;
      break;
    case 'email':
      if (str(s) && !EMAIL_RE.test(str(s))) return `${label} không hợp lệ`;
      break;
    case 'minLength': {
      const n = Number(param);
      if (str(s).length < n) return `${label} phải có ít nhất ${n} ký tự`;
      break;
    }
    case 'maxLength': {
      const n = Number(param);
      if (str(s).length > n) return `${label} tối đa ${n} ký tự`;
      break;
    }
    case 'phone':
      if (str(s) && !PHONE_RE.test(str(s).replace(/\s/g, ''))) {
        return `${label} không hợp lệ (VD: 0912345678)`;
      }
      break;
    case 'number': {
      const n = num(s);
      if (str(s) !== '' && Number.isNaN(n)) return `${label} phải là số`;
      break;
    }
    case 'integer': {
      const n = num(s);
      if (str(s) !== '' && (!Number.isInteger(n) || Number.isNaN(n))) {
        return `${label} phải là số nguyên`;
      }
      break;
    }
    case 'min': {
      const n = num(s);
      const min = Number(param);
      if (str(s) !== '' && (Number.isNaN(n) || n < min)) {
        return `${label} phải ≥ ${min.toLocaleString('vi-VN')}`;
      }
      break;
    }
    case 'max': {
      const n = num(s);
      const max = Number(param);
      if (str(s) !== '' && (Number.isNaN(n) || n > max)) {
        return `${label} phải ≤ ${max.toLocaleString('vi-VN')}`;
      }
      break;
    }
    case 'percent': {
      const n = num(s);
      if (str(s) !== '' && (Number.isNaN(n) || n <= 0 || n > 100)) {
        return `${label} phải từ 1 đến 100`;
      }
      break;
    }
    case 'match': {
      const other = ctx.values?.[param] ?? document.getElementById(param)?.value ?? '';
      if (s !== other) return `${label} không khớp`;
      break;
    }
    case 'lteField': {
      const other = num(ctx.values?.[param] ?? document.getElementById(param)?.value);
      const n = num(s);
      if (str(s) !== '' && !Number.isNaN(other) && !Number.isNaN(n) && n > other) {
        return `${label} không được lớn hơn giá gốc`;
      }
      break;
    }
    case 'dateAfter': {
      const start = ctx.values?.[param] ?? document.getElementById(param)?.value;
      if (s && start && new Date(s) <= new Date(start)) {
        return `${label} phải sau ngày bắt đầu`;
      }
      break;
    }
    case 'voucherCode':
      if (str(s) && !VOUCHER_RE.test(str(s).toUpperCase())) {
        return `${label} chỉ gồm chữ, số, gạch ngang (2–30 ký tự)`;
      }
      break;
    case 'select':
      if (!str(s)) return `Vui lòng chọn ${label.toLowerCase()}`;
      break;
    default:
      break;
  }
  return null;
}

/** @param {Array<{id:string, label?:string, value?:any, rules?:string[]}>} fields */
export function validateFields(fields) {
  const values = {};
  const errors = [];

  for (const f of fields) {
    const raw = f.value !== undefined ? f.value : document.getElementById(f.id)?.value;
    values[f.id] = raw;
    for (const rule of f.rules || []) {
      const msg = runRule(rule, raw, { ...f, values });
      if (msg) {
        errors.push({ id: f.id, message: msg });
        break;
      }
    }
  }

  if (errors.length) return { ok: false, errors, values };
  return { ok: true, values };
}

export function showErrors(errors, root) {
  clearErrors(root);
  for (const e of errors) {
    const input = document.getElementById(e.id);
    if (!input) continue;
    input.classList.add('input-invalid');
    input.setAttribute('aria-invalid', 'true');
    const wrap = fieldWrap(input);
    if (!wrap) continue;
    let err = wrap.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      wrap.appendChild(err);
    }
    err.textContent = e.message;
  }
}

export function clearErrors(root) {
  const scope = root || document;
  scope.querySelectorAll('.input-invalid').forEach((el) => {
    el.classList.remove('input-invalid');
    el.removeAttribute('aria-invalid');
  });
  scope.querySelectorAll('.field-error').forEach((el) => el.remove());
}

/** Xóa lỗi khi người dùng sửa input. */
export function bindLiveClear(root) {
  if (!root) return;
  root.querySelectorAll('input, select, textarea').forEach((el) => {
    const handler = () => {
      el.classList.remove('input-invalid');
      el.removeAttribute('aria-invalid');
      fieldWrap(el)?.querySelector('.field-error')?.remove();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

/** Kiểm tra nhanh: hiện lỗi + toast, trả về false nếu không hợp lệ. */
export function guardForm(fields, root, toast) {
  const result = validateFields(fields);
  if (result.ok) return result;
  showErrors(result.errors, root);
  if (toast) toast.error(result.errors[0].message);
  return false;
}
