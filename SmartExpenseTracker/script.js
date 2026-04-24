/* ═══════════════════════════════════════════════════════════
   SMART EXPENSE TRACKER — script.js
   Shared logic across all pages
═══════════════════════════════════════════════════════════ */

// ── CONSTANTS ──────────────────────────────────────────────
const CATEGORY_ICONS = {
  Food:          '🍔',
  Travel:        '✈️',
  Shopping:      '🛍️',
  Bills:         '💡',
  Health:        '💊',
  Entertainment: '🎬',
  Education:     '📚',
  Other:         '📦'
};

const HIGH_THRESHOLD = 2000;   // Amount above which a row is flagged
const RECENT_LIMIT   = 5;      // How many recent transactions to show

// ── AUTH HELPERS ────────────────────────────────────────────

/** Returns the username of the logged-in user, or null */
function getCurrentUser() {
  return localStorage.getItem('currentUser');
}

/** Returns expenses array for the current user */
function getExpenses() {
  const user = getCurrentUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem('expenses_' + user) || '[]');
}

/** Saves expenses array for current user */
function saveExpenses(list) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem('expenses_' + user, JSON.stringify(list));
}

/** Returns budget for the current user */
function getBudget() {
  const user = getCurrentUser();
  return parseFloat(localStorage.getItem('budget_' + user) || '0');
}

/** Saves budget for current user */
function saveBudget(amount) {
  const user = getCurrentUser();
  localStorage.setItem('budget_' + user, amount);
}

/** Returns all registered users (used by login.html) */
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

/** Protects pages — redirects to login if not logged in */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/** Logs the user out */
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// ── THEME ────────────────────────────────────────────────────

function applyTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  // Rebuild charts if on charts page
  if (typeof buildCharts === 'function') buildCharts();
}

// ── NOTIFICATIONS ────────────────────────────────────────────

let _notifTimer = null;

function notify(msg, type = 'success') {
  const el = document.getElementById('notif');
  if (!el) return;
  el.textContent = msg;
  el.className = type === 'error' ? 'error' : type === 'warning' ? 'warning' : '';
  void el.offsetWidth;  // force reflow
  el.classList.add('show');
  if (_notifTimer) clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── MODAL (CONFIRM) ──────────────────────────────────────────

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

function confirmModal() {
  closeModal();
  if (_confirmCb) _confirmCb();
}

// ── SIDEBAR ──────────────────────────────────────────────────

function buildSidebar(active) {
  const user = getCurrentUser() || '';
  const links = [
    { href:'index.html',   icon:'🏠', label:'Dashboard' },
    { href:'charts.html',  icon:'📊', label:'Charts'    },
    { href:'reports.html', icon:'📄', label:'Reports'   },
  ];
  const navHTML = links.map(l => `
    <a href="${l.href}" class="nav-item${active === l.label ? ' active' : ''}">
      <span class="nav-icon">${l.icon}</span> ${l.label}
    </a>
  `).join('');

  return `
    <div class="sidebar-brand">
      <div class="sidebar-logo"><span>💰</span> SpendSmart</div>
      <div class="sidebar-user">Welcome, <strong>${escHtml(user)}</strong></div>
    </div>
    <nav class="sidebar-nav">
      ${navHTML}
      <div class="nav-divider"></div>
    </nav>
    <div class="sidebar-bottom">
      <button class="btn-logout" onclick="logout()">🚪 Logout</button>
    </div>
  `;
}

// ── HELPERS ──────────────────────────────────────────────────

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtMoney(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function catIcon(cat) {
  return CATEGORY_ICONS[cat] || '📦';
}

/** Generate a unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

/** Get current month key YYYY-MM */
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/** Get week range (Mon-Sun) for a given offset (0=this week, 1=last week) */
function weekRange(offsetWeeks) {
  const now   = new Date();
  const day   = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon   = new Date(now);
  mon.setDate(now.getDate() + diffToMon - offsetWeeks * 7);
  mon.setHours(0,0,0,0);
  const sun   = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23,59,59,999);
  return { start: mon, end: sun };
}

function weekTotal(expenses, offsetWeeks = 0) {
  const { start, end } = weekRange(offsetWeeks);
  return expenses
    .filter(e => { const d = new Date(e.date+'T00:00:00'); return d >= start && d <= end; })
    .reduce((s, e) => s + e.amount, 0);
}

function monthTotal(expenses) {
  const [y, m] = currentMonthKey().split('-');
  return expenses
    .filter(e => {
      const d = new Date(e.date+'T00:00:00');
      return d.getFullYear() === +y && d.getMonth() === +m - 1;
    })
    .reduce((s, e) => s + e.amount, 0);
}

function topCategory(expenses) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category]||0) + e.amount; });
  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  return sorted.length ? sorted[0] : null;
}

function buildInsights(expenses) {
  const items = [];
  const tw = weekTotal(expenses, 0);
  const lw = weekTotal(expenses, 1);
  const top = topCategory(expenses);

  if (top) {
    items.push({ icon: catIcon(top[0]), text: `You are spending the most on <strong>${top[0]}</strong> — ${fmtMoney(top[1])} total.`, type:'' });
  }
  if (tw > lw && lw > 0) {
    const pct = Math.round((tw - lw) / lw * 100);
    items.push({ icon:'📈', text:`Your spending <strong>increased by ${pct}%</strong> compared to last week.`, type:'warn' });
  } else if (lw > 0 && tw < lw) {
    items.push({ icon:'📉', text:`Great job! Spending is <strong>down this week</strong> vs last week.`, type:'good' });
  }
  const high = expenses.filter(e => e.amount >= HIGH_THRESHOLD);
  if (high.length) {
    items.push({ icon:'🔴', text:`You have <strong>${high.length} high-value expense(s)</strong> above ${fmtMoney(HIGH_THRESHOLD)}.`, type:'warn' });
  }
  const mt = monthTotal(expenses);
  if (mt > 0) {
    const now = new Date();
    const name = now.toLocaleString('default',{month:'long',year:'numeric'});
    items.push({ icon:'📅', text:`Total spending this month (<strong>${name}</strong>): ${fmtMoney(mt)}.`, type:'' });
  }
  return items;
}

// ── DUPLICATE CHECK ──────────────────────────────────────────

function isDuplicate(expenses, name, amount, date, excludeId = null) {
  return expenses.some(e =>
    e.id !== excludeId &&
    e.name.toLowerCase() === String(name).toLowerCase() &&
    e.amount === parseFloat(amount) &&
    e.date === date
  );
}

// ── CSV EXPORT ───────────────────────────────────────────────

function downloadCSV(expenses) {
  const rows = [['ID','Name','Amount','Category','Date','Notes']];
  expenses.forEach(e => rows.push([e.id, `"${e.name}"`, e.amount, e.category, e.date, `"${e.notes||''}"`]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV IMPORT PARSER ────────────────────────────────────────

/**
 * Parses CSV text.
 * Expected format: Name,Amount,Category,Date,Notes
 * Returns { added, skipped, errors }
 */
function parseAndImportCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { added:0, skipped:0, errors:['CSV is empty or has no data rows.'] };

  const header = lines[0].toLowerCase();
  if (!header.includes('name') || !header.includes('amount')) {
    return { added:0, skipped:0, errors:['CSV header must include Name and Amount columns.'] };
  }

  let expenses = getExpenses();
  let added = 0, skipped = 0, errors = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields
    const cols = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || lines[i].split(',');
    const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());

    const [name, amount, category, date, notes] = clean;

    // Validate
    if (!name || !amount || !date) {
      errors.push(`Row ${i+1}: Missing name, amount, or date. Skipped.`);
      skipped++;
      continue;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      errors.push(`Row ${i+1}: Invalid amount "${amount}". Skipped.`);
      skipped++;
      continue;
    }
    // Check valid date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i+1}: Invalid date format. Use YYYY-MM-DD. Skipped.`);
      skipped++;
      continue;
    }

    const cat = CATEGORY_ICONS[category] ? category : 'Other';

    // Duplicate check
    if (isDuplicate(expenses, name, amt, date)) {
      skipped++;
      continue;
    }

    expenses.push({
      id: uid(),
      name: name,
      amount: amt,
      category: cat,
      date: date,
      notes: notes || '',
      createdAt: new Date().toISOString()
    });
    added++;
  }

  saveExpenses(expenses);
  return { added, skipped, errors };
}
