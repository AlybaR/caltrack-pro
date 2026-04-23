/* ============================================================
   wizard.js — 3-step wizard (v3) + prénom support
   ============================================================ */

function wizGo(step, dir = 1) {
    const current = [1, 2, 3].find(i => document.getElementById('ws' + i).classList.contains('active'));
    const outEl = document.getElementById('ws' + current);
    const inEl = document.getElementById('ws' + step);
    [1, 2, 3].forEach(i => {
        const dot = document.getElementById('wd' + i);
        dot.classList.toggle('done', i <= step);
        dot.classList.toggle('current', i === step);
    });
    outEl.classList.remove('active');
    inEl.classList.toggle('slide-left', dir < 0);
    inEl.classList.add('active');
    setTimeout(() => inEl.classList.remove('slide-left'), 400);
    if (step === 3) updateRecap();
}

function wizGo2() { if (!validateStep1()) return; wizGo(2, 1); }
function wizGo3() { wizGo(3, 1); }

function wizFinish() {
    const age = parseFloat(document.getElementById('w-age').value);
    const h = parseFloat(document.getElementById('w-height').value);
    const w = parseFloat(document.getElementById('w-weight').value);
    const g = parseFloat(document.getElementById('w-goal').value);
    const bf = parseFloat(document.getElementById('w-bf').value);
    const name = document.getElementById('w-name').value.trim() || 'Toi';
    if ([age, h, w, g].some(isNaN)) { wizGo(1, -1); return; }
    const sexe = document.querySelector('input[name=sexe]:checked').value;
    const act = parseFloat(document.querySelector('input[name=act]:checked').value);
    const rythme = parseInt(document.querySelector('input[name=rythme]:checked').value);
    const mp = document.querySelector('input[name=mp]:checked').value;
    const cyc = document.querySelector('input[name=cyc]:checked').value;
    S = { age, h, w, g, bf: isNaN(bf) ? null : bf, sexe, act, rythme, mp, cyc, name };
    lsSave('settings', S);
    launchApp();
}

function resetWizard() {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('wizard').style.display = 'flex';
    document.getElementById('bot-nav').style.display = 'none';
    const sideNav = document.getElementById('side-nav');
    if (sideNav) sideNav.style.display = 'none';
    ['dash', 'journal', 'poids', 'suivi', 'settings'].forEach(p =>
        document.getElementById('page-' + p).classList.remove('active')
    );
    prefillWizard();
    wizGo(1, -1);
}

function prefillWizard() {
    if (!S.age) return;
    ['age', 'height', 'weight', 'goal', 'bf'].forEach(f => {
        const el = document.getElementById('w-' + f);
        if (el) el.value = ({ age: S.age, height: S.h, weight: S.w, goal: S.g, bf: S.bf })[f] || '';
    });
    const nameEl = document.getElementById('w-name');
    if (nameEl) nameEl.value = S.name || '';
    [['sexe', S.sexe], ['act', S.act], ['rythme', S.rythme], ['mp', S.mp], ['cyc', S.cyc]].forEach(([n, v]) => {
        const r = document.querySelector(`input[name=${n}][value="${v}"]`);
        if (r) r.checked = true;
    });
}

function validateStep1() {
    let ok = true;
    [{ id: 'w-age', min: 10, max: 100 }, { id: 'w-height', min: 120, max: 250 }, { id: 'w-weight', min: 30, max: 300 }, { id: 'w-goal', min: 30, max: 300 }]
        .forEach(f => {
            const v = parseFloat(document.getElementById(f.id).value);
            validateField(f.id, v, f.min, f.max);
            if (isNaN(v) || v < f.min || v > f.max) ok = false;
        });
    return ok;
}

function validateField(id, val, min, max) {
    const input = document.getElementById(id);
    const hint = document.getElementById('hint-' + id);
    const isOk = !isNaN(val) && val >= min && val <= max;
    input.classList.toggle('valid', isOk);
    input.classList.toggle('invalid', !isOk && !isNaN(val));
    if (hint) { hint.textContent = isOk ? '✓' : (!isNaN(val) ? `Entre ${min} et ${max}` : ''); hint.className = 'field-hint ' + (isOk ? 'ok' : 'err'); }
}

function updateImcBadge() {
    const h = parseFloat(document.getElementById('w-height').value);
    const w = parseFloat(document.getElementById('w-weight').value);
    const badge = document.getElementById('imc-badge');
    if (!badge) return;
    const imc = calcIMC(w, h);
    if (!imc) { badge.style.display = 'none'; return; }
    badge.className = 'imc-badge ' + imc.cls;
    badge.textContent = `IMC ${imc.val.toFixed(1)} — ${imc.label}`;
    badge.style.display = '';
}

function initWizardListeners() {
    [{ id: 'w-age', min: 10, max: 100 }, { id: 'w-height', min: 120, max: 250 }, { id: 'w-weight', min: 30, max: 300 }, { id: 'w-goal', min: 30, max: 300 }]
        .forEach(f => {
            document.getElementById(f.id).addEventListener('input', () => {
                validateField(f.id, parseFloat(document.getElementById(f.id).value), f.min, f.max);
                updateImcBadge();
            });
        });
    document.querySelectorAll('input[name=rythme]').forEach(r => {
        r.addEventListener('change', () => {
            const warn = document.getElementById('rythme-warn');
            if (warn) warn.style.display = r.value === '1000' ? '' : 'none';
        });
    });
}

function updateRecap() {
    const recap = document.getElementById('wiz-recap');
    if (!recap) return;
    const ACT = { '1.2': 'Sédentaire', '1.375': 'Légèrement actif', '1.55': 'Modérément actif', '1.725': 'Très actif', '1.9': 'Athlète' };
    const name = document.getElementById('w-name').value.trim() || '—';
    const sexeV = document.querySelector('input[name=sexe]:checked')?.value;
    const actV = document.querySelector('input[name=act]:checked')?.value;
    recap.innerHTML = `
    <div class="wiz-sum-row"><span class="k">Prénom</span><span class="v">${name}</span></div>
    <div class="wiz-sum-row"><span class="k">Profil</span><span class="v">${sexeV === 'h' ? 'Homme' : 'Femme'}, ${document.getElementById('w-age').value || '—'} ans</span></div>
    <div class="wiz-sum-row"><span class="k">Corps</span><span class="v">${document.getElementById('w-height').value || '—'} cm · ${document.getElementById('w-weight').value || '—'} → ${document.getElementById('w-goal').value || '—'} kg</span></div>
    <div class="wiz-sum-row"><span class="k">Activité</span><span class="v">${ACT[actV] || '—'}</span></div>`;
}
