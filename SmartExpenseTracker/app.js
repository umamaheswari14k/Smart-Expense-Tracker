/* ============================================================
   SMART EXPENSE TRACKER — app.js
   Shared utility functions used by all pages
   ============================================================ */

/* ── CATEGORY CONFIG ───────────────────────────────────── */
const CAT_ICONS = {
  Food:          '🍔',
  Travel:        '✈️',
  Shopping:      '🛍️',
  Bills:         '💡',
  Health:        '💊',
  Entertainment: '🎬',
  Education:     '📚',
  Other:         '📦'
};

const HIGH_AMT = 5000; // Amount above this is highlighted red

/* ── AUTH ───────────────────────────────────────────────── */
// Returns username of logged-in user, or null
function getUser() {
  return localStorage.getItem('currentUser');
}

// Protect a page — call at top of each page's script
function requireLogin() {
  if (!getUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Log user out
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

/* ── EXPENSE STORAGE ────────────────────────────────────── */
// Get expenses for current user
function getExpenses() {
  const user = getUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem('exp_' + user) || '[]');
}

// Save expenses for current user
function saveExpenses(list) {
  const user = getUser();
  if (!user) return;
  localStorage.setItem('exp_' + user, JSON.stringify(list));
}

// Get budget for current user
function getBudget() {
  const user = getUser();
  return parseFloat(localStorage.getItem('budget_' + user) || '0');
}

// Save budget for current user
function saveBudget(amount) {
  const user = getUser();
  localStorage.setItem('budget_' + user, amount);
}

/* ── USER REGISTRY (for login.html) ────────────────────── */
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

/* ── HELPERS ────────────────────────────────────────────── */
// Generate unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Format currency
function fmtMoney(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

// Format date string (YYYY-MM-DD) → readable
function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Escape HTML to prevent XSS
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Get category icon emoji
function catIcon(cat) {
  return CAT_ICONS[cat] || '📦';
}

// Get month key YYYY-MM from a date string
function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : '';
}

// Current month key
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Sum of expenses in current month
function monthTotal(expenses) {
  const m = currentMonth();
  return expenses
    .filter(e => monthKey(e.date) === m)
    .reduce((s, e) => s + e.amount, 0);
}

// Top spending category
function topCategory(expenses) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0] : null;
}

/* ── TOAST NOTIFICATION ─────────────────────────────────── */
let _toastTimer = null;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = type;      // reset classes
  void el.offsetWidth;      // force reflow so animation retriggers
  el.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ── CONFIRM MODAL ──────────────────────────────────────── */
let _confirmCb = null;
function showConfirm(title, msg, onYes, yesLabel = 'Delete') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent   = msg;
  document.getElementById('modalYes').textContent   = yesLabel;
  document.getElementById('modal').classList.remove('hidden');
  _confirmCb = onYes;
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  _confirmCb = null;
}
function confirmYes() {
  closeModal();
  if (_confirmCb) _confirmCb();
}

/* ── SIDEBAR BUILDER ────────────────────────────────────── */
function buildSidebar(activePage) {
  const user = getUser() || '';
  const initial = user.charAt(0).toUpperCase();

  const links = [
    { href: 'index.html',   icon: '🏠', label: 'Dashboard' },
    { href: 'charts.html',  icon: '📊', label: 'Charts'    },
    { href: 'reports.html', icon: '📄', label: 'Reports'   },
  ];

  return `
    <div class="sidebar-brand">
      <div class="sidebar-logo">💰 SpendSmart</div>
      <div class="sidebar-tagline">Personal Finance Tracker</div>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-user-label">Logged in as</div>
      <div class="sidebar-user-name">
        <div class="sidebar-avatar">${esc(initial)}</div>
        ${esc(user)}
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      ${links.map(l => `
        <a href="${l.href}" class="nav-link ${activePage === l.label ? 'active' : ''}">
          <span class="nav-icon">${l.icon}</span> ${l.label}
        </a>
      `).join('')}
      <div class="nav-divider"></div>
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" onclick="logout()">🚪 Logout</button>
    </div>
  `;
}

/* ── CSV EXPORT ─────────────────────────────────────────── */
function downloadCSV(expenses, filename) {
  const rows = [['Name', 'Amount', 'Category', 'Date']];
  expenses.forEach(e => rows.push([`"${e.name}"`, e.amount, e.category, e.date]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename || `expenses_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── CSV IMPORT PARSER ──────────────────────────────────── */
// Parses CSV text and adds valid rows to localStorage.
// Returns { added, skipped } counts.
function importCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { added: 0, skipped: 0, error: 'File is empty or has no data rows.' };

  // Detect if first row is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader  = firstLower.includes('name') || firstLower.includes('amount');
  const dataLines  = hasHeader ? lines.slice(1) : lines;

  let expenses = getExpenses();
  let added = 0, skipped = 0;

  dataLines.forEach((line, idx) => {
    // Parse columns — handle basic quoted fields
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const [name, amtStr, category, date] = cols;

    // Validate required fields
    if (!name || !amtStr || !date) { skipped++; return; }
    const amount = parseFloat(amtStr);
    if (isNaN(amount) || amount <= 0) { skipped++; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; return; } // must be YYYY-MM-DD

    const cat = CAT_ICONS[category] ? category : 'Other';

    // Duplicate check (same name + amount + date)
    const isDup = expenses.some(e =>
      e.name.toLowerCase() === name.toLowerCase() &&
      e.amount === amount &&
      e.date === date
    );
    if (isDup) { skipped++; return; }

    expenses.push({ id: uid(), name, amount, category: cat, date, createdAt: new Date().toISOString() });
    added++;
  });

  saveExpenses(expenses);
  return { added, skipped };
}
