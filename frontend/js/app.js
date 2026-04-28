// ============================================================
// futsal-app.js — Shared Utilities & API Layer
// ============================================================

const API = 'http://localhost:8080/api';

// ── Session Helpers ──────────────────────────────────────────
const Auth = {
  save(user) {
    localStorage.setItem('futsal_user', JSON.stringify(user));
  },
  get() {
    const raw = localStorage.getItem('futsal_user');
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn() { return !!this.get(); },
  isAdmin()    { return this.get()?.role === 'ADMIN'; },
  logout() {
    localStorage.removeItem('futsal_user');
    window.location.href = '../index.html';
  },
  requireLogin(adminOnly = false) {
    const user = this.get();
    if (!user) { window.location.href = '../pages/login.html'; return false; }
    if (adminOnly && user.role !== 'ADMIN') { window.location.href = '../pages/dashboard.html'; return false; }
    return true;
  }
};

// ── API Helper ───────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Network error. Is the server running?');
  }
}

// ── User API ─────────────────────────────────────────────────
const UserAPI = {
  register: (user) => apiFetch('/users/register', { method: 'POST', body: JSON.stringify(user) }),
  login:    (email, password) => apiFetch('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getAll:   () => apiFetch('/users'),
  getById:  (id) => apiFetch(`/users/${id}`),
  update:   (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:   (id) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
};

// ── Slot API ─────────────────────────────────────────────────
const SlotAPI = {
  getAvailable: () => apiFetch('/slots'),
  getAll:       () => apiFetch('/slots/all'),
  getById:      (id) => apiFetch(`/slots/${id}`),
  add:          (slot) => apiFetch('/slots', { method: 'POST', body: JSON.stringify(slot) }),
  update:       (id, slot) => apiFetch(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(slot) }),
  delete:       (id) => apiFetch(`/slots/${id}`, { method: 'DELETE' }),
};

// ── Booking API ──────────────────────────────────────────────
const BookingAPI = {
  create:        (userId, slotId, notes) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify({ userId, slotId, notes }) }),
  getAll:        () => apiFetch('/bookings'),
  getByUser:     (userId) => apiFetch(`/bookings/user/${userId}`),
  getById:       (id) => apiFetch(`/bookings/${id}`),
  updateStatus:  (id, status) => apiFetch(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete:        (id) => apiFetch(`/bookings/${id}`, { method: 'DELETE' }),
};

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Format Helpers ───────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NP', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateTime(dtStr) {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  return d.toLocaleString('en-NP', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    CANCELLED: 'badge-cancelled',
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function calculateDuration(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins >= 60) return `${Math.floor(mins/60)}h ${mins%60 > 0 ? mins%60+'m' : ''}`.trim();
  return `${mins} min`;
}

// ── Navbar ───────────────────────────────────────────────────
function renderNavbar(activePage = '') {
  const user = Auth.get();
  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  const basePath = window.location.pathname.includes('/pages/') ? '../' : './';

  let links = '';
  if (user) {
    if (user.role === 'ADMIN') {
      links = `
        <a href="${basePath}pages/admin-dashboard.html" class="nav-link ${activePage==='admin'?'active':''}">Dashboard</a>
        <a href="${basePath}pages/admin-slots.html" class="nav-link ${activePage==='slots'?'active':''}">Slots</a>
        <a href="${basePath}pages/admin-bookings.html" class="nav-link ${activePage==='bookings'?'active':''}">Bookings</a>
        <a href="${basePath}pages/admin-users.html" class="nav-link ${activePage==='users'?'active':''}">Users</a>
      `;
    } else {
      links = `
        <a href="${basePath}pages/dashboard.html" class="nav-link ${activePage==='dashboard'?'active':''}">Dashboard</a>
        <a href="${basePath}pages/slots.html" class="nav-link ${activePage==='slots'?'active':''}">Book a Slot</a>
        <a href="${basePath}pages/my-bookings.html" class="nav-link ${activePage==='bookings'?'active':''}">My Bookings</a>
      `;
    }
  } else {
    links = `
      <a href="${basePath}pages/login.html" class="nav-link">Login</a>
      <a href="${basePath}pages/register.html" class="nav-btn">Register</a>
    `;
  }

  const userSection = user ? `
    <div class="nav-user">
      <div class="nav-avatar">${user.name.charAt(0).toUpperCase()}</div>
      <span>${user.name.split(' ')[0]}</span>
      <button onclick="Auth.logout()" class="nav-link btn-secondary btn-sm">Logout</button>
    </div>
  ` : '';

  navEl.innerHTML = `
    <div class="navbar-inner">
      <a href="${basePath}index.html" class="navbar-brand" style="text-decoration:none">
        <div class="logo-icon">⚽</div>
        Futsal<span>Book</span>
      </a>
      <div class="navbar-links">
        ${links}
        ${userSection}
      </div>
    </div>
  `;
}

// ── Confirm Dialog ───────────────────────────────────────────
function showConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirmModal');
  const msgEl = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmOk');
  if (!overlay) return;
  msgEl.textContent = message;
  overlay.classList.add('show');
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.onclick = () => { overlay.classList.remove('show'); onConfirm(); };
  document.getElementById('confirmCancel').onclick = () => overlay.classList.remove('show');
}

// ── Global Confirm Modal HTML ────────────────────────────────
function injectConfirmModal() {
  const html = `
    <div id="confirmModal" class="modal-overlay">
      <div class="modal" style="max-width:380px">
        <div class="modal-header">
          <h3>Confirm Action</h3>
          <button class="modal-close" onclick="document.getElementById('confirmModal').classList.remove('show')">✕</button>
        </div>
        <div class="modal-body">
          <p id="confirmMessage" style="color:var(--muted);font-size:15px;"></p>
        </div>
        <div class="modal-footer">
          <button id="confirmCancel" class="btn btn-secondary">Cancel</button>
          <button id="confirmOk" class="btn btn-danger">Confirm</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Auto-inject confirm modal on page load
document.addEventListener('DOMContentLoaded', injectConfirmModal);
