/* ═══════════════════════════════════════════════════════
   sidebar.js — Shared logic for all dashboard pages
   · Auth guard
   · Sidebar rendering
   · Mobile toggle
   · Toast notifications
   · localStorage helpers
═══════════════════════════════════════════════════════ */

/* ── AUTH GUARD ── */
/* Call this at the top of every dashboard page */
function requireLogin() {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/* ── GET / SAVE USER DATA ── */
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function getUserData(username) {
  const users = getUsers();
  if (!users[username]) {
    users[username] = { password: '', expenses: [], budget: 0 };
    localStorage.setItem('users', JSON.stringify(users));
  }
  return users[username];
}

function saveUserData(username, data) {
  const users = getUsers();
  users[username] = data;
  localStorage.setItem('users', JSON.stringify(users));
}

/* ── LOGOUT ── */
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

/* ── RENDER SIDEBAR ── */
function renderSidebar(activePage) {
  const username = requireLogin();
  if (!username) return;

  const initial = username.charAt(0).toUpperCase();

  const pages = [
    { href: 'index.html',   icon: '📊', label: 'Dashboard', key: 'dashboard' },
    { href: 'charts.html',  icon: '📈', label: 'Charts',    key: 'charts'    },
    { href: 'reports.html', icon: '📄', label: 'Reports',   key: 'reports'   },
  ];

  const navLinks = pages.map(p => `
    <a href="${p.href}" class="nav-link ${activePage === p.key ? 'active' : ''}">
      <span class="nav-icon">${p.icon}</span>
      ${p.label}
    </a>
  `).join('');

  const sidebarHTML = `
    <!-- Decorative top stripe rendered via ::before in CSS -->
    <div class="sidebar-brand">
      <div class="brand-logo">
        <span class="logo-icon">💰</span> SpendWise
      </div>
      <div class="brand-sub">Smart Finance Tracker</div>
    </div>

    <div class="sidebar-user">
      <div class="user-avatar">${initial}</div>
      <div class="user-greet">Welcome back</div>
      <div class="user-name">${username}</div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      ${navLinks}
      <div class="nav-section-label" style="margin-top:auto;padding-top:20px;">Account</div>
      <a href="#" class="nav-link danger" onclick="logout(); return false;">
        <span class="nav-icon">🚪</span> Logout
      </a>
    </nav>

    <div class="sidebar-footer">
      v1.0 · SpendWise © 2025
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = sidebarHTML;

  /* Mobile overlay toggle */
  const mobBtn     = document.getElementById('mob-btn');
  const overlay    = document.getElementById('sidebar-overlay');

  if (mobBtn) {
    mobBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

/* ── TOAST NOTIFICATIONS ── */
let toastTimer = null;

function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast t-${type}`;
  // force reflow
  void toast.offsetWidth;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── CATEGORY HELPERS ── */
const CAT_ICONS = {
  Food:          '🍔',
  Travel:        '✈️',
  Shopping:      '🛍️',
  Health:        '💊',
  Entertainment: '🎬',
  Other:         '📦',
};

const CAT_CLASSES = {
  Food:          'cat-food',
  Travel:        'cat-travel',
  Shopping:      'cat-shopping',
  Health:        'cat-health',
  Entertainment: 'cat-entertainment',
  Other:         'cat-other',
};

function catPill(cat) {
  const icon = CAT_ICONS[cat] || '📦';
  const cls  = CAT_CLASSES[cat] || 'cat-other';
  return `<span class="cat-pill ${cls}">${icon} ${cat}</span>`;
}

/* ── FORMAT HELPERS ── */
function formatINR(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
