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
function saveDay(dk, data) {
  lsSave('day_' + dk, data);
  if (typeof refreshNavBadges === 'function') refreshNavBadges();
}
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
  refreshNavBadges();
  applyNumericInputmode();
  attachPageGestures(name);
}

/** Wire up swipe + pull-to-refresh on the active page (idempotent). */
function attachPageGestures(name) {
  // UX18 — swipe left/right on Journal page = change day
  if (name === 'journal') {
    const journalPage = document.getElementById('page-journal');
    attachHSwipe(journalPage,
      () => { if (typeof changeJournalDate === 'function') changeJournalDate(1); },   // ← swipe left = next day
      () => { if (typeof changeJournalDate === 'function') changeJournalDate(-1); }   // → swipe right = previous day
    );
  }
  // UX17 — pull-to-refresh on Dashboard
  if (name === 'dash') {
    const dashPage = document.getElementById('page-dash');
    attachPullToRefresh(dashPage, () => {
      // Re-render + try to pull from cloud if signed in
      renderDash();
      if (typeof pullAllFromCloud === 'function' && typeof _syncUid !== 'undefined' && _syncUid) {
        pullAllFromCloud().then(renderDash);
      }
    });
  }
}

/* ----------------------------------------------------------
   UX19 — bottom-nav badges: red dot on Journal if nothing
   logged for today (across meals + exercises + weight).
   Removes itself once user logs anything.
   ---------------------------------------------------------- */
function refreshNavBadges() {
  const dk = todayKey();
  const day = getDay(dk);
  const meals = day && day.meals ? day.meals : {};
  const hasMeal = MEAL_KEYS.some(k => (meals[k] || []).length > 0);
  const hasExo = (day && day.exercises || []).length > 0;
  const hasWeight = day && day.weight != null;
  const journalEmpty = !hasMeal;
  // Show on Journal nav button (bottom + side)
  ['nb-journal', 'sn-journal'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('has-badge', journalEmpty);
  });
  // Subtle dot on Sport too if neither sport nor meal logged (= nothing today)
  const nothingToday = !hasMeal && !hasExo && !hasWeight;
  ['nb-sport', 'sn-sport'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('has-badge-soft', nothingToday);
  });
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
  refreshNavBadges();
  if (typeof initNotifications === 'function') initNotifications();
}

/** Show the landing page (3-promise hero). Called only when no auth/no settings. */
function showLanding() {
  const el = document.getElementById('landing');
  if (el) el.style.display = '';
}
function hideLanding() {
  const el = document.getElementById('landing');
  if (el) el.style.display = 'none';
}

// ---------- INIT ----------
window.onload = () => {
  // If Firebase is configured → let auth.js drive the launch flow.
  // Landing stays hidden until either:
  //   - auth.js shows the auth-page (logged out), OR
  //   - sync.js onUserReady decides to show landing (logged in but no settings yet).
  // This prevents the landing flash during boot.
  const firebaseMode = (typeof FIREBASE_ENABLED !== 'undefined') && FIREBASE_ENABLED;
  if (firebaseMode && typeof initAuth === 'function') {
    const ok = initAuth();
    if (!ok) {
      // Firebase init failed → fall back to local mode.
      const saved = lsLoad('settings');
      if (saved && saved.target) { S = saved; launchApp(); }
      else { showLanding(); }
    }
  } else {
    // Local-only mode — show landing if no settings, else launch app.
    const saved = lsLoad('settings');
    if (saved && saved.target) {
      S = saved;
      launchApp();
    } else {
      showLanding();
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
// Apply saved theme ASAP (before first paint).
// UX23: at first launch (no saved preference), respect OS preference.
(function bootTheme() {
  const saved = lsLoad('theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
})();

// ---------- HORIZONTAL SWIPE (UX18 — change day in Journal) ----------
/** Attach left/right swipe handlers to a target element.
 *  onLeft = swipe to the left (go forward in time / next day).
 *  onRight = swipe to the right (go backward / previous day).
 *  Triggers only if horizontal travel > 60px and dominant axis is horizontal. */
function attachHSwipe(el, onLeft, onRight) {
  if (!el || el._hSwipeBound) return;
  el._hSwipeBound = true;
  let sx = 0, sy = 0, t0 = 0, active = false;
  el.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; t0 = Date.now(); active = true;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const dt = Date.now() - t0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 600) {
      if (dx < 0 && typeof onLeft === 'function')  onLeft();
      if (dx > 0 && typeof onRight === 'function') onRight();
    }
  }, { passive: true });
}

// ---------- PULL-TO-REFRESH (UX17 — dashboard refresh) ----------
function attachPullToRefresh(el, onRefresh) {
  if (!el || el._ptrBound) return;
  el._ptrBound = true;
  let sy = 0, dy = 0, pulling = false, indicator = null;
  el.addEventListener('touchstart', (e) => {
    if (window.scrollY > 0) return;
    sy = e.touches[0].clientY;
    pulling = true;
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'ptr-indicator';
      indicator.innerHTML = '<span class="ptr-icon">↓</span><span class="ptr-text">Tire pour rafraîchir</span>';
      document.body.appendChild(indicator);
    }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    dy = e.touches[0].clientY - sy;
    if (dy > 0 && window.scrollY === 0) {
      const pct = Math.min(dy / 100, 1);
      indicator.style.opacity = pct;
      indicator.style.transform = `translateX(-50%) translateY(${Math.min(dy * 0.6, 70)}px)`;
      const ico = indicator.querySelector('.ptr-icon');
      if (ico) ico.style.transform = `rotate(${pct * 180}deg)`;
      const txt = indicator.querySelector('.ptr-text');
      if (txt) txt.textContent = dy > 80 ? 'Lâche pour rafraîchir' : 'Tire pour rafraîchir';
    }
  }, { passive: true });
  el.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    if (dy > 80) {
      if (indicator) {
        indicator.querySelector('.ptr-text').textContent = '↻ Rafraîchissement…';
        indicator.querySelector('.ptr-icon').style.animation = 'spin 0.6s linear infinite';
      }
      if (typeof onRefresh === 'function') onRefresh();
      if (typeof haptic === 'function') haptic('success');
      setTimeout(() => { if (indicator) indicator.style.opacity = 0; }, 600);
    } else {
      if (indicator) {
        indicator.style.opacity = 0;
        indicator.style.transform = 'translateX(-50%) translateY(0)';
      }
    }
    dy = 0;
  });
}

// ---------- HAPTIC FEEDBACK (UX14) ----------
/** Short vibration for critical taps. Falls back to no-op if unsupported. */
function haptic(kind = 'tap') {
  if (!navigator.vibrate) return;
  // Don't haptic-spam if user prefers reduced motion (often correlated with sensitivity)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const patterns = {
    tap:     [8],         // light tap
    success: [12, 40, 18],// satisfying double pulse
    warn:    [25, 60, 25],// warning double
    error:   [40, 80, 40, 80, 40],
  };
  try { navigator.vibrate(patterns[kind] || patterns.tap); } catch (e) {}
}

// Auto-fire haptic on any element with [data-haptic] attribute
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-haptic]');
  if (t) haptic(t.dataset.haptic || 'tap');
}, { passive: true });

// ---------- INPUT MODE — UX16 (numeric keyboard on mobile) ----------
/** Run after any DOM mutation that adds inputs. Adds inputmode=decimal
 *  to every number input that doesn't already have one. */
function applyNumericInputmode(root = document) {
  root.querySelectorAll('input[type="number"]:not([inputmode])').forEach(el => {
    el.setAttribute('inputmode', el.step && parseFloat(el.step) < 1 ? 'decimal' : 'numeric');
  });
}
window.addEventListener('DOMContentLoaded', () => applyNumericInputmode());
// Also after page navigation (renders new inputs)
const _origShowPageForInputmode = window.showPage;
// We can't wrap here yet (showPage is in same file scope). Hook done below in init.

// ---------- COUNT-UP (wow effect on numbers) ----------
/** Animate an element's text from 0 (or its previous value) to `to`.
 *  Respects prefers-reduced-motion. Format function lets you customize output. */
function countUp(el, to, opts = {}) {
  if (!el) return;
  const from = opts.from != null ? opts.from : (parseFloat(el.dataset.val) || 0);
  const dur = opts.dur || 900;
  const fmt = opts.fmt || ((v) => Math.round(v).toString());
  const prefix = opts.prefix || '';
  el.dataset.val = to;
  // Skip animation for trivial deltas or if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = prefix + fmt(to);
    return;
  }
  if (Math.abs(to - from) < 1) { el.textContent = prefix + fmt(to); return; }
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const v = from + (to - from) * ease(t);
    el.textContent = prefix + fmt(v);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
