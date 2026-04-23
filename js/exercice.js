/* ============================================================
   exercice.js — Exercise tracking (v1)
   Presets by category · kcal/h scaled to user weight · CRUD
   ============================================================ */

const EX_CATS = {
    '🏃 Cardio': [
        { n: 'Course à pied',    kcal_h: 550 },
        { n: 'Vélo extérieur',   kcal_h: 480 },
        { n: 'Natation',         kcal_h: 520 },
        { n: 'Marche rapide',    kcal_h: 280 },
        { n: 'Corde à sauter',   kcal_h: 600 },
        { n: 'Elliptique',       kcal_h: 420 },
        { n: 'Rameur',           kcal_h: 500 },
        { n: 'HIIT',             kcal_h: 640 },
    ],
    '💪 Musculation': [
        { n: 'Musculation légère',   kcal_h: 260 },
        { n: 'Musculation intense',  kcal_h: 380 },
        { n: 'Crossfit',             kcal_h: 500 },
        { n: 'Circuit training',     kcal_h: 440 },
        { n: 'Calisthenics',         kcal_h: 350 },
    ],
    '⚽ Sport': [
        { n: 'Football',    kcal_h: 480 },
        { n: 'Basketball',  kcal_h: 440 },
        { n: 'Tennis',      kcal_h: 420 },
        { n: 'Handball',    kcal_h: 480 },
        { n: 'Badminton',   kcal_h: 360 },
        { n: 'Padel',       kcal_h: 380 },
        { n: 'Boxe',        kcal_h: 520 },
    ],
    '🧘 Bien-être': [
        { n: 'Yoga',        kcal_h: 200 },
        { n: 'Pilates',     kcal_h: 220 },
        { n: 'Tai-chi',     kcal_h: 180 },
        { n: 'Stretching',  kcal_h: 130 },
    ],
};

let _exActiveCat = '🏃 Cardio';
let _exManualOpen = false;

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */
function exKcal(kcal_h, dur_min) {
    const w = S.w || 70;
    return Math.round((kcal_h * dur_min / 60) * (w / 70));
}

/* ---------------------------------------------------------------
   Main render — called by renderJournal()
   --------------------------------------------------------------- */
function renderExercice() {
    const dk = getJournalKey();
    const day = getDay(dk);
    const exList = day.exercises || [];
    const burned = exList.reduce((s, e) => s + e.kcal, 0);

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

            <!-- Category tabs -->
            <div class="ex-cats" id="ex-cats"></div>

            <!-- Preset grid -->
            <div class="ex-preset-grid" id="ex-preset-grid"></div>

            <!-- Duration input (shown after preset click) -->
            <div class="ex-dur-row" id="ex-dur-row" style="display:none">
                <span class="ex-dur-label" id="ex-dur-label">Course à pied</span>
                <input type="number" id="ex-dur-input" placeholder="min" min="1" max="600" class="ex-dur-input"
                       onkeydown="if(event.key==='Enter') confirmExPreset()" />
                <button class="btn btn-acc btn-sm" onclick="confirmExPreset()">+ Ajouter</button>
                <button class="btn btn-ghost btn-sm" onclick="cancelExPreset()">✕</button>
            </div>

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

            <!-- Exercise list -->
            <div class="ex-list" id="ex-list"></div>
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
        b.innerHTML = `<span class="ex-p-name">${ex.n}</span><span class="ex-p-rate">~${ex.kcal_h} kcal/h</span>`;
        b.onclick = () => selectExPreset(ex);
        grid.appendChild(b);
    });
}

/* ---------------------------------------------------------------
   Preset selection flow
   --------------------------------------------------------------- */
let _selectedPreset = null;

function selectExPreset(ex) {
    _selectedPreset = ex;
    const row = document.getElementById('ex-dur-row');
    const lbl = document.getElementById('ex-dur-label');
    const inp = document.getElementById('ex-dur-input');
    if (!row || !lbl || !inp) return;
    lbl.textContent = ex.n;
    row.style.display = 'flex';
    inp.value = '';
    setTimeout(() => inp.focus(), 50);
}

function confirmExPreset() {
    if (!_selectedPreset) return;
    const dur = parseInt(document.getElementById('ex-dur-input')?.value, 10);
    if (!dur || dur < 1) { showToast('⚠️ Durée invalide'); return; }
    const kcal = exKcal(_selectedPreset.kcal_h, dur);
    addExEntry({ n: _selectedPreset.n, kcal, dur });
    _selectedPreset = null;
    cancelExPreset();
}

function cancelExPreset() {
    const row = document.getElementById('ex-dur-row');
    if (row) row.style.display = 'none';
    _selectedPreset = null;
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
    addExEntry({ n, kcal, dur: null });
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
    showToast(`🔥 ${entry.kcal} kcal brûlées ajoutées`);
    renderJournal();
    if (document.getElementById('page-dash').classList.contains('active')) renderDash();
}

function deleteEx(idx) {
    const dk = getJournalKey();
    const day = getDay(dk);
    if (!day.exercises) return;
    day.exercises.splice(idx, 1);
    saveDay(dk, day);
    renderJournal();
    if (document.getElementById('page-dash').classList.contains('active')) renderDash();
}

/* ---------------------------------------------------------------
   Render exercise list
   --------------------------------------------------------------- */
function renderExList(exList) {
    const el = document.getElementById('ex-list');
    if (!el) return;
    if (!exList || exList.length === 0) {
        el.innerHTML = `<div class="empty-state">Aucun exercice — sélectionne une activité ci-dessus.</div>`;
        return;
    }
    el.innerHTML = exList.map((e, i) => `
        <div class="ex-item">
            <span class="ex-item-name">${e.n}${e.dur ? ` · ${e.dur} min` : ''}</span>
            <span class="ex-item-right">
                <span class="ex-item-kcal">🔥 ${e.kcal} kcal</span>
                <button class="food-del" onclick="deleteEx(${i})" title="Supprimer">✕</button>
            </span>
        </div>`).join('');
}

/* ---------------------------------------------------------------
   Section open/close toggle
   --------------------------------------------------------------- */
let _exSectionOpen = true;

function toggleExSection() {
    _exSectionOpen = !_exSectionOpen;
    renderExercice();
}
