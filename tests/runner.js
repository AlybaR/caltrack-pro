/* ============================================================
   runner.js — Test engine
   Orchestrates user-journey scenarios in an iframe of the app.
   No npm, no build step — just open tests/index.html in a browser.
   ============================================================ */

(function() {
'use strict';

const frame    = document.getElementById('app-frame');
const consoleEl = document.getElementById('console');
const listEl   = document.getElementById('test-list');
const overlay  = document.getElementById('frame-overlay');
const overlayTxt = document.getElementById('frame-overlay-text');
const btnRunAll = document.getElementById('btn-run-all');
const btnReset = document.getElementById('btn-reset');

let _running = false;
let _abort = false;

/* ---------- Console ---------- */
function log(msg, type = 'info') {
    const t = new Date().toLocaleTimeString('fr-FR');
    const div = document.createElement('div');
    div.className = 'log-' + type;
    div.innerHTML = `<span class="timestamp">${t}</span>${escape(msg)}`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}
function escape(s) { return String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

/* ---------- Render test list ---------- */
function renderList() {
    listEl.innerHTML = '';
    SCENARIOS.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'test-item';
        div.dataset.idx = i;
        div.innerHTML = `
            <div class="test-status">⏸</div>
            <div>
                <div class="test-name">${s.id}. ${s.name}</div>
                <div class="test-meta">${s.target || ''}</div>
            </div>
            <div class="test-time" id="time-${i}"></div>
        `;
        div.onclick = () => runOne(i);
        listEl.appendChild(div);
    });
}

function setStatus(idx, status, time) {
    const item = listEl.children[idx];
    if (!item) return;
    item.classList.remove('running', 'pass', 'fail');
    if (status === 'running') item.classList.add('running');
    if (status === 'pass')    item.classList.add('pass');
    if (status === 'fail')    item.classList.add('fail');
    const statusEl = item.querySelector('.test-status');
    if (status === 'running') statusEl.textContent = '⏳';
    if (status === 'pass')    statusEl.textContent = '✓';
    if (status === 'fail')    statusEl.textContent = '✕';
    if (status === 'idle')    statusEl.textContent = '⏸';
    const tEl = document.getElementById('time-' + idx);
    if (tEl && time) tEl.textContent = time + 'ms';
}

/* ---------- Stats ---------- */
const stats = { total: 0, pass: 0, fail: 0, time: 0 };
function updateStats() {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pass').textContent = stats.pass;
    document.getElementById('stat-fail').textContent = stats.fail;
    document.getElementById('stat-time').textContent = stats.time;
}
function resetStats() {
    stats.total = stats.pass = stats.fail = stats.time = 0;
    updateStats();
}

/* ---------- Iframe helpers ---------- */
function $(sel) {
    const doc = frame.contentDocument;
    if (!doc) throw new Error('iframe not ready');
    return doc.querySelector(sel);
}
function $$(sel) {
    return Array.from(frame.contentDocument.querySelectorAll(sel));
}

/** Robust visibility check that works for position:fixed (where offsetParent is always null). */
function isVisible(el) {
    if (!el) return false;
    const win = frame.contentWindow;
    if (!win || !win.getComputedStyle) return false;
    try {
        const cs = win.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    } catch (e) { return false; }
}

function waitFor(selector, timeout = 5000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tick = () => {
            const el = $(selector);
            if (el && isVisible(el)) return resolve(el);
            if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for ' + selector + ' — ' + diagnoseIframe()));
            setTimeout(tick, 50);
        };
        tick();
    });
}

/** When something times out, this helps us understand what IS visible. */
function diagnoseIframe() {
    try {
        const doc = frame.contentDocument;
        if (!doc) return 'iframe document inaccessible';
        const v = (sel) => isVisible(doc.querySelector(sel));
        const bits = [];
        if (v('#auth-page')) bits.push('AUTH page visible');
        if (v('#landing'))   bits.push('landing visible');
        if (v('#wizard'))    bits.push('wizard visible');
        if (v('#page-dash')) bits.push('dashboard active');
        if (v('#page-journal.active')) bits.push('journal active');
        const fbEnabled = frame.contentWindow.FIREBASE_ENABLED;
        bits.push('FIREBASE_ENABLED=' + fbEnabled);
        try { bits.push('settings=' + (frame.contentWindow.localStorage.getItem('settings') ? 'present' : 'empty')); } catch(e){}
        return bits.join(' · ') || 'page-state unknown';
    } catch (e) { return 'diag-error: ' + e.message; }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function reloadFrame() {
    // Use src reassignment instead of location.reload() — works in more contexts
    return new Promise(resolve => {
        frame.onload = () => { setTimeout(resolve, 350); };
        frame.src = frame.src;
    });
}

async function clearAndReload() {
    try {
        frame.contentWindow.localStorage.clear();
        if (frame.contentWindow.indexedDB) {
            try { frame.contentWindow.indexedDB.databases?.().then(dbs => dbs.forEach(db => frame.contentWindow.indexedDB.deleteDatabase(db.name))); } catch(e){}
        }
    } catch (e) { /* cross-origin or not loaded */ }
    return reloadFrame();
}

/* ---------- Sanity check at boot — detect file:// protocol ---------- */
function checkProtocol() {
    if (location.protocol === 'file:') {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position:fixed; top:0; left:0; right:0; z-index:99999;
            background:#BC3535; color:#fff; padding:14px 20px;
            font-family:-apple-system,sans-serif; font-size:.92rem;
            line-height:1.5; box-shadow:0 4px 16px rgba(0,0,0,.4);
        `;
        banner.innerHTML = `
            <strong>⚠️ Le runner doit être servi via HTTP local, pas en double-clic.</strong><br>
            Ouvre PowerShell dans le dossier du projet et lance :
            <code style="background:rgba(0,0,0,.25);padding:2px 6px;border-radius:4px;font-family:monospace;">python -m http.server 8000</code>
            puis ouvre <code style="background:rgba(0,0,0,.25);padding:2px 6px;border-radius:4px;font-family:monospace;">http://localhost:8000/tests/</code><br>
            <small style="opacity:.8;">Raison technique : la politique CORS du navigateur empêche l'iframe de fonctionner sous protocole <code>file://</code>.</small>
        `;
        document.body.appendChild(banner);
        document.body.style.paddingTop = '90px';
        return false;
    }
    return true;
}

/* ---------- Test context (passed to each scenario) ---------- */
function makeCtx() {
    const ctx = {
        tapCount: 0,
        steps: [],
        startedAt: 0,

        // DOM access
        $, $$,

        // Wait
        wait, waitFor,

        // Assertions
        exists: (sel) => !!$(sel),
        visible: (sel) => { const el = $(sel); return el && el.offsetParent !== null; },
        text: (sel) => { const el = $(sel); return el ? el.textContent.trim() : ''; },

        // Actions (count taps)
        async click(sel) {
            const el = await waitFor(sel);
            this.tapCount++;
            log(`  click ${sel}`, 'step');
            el.click();
            await wait(180);
        },
        async type(sel, value) {
            const el = await waitFor(sel);
            el.focus();
            el.value = String(value);
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            log(`  type ${sel} → ${value}`, 'step');
            await wait(80);
        },
        async pressEnter(sel) {
            const el = sel ? await waitFor(sel) : frame.contentDocument.activeElement;
            if (!el) return;
            el.focus();
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await wait(120);
        },

        // App state
        getStorage(key) {
            try { return JSON.parse(frame.contentWindow.localStorage.getItem(key)); }
            catch(e) { return null; }
        },
        setStorage(key, val) {
            frame.contentWindow.localStorage.setItem(key, JSON.stringify(val));
        },

        // Utility
        assert(cond, msg) {
            if (!cond) throw new Error('Assertion failed: ' + msg);
            log(`  ✓ ${msg}`, 'pass');
        },
    };
    return ctx;
}

/* ---------- Run one scenario ---------- */
async function runOne(idx) {
    if (_running) { log('⚠ already running', 'warn'); return; }
    _running = true; _abort = false;
    btnRunAll.disabled = true;

    const scenario = SCENARIOS[idx];
    log(`▶ ${scenario.id} — ${scenario.name}`, 'info');
    setStatus(idx, 'running');
    overlay.classList.add('show');
    overlayTxt.textContent = scenario.name;

    const ctx = makeCtx();
    const t0 = Date.now();

    try {
        if (scenario.fresh !== false) await clearAndReload();
        else await wait(300);
        await scenario.run(ctx);
        const elapsed = Date.now() - t0;
        log(`✅ PASS — ${elapsed}ms · ${ctx.tapCount} taps`, 'pass');
        setStatus(idx, 'pass', elapsed);
        stats.pass++;
        stats.time += elapsed;
    } catch (e) {
        const elapsed = Date.now() - t0;
        log(`❌ FAIL — ${e.message || e}`, 'fail');
        log(`   ${e.stack ? e.stack.split('\n')[1]?.trim() : ''}`, 'fail');
        setStatus(idx, 'fail', elapsed);
        stats.fail++;
        stats.time += elapsed;
    }
    stats.total++;
    updateStats();
    overlay.classList.remove('show');
    _running = false;
    btnRunAll.disabled = false;
}

/* ---------- Run all ---------- */
async function runAll() {
    resetStats();
    SCENARIOS.forEach((_, i) => setStatus(i, 'idle'));
    log('=== Running ' + SCENARIOS.length + ' scenarios ===', 'info');
    for (let i = 0; i < SCENARIOS.length; i++) {
        if (_abort) break;
        await runOne(i);
        await wait(150);
    }
    log(`=== DONE — ${stats.pass}/${stats.total} passed in ${stats.time}ms ===`, stats.fail === 0 ? 'pass' : 'warn');
}

/* ---------- Wire up ---------- */
btnRunAll.addEventListener('click', runAll);
btnReset.addEventListener('click', clearAndReload);

// Wait for frame to be ready before populating
frame.addEventListener('load', () => {
    log('iframe ready', 'info');
});

renderList();
if (checkProtocol()) {

    // Robust cleanup at boot — SW + Cache Storage + IndexedDB
    bootCleanup().then(() => {
        log('Test runner ready. Click ▶ Run All or click any test individually.', 'info');
        // Cache-buster on iframe src
        try {
            const fresh = '../index.html?test=1&_cb=' + Date.now();
            if (frame.src.indexOf('_cb=') === -1) frame.src = fresh;
        } catch (e) {}
    });

    // Capture iframe JS errors so we can see crashes
    window.addEventListener('message', (e) => {
        if (e.data && e.data._iframeError) log('iframe error: ' + e.data._iframeError, 'fail');
    });
    frame.addEventListener('load', () => {
        try {
            frame.contentWindow.addEventListener('error', (ev) => {
                log('iframe JS error: ' + (ev.message || ev) + ' @ ' + ev.filename + ':' + ev.lineno, 'fail');
            });
        } catch(e) {}
    });
} else {
    log('⚠️ Protocole file:// détecté — voir bandeau rouge en haut.', 'fail');
}

async function bootCleanup() {
    // 1. Unregister all SWs
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister().catch(() => {})));
            if (regs.length) log(`Unregistered ${regs.length} service worker(s).`, 'warn');
        } catch(e) {}
    }
    // 2. Clear all CacheStorage entries (this is what the SW populated)
    if (window.caches && caches.keys) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
            if (keys.length) log(`Cleared ${keys.length} cache storage entries.`, 'warn');
        } catch(e) {}
    }
}

})();
