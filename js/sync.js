/* ============================================================
   sync.js — localStorage ↔ Firestore bridge (bidirectional)
   Strategy:
   - On user ready: pull cloud state, or push local if cloud empty (migration).
   - Wrap lsSave/saveDay → also write to Firestore when key matters.
   - Realtime listeners on settings / weight-history / days → pull.
   - Conflict: last-write-wins (server timestamp).
   ============================================================ */

let _syncDb = null;
let _syncUid = null;
let _syncReady = false;
let _syncBusy = false;           // true = we're applying a remote update, don't re-push
const _syncUnsub = [];

/* Keys we care about syncing: */
const META_KEYS = ['settings', 'weight-history', 'theme', 'best-streak'];

/** Called by auth.js when user is authenticated. */
async function onUserReady(user) {
    _syncUid = user.uid;
    _syncDb = firebase.firestore();
    setSyncStatus('syncing');

    // Migration flow: if cloud has no settings, push local. Otherwise pull.
    const metaRef = _syncDb.collection('users').doc(_syncUid).collection('meta');
    const settingsSnap = await metaRef.doc('settings').get().catch(() => null);

    if (!settingsSnap || !settingsSnap.exists) {
        // Cloud empty → push whatever is in localStorage (may be nothing → fresh account)
        await pushAllLocalToCloud();
    } else {
        // Cloud exists → pull and overwrite local
        await pullAllFromCloud();
    }

    subscribeRealtime();
    _syncReady = true;
    setSyncStatus('ok');

    // Decide landing destination
    const saved = lsLoad('settings');
    if (saved && saved.target) {
        S = saved;
        launchApp();
    } else {
        // Brand-new user → show wizard
        document.getElementById('landing').style.display = '';
    }
}

/* ---------- Push all local → cloud (migration / fresh signup) ---------- */
async function pushAllLocalToCloud() {
    const batch = _syncDb.batch();
    const metaRef = _syncDb.collection('users').doc(_syncUid).collection('meta');
    const daysRef = _syncDb.collection('users').doc(_syncUid).collection('days');

    META_KEYS.forEach(k => {
        const v = lsLoad(k);
        if (v != null) batch.set(metaRef.doc(k), wrap(v));
    });

    // Walk all day_* keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('day_')) continue;
        const dk = key.slice(4);
        const v = lsLoad(key);
        if (v) batch.set(daysRef.doc(dk), wrap(v));
    }
    await batch.commit().catch(e => console.warn('Push failed:', e));
}

/* ---------- Pull all cloud → local (first login on new device) ---------- */
async function pullAllFromCloud() {
    _syncBusy = true;
    const metaRef = _syncDb.collection('users').doc(_syncUid).collection('meta');
    const daysRef = _syncDb.collection('users').doc(_syncUid).collection('days');

    // Pull meta docs
    for (const k of META_KEYS) {
        const snap = await metaRef.doc(k).get().catch(() => null);
        if (snap && snap.exists) {
            const { v } = snap.data();
            if (v !== undefined) localStorage.setItem(k, JSON.stringify(v));
        }
    }
    // Pull days
    const daysSnap = await daysRef.get().catch(() => null);
    if (daysSnap) {
        daysSnap.forEach(d => {
            const { v } = d.data();
            if (v !== undefined) localStorage.setItem('day_' + d.id, JSON.stringify(v));
        });
    }
    _syncBusy = false;
}

/* ---------- Realtime listeners ---------- */
function subscribeRealtime() {
    _syncUnsub.forEach(u => u());
    _syncUnsub.length = 0;
    const metaRef = _syncDb.collection('users').doc(_syncUid).collection('meta');
    const daysRef = _syncDb.collection('users').doc(_syncUid).collection('days');

    META_KEYS.forEach(k => {
        _syncUnsub.push(metaRef.doc(k).onSnapshot(snap => {
            if (!snap.exists || snap.metadata.hasPendingWrites) return;
            const { v } = snap.data();
            if (v === undefined) return;
            _syncBusy = true;
            localStorage.setItem(k, JSON.stringify(v));
            _syncBusy = false;
            if (k === 'settings') { S = v; refreshActivePage(); }
            else if (k === 'theme' && typeof applyTheme === 'function') applyTheme(v);
            else refreshActivePage();
        }));
    });

    _syncUnsub.push(daysRef.onSnapshot(snap => {
        snap.docChanges().forEach(ch => {
            if (ch.doc.metadata.hasPendingWrites) return;
            const dk = ch.doc.id;
            if (ch.type === 'removed') {
                localStorage.removeItem('day_' + dk);
            } else {
                const { v } = ch.doc.data();
                if (v !== undefined) {
                    _syncBusy = true;
                    localStorage.setItem('day_' + dk, JSON.stringify(v));
                    _syncBusy = false;
                }
            }
        });
        refreshActivePage();
    }));
}

/* ---------- Refresh helper ---------- */
function refreshActivePage() {
    const active = document.querySelector('.page.active');
    if (!active) return;
    const id = active.id.replace('page-', '');
    const fn = { dash: 'renderDash', journal: 'renderJournal', sport: 'renderSport',
                 corps: 'renderCorps', poids: 'renderPoids', suivi: 'renderSuivi',
                 settings: 'renderSettings' }[id];
    if (fn && typeof window[fn] === 'function') window[fn]();
}

/* ---------- Write wrapper (monkey-patch lsSave) ---------- */
(function () {
    const origLsSave = window.lsSave;
    window.lsSave = function (k, v) {
        origLsSave(k, v);
        if (!_syncReady || _syncBusy || !_syncUid) return;
        pushKey(k, v);
    };
})();

function pushKey(k, v) {
    if (!_syncDb) return;
    setSyncStatus('syncing');
    const metaRef = _syncDb.collection('users').doc(_syncUid).collection('meta');
    const daysRef = _syncDb.collection('users').doc(_syncUid).collection('days');
    let p;
    if (META_KEYS.includes(k)) {
        p = metaRef.doc(k).set(wrap(v));
    } else if (k.startsWith('day_')) {
        const dk = k.slice(4);
        p = daysRef.doc(dk).set(wrap(v));
    } else {
        return;
    }
    p.then(() => setSyncStatus('ok'))
     .catch(e => { console.warn('Sync push failed:', e); setSyncStatus('error'); });
}

function wrap(v) {
    return { v, _updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
}

/* ---------- Sync status indicator ---------- */
function setSyncStatus(state) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    const map = {
        syncing: { ico: '⟳', txt: 'Sync…', cls: 'sync-on' },
        ok:      { ico: '✓', txt: 'Sync',  cls: 'sync-ok' },
        error:   { ico: '⚠', txt: 'Erreur', cls: 'sync-err' },
        offline: { ico: '📴', txt: 'Offline', cls: 'sync-off' },
    };
    const s = map[state] || map.ok;
    el.className = 'sync-status ' + s.cls;
    el.innerHTML = `<span class="sync-ico">${s.ico}</span>${s.txt}`;
}

window.addEventListener('online', () => _syncReady && setSyncStatus('ok'));
window.addEventListener('offline', () => setSyncStatus('offline'));
