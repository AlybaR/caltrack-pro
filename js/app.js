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
const lsSave = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const todayKey = () => { const d = new Date(); const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().slice(0, 10); };
function getDay(dk) {
  const d = lsLoad('day_' + dk) || { meals: {}, water: 0, weight: null, exercises: [] };
  MEAL_KEYS.forEach(k => { if (!d.meals[k]) d.meals[k] = []; });
  if (!d.exercises) d.exercises = [];
  return d;
}
function saveDay(dk, data) { lsSave('day_' + dk, data); }
function totalKcal(day) {
  return MEAL_KEYS.reduce((s, k) => s + (day.meals[k] || []).reduce((a, f) => a + f.k, 0), 0);
}
function totalBurned(day) {
  return (day.exercises || []).reduce((s, e) => s + e.kcal, 0);
}
function totalMacros(day) {
  let p = 0, l = 0, g = 0, tracked = 0;
  MEAL_KEYS.forEach(k => (day.meals[k] || []).forEach(f => {
    if (f.p != null) { p += f.p; tracked++; }
    if (f.l != null) l += f.l;
    if (f.g != null) g += f.g;
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
  ['dash', 'journal', 'poids', 'suivi', 'settings'].forEach(p => {
    document.getElementById('page-' + p).classList.toggle('active', p === name);
    document.getElementById('nb-' + p).classList.toggle('active', p === name);
    const snBtn = document.getElementById('sn-' + p);
    if (snBtn) snBtn.classList.toggle('active', p === name);
  });
  if (name === 'dash') renderDash();
  if (name === 'journal') renderJournal();
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
  const saved = lsLoad('settings');
  if (saved && saved.target) {
    S = saved;
    launchApp();
  }
  // Resize weight graph
  window.addEventListener('resize', () => {
    if (document.getElementById('page-poids').classList.contains('active')) renderPoids();
    if (document.getElementById('page-suivi').classList.contains('active')) renderSuivi();
  });
  // PWA — register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
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
function showToast(msg) {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}
