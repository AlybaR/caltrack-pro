/* ============================================================
   app.js — State management, constants, utilities, init (v3)
   ============================================================ */

// ---------- CONSTANTS ----------
const MEALS = ['🌅 Petit-déjeuner', '☀️ Déjeuner', '🌙 Dîner', '🍎 Collation'];
const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MACROS_P = {
  std: { p: .30, l: .30, g: .40 },
  lc: { p: .40, l: .40, g: .20 },
  keto: { p: .35, l: .60, g: .05 },
  hp: { p: .60, l: .25, g: .15 },
};
const MACRO_KCAL = { p: 4, l: 9, g: 4 };
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ---------- STATE ----------
let S = {};

// ---------- STORAGE ----------
const lsLoad = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSave = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  // Sync hook — sync.js sets window._onLsWrite to mirror writes to Firestore.
  if (typeof window._onLsWrite === 'function') {
    try { window._onLsWrite(k, v); } catch (e) { console.error('[sync] hook err:', e); }
  }
};

const todayKey = () => { const d = new Date(); const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().slice(0, 10); };
function getDay(dk) {
  const d = lsLoad('day_' + dk) || { meals: {}, water: 0, weight: null, exercises: [] };
  MEAL_KEYS.forEach(k => { if (!d.meals[k]) d.meals[k] = []; });
  if (!d.exercises) d.exercises = [];
  return d;
}
function saveDay(dk, data) { lsSave('day_' + dk, data); }
// Portion helpers — qty defaults to 1 for backwards compatibility
function foodQty(f) { return f.qty || 1; }
function foodKcal(f) { return Math.round(f.k * foodQty(f)); }
function totalKcal(day) {
  return MEAL_KEYS.reduce((s, k) => s + (day.meals[k] || []).reduce((a, f) => a + foodKcal(f), 0), 0);
}
function totalBurned(day) {
  return (day.exercises || []).reduce((s, e) => s + e.kcal, 0);
}
function totalMacros(day) {
  let p = 0, l = 0, g = 0, tracked = 0;
  MEAL_KEYS.forEach(k => (day.meals[k] || []).forEach(f => {
    const q = foodQty(f);
    if (f.p != null) { p += f.p * q; tracked++; }
    if (f.l != null) l += f.l * q;
    if (f.g != null) g += f.g * q;
  }));
  return { p: Math.round(p), l: Math.round(l), g: Math.round(g), tracked };
}

// ---------- NUTRITION ----------
function calcNutrition() {
  const { age, h, w, bf, sexe, act, rythme } = S;
  let bmr;
  if (bf !== null && !isNaN(bf)) {
    bmr = 370 + 21.6 * (w * (1 - bf / 100));
  } else {
    bmr = sexe === 'h' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
  }
  const tef = bmr * 0.10;
  const tdee = Math.round((bmr + tef) * act);
  const minCal = sexe === 'h' ? 1500 : 1200;
  const target = Math.max(tdee - rythme, minCal);
  const water = Math.round(w * 35 / 250);
  S.bmr = Math.round(bmr); S.tdee = tdee; S.target = target; S.water = water;
  lsSave('settings', S);
}

// ---------- PAGE NAV ----------
function showPage(name) {
  ['dash', 'journal', 'sport', 'corps', 'poids', 'suivi', 'settings'].forEach(p => {
    const pg = document.getElementById('page-' + p); if (pg) pg.classList.toggle('active', p === name);
    const nb = document.getElementById('nb-' + p); if (nb) nb.classList.toggle('active', p === name);
    const sn = document.getElementById('sn-' + p); if (sn) sn.classList.toggle('active', p === name);
  });
  if (name === 'dash') renderDash();
  if (name === 'journal') renderJournal();
  if (name === 'sport' && typeof renderSport === 'function') renderSport();
  if (name === 'corps' && typeof renderCorps === 'function') { renderCorps(); if (typeof checkMilestones === 'function') checkMilestones(); }
  if (name === 'poids') renderPoids();
  if (name === 'suivi') renderSuivi();
  if (name === 'settings') renderSettings();
}

// ---------- LAUNCH ----------
function launchApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('wizard').style.display = 'none';
  document.getElementById('bot-nav').style.display = 'flex';
  // Side nav: remove inline display:none so CSS media queries take over
  const sideNav = document.getElementById('side-nav');
  if (sideNav) sideNav.style.display = '';
  calcNutrition();
  showPage('dash');
  if (typeof initNotifications === 'function') initNotifications();
}

// ---------- INIT ----------
window.onload = () => {
  // If Firebase is configured → let auth.js drive the launch flow
  // (onUserReady in sync.js will call launchApp once cloud state is resolved).
  const firebaseMode = (typeof FIREBASE_ENABLED !== 'undefined') && FIREBASE_ENABLED;
  if (firebaseMode && typeof initAuth === 'function') {
    const ok = initAuth();
    // If Firebase init failed for any reason → fall back to local auto-launch
    if (!ok) {
      const saved = lsLoad('settings');
      if (saved && saved.target) { S = saved; launchApp(); }
    }
  } else {
    // Local-only mode (no Firebase config) — legacy behaviour
    const saved = lsLoad('settings');
    if (saved && saved.target) {
      S = saved;
      launchApp();
    }
  }
  // Resize weight graph
  window.addEventListener('resize', () => {
    if (document.getElementById('page-poids').classList.contains('active')) renderPoids();
    if (document.getElementById('page-suivi').classList.contains('active')) renderSuivi();
  });
  // PWA — register service worker (auto-reload on new version)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'activated') window.location.reload();
        });
      });
      reg.update();
    }).catch(() => { });
  }
  // PWA — capture install prompt
  window._deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window._deferredInstall = e;
    const btn = document.getElementById('btn-install');
    if (btn) btn.style.display = '';
  });
};

// ---------- IMC (shared) ----------
function calcIMC(w, h) {
  if (!w || !h || h <= 0) return null;
  const val = w / ((h / 100) ** 2);
  let label, cls, bg;
  if (val < 18.5)      { label = 'Sous-poids';    cls = 'imc-normal';   bg = 'rgba(123,184,197,.15)'; }
  else if (val < 25)   { label = 'Normal 💚';      cls = 'imc-normal';   bg = 'rgba(106,177,135,.15)'; }
  else if (val < 30)   { label = 'Surpoids ⚠️';   cls = 'imc-surpoids'; bg = 'rgba(212,160,74,.15)'; }
  else                 { label = 'Obésité';         cls = 'imc-obese';    bg = 'rgba(201,116,116,.15)'; }
  return { val, label, cls, bg };
}

// ---------- TOAST (shared) ----------
function showToast(msg, undoFn) {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = '';
  const span = document.createElement('span'); span.textContent = msg; t.appendChild(span);
  if (typeof undoFn === 'function') {
    const btn = document.createElement('button');
    btn.className = 'toast-undo'; btn.textContent = 'Annuler';
    btn.onclick = () => { clearTimeout(t._t); t.classList.remove('show'); try { undoFn(); } catch(e){} };
    t.appendChild(btn);
  }
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), undoFn ? 5000 : 2800);
}

// ---------- THEME ----------
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  lsSave('theme', t);
}
function toggleTheme() {
  const cur = lsLoad('theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
  if (typeof renderSettings === 'function') renderSettings();
}
// Apply saved theme ASAP (before first paint if possible)
applyTheme(lsLoad('theme') || 'light');
