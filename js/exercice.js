/* ============================================================
   exercice.js — Exercise tracking v2
   Supports: cardio (distance + HR), strength (sets × reps × weight),
   sport, wellness. Backwards-compatible with v1 entries.
   ============================================================ */

const EX_CATS = {
    '🏃 Cardio': [
        { n: 'Course à pied',    kcal_h: 550, type: 'cardio' },
        { n: 'Vélo extérieur',   kcal_h: 480, type: 'cardio' },
        { n: 'Natation',         kcal_h: 520, type: 'cardio' },
        { n: 'Marche rapide',    kcal_h: 280, type: 'cardio' },
        { n: 'Corde à sauter',   kcal_h: 600, type: 'cardio' },
        { n: 'Elliptique',       kcal_h: 420, type: 'cardio' },
        { n: 'Rameur',           kcal_h: 500, type: 'cardio' },
        { n: 'HIIT',             kcal_h: 640, type: 'cardio' },
    ],
    '🏋️ Muscu — Exercices': [
        { n: 'Développé couché',     type: 'strength', muscle: 'Pectoraux' },
        { n: 'Squat',                type: 'strength', muscle: 'Jambes' },
        { n: 'Soulevé de terre',     type: 'strength', muscle: 'Dos' },
        { n: 'Tractions',            type: 'strength', muscle: 'Dos' },
        { n: 'Pompes',               type: 'strength', muscle: 'Pectoraux' },
        { n: 'Dips',                 type: 'strength', muscle: 'Triceps' },
        { n: 'Développé militaire',  type: 'strength', muscle: 'Épaules' },
        { n: 'Rowing barre',         type: 'strength', muscle: 'Dos' },
        { n: 'Curl biceps',          type: 'strength', muscle: 'Biceps' },
        { n: 'Extension triceps',    type: 'strength', muscle: 'Triceps' },
        { n: 'Leg press',            type: 'strength', muscle: 'Jambes' },
        { n: 'Fentes',               type: 'strength', muscle: 'Jambes' },
        { n: 'Gainage (s)',          type: 'strength', muscle: 'Core', unit: 's' },
        { n: 'Abdos crunch',         type: 'strength', muscle: 'Core' },
    ],
    '💪 Muscu — Séance': [
        { n: 'Musculation légère',   kcal_h: 260, type: 'session' },
        { n: 'Musculation intense',  kcal_h: 380, type: 'session' },
        { n: 'Crossfit',             kcal_h: 500, type: 'session' },
        { n: 'Circuit training',     kcal_h: 440, type: 'session' },
        { n: 'Calisthenics',         kcal_h: 350, type: 'session' },
    ],
    '⚽ Sport': [
        { n: 'Football',    kcal_h: 480, type: 'cardio' },
        { n: 'Basketball',  kcal_h: 440, type: 'cardio' },
        { n: 'Tennis',      kcal_h: 420, type: 'cardio' },
        { n: 'Handball',    kcal_h: 480, type: 'cardio' },
        { n: 'Badminton',   kcal_h: 360, type: 'cardio' },
        { n: 'Padel',       kcal_h: 380, type: 'cardio' },
        { n: 'Boxe',        kcal_h: 520, type: 'cardio' },
    ],
    '🧘 Bien-être': [
        { n: 'Yoga',        kcal_h: 200, type: 'cardio' },
        { n: 'Pilates',     kcal_h: 220, type: 'cardio' },
        { n: 'Tai-chi',     kcal_h: 180, type: 'cardio' },
        { n: 'Stretching',  kcal_h: 130, type: 'cardio' },
    ],
};

let _exActiveCat = '🏃 Cardio';
let _exManualOpen = false;
let _exSectionOpen = true;
let _selectedPreset = null;
let _pendingSets = []; // Working set list for strength entries

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */
function exKcal(kcal_h, dur_min) {
    const w = S.w || 70;
    return Math.round((kcal_h * dur_min / 60) * (w / 70));
}

// Total strength volume (kg lifted) across sets
function strengthVolume(sets) {
    return (sets || []).reduce((s, x) => s + (x.reps || 0) * (x.weight || 0), 0);
}

// Kcal estimate for strength: ~0.06 kcal per kg lifted (approx)
function strengthKcal(sets) {
    return Math.round(strengthVolume(sets) * 0.06);
}

// Epley 1RM estimate
function estimate1RM(reps, weight) {
    if (!reps || !weight) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
}

// Best 1RM from all sets of one exercise entry
function bestSet1RM(sets) {
    return (sets || []).reduce((m, s) => Math.max(m, estimate1RM(s.reps, s.weight)), 0);
}

/* ---------------------------------------------------------------
   Main render — called by renderJournal()
   --------------------------------------------------------------- */
function renderExercice() {
    const dk = getJournalKey();
    const day = getDay(dk);
    const exList = day.exercises || [];
    const burned = exList.reduce((s, e) => s + (e.kcal || 0), 0);

    const container = document.getElementById('exercice-section');
    if (!container) return;

    container.innerHTML = `
        <div class="ex-header" onclick="toggleExSection()">
            <div class="ex-header-left">
                <span class="ex-header-icon">🔥</span>
                <span class="ex-header-title">Exercice</span>
                ${burned > 0 ? `<span class="ex-burned-badge">+${burned} kcal brûlées</span>` : ''}
            </div>
            <span class="ex-header-arrow" id="ex-arrow">${_exSectionOpen ? '▼' : '▶'}</span>
        </div>

        <div class="ex-body" id="ex-body" style="display:${_exSectionOpen ? 'block' : 'none'}">

            <!-- Exercise list (history FIRST) -->
            <div class="ex-list" id="ex-list"></div>

            ${exList.length > 0 ? `<div class="meal-divider"><span>Ajouter</span></div>` : ''}

            <!-- Category tabs -->
            <div class="ex-cats" id="ex-cats"></div>

            <!-- Preset grid -->
            <div class="ex-preset-grid" id="ex-preset-grid"></div>

            <!-- Duration/details panel (shown after preset click) -->
            <div class="ex-detail-panel" id="ex-detail-panel" style="display:none"></div>

            <!-- Manual toggle -->
            <button class="ex-manual-toggle" onclick="toggleExManual()">
                ${_exManualOpen ? '▲ Masquer saisie manuelle' : '✏️ Saisie manuelle'}
            </button>

            <!-- Manual entry -->
            <div class="ex-manual-row" id="ex-manual-row" style="display:${_exManualOpen ? 'flex' : 'none'}">
                <input type="text"   id="ex-m-name"  placeholder="Nom de l'activité" class="ex-m-input-n"/>
                <input type="number" id="ex-m-kcal"  placeholder="kcal brûlées" min="1" max="9999" class="ex-m-input-k"
                       onkeydown="if(event.key==='Enter') addExManual()"/>
                <button class="btn btn-acc btn-sm" onclick="addExManual()">+ Ajouter</button>
            </div>
        </div>
    `;

    // Render category tabs
    const catsEl = document.getElementById('ex-cats');
    Object.keys(EX_CATS).forEach(cat => {
        const b = document.createElement('button');
        b.className = 'ex-cat-btn' + (cat === _exActiveCat ? ' active' : '');
        b.textContent = cat;
        b.onclick = () => { _exActiveCat = cat; renderExerciceGrid(); };
        catsEl.appendChild(b);
    });

    renderExerciceGrid();
    renderExList(exList);
}

function renderExerciceGrid() {
    const grid = document.getElementById('ex-preset-grid');
    if (!grid) return;
    const presets = EX_CATS[_exActiveCat] || [];
    grid.innerHTML = '';
    presets.forEach(ex => {
        const b = document.createElement('button');
        b.className = 'ex-preset-btn';
        const rate = ex.kcal_h ? `<span class="ex-p-rate">~${ex.kcal_h} kcal/h</span>`
                   : ex.muscle ? `<span class="ex-p-rate">${ex.muscle}</span>`
                   : '';
        b.innerHTML = `<span class="ex-p-name">${ex.n}</span>${rate}`;
        b.onclick = () => selectExPreset(ex);
        grid.appendChild(b);
    });
    // Close any open detail panel when switching category
    const p = document.getElementById('ex-detail-panel');
    if (p) p.style.display = 'none';
    _selectedPreset = null;
}

/* ---------------------------------------------------------------
   Preset selection → type-specific flow
   --------------------------------------------------------------- */
function selectExPreset(ex) {
    _selectedPreset = ex;
    _pendingSets = [];
    const panel = document.getElementById('ex-detail-panel');
    if (!panel) return;

    if (ex.type === 'strength') {
        panel.innerHTML = renderStrengthForm(ex);
        setTimeout(() => document.getElementById('ex-set-reps')?.focus(), 50);
    } else if (ex.type === 'cardio') {
        panel.innerHTML = renderCardioForm(ex);
        setTimeout(() => document.getElementById('ex-c-dur')?.focus(), 50);
    } else {
        // session (muscu-séance) or other — just duration
        panel.innerHTML = renderSessionForm(ex);
        setTimeout(() => document.getElementById('ex-s-dur')?.focus(), 50);
    }
    panel.style.display = 'block';
}

/* ---------- Cardio form: duration + distance + HR ---------- */
function renderCardioForm(ex) {
    return `
        <div class="ex-form-title">${ex.n}</div>
        <div class="ex-form-row">
            <label class="ex-form-lbl">⏱ Durée</label>
            <input type="number" id="ex-c-dur" placeholder="min" min="1" max="600" class="ex-form-input"
                   onkeydown="if(event.key==='Enter') confirmCardio()"/>
            <span class="ex-form-unit">min</span>
        </div>
        <div class="ex-form-row">
            <label class="ex-form-lbl">📏 Distance <span class="ex-form-opt">(optionnel)</span></label>
            <input type="number" id="ex-c-dist" placeholder="ex: 5" step=".1" min="0" max="500" class="ex-form-input"/>
            <span class="ex-form-unit">km</span>
        </div>
        <div class="ex-form-row">
            <label class="ex-form-lbl">❤️ FC moyenne <span class="ex-form-opt">(optionnel)</span></label>
            <input type="number" id="ex-c-hr" placeholder="ex: 140" min="40" max="220" class="ex-form-input"/>
            <span class="ex-form-unit">bpm</span>
        </div>
        <div class="ex-form-actions">
            <button class="btn btn-acc btn-sm" onclick="confirmCardio()">✓ Ajouter</button>
            <button class="btn btn-ghost btn-sm" onclick="cancelExPreset()">✕ Annuler</button>
        </div>
    `;
}

function confirmCardio() {
    if (!_selectedPreset) return;
    const dur = parseInt(document.getElementById('ex-c-dur')?.value, 10);
    if (!dur || dur < 1) { showToast('⚠️ Durée invalide'); return; }
    const dist = parseFloat(document.getElementById('ex-c-dist')?.value) || null;
    const hr = parseInt(document.getElementById('ex-c-hr')?.value, 10) || null;
    const kcal = exKcal(_selectedPreset.kcal_h, dur);
    const entry = { n: _selectedPreset.n, kcal, dur, type: 'cardio' };
    if (dist) entry.dist = dist;
    if (hr) entry.hr = hr;
    addExEntry(entry);
    cancelExPreset();
}

/* ---------- Session form: just duration (legacy) ---------- */
function renderSessionForm(ex) {
    return `
        <div class="ex-form-title">${ex.n}</div>
        <div class="ex-form-row">
            <label class="ex-form-lbl">⏱ Durée</label>
            <input type="number" id="ex-s-dur" placeholder="min" min="1" max="600" class="ex-form-input"
                   onkeydown="if(event.key==='Enter') confirmSession()"/>
            <span class="ex-form-unit">min</span>
        </div>
        <div class="ex-form-actions">
            <button class="btn btn-acc btn-sm" onclick="confirmSession()">✓ Ajouter</button>
            <button class="btn btn-ghost btn-sm" onclick="cancelExPreset()">✕ Annuler</button>
        </div>
    `;
}

function confirmSession() {
    if (!_selectedPreset) return;
    const dur = parseInt(document.getElementById('ex-s-dur')?.value, 10);
    if (!dur || dur < 1) { showToast('⚠️ Durée invalide'); return; }
    const kcal = exKcal(_selectedPreset.kcal_h, dur);
    addExEntry({ n: _selectedPreset.n, kcal, dur, type: 'session' });
    cancelExPreset();
}

/* ---------- Strength form: sets × reps × weight ---------- */
function renderStrengthForm(ex) {
    const isBodyweight = ex.n === 'Pompes' || ex.n === 'Tractions' || ex.n === 'Dips' || ex.n === 'Abdos crunch' || ex.n === 'Gainage (s)';
    const weightPlaceholder = isBodyweight ? '0 si poids du corps' : 'ex: 60';
    const repsLabel = ex.unit === 's' ? 'Secondes' : 'Reps';
    const lastBest = getLastBest(ex.n); // Last session's volume / 1RM for motivation

    return `
        <div class="ex-form-title">${ex.n} ${ex.muscle ? `<span class="ex-form-muscle">· ${ex.muscle}</span>` : ''}</div>
        ${lastBest ? `<div class="ex-form-hint">💡 Dernière séance : ${lastBest}</div>` : ''}
        <div class="ex-sets-list" id="ex-sets-list"></div>
        <div class="ex-form-row ex-set-row">
            <div class="ex-set-input-group">
                <label class="ex-form-lbl-sm">${repsLabel}</label>
                <input type="number" id="ex-set-reps" placeholder="ex: 10" min="1" max="999" class="ex-form-input-sm"
                       onkeydown="if(event.key==='Enter') document.getElementById('ex-set-weight').focus()"/>
            </div>
            <span class="ex-set-x">×</span>
            <div class="ex-set-input-group">
                <label class="ex-form-lbl-sm">Poids (kg)</label>
                <input type="number" id="ex-set-weight" placeholder="${weightPlaceholder}" step=".5" min="0" max="999" class="ex-form-input-sm"
                       onkeydown="if(event.key==='Enter') addPendingSet()"/>
            </div>
            <button class="btn btn-acc btn-sm ex-add-set-btn" onclick="addPendingSet()">+</button>
        </div>
        <div class="ex-form-actions">
            <button class="btn btn-acc btn-sm" onclick="confirmStrength()">✓ Enregistrer</button>
            <button class="btn btn-ghost btn-sm" onclick="cancelExPreset()">✕ Annuler</button>
        </div>
    `;
}

function addPendingSet() {
    const reps = parseInt(document.getElementById('ex-set-reps')?.value, 10);
    const weight = parseFloat(document.getElementById('ex-set-weight')?.value) || 0;
    if (!reps || reps < 1) { showToast('⚠️ Reps manquants'); return; }
    _pendingSets.push({ reps, weight });
    renderPendingSets();
    // Clear inputs, keep weight for next set
    document.getElementById('ex-set-reps').value = '';
    document.getElementById('ex-set-reps').focus();
}

function removePendingSet(i) {
    _pendingSets.splice(i, 1);
    renderPendingSets();
}

function renderPendingSets() {
    const el = document.getElementById('ex-sets-list');
    if (!el) return;
    if (_pendingSets.length === 0) { el.innerHTML = ''; return; }
    const vol = strengthVolume(_pendingSets);
    const kcal = strengthKcal(_pendingSets);
    el.innerHTML = `
        <div class="ex-sets-hd">${_pendingSets.length} série${_pendingSets.length > 1 ? 's' : ''} · Volume ${vol}kg · ~${kcal} kcal</div>
        ${_pendingSets.map((s, i) => `
            <div class="ex-set-pill">
                <span class="ex-set-n">#${i + 1}</span>
                <span class="ex-set-val">${s.reps} × ${s.weight}kg</span>
                <button class="ex-set-del" onclick="removePendingSet(${i})" title="Retirer">✕</button>
            </div>
        `).join('')}
    `;
}

function confirmStrength() {
    if (!_selectedPreset) return;
    if (_pendingSets.length === 0) {
        // Allow adding from current input if user forgot to click "+"
        const reps = parseInt(document.getElementById('ex-set-reps')?.value, 10);
        const weight = parseFloat(document.getElementById('ex-set-weight')?.value) || 0;
        if (reps && reps > 0) _pendingSets.push({ reps, weight });
    }
    if (_pendingSets.length === 0) { showToast('⚠️ Ajoute au moins une série'); return; }
    const sets = [..._pendingSets];
    const kcal = strengthKcal(sets);
    addExEntry({
        n: _selectedPreset.n,
        muscle: _selectedPreset.muscle || null,
        kcal,
        type: 'strength',
        sets,
    });
    cancelExPreset();
}

/* ---------- Lookup: last session's best for this lift ---------- */
function getLastBest(exName) {
    const curKey = getJournalKey();
    const allDays = Object.keys(localStorage)
        .filter(k => k.startsWith('day_') && k !== 'day_' + curKey)
        .sort()
        .reverse();
    for (const k of allDays) {
        try {
            const day = JSON.parse(localStorage.getItem(k));
            const match = (day.exercises || []).find(e => e.n === exName && e.sets && e.sets.length > 0);
            if (match) {
                const vol = strengthVolume(match.sets);
                const bestSet = match.sets.reduce((m, s) => s.weight > m.weight ? s : m, match.sets[0]);
                return `${match.sets.length} séries · ${bestSet.reps}×${bestSet.weight}kg · Vol ${vol}kg`;
            }
        } catch {}
    }
    return null;
}

function cancelExPreset() {
    const panel = document.getElementById('ex-detail-panel');
    if (panel) panel.style.display = 'none';
    _selectedPreset = null;
    _pendingSets = [];
}

/* ---------------------------------------------------------------
   Manual entry
   --------------------------------------------------------------- */
function toggleExManual() {
    _exManualOpen = !_exManualOpen;
    renderExercice();
    if (_exManualOpen) setTimeout(() => document.getElementById('ex-m-name')?.focus(), 50);
}

function addExManual() {
    const n = (document.getElementById('ex-m-name')?.value || '').trim();
    const kcal = parseInt(document.getElementById('ex-m-kcal')?.value, 10);
    if (!n || !kcal || kcal < 1) { showToast('⚠️ Remplis le nom et les calories'); return; }
    addExEntry({ n, kcal, dur: null, type: 'manual' });
    document.getElementById('ex-m-name').value = '';
    document.getElementById('ex-m-kcal').value = '';
}

/* ---------------------------------------------------------------
   CRUD
   --------------------------------------------------------------- */
function addExEntry(entry) {
    const dk = getJournalKey();
    const day = getDay(dk);
    if (!day.exercises) day.exercises = [];
    day.exercises.push(entry);
    saveDay(dk, day);
    const msg = entry.type === 'strength' && entry.sets
        ? `🏋️ ${entry.sets.length} série${entry.sets.length > 1 ? 's' : ''} · ${strengthVolume(entry.sets)}kg`
        : `🔥 ${entry.kcal} kcal brûlées`;
    showToast(msg);
    renderSport();
    if (document.getElementById('page-dash').classList.contains('active')) renderDash();
    if (document.getElementById('page-journal').classList.contains('active')) renderJournal();
}

function deleteEx(idx) {
    const dk = getJournalKey();
    const day = getDay(dk);
    if (!day.exercises) return;
    day.exercises.splice(idx, 1);
    saveDay(dk, day);
    renderSport();
    if (document.getElementById('page-dash').classList.contains('active')) renderDash();
    if (document.getElementById('page-journal').classList.contains('active')) renderJournal();
}

/* ---------------------------------------------------------------
   Render exercise list (with type-specific details)
   --------------------------------------------------------------- */
function renderExList(exList) {
    const el = document.getElementById('ex-list');
    if (!el) return;
    if (!exList || exList.length === 0) {
        el.innerHTML = `<div class="empty-state meal-empty">🏋️ Aucun exercice encore<br><small>Choisis une activité ci-dessous ↓</small></div>`;
        return;
    }
    el.innerHTML = exList.map((e, i) => {
        let detail = '';
        if (e.type === 'strength' && e.sets) {
            const vol = strengthVolume(e.sets);
            const setStr = e.sets.map(s => `${s.reps}×${s.weight}`).join(' · ');
            detail = `<div class="ex-item-sub">🏋️ ${setStr} kg · Vol ${vol}kg</div>`;
        } else if (e.type === 'cardio' && (e.dist || e.hr)) {
            const parts = [];
            if (e.dur) parts.push(`${e.dur} min`);
            if (e.dist) parts.push(`${e.dist} km`);
            if (e.hr) parts.push(`❤️ ${e.hr} bpm`);
            detail = `<div class="ex-item-sub">${parts.join(' · ')}</div>`;
        } else if (e.dur) {
            detail = `<div class="ex-item-sub">${e.dur} min</div>`;
        }
        return `
        <div class="ex-item">
            <div class="ex-item-main">
                <span class="ex-item-name">${e.n}${e.muscle ? ` <span class="ex-item-muscle">${e.muscle}</span>` : ''}</span>
                ${detail}
            </div>
            <span class="ex-item-right">
                <span class="ex-item-kcal">🔥 ${e.kcal || 0}</span>
                <button class="food-del" onclick="deleteEx(${i})" title="Supprimer">✕</button>
            </span>
        </div>`;
    }).join('');
}

/* ---------------------------------------------------------------
   Section open/close toggle
   --------------------------------------------------------------- */
function toggleExSection() {
    _exSectionOpen = !_exSectionOpen;
    renderExercice();
}

/* ---------- Sport page dispatcher (called by showPage) ---------- */
function renderSport() {
    renderExercice();
    if (typeof renderProgression === 'function') renderProgression();
}
