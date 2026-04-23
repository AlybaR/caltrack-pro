/* ============================================================
   journal.js — Daily food journal (v4)
   Improvements: Date navigation, Inline editing, Favorites (⭐),
                 Collapsible meal sections, performance.
   ============================================================ */

/* Quick-add foods organised by category (n=name, k=kcal, p=protein, l=fat, g=carbs in grams) */
const QUICK_BY_CAT = {
    '🍖 Protéines': [
        { n: 'Poulet grillé 100g', k: 165, p: 31, l: 4, g: 0 },
        { n: 'Saumon 100g', k: 208, p: 20, l: 13, g: 0 },
        { n: 'Oeuf entier', k: 78, p: 6, l: 5, g: 1 },
        { n: 'Thon boîte 100g', k: 116, p: 26, l: 1, g: 0 },
        { n: 'Yaourt grec 150g', k: 100, p: 17, l: 0, g: 6 },
        { n: 'Fromage blanc 100g', k: 57, p: 8, l: 0, g: 4 },
        { n: 'Steak haché 100g', k: 215, p: 18, l: 15, g: 0 },
        { n: 'Tofu ferme 100g', k: 76, p: 8, l: 4, g: 2 },
    ],
    '🌾 Féculents': [
        { n: 'Riz blanc cuit 150g', k: 195, p: 4, l: 0, g: 43 },
        { n: 'Pâtes cuites 150g', k: 220, p: 7, l: 1, g: 44 },
        { n: 'Pain complet (tranche)', k: 80, p: 4, l: 1, g: 15 },
        { n: "Flocons d'avoine 50g", k: 190, p: 6, l: 4, g: 33 },
        { n: 'Quinoa cuit 150g', k: 174, p: 6, l: 3, g: 30 },
        { n: 'Pomme de terre 150g', k: 115, p: 2, l: 0, g: 26 },
    ],
    '🥦 Légumes': [
        { n: 'Brocoli 150g', k: 51, p: 4, l: 1, g: 7 },
        { n: 'Épinards 200g', k: 46, p: 6, l: 1, g: 3 },
        { n: 'Courgette 200g', k: 38, p: 2, l: 0, g: 6 },
        { n: 'Carottes 150g', k: 62, p: 1, l: 0, g: 13 },
        { n: 'Salade verte 100g', k: 15, p: 1, l: 0, g: 2 },
        { n: 'Tomates 150g', k: 27, p: 1, l: 0, g: 5 },
    ],
    '🍎 Fruits': [
        { n: 'Banane', k: 89, p: 1, l: 0, g: 23 },
        { n: 'Pomme', k: 52, p: 0, l: 0, g: 14 },
        { n: 'Orange', k: 47, p: 1, l: 0, g: 12 },
        { n: 'Fraises 150g', k: 48, p: 1, l: 0, g: 11 },
    ],
    '🥛 Laitiers/Autres': [
        { n: 'Lait demi-écrémé 250ml', k: 122, p: 9, l: 4, g: 12 },
        { n: 'Amandes 30g', k: 174, p: 6, l: 15, g: 5 },
        { n: 'Noix 30g', k: 196, p: 5, l: 19, g: 4 },
        { n: 'Café noir', k: 2, p: 0, l: 0, g: 0 },
        { n: 'Huile olive 10ml', k: 88, p: 0, l: 10, g: 0 },
        { n: 'Beurre 10g', k: 74, p: 0, l: 8, g: 0 },
    ],
};

// Global Journal State
let _activeCat = '⭐ Favoris';
let _qaSearch = '';
let _journalDate = new Date(); // Current viewed date
let _openMeals = { 'breakfast': true, 'lunch': true, 'dinner': true, 'snack': true };
let _editingFood = null; // { mk, idx }
let _mealTab = { breakfast: 'quick', lunch: 'quick', dinner: 'quick', snack: 'quick' };

// Helper to get local date string YYYY-MM-DD safely
const toLocaleISO = (d) => {
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 10);
};
function getJournalKey() { return toLocaleISO(_journalDate); }

/* =====================================================================
   MAIN RENDER
   ===================================================================== */
function renderJournal() {
    const dk = getJournalKey();
    const day = getDay(dk);
    const eaten = totalKcal(day);
    const { target, cyc } = S;

    // Daily target changes if Calorie Cycling is ON
    let todayTarget = target;
    if (cyc === 'on') {
        const dow = _journalDate.getDay(); // 0 = Sun
        if (dow === 1 || dow === 3 || dow === 5 || dow === 6) todayTarget = Math.round(target * 1.10); // sport days
        else if (dow === 0) todayTarget = Math.round(target * 0.90); // rest day
    }

    renderJournalNav(dk);
    renderJournalGauge(eaten, todayTarget);
    renderMealSections(day, dk);
    if (typeof renderExercice === 'function') renderExercice();
}

/* ---------- Date Navigation ---------- */
function renderJournalNav(dk) {
    const hd = document.getElementById('jour-date');
    if (!hd) return;

    // Formatting date label
    const now = new Date();
    const isToday = dk === toLocaleISO(now);
    let dateLabel = isToday ? "Aujourd'hui" : _journalDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    hd.innerHTML = `
        <div class="jour-nav">
            <button class="jour-btn" onclick="changeJournalDate(-1)">◀</button>
            <span class="jour-label ${isToday ? 'text-acc fw8' : ''}">${dateLabel}</span>
            <button class="jour-btn" onclick="changeJournalDate(1)" ${isToday ? 'disabled' : ''}>▶</button>
        </div>
    `;
}

function changeJournalDate(offset) {
    _journalDate.setDate(_journalDate.getDate() + offset);
    // Auto-close empty meals when changing day, open filled ones
    const dk = getJournalKey();
    const day = getDay(dk);
    MEAL_KEYS.forEach(mk => {
        _openMeals[mk] = (day.meals[mk] && day.meals[mk].length > 0) || offset === 0;
    });
    // Force at least first meal open if all empty
    if (!MEAL_KEYS.some(mk => _openMeals[mk])) _openMeals['breakfast'] = true;
    _editingFood = null;
    renderJournal();
}

/* ---------- Gauge ---------- */
function renderJournalGauge(eaten, target) {
    const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
    const left = target - eaten;

    document.getElementById('jg-pct').textContent = Math.round(pct * 100) + '%';
    document.getElementById('jg-val').textContent = eaten;
    document.getElementById('jg-eaten').textContent = eaten + ' kcal';
    document.getElementById('jg-left').textContent = left >= 0 ? left + ' kcal restants' : Math.abs(left) + ' kcal dépassés';
    const jgLeftEl = document.getElementById('jg-left'); if(jgLeftEl) jgLeftEl.style.color = left < 0 ? 'var(--red)' : 'var(--mut)';

    const bar = document.getElementById('jg-bar');
    bar.style.width = (pct * 100) + '%';
    bar.style.background = pct < .75 ? 'var(--grn)' : pct < 1 ? 'var(--yel)' : 'var(--red)';

    const jValEl = document.getElementById('jg-val');
    if (jValEl) jValEl.style.color = pct >= 1 ? 'var(--red)' : 'var(--txt)';
}

/* ---------- Meal sections (Accordions) ---------- */
function renderMealSections(day, dk) {
    const container = document.getElementById('meals-container');
    container.innerHTML = '';

    MEAL_KEYS.forEach((mk, mi) => {
        const items = day.meals[mk] || [];
        const mkc = items.reduce((s, f) => s + f.k, 0);
        const isOpen = !!_openMeals[mk];
        const activeTab = _mealTab[mk] || 'quick';

        const sec = document.createElement('div');
        sec.className = `meal-section ${isOpen ? 'open' : 'closed'}`;
        sec.dataset.mk = mk;

        sec.innerHTML = `
      <div class="meal-hd" onclick="toggleMeal('${mk}')">
        <div class="meal-hd-left">
          <span class="meal-arrow">${isOpen ? '▼' : '▶'}</span>
          <span class="meal-title">${MEALS[mi]}</span>
        </div>
        <div class="meal-hd-right" onclick="event.stopPropagation()">
          ${mkc > 0 ? `<span class="meal-kcal-badge">${mkc} kcal</span>` : ''}
          <button class="copy-yesterday-btn" onclick="copyFromYesterday('${mk}')" title="Copier depuis hier">📋</button>
        </div>
      </div>

      <div class="meal-body" style="display: ${isOpen ? 'block' : 'none'}">

          <!-- Add interface — 3 tabs -->
          <div class="meal-tabs">
            <button class="meal-tab ${activeTab==='quick'?'active':''}" data-tab="quick" onclick="setMealTab('${mk}','quick')">Rapide</button>
            <button class="meal-tab ${activeTab==='manual'?'active':''}" data-tab="manual" onclick="setMealTab('${mk}','manual')">Manuel</button>
            <button class="meal-tab ${activeTab==='search'?'active':''}" data-tab="search" onclick="setMealTab('${mk}','search')">🌐 Chercher</button>
          </div>

          <!-- TAB: Rapide -->
          <div class="meal-tab-pane" data-pane="quick" style="display:${activeTab==='quick'?'':'none'}">
            <div class="qa-search-wrap" style="margin-bottom:8px;">
              <span class="qa-search-icon">🔍</span>
              <input type="text" placeholder="Recherche rapide..." id="qa-search-${mk}"
                     oninput="filterQuickAdd('${mk}', this.value)"/>
            </div>
            <div class="quick-cats" id="qcats-${mk}"></div>
            <div class="quick-grid" id="qg-${mk}"></div>
          </div>

          <!-- TAB: Manuel -->
          <div class="meal-tab-pane" data-pane="manual" style="display:${activeTab==='manual'?'':'none'}">
            <div class="add-row">
              <input type="text" id="fn-${mk}" placeholder="Nom de l'aliment..."
                     onkeydown="if(event.key==='Enter') document.getElementById('fk-${mk}')?.focus()"/>
              <input type="number" id="fk-${mk}" placeholder="kcal" min="0" max="9999"
                     onkeydown="if(event.key==='Enter') addFood('${mk}')"/>
              <button onclick="addFood('${mk}')">+ Ajouter</button>
            </div>
            <details class="macro-details">
              <summary>Macros optionnelles</summary>
              <div class="add-row-macros">
                <input type="number" id="fp-${mk}" placeholder="P (g)" min="0" max="999" step=".1" title="Protéines (g)"/>
                <input type="number" id="fl-${mk}" placeholder="L (g)" min="0" max="999" step=".1" title="Lipides (g)"/>
                <input type="number" id="fg-${mk}" placeholder="G (g)" min="0" max="999" step=".1" title="Glucides (g)"/>
              </div>
            </details>
          </div>

          <!-- TAB: Chercher (OpenFoodFacts) -->
          <div class="meal-tab-pane" data-pane="search" style="display:${activeTab==='search'?'':'none'}">
            <div class="off-input-row">
              <input type="text" id="off-q-${mk}" placeholder="Rechercher un aliment..." onkeydown="if(event.key==='Enter') searchOff('${mk}')"/>
              <button class="off-go-btn" onclick="searchOff('${mk}')">Chercher</button>
            </div>
            <div class="off-results" id="off-results-${mk}"></div>
          </div>

          <!-- Food list -->
          <div id="food-list-${mk}" style="margin-top:10px;"></div>
      </div>
    `;
        container.appendChild(sec);

        if (isOpen) {
            if (activeTab === 'quick') {
                const catsEl = sec.querySelector('#qcats-' + mk);
                renderCatTab(catsEl, '⭐ Favoris', mk);
                Object.keys(QUICK_BY_CAT).forEach(cat => renderCatTab(catsEl, cat, mk));
                renderQuickGrid(mk);
            }
            renderFoodList(sec.querySelector('#food-list-' + mk), items, mk);
        }
    });
}

function renderCatTab(container, catName, mk) {
    const b = document.createElement('button');
    b.className = 'qcat-btn' + (catName === _activeCat ? ' active' : '');
    b.textContent = catName;
    b.onclick = () => { _activeCat = catName; _qaSearch = ''; filterQuickAdd(mk, ''); };
    container.appendChild(b);
}

function toggleMeal(mk) {
    _openMeals[mk] = !_openMeals[mk];
    renderJournal();
}

function setMealTab(mk, tab) {
    _mealTab[mk] = tab;
    // Only re-render the meal section, not the full journal
    const sec = document.querySelector(`.meal-section[data-mk="${mk}"]`);
    if (!sec) { renderJournal(); return; }
    // Update tab buttons
    sec.querySelectorAll('.meal-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    // Update panes
    sec.querySelectorAll('.meal-tab-pane').forEach(pane => {
        const isActive = pane.dataset.pane === tab;
        pane.style.display = isActive ? '' : 'none';
    });
    // Re-initialize quick grid when switching to quick tab
    if (tab === 'quick') {
        renderQuickGrid(mk);
        const catsEl = sec.querySelector('#qcats-' + mk);
        if (catsEl && catsEl.children.length === 0) {
            renderCatTab(catsEl, '⭐ Favoris', mk);
            Object.keys(QUICK_BY_CAT).forEach(cat => renderCatTab(catsEl, cat, mk));
        }
    }
    // Focus relevant input
    if (tab === 'manual') setTimeout(() => document.getElementById('fn-' + mk)?.focus(), 50);
    if (tab === 'search') setTimeout(() => document.getElementById('off-q-' + mk)?.focus(), 50);
}

function renderQuickGrid(mk) {
    const qg = document.getElementById('qg-' + mk);
    if (!qg) return;
    qg.innerHTML = '';
    const search = (_qaSearch || '').toLowerCase();

    let foods = [];
    if (search) {
        foods = Object.values(QUICK_BY_CAT).flat().filter(f => f.n.toLowerCase().includes(search));
        const favs = lsLoad('fav_foods') || [];
        foods = [...foods, ...favs.filter(f => f.n.toLowerCase().includes(search))];
        // deduplicate
        foods = foods.filter((v, i, a) => a.findIndex(t => (t.n === v.n)) === i);
    } else if (_activeCat === '⭐ Favoris') {
        foods = lsLoad('fav_foods') || [];
    } else {
        foods = QUICK_BY_CAT[_activeCat] || [];
    }

    if (foods.length === 0 && _activeCat === '⭐ Favoris' && !search) {
        qg.innerHTML = `<span class="empty-state">Aucun favori. Clique sur l'étoile d'un aliment pour l'ajouter.</span>`;
        return;
    }

    foods.forEach(q => {
        const b = document.createElement('button');
        b.className = 'qbtn';
        b.textContent = q.k > 0 ? `${q.n} · ${q.k}` : q.n;
        b.onclick = () => addFoodDirect(mk, q.n, q.k);
        qg.appendChild(b);
    });
}

function filterQuickAdd(mk, val) {
    _qaSearch = val;
    // Update all open grids
    MEAL_KEYS.forEach(k => {
        if (_openMeals[k]) {
            renderQuickGrid(k);
            // Also update category buttons visual state across all open sections
            document.querySelectorAll(`#qcats-${k} .qcat-btn`).forEach(b => {
                b.classList.toggle('active', b.textContent === _activeCat);
            });
        }
    });
}

/* ---------- Food list & Inline Edit ---------- */
function renderFoodList(el, items, mk) {
    if (!el) return;
    if (items.length === 0) {
        el.innerHTML = `<div class="empty-state">Aucun aliment — utilise la recherche ou le formulaire.</div>`;
        return;
    }
    el.innerHTML = '';

    const favs = lsLoad('fav_foods') || [];

    items.forEach((f, i) => {
        const isEditing = _editingFood && _editingFood.mk === mk && _editingFood.idx === i;
        const isFav = favs.some(fv => fv.n === f.n);

        const div = document.createElement('div');
        div.className = 'food-item' + (isEditing ? ' editing' : '');
        div.id = `fi-${mk}-${i}`;

        if (isEditing) {
            div.innerHTML = `
              <div class="edit-mode-row">
                 <input type="text" id="edit-n-${mk}-${i}" value="${f.n}" class="edit-input-n" />
                 <input type="number" id="edit-k-${mk}-${i}" value="${f.k}" class="edit-input-k" />
                 <button class="btn-save-edit" onclick="saveEdit('${mk}', ${i})">✓</button>
              </div>`;
            // auto-focus
            setTimeout(() => {
                const input = document.getElementById(`edit-n-${mk}-${i}`);
                if (input) { input.focus(); input.select(); }
            }, 10);
        } else {
            const macroStr = (f.p != null || f.l != null || f.g != null)
                ? `<span class="food-macros">${f.p != null ? `P${f.p}g` : ''} ${f.l != null ? `L${f.l}g` : ''} ${f.g != null ? `G${f.g}g` : ''}</span>`
                : '';
            div.innerHTML = `
              <span class="food-name-wrap" onclick="startEdit('${mk}', ${i})" title="Cliquer pour modifier">
                <span class="food-name">${f.n}</span>${macroStr}
              </span>
              <span class="food-right">
                <span class="food-k" onclick="startEdit('${mk}', ${i})">${f.k}</span>
                <span class="food-kcal-lbl" onclick="startEdit('${mk}', ${i})">kcal</span>
                <button class="food-fav ${isFav ? 'active' : ''}" title="Favori" onclick="toggleFav('${f.n}', ${f.k}, ${f.p ?? 'null'}, ${f.l ?? 'null'}, ${f.g ?? 'null'})">⭐</button>
                <button class="food-del" title="Supprimer" onclick="delFood('${mk}',${i})">✕</button>
              </span>`;
        }
        el.appendChild(div);
    });
}

/* ---------- Add food ---------- */
function addFood(mk) {
    const nameEl = document.getElementById('fn-' + mk);
    const kcalEl = document.getElementById('fk-' + mk);
    const n = nameEl.value.trim();
    const k = parseFloat(kcalEl.value);
    if (!n || isNaN(k) || k < 0 || k > 9999) return;
    const p = parseFloat(document.getElementById('fp-' + mk)?.value);
    const l = parseFloat(document.getElementById('fl-' + mk)?.value);
    const g = parseFloat(document.getElementById('fg-' + mk)?.value);
    addFoodDirect(mk, n, k, isNaN(p) ? null : p, isNaN(l) ? null : l, isNaN(g) ? null : g);
    nameEl.value = '';
    kcalEl.value = '';
    ['fp-', 'fl-', 'fg-'].forEach(prefix => { const el = document.getElementById(prefix + mk); if (el) el.value = ''; });
    nameEl.focus();
}

function addFoodDirect(mk, n, k, p = null, l = null, g = null) {
    const dk = getJournalKey();
    const day = getDay(dk);
    const food = { n, k };
    if (p !== null) food.p = p;
    if (l !== null) food.l = l;
    if (g !== null) food.g = g;
    day.meals[mk].push(food);
    saveDay(dk, day);
    _editingFood = null;
    renderJournal();
}

/* ---------- Edit food ---------- */
function startEdit(mk, idx) {
    _editingFood = { mk, idx };
    renderJournal();
}

function saveEdit(mk, idx) {
    const n = document.getElementById(`edit-n-${mk}-${idx}`).value.trim();
    const k = parseFloat(document.getElementById(`edit-k-${mk}-${idx}`).value);

    if (n && !isNaN(k) && k >= 0) {
        const dk = getJournalKey();
        const day = getDay(dk);
        day.meals[mk][idx] = { n, k };
        saveDay(dk, day);
    }
    _editingFood = null;
    renderJournal();
}

/* ---------- Favorites ---------- */
function toggleFav(n, k, p = null, l = null, g = null) {
    let favs = lsLoad('fav_foods') || [];
    const idx = favs.findIndex(f => f.n === n);
    if (idx >= 0) {
        favs.splice(idx, 1);
        showToast('⭐ Retiré des favoris');
    } else {
        const fav = { n, k };
        if (p !== null) fav.p = p;
        if (l !== null) fav.l = l;
        if (g !== null) fav.g = g;
        favs.push(fav);
        showToast('⭐ Ajouté aux favoris');
    }
    lsSave('fav_foods', favs);
    renderJournal();
}

/* ---------- Delete with slide-out animation ---------- */
function delFood(mk, idx) {
    const itemEl = document.getElementById(`fi-${mk}-${idx}`);
    if (itemEl) {
        itemEl.classList.add('removing');
        setTimeout(() => {
            const dk = getJournalKey();
            const day = getDay(dk);
            day.meals[mk].splice(idx, 1);
            saveDay(dk, day);
            _editingFood = null;
            renderJournal();
        }, 280);
    } else {
        const dk = getJournalKey();
        const day = getDay(dk);
        day.meals[mk].splice(idx, 1);
        saveDay(dk, day);
        _editingFood = null;
        renderJournal();
    }
}

/* ---------- OpenFoodFacts search ---------- */
function toggleOffSearch(mk) {
    const panel = document.getElementById('off-panel-' + mk);
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : '';
    if (!isOpen) setTimeout(() => document.getElementById('off-q-' + mk)?.focus(), 50);
}

async function searchOff(mk) {
    const q = (document.getElementById('off-q-' + mk)?.value || '').trim();
    if (!q) return;
    const resultsEl = document.getElementById('off-results-' + mk);
    if (!resultsEl) return;

    // 1. Always search local DB first (instant, offline-safe)
    const localResults = typeof searchLocalDB === 'function' ? searchLocalDB(q) : [];
    if (localResults.length > 0) {
        renderOffResults(resultsEl, localResults, mk);
    } else {
        resultsEl.innerHTML = '<div class="off-loading">🔍 Recherche...</div>';
    }

    // 2. Try OpenFoodFacts in background (only if online)
    if (!navigator.onLine) return;
    const cacheKey = 'off_cache_' + q.toLowerCase().slice(0, 30);
    const cached = lsLoad(cacheKey);
    if (cached && cached.length > 0) {
        // Merge: local first, then OFF results not already in local
        const merged = mergeResults(localResults, cached);
        renderOffResults(resultsEl, merged, mk);
        return;
    }

    try {
        const res = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&lc=fr`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const offResults = (data.products || [])
            .filter(p => p.product_name && p.nutriments)
            .slice(0, 8)
            .map(p => ({
                n: (p.product_name_fr || p.product_name).slice(0, 60),
                k: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
                p: Math.round(p.nutriments['proteins_100g'] || 0),
                l: Math.round(p.nutriments['fat_100g'] || 0),
                g: Math.round(p.nutriments['carbohydrates_100g'] || 0),
            }))
            .filter(p => p.k > 0);
        try { lsSave(cacheKey, offResults); } catch {}
        const merged = mergeResults(localResults, offResults);
        if (merged.length > localResults.length) {
            renderOffResults(resultsEl, merged, mk);
        }
    } catch {
        // silently fail — local results already shown
    }
}

function mergeResults(local, remote) {
    const names = new Set(local.map(f => f.n.toLowerCase().slice(0, 20)));
    const newRemote = remote.filter(f => !names.has(f.n.toLowerCase().slice(0, 20)));
    return [...local, ...newRemote].slice(0, 12);
}

function renderOffResults(el, products, mk) {
    if (!products.length) { el.innerHTML = '<div class="off-error">Aucun résultat.</div>'; return; }
    el.innerHTML = '';
    products.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'off-result-btn';
        btn.innerHTML = `<span class="off-r-name">${p.n}</span><span class="off-r-meta">${p.k} kcal · P${p.p}g L${p.l}g G${p.g}g</span>`;
        btn.onclick = () => {
            addFoodDirect(mk, p.n + ' (100g)', p.k, p.p, p.l, p.g);
            const panel = document.getElementById('off-panel-' + mk);
            if (panel) panel.style.display = 'none';
        };
        el.appendChild(btn);
    });
}

/* ---------- Copy meal from yesterday ---------- */
function copyFromYesterday(mk) {
    const yesterday = new Date(_journalDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const off = yesterday.getTimezoneOffset() * 60000;
    const yesterdayKey = new Date(yesterday.getTime() - off).toISOString().slice(0, 10);
    const yesterdayDay = getDay(yesterdayKey);
    const items = yesterdayDay.meals[mk] || [];
    if (items.length === 0) { showToast('📋 Aucun aliment hier dans ce repas'); return; }
    const dk = getJournalKey();
    const day = getDay(dk);
    day.meals[mk] = [...day.meals[mk], ...items];
    saveDay(dk, day);
    showToast(`📋 ${items.length} aliment(s) copié(s) depuis hier`);
    renderJournal();
}
