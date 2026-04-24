/* ═══════════════════════════════════════════════
   auth.js  —  Authentication + shared utilities
═══════════════════════════════════════════════ */

// ── LOGIN ──────────────────────────────────────
// Password rules: 6+ chars, at least one letter, one number
function loginUser() {
  var username = document.getElementById("username").value.trim();
  var password = document.getElementById("password").value;

  if (!username) { showLoginError("Please enter a username."); return; }
  if (password.length < 6) { showLoginError("Password must be at least 6 characters."); return; }
  if (!/[a-zA-Z]/.test(password)) { showLoginError("Password must include at least one letter."); return; }
  if (!/[0-9]/.test(password)) { showLoginError("Password must include at least one number."); return; }

  localStorage.setItem("currentUser", username);
  window.location.href = "index.html";
}

function showLoginError(msg) {
  var el = document.getElementById("loginError");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

// ── AUTH GUARD ─────────────────────────────────
function checkAuth() {
  if (!localStorage.getItem("currentUser")) {
    window.location.href = "login.html";
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function getCurrentUser() {
  return localStorage.getItem("currentUser") || "";
}

// ── EXPENSE STORAGE ────────────────────────────
function getExpenses() {
  var u = getCurrentUser();
  if (!u) return [];
  return JSON.parse(localStorage.getItem("expenses_" + u) || "[]");
}

function saveExpenses(list) {
  var u = getCurrentUser();
  if (!u) return;
  localStorage.setItem("expenses_" + u, JSON.stringify(list));
}

function getBudget() {
  return parseFloat(localStorage.getItem("budget_" + getCurrentUser()) || "0");
}

function saveBudget(val) {
  localStorage.setItem("budget_" + getCurrentUser(), val);
}

// ── THEME ──────────────────────────────────────
function applyStoredTheme() {
  var t = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark", t === "dark");
  var btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = (t === "dark") ? "☀️" : "🌙";
}

function toggleTheme() {
  var isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  var btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = isDark ? "☀️" : "🌙";
  if (typeof renderCharts === "function") renderCharts();
}

// ── TOAST ──────────────────────────────────────
var _toastTimer = null;
function showToast(msg, type) {
  var toast = document.getElementById("toast");
  if (!toast) { toast = document.createElement("div"); toast.id = "toast"; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className   = "toast show " + (type || "success");
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 3200);
}

// ── CONFIRM MODAL ──────────────────────────────
var _confirmCb = null;
function showConfirm(title, msg, onYes) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent   = msg;
  document.getElementById("confirmModal").style.display = "flex";
  _confirmCb = onYes;
}
function closeConfirmModal() {
  document.getElementById("confirmModal").style.display = "none";
  _confirmCb = null;
}
function doConfirm() {
  closeConfirmModal();
  if (_confirmCb) _confirmCb();
}

// ── SIDEBAR ────────────────────────────────────
function buildSidebar(activePage) {
  var user  = getCurrentUser();
  var pages = [
    { label: "Dashboard", icon: "🏠", href: "index.html"   },
    { label: "Charts",    icon: "📊", href: "charts.html"  },
    { label: "Reports",   icon: "📄", href: "reports.html" }
  ];
  var links = pages.map(function(p) {
    return '<a href="' + p.href + '" class="nav-link' + (activePage === p.label ? " active" : "") + '">' +
           '<span class="nav-icon">' + p.icon + '</span><span>' + p.label + '</span></a>';
  }).join("");

  return '<div class="sidebar-brand"><span>💰</span><span class="brand-name">SpendSmart</span></div>' +
    '<div class="sidebar-user"><div class="user-avatar">' + user.charAt(0).toUpperCase() + '</div>' +
    '<div><div class="user-label">Welcome back,</div><div class="user-name">' + escHtml(user) + '</div></div></div>' +
    '<nav class="sidebar-nav">' + links + '</nav>' +
    '<div class="sidebar-footer"><button class="btn-logout" onclick="logoutUser()">🚪 Logout</button></div>';
}

// ── UTILS ──────────────────────────────────────
function escHtml(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function fmtDate(d) {
  if (!d) return "—";
  var dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtMoney(n) { return "₹" + Number(n||0).toLocaleString("en-IN"); }

var CAT_ICON = { Food:"🍔", Travel:"✈️", Shopping:"🛍️", Bills:"💡", Health:"💊", Entertainment:"🎬", Education:"📚", Other:"📦" };
function catIcon(cat) { return CAT_ICON[cat] || "📦"; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function monthTotal(expenses) {
  var now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return expenses.filter(function(e) {
    var d = new Date(e.date + "T00:00:00");
    return d.getMonth() === m && d.getFullYear() === y;
  }).reduce(function(s,e){ return s + e.amount; }, 0);
}

function topCategory(expenses) {
  var totals = {};
  expenses.forEach(function(e){ totals[e.category] = (totals[e.category]||0) + e.amount; });
  var sorted = Object.entries(totals).sort(function(a,b){ return b[1]-a[1]; });
  return sorted.length ? sorted[0] : null;
}

// CSV download
function downloadCSV(expenses) {
  var rows = [["Name","Amount","Category","Date"]];
  expenses.forEach(function(e){ rows.push(['"'+e.name+'"', e.amount, e.category, e.date]); });
  var csv  = rows.map(function(r){ return r.join(","); }).join("\n");
  var blob = new Blob([csv], { type: "text/csv" });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement("a");
  a.href   = url; a.download = "expenses.csv"; a.click();
  URL.revokeObjectURL(url);
}
