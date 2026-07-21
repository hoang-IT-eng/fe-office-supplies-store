// Toast đơn giản thay cho react-hot-toast.
function ensureRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  return root;
}

function show(message, type = 'info', duration = 3000, icon = '') {
  const root = ensureRoot();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon ? `<span>${icon}</span>` : ''}<span>${message}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .2s';
    setTimeout(() => el.remove(), 200);
  }, duration);
}

export const toast = {
  success: (m, d) => show(m, 'success', d),
  error: (m, d) => show(m, 'error', d),
  info: (m, d, icon) => show(m, 'info', d, icon),
};
