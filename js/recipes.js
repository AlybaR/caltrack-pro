/* ============================================================
   recipes.js — User-defined meal templates (N3)
   Flow :
     - Save any meal's foods as a named recipe
     - Click a recipe → all its foods are added to current meal
     - Edit/rename/delete via modal
     - Stored in localStorage under "recipes"
   ============================================================ */

/* ---------- Storage helpers ---------- */
function getRecipes() {
    return lsLoad('recipes') || [];
}

function saveRecipes(list) {
    lsSave('recipes', list);
}

function recipeId() {
    return 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Compute totals for display ---------- */
function recipeTotals(recipe) {
    let k = 0, p = 0, l = 0, g = 0;
    (recipe.foods || []).forEach(f => {
        const q = f.qty || 1;
        k += (f.k || 0) * q;
        if (f.p != null) p += f.p * q;
        if (f.l != null) l += f.l * q;
        if (f.g != null) g += f.g * q;
    });
    return {
        k: Math.round(k),
        p: Math.round(p),
        l: Math.round(l),
        g: Math.round(g),
        count: (recipe.foods || []).length,
    };
}

/* ---------- Render recipe grid (inside Rapide tab) ---------- */
function renderRecipesGrid(mk) {
    const qg = document.getElementById('qg-' + mk);
    if (!qg) return;
    qg.innerHTML = '';

    const recipes = getRecipes();
    if (recipes.length === 0) {
        qg.innerHTML = `
            <div class="empty-state recipes-empty">
                📖 Aucune recette encore.<br>
                <small>Ajoute des aliments à un repas puis clique "Sauvegarder comme recette".</small>
            </div>`;
        return;
    }

    recipes.forEach(r => {
        const t = recipeTotals(r);
        const card = document.createElement('button');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-card-main">
                <div class="recipe-card-name">📖 ${r.name}</div>
                <div class="recipe-card-meta">${t.count} ingrédient${t.count > 1 ? 's' : ''} · ${t.k} kcal</div>
            </div>
            <button class="recipe-card-edit" aria-label="Modifier" data-id="${r.id}">⋯</button>`;
        // Click on card body adds to meal
        card.querySelector('.recipe-card-main').addEventListener('click', () => addRecipeToMeal(r.id, mk));
        // Click on edit button opens modal
        card.querySelector('.recipe-card-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openRecipeEdit(r.id);
        });
        qg.appendChild(card);
    });
}

/* ---------- Add a recipe to the current meal ---------- */
function addRecipeToMeal(recipeId, mk) {
    const recipes = getRecipes();
    const r = recipes.find(x => x.id === recipeId);
    if (!r) return;

    const dk = getJournalKey();
    const day = getDay(dk);
    (r.foods || []).forEach(f => {
        // Clone to avoid mutation on edit
        day.meals[mk].push({ ...f });
    });
    saveDay(dk, day);
    showToast(`📖 ${r.name} ajoutée (${(r.foods || []).length} aliments)`);

    // Bump "lastUsed" for future ordering
    r.lastUsed = Date.now();
    saveRecipes(recipes);

    renderJournal();
}

/* ---------- Save current meal as a new recipe ---------- */
function saveRecipeFromMeal(mk) {
    const dk = getJournalKey();
    const day = getDay(dk);
    const foods = (day.meals[mk] || []).slice();
    if (foods.length === 0) {
        showToast('⚠️ Ce repas est vide');
        return;
    }

    const name = prompt('Nom de la recette :', '');
    if (!name || !name.trim()) return;

    const recipes = getRecipes();
    recipes.unshift({
        id: recipeId(),
        name: name.trim().slice(0, 50),
        created: Date.now(),
        lastUsed: Date.now(),
        foods: foods.map(f => ({ ...f })),
    });
    saveRecipes(recipes);
    showToast(`📖 Recette "${name}" sauvegardée`);
    renderJournal();
}

/* ---------- Edit modal ---------- */
function openRecipeEdit(id) {
    const recipes = getRecipes();
    const r = recipes.find(x => x.id === id);
    if (!r) return;

    ensureRecipeModal();
    const modal = document.getElementById('recipe-modal');
    const t = recipeTotals(r);

    document.getElementById('recipe-modal-body').innerHTML = `
        <div class="recipe-edit-header">
            <input type="text" id="recipe-edit-name" value="${r.name}" class="recipe-edit-name" maxlength="50" />
        </div>
        <div class="recipe-edit-summary">
            ${t.count} ingrédient${t.count > 1 ? 's' : ''} · <b>${t.k}</b> kcal
            ${t.p ? ` · P${t.p}g L${t.l}g G${t.g}g` : ''}
        </div>
        <div class="recipe-edit-list">
            ${(r.foods || []).map((f, i) => {
                const q = f.qty || 1;
                const effK = Math.round(f.k * q);
                const qtyLbl = q !== 1 ? ` <span class="qty-badge">×${q}</span>` : '';
                return `<div class="recipe-food-row">
                    <span class="recipe-food-name">${f.n}${qtyLbl}</span>
                    <span class="recipe-food-k">${effK} kcal</span>
                    <button class="recipe-food-del" data-i="${i}" title="Retirer">✕</button>
                </div>`;
            }).join('')}
        </div>
        <div class="recipe-edit-actions">
            <button class="btn btn-acc" onclick="saveRecipeEdit('${r.id}')">✓ Enregistrer</button>
            <button class="btn btn-ghost" onclick="closeRecipeModal()">Annuler</button>
            <button class="btn btn-danger" onclick="deleteRecipe('${r.id}')">🗑 Supprimer</button>
        </div>
    `;

    // Bind ingredient removal
    document.querySelectorAll('#recipe-modal-body .recipe-food-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.i, 10);
            const recipes2 = getRecipes();
            const r2 = recipes2.find(x => x.id === id);
            if (!r2) return;
            r2.foods.splice(i, 1);
            saveRecipes(recipes2);
            openRecipeEdit(id); // re-render
        });
    });

    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('recipe-edit-name')?.focus(), 30);
}

function saveRecipeEdit(id) {
    const newName = (document.getElementById('recipe-edit-name')?.value || '').trim();
    if (!newName) { showToast('⚠️ Nom vide'); return; }
    const recipes = getRecipes();
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    r.name = newName.slice(0, 50);
    saveRecipes(recipes);
    closeRecipeModal();
    showToast('✅ Recette mise à jour');
    renderJournal();
}

function deleteRecipe(id) {
    const recipes = getRecipes();
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    if (!confirm(`Supprimer la recette "${r.name}" ?`)) return;
    const filtered = recipes.filter(x => x.id !== id);
    saveRecipes(filtered);
    closeRecipeModal();
    showToast('🗑 Recette supprimée');
    renderJournal();
}

function closeRecipeModal() {
    const modal = document.getElementById('recipe-modal');
    if (modal) modal.style.display = 'none';
}

/* ---------- Modal factory ---------- */
function ensureRecipeModal() {
    let m = document.getElementById('recipe-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'recipe-modal';
    m.className = 'recipe-modal';
    m.innerHTML = `
        <div class="recipe-modal-card">
            <button class="recipe-modal-close" onclick="closeRecipeModal()" aria-label="Fermer">✕</button>
            <div id="recipe-modal-body"></div>
        </div>`;
    // Close on backdrop click
    m.addEventListener('click', (e) => { if (e.target === m) closeRecipeModal(); });
    document.body.appendChild(m);
    return m;
}
