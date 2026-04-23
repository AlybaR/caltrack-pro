/* ============================================================
   body.js — Corps & Objectifs (Phase 3)
   C1 Mensurations · C2 Photos · O1 Objectifs SMART · O2 Jalons
   Storage keys: measures, photos, goals
   ============================================================ */

const BODY_PARTS = [
    { k: 'waist', n: 'Tour de taille', ico: '📏' },
    { k: 'hips',  n: 'Tour de hanches', ico: '📐' },
    { k: 'chest', n: 'Tour de poitrine', ico: '🫀' },
    { k: 'arm',   n: 'Tour de bras', ico: '💪' },
    { k: 'thigh', n: 'Tour de cuisse', ico: '🦵' },
    { k: 'neck',  n: 'Tour de cou', ico: '🧣' },
];

const GOAL_TYPES = {
    weight: { n: 'Poids cible', u: 'kg', ico: '⚖️' },
    waist:  { n: 'Tour de taille', u: 'cm', ico: '📏' },
    bodyfat:{ n: '% masse grasse', u: '%', ico: '🔥' },
    habit:  { n: 'Habitude (jours consécutifs)', u: 'jours', ico: '🔥' },
    custom: { n: 'Personnalisé', u: '', ico: '🎯' },
};

let _bodyTab = 'mensurations'; // mensurations | photos | objectifs

/* ---------- Storage ---------- */
function getMeasures() { return lsLoad('measures') || []; }
function saveMeasures(x) { lsSave('measures', x); }
function getPhotos() { return lsLoad('photos') || []; }
function savePhotos(x) { lsSave('photos', x); }
function getGoals() { return lsLoad('goals') || []; }
function saveGoals(x) { lsSave('goals', x); }

/* ---------- Main render ---------- */
function renderCorps() {
    const c = document.getElementById('corps-section');
    if (!c) return;
    c.innerHTML = `
        <div class="corps-tabs">
            <button class="corps-tab ${_bodyTab==='mensurations'?'active':''}" onclick="setBodyTab('mensurations')">📏 Mensurations</button>
            <button class="corps-tab ${_bodyTab==='photos'?'active':''}" onclick="setBodyTab('photos')">📸 Photos</button>
            <button class="corps-tab ${_bodyTab==='objectifs'?'active':''}" onclick="setBodyTab('objectifs')">🎯 Objectifs</button>
        </div>
        <div id="corps-pane"></div>
    `;
    renderCorpsPane();
}

function setBodyTab(t) { _bodyTab = t; renderCorpsPane(); document.querySelectorAll('.corps-tab').forEach(b => b.classList.toggle('active', b.textContent.includes(t === 'mensurations' ? 'Mensurations' : t === 'photos' ? 'Photos' : 'Objectifs'))); }

function renderCorpsPane() {
    const p = document.getElementById('corps-pane');
    if (!p) return;
    if (_bodyTab === 'mensurations') p.innerHTML = renderMeasuresView();
    else if (_bodyTab === 'photos') p.innerHTML = renderPhotosView();
    else p.innerHTML = renderGoalsView();
    if (_bodyTab === 'photos') bindPhotoInput();
}

/* ============================================================
   C1 — MENSURATIONS
   ============================================================ */
function renderMeasuresView() {
    const list = getMeasures().sort((a, b) => b.date.localeCompare(a.date));
    const last = list[0] || {};
    const prev = list[1] || {};

    return `
        <div class="card" style="margin-bottom:12px;">
            <div class="card-t">➕ Nouvelle mesure</div>
            <div class="measure-grid">
                ${BODY_PARTS.map(p => {
                    const lastVal = last[p.k] || '';
                    const delta = (last[p.k] && prev[p.k]) ? (last[p.k] - prev[p.k]).toFixed(1) : null;
                    return `
                        <div class="measure-input-wrap">
                            <label class="measure-lbl">${p.ico} ${p.n}</label>
                            <div class="measure-row">
                                <input type="number" id="m-${p.k}" step=".1" min="10" max="300" placeholder="${lastVal || 'cm'}" class="measure-input"/>
                                <span class="measure-unit">cm</span>
                            </div>
                            ${delta != null ? `<div class="measure-delta ${parseFloat(delta) < 0 ? 'loss' : parseFloat(delta) > 0 ? 'gain' : ''}">${delta > 0 ? '+' : ''}${delta} cm vs précédent</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <button class="btn btn-acc" onclick="addMeasure()" style="margin-top:10px;">✓ Enregistrer la mesure</button>
        </div>

        <div class="card">
            <div class="card-t">📅 Historique (${list.length})</div>
            ${list.length === 0 ? `<div class="empty-state meal-empty">Aucune mesure encore</div>` :
                list.slice(0, 20).map((m, i) => {
                    const d = new Date(m.date);
                    const lbl = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                    const vals = BODY_PARTS.filter(p => m[p.k]).map(p => `<span class="mes-chip">${p.ico} ${m[p.k]}</span>`).join('');
                    return `
                        <div class="mes-row">
                            <div class="mes-date">${lbl}</div>
                            <div class="mes-vals">${vals || '<span class="mes-empty">vide</span>'}</div>
                            <button class="food-del" onclick="deleteMeasure('${m.id}')" title="Supprimer">✕</button>
                        </div>`;
                }).join('')
            }
        </div>
    `;
}

function addMeasure() {
    const entry = { id: 'm_' + Date.now().toString(36), date: new Date().toISOString().slice(0, 10) };
    let any = false;
    BODY_PARTS.forEach(p => {
        const v = parseFloat(document.getElementById('m-' + p.k)?.value);
        if (!isNaN(v) && v > 0) { entry[p.k] = v; any = true; }
    });
    if (!any) { showToast('⚠️ Entre au moins une mesure'); return; }
    const list = getMeasures();
    list.push(entry);
    saveMeasures(list);
    showToast('✅ Mesure enregistrée');
    checkMilestones();
    renderCorpsPane();
}

function deleteMeasure(id) {
    if (!confirm('Supprimer cette mesure ?')) return;
    saveMeasures(getMeasures().filter(m => m.id !== id));
    renderCorpsPane();
}

/* ============================================================
   C2 — PHOTOS (base64, resized to 800px max)
   ============================================================ */
function renderPhotosView() {
    const list = getPhotos().sort((a, b) => b.date.localeCompare(a.date));
    return `
        <div class="card" style="margin-bottom:12px;">
            <div class="card-t">📸 Nouvelle photo</div>
            <p class="photo-hint">Prends une photo face/profil dans les mêmes conditions (lumière, tenue). Stockée en local uniquement.</p>
            <input type="file" id="photo-input" accept="image/*" capture="environment" class="photo-file-input"/>
            <label for="photo-input" class="photo-file-lbl">📷 Choisir / prendre une photo</label>
        </div>
        <div class="card">
            <div class="card-t">🗂 Photos (${list.length})</div>
            ${list.length === 0 ? `<div class="empty-state meal-empty">Aucune photo encore</div>` : `
                <div class="photos-grid">
                    ${list.map(ph => {
                        const d = new Date(ph.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                        return `
                            <div class="photo-card">
                                <img src="${ph.data}" alt="Photo ${d}" onclick="openPhotoZoom('${ph.id}')"/>
                                <div class="photo-meta">
                                    <span class="photo-date">${d}${ph.weight ? ` · ${ph.weight}kg` : ''}</span>
                                    <button class="photo-del" onclick="deletePhoto('${ph.id}')">✕</button>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            `}
        </div>
        <div id="photo-zoom-modal" class="photo-zoom-modal" onclick="closePhotoZoom()"></div>
    `;
}

function bindPhotoInput() {
    const input = document.getElementById('photo-input');
    if (!input) return;
    input.onchange = e => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const max = 800;
                let w = img.width, h = img.height;
                if (w > h && w > max) { h = h * max / w; w = max; }
                else if (h > max) { w = w * max / h; h = max; }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const data = canvas.toDataURL('image/jpeg', 0.78);
                const day = getDay(todayKey());
                const photo = {
                    id: 'p_' + Date.now().toString(36),
                    date: new Date().toISOString().slice(0, 10),
                    data,
                    weight: day.weight || null,
                };
                try {
                    const list = getPhotos();
                    list.push(photo);
                    savePhotos(list);
                    showToast('📸 Photo enregistrée');
                    renderCorpsPane();
                } catch {
                    showToast('⚠️ Stockage plein — supprime des photos');
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(f);
    };
}

function deletePhoto(id) {
    if (!confirm('Supprimer cette photo ?')) return;
    savePhotos(getPhotos().filter(p => p.id !== id));
    renderCorpsPane();
}

function openPhotoZoom(id) {
    const ph = getPhotos().find(p => p.id === id);
    if (!ph) return;
    const m = document.getElementById('photo-zoom-modal');
    if (!m) return;
    m.innerHTML = `<img src="${ph.data}" alt="zoom"/>`;
    m.style.display = 'flex';
}

function closePhotoZoom() {
    const m = document.getElementById('photo-zoom-modal');
    if (m) m.style.display = 'none';
}

/* ============================================================
   O1 — OBJECTIFS SMART
   ============================================================ */
function renderGoalsView() {
    const goals = getGoals();
    return `
        <div class="card" style="margin-bottom:12px;">
            <div class="card-t">🎯 Nouvel objectif</div>
            <select id="g-type" class="goal-select">
                ${Object.entries(GOAL_TYPES).map(([k, v]) => `<option value="${k}">${v.ico} ${v.n}</option>`).join('')}
            </select>
            <div class="goal-row mt8">
                <input type="text" id="g-label" placeholder="Description (ex: perdre 5 kg avant l'été)" class="goal-input"/>
            </div>
            <div class="goal-row mt8">
                <input type="number" id="g-target" placeholder="Valeur cible" step=".1" class="goal-input-sm"/>
                <input type="date" id="g-deadline" class="goal-input-sm"/>
            </div>
            <button class="btn btn-acc mt8" onclick="addGoal()">✓ Ajouter l'objectif</button>
        </div>

        <div class="card">
            <div class="card-t">📋 Mes objectifs (${goals.filter(g => !g.done).length} en cours · ${goals.filter(g => g.done).length} atteints)</div>
            ${goals.length === 0 ? `<div class="empty-state meal-empty">Aucun objectif encore</div>` :
                goals.map(g => renderGoalCard(g)).join('')
            }
        </div>

        <div class="card" style="margin-top:12px;">
            <div class="card-t">🏆 Jalons atteints</div>
            <div id="milestones-list"></div>
        </div>
    `;
}

function renderGoalCard(g) {
    const type = GOAL_TYPES[g.type] || GOAL_TYPES.custom;
    const current = getCurrentValue(g.type);
    let pct = 0, remaining = '';
    if (current != null && g.target) {
        if (g.type === 'weight' || g.type === 'waist' || g.type === 'bodyfat') {
            // Lower is better (loss goals)
            const start = g.startValue || current;
            const delta = start - current;
            const total = start - g.target;
            pct = total > 0 ? Math.max(0, Math.min(1, delta / total)) : 0;
            remaining = `${Math.abs(current - g.target).toFixed(1)} ${type.u} restant`;
        } else {
            pct = Math.min(1, current / g.target);
            remaining = `${Math.max(0, g.target - current).toFixed(1)} ${type.u} restant`;
        }
    }
    const deadline = g.deadline ? new Date(g.deadline) : null;
    const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
    const isDone = g.done || pct >= 1;

    return `
        <div class="goal-card ${isDone ? 'done' : ''}">
            <div class="goal-hd">
                <span class="goal-ico">${type.ico}</span>
                <div class="goal-info">
                    <div class="goal-label">${g.label || type.n}</div>
                    <div class="goal-meta">Cible : <b>${g.target} ${type.u}</b>${current != null ? ` · Actuel : ${current} ${type.u}` : ''}</div>
                </div>
                <button class="food-del" onclick="deleteGoal('${g.id}')" title="Supprimer">✕</button>
            </div>
            ${current != null ? `
                <div class="goal-bar-wrap">
                    <div class="goal-bar-bg"><div class="goal-bar-fg" style="width:${Math.round(pct * 100)}%"></div></div>
                    <div class="goal-bar-sub">
                        <span>${Math.round(pct * 100)}%</span>
                        <span>${isDone ? '🎉 Atteint !' : remaining}</span>
                        ${daysLeft != null ? `<span class="${daysLeft < 0 ? 'overdue' : daysLeft < 14 ? 'urgent' : ''}">${daysLeft >= 0 ? daysLeft + ' j restants' : Math.abs(daysLeft) + ' j dépassés'}</span>` : ''}
                    </div>
                </div>
            ` : `<div class="goal-bar-sub">Aucune donnée actuelle</div>`}
        </div>
    `;
}

function getCurrentValue(type) {
    if (type === 'weight') {
        // Last recorded weight
        const days = Object.keys(localStorage).filter(k => k.startsWith('day_')).sort().reverse();
        for (const k of days) {
            try { const d = JSON.parse(localStorage.getItem(k)); if (d.weight) return d.weight; } catch {}
        }
        return null;
    }
    if (type === 'waist' || type === 'hips' || type === 'chest' || type === 'arm' || type === 'thigh') {
        const m = getMeasures().sort((a, b) => b.date.localeCompare(a.date))[0];
        return m?.[type] ?? null;
    }
    if (type === 'bodyfat') return S.bf || null;
    if (type === 'habit') return typeof calcStreak === 'function' ? calcStreak() : 0;
    return null;
}

function addGoal() {
    const type = document.getElementById('g-type')?.value;
    const label = (document.getElementById('g-label')?.value || '').trim();
    const target = parseFloat(document.getElementById('g-target')?.value);
    const deadline = document.getElementById('g-deadline')?.value || null;
    if (!type || isNaN(target)) { showToast('⚠️ Type et cible requis'); return; }
    const goal = {
        id: 'g_' + Date.now().toString(36),
        type, label, target, deadline,
        created: Date.now(),
        startValue: getCurrentValue(type),
        done: false,
    };
    const list = getGoals();
    list.push(goal);
    saveGoals(list);
    showToast('🎯 Objectif ajouté');
    renderCorpsPane();
}

function deleteGoal(id) {
    if (!confirm('Supprimer cet objectif ?')) return;
    saveGoals(getGoals().filter(g => g.id !== id));
    renderCorpsPane();
}

/* ============================================================
   O2 — JALONS (auto-détectés)
   ============================================================ */
function checkMilestones() {
    const milestones = lsLoad('milestones') || [];
    const existing = new Set(milestones.map(m => m.k));
    const add = (k, ico, text) => {
        if (!existing.has(k)) {
            milestones.push({ k, ico, text, date: new Date().toISOString().slice(0, 10) });
            showToast(`${ico} Nouveau jalon : ${text}`);
        }
    };

    // Weight loss milestones (vs starting weight S.sw if present, else S.w at signup)
    const curW = getCurrentValue('weight');
    const startW = S.sw || S.w;
    if (curW && startW && startW > curW) {
        const lost = startW - curW;
        [1, 2, 5, 10, 15, 20].forEach(kg => {
            if (lost >= kg) add('w-' + kg, '⚖️', `−${kg}kg perdus`);
        });
    }

    // Streak milestones
    const streak = typeof calcStreak === 'function' ? calcStreak() : 0;
    [3, 7, 14, 30, 60, 100].forEach(d => {
        if (streak >= d) add('s-' + d, '🔥', `${d} jours consécutifs`);
    });

    // Completed goals
    const goals = getGoals();
    let anyUpdated = false;
    goals.forEach(g => {
        const cur = getCurrentValue(g.type);
        if (cur == null || g.done) return;
        let reached = false;
        if (g.type === 'weight' || g.type === 'waist' || g.type === 'bodyfat') reached = cur <= g.target;
        else reached = cur >= g.target;
        if (reached) {
            g.done = true; g.doneDate = new Date().toISOString().slice(0, 10);
            add('g-' + g.id, '🎯', `Objectif atteint : ${g.label || GOAL_TYPES[g.type]?.n}`);
            anyUpdated = true;
        }
    });
    if (anyUpdated) saveGoals(goals);

    lsSave('milestones', milestones);
    renderMilestonesList();
}

function renderMilestonesList() {
    const el = document.getElementById('milestones-list');
    if (!el) return;
    const m = (lsLoad('milestones') || []).sort((a, b) => b.date.localeCompare(a.date));
    if (m.length === 0) {
        el.innerHTML = `<div class="empty-state meal-empty">Aucun jalon encore — continue, ça arrive 💪</div>`;
        return;
    }
    el.innerHTML = m.slice(0, 20).map(x => `
        <div class="milestone-row">
            <span class="milestone-ico">${x.ico}</span>
            <span class="milestone-txt">${x.text}</span>
            <span class="milestone-date">${new Date(x.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
        </div>
    `).join('');
}
