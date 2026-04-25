/* ============================================================
   dashboard.js — Dashboard tab (v3)
   ============================================================ */

const TIPS = [
    '💧 Bois un grand verre d\'eau avant chaque repas — tu manges ~20% moins.',
    '🥚 Les protéines rassasient 3× plus que les glucides à calories égales.',
    '😴 Moins de 6h de sommeil = +24% de faim (ghréline ↑).',
    '🚶 10 min de marche post-repas abaissent la glycémie de 22%.',
    '🍽 Mange lentement : la satiété arrive 15–20 min après le début du repas.',
    '🌿 Remplis la moitié de ton assiette de légumes en premier.',
    '☕ Le café pré-entraînement augmente les perfs de ~11%.',
    '🧂 Réduis le sel : la rétention d\'eau peut masquer ta progression.',
    '🍖 Vise 1,6–2,2g de protéines/kg pour préserver le muscle.',
    '📵 Manger devant un écran = +25% de calories consommées.',
];

function getGreeting(name) {
    const h = new Date().getHours();
    if (h < 6) return `🌙 Bonne nuit, <span>${name}</span>`;
    if (h < 12) return `☀️ Bonjour, <span>${name}</span>`;
    if (h < 18) return `💪 Bon après-midi, <span>${name}</span>`;
    if (h < 22) return `🌆 Bonsoir, <span>${name}</span>`;
    return `🌙 Encore debout, <span>${name}</span> ?`;
}

/** Build an actionable subline: "Il te reste 1247 kcal et 2 repas à logger". */
function buildActionableSub(eaten, effectiveTarget, day) {
    const left = effectiveTarget - eaten;
    const meals = day.meals || {};
    const loggedMeals = MEAL_KEYS.filter(k => (meals[k] || []).length > 0).length;
    const remainingMeals = Math.max(0, 4 - loggedMeals);
    if (eaten === 0) {
        return `Tu as <b>${effectiveTarget}</b> kcal pour aujourd'hui.`;
    }
    if (left < 0) {
        return `Tu as dépassé de <b style="color:var(--red)">${Math.abs(left)}</b> kcal.`;
    }
    if (remainingMeals === 0) {
        return `Plus que <b>${left}</b> kcal pour finir la journée.`;
    }
    return `Il te reste <b>${left}</b> kcal et <b>${remainingMeals}</b> repas à logger.`;
}

function renderDash() {
    const dk = todayKey();
    const day = getDay(dk);
    const eaten = totalKcal(day);
    const burned = totalBurned(day);
    const { target, tdee, bmr, water, rythme, mp, cyc } = S;
    const effectiveTarget = target + burned; // exercise expands the budget

    // [Design v3] Wellness, Micros, Score moved to Suivi — not rendered here.

    // Greeting
    document.getElementById('dash-greeting').innerHTML = getGreeting(S.name || 'Toi');

    // Streak chip
    const streakChip = document.getElementById('dash-streak-chip');
    if (streakChip) {
        const streak = typeof calcStreak === 'function' ? calcStreak() : 0;
        streakChip.innerHTML = streak > 0
            ? `🔥 <span>${streak} jour${streak > 1 ? 's' : ''}</span>`
            : '';
        streakChip.onclick = () => showPage('suivi');
    }

    // Date
    document.getElementById('dash-date').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Actionable subline (under greeting)
    const subEl = document.getElementById('dash-actionable');
    if (subEl) subEl.innerHTML = buildActionableSub(eaten, effectiveTarget, day);

    // Calorie ring — animated stroke reveal (radius 104 → circumference ≈ 653.45)
    const left = effectiveTarget - eaten;
    const pct = Math.min(eaten / effectiveTarget, 1);
    const RING_R = 104;
    const circ = 2 * Math.PI * RING_R;
    const ringEl = document.getElementById('ring-cal');
    ringEl.style.strokeDasharray = circ;
    // Reset to 0 for animated reveal on each render
    if (!ringEl.dataset.animated) {
        ringEl.style.strokeDashoffset = circ;
        // force reflow then animate
        void ringEl.getBoundingClientRect();
        ringEl.style.transition = 'stroke-dashoffset 1.2s var(--ease, cubic-bezier(.32,.72,0,1))';
        requestAnimationFrame(() => {
            ringEl.style.strokeDashoffset = circ - circ * pct;
        });
        ringEl.dataset.animated = '1';
    } else {
        ringEl.style.strokeDashoffset = circ - circ * pct;
    }

    // Sematic ring color: dépassé = rouge, ≥90% = sage well, sinon acc
    if (left < 0) ringEl.style.stroke = 'var(--red)';
    else if (pct >= 0.90) ringEl.style.stroke = 'var(--well)';
    else ringEl.style.stroke = '';

    // Hero number — count-up animation
    const leftEl = document.getElementById('ring-kcal-left');
    const displayLeft = left >= 0 ? left : -Math.abs(left);
    countUp(leftEl, displayLeft, {
        fmt: (v) => {
            const n = Math.round(v);
            return n >= 0 ? n.toString() : '−' + Math.abs(n);
        }
    });
    leftEl.style.webkitTextFillColor = left < 0 ? 'var(--red)' : '';
    document.getElementById('ring-sub-txt').textContent = left >= 0 ? 'kcal restants' : 'kcal dépassés';

    // Stat boxes — count-up
    countUp(document.getElementById('d-target'), effectiveTarget);
    countUp(document.getElementById('d-eaten'),  eaten);
    countUp(document.getElementById('d-bmr'),    bmr);
    countUp(document.getElementById('d-tdee'),   tdee);
    document.getElementById('d-deficit').textContent = '−' + rythme;

    // Burned stat box
    const dBurnedEl = document.getElementById('d-burned');
    if (dBurnedEl) {
        countUp(dBurnedEl, burned, { prefix: burned > 0 ? '+' : '', fmt: v => Math.round(v).toString() });
        dBurnedEl.style.color = burned > 0 ? 'var(--well)' : 'var(--mut)';
    }

    // Left box — count-up + color
    const dLeftEl = document.getElementById('d-left');
    countUp(dLeftEl, displayLeft, {
        fmt: (v) => {
            const n = Math.round(v);
            return n >= 0 ? n.toString() : '−' + Math.abs(n);
        }
    });
    dLeftEl.style.color = left < 0 ? 'var(--red)' : 'var(--well)';

    // Safety alert
    const aEl = document.getElementById('dash-alert');
    if (target < 1300) aEl.innerHTML = `<div class="alert alert-bad">⚠️ Apport très bas — consulte un professionnel.</div>`;
    else if (target < 1600) aEl.innerHTML = `<div class="alert alert-warn">💛 Déficit élevé. Priorise les protéines.</div>`;
    else aEl.innerHTML = `<div class="alert alert-ok">✅ Objectif sain et réalisable. Let's go !</div>`;

    // Celebration — fire once per day when goal first reached
    const celebKey = 'celebrated_' + dk;
    const ringOuter = document.querySelector('.ring-outer');
    if (eaten > 0 && eaten >= effectiveTarget && !sessionStorage.getItem(celebKey)) {
        sessionStorage.setItem(celebKey, '1');
        if (ringOuter) {
            ringOuter.classList.remove('goal-done');
            void ringOuter.offsetWidth; // force reflow to restart animation
            ringOuter.classList.add('goal-done');
        }
        const streak = typeof calcStreak === 'function' ? calcStreak() : 0;
        const msgs = [
            '🎉 Objectif atteint ! Belle journée !',
            '🔥 Dans l\'objectif ! Continue comme ça !',
            '💪 Journée parfaite ! Tes efforts payent.',
            '🏆 Objectif du jour coché ! Excellent !',
        ];
        showToast(streak >= 3 ? `🔥 ${streak} jours de suite dans l'objectif !` : msgs[Math.floor(Math.random() * msgs.length)]);
    } else if (eaten < effectiveTarget && ringOuter) {
        ringOuter.classList.remove('goal-done');
    }

    renderMacroBars(eaten, effectiveTarget, mp, totalMacros(day));
    renderWaterCtrl(day, dk, water);
    renderSportToday(day);                         // Promesse 2
    renderGoalMini();                              // Promesse 3
    renderCalorieCycling(cyc, target);
    if (typeof refreshIcons === 'function') refreshIcons();
}

/* ============================================================
   PROMESSE 2 — Sport du jour (mini-card dashboard)
   ============================================================ */
function renderSportToday(day) {
    const el = document.getElementById('dash-sport-card');
    if (!el) return;
    const exos = day.exercises || [];
    if (exos.length === 0) {
        el.innerHTML = `
            <div class="promise-hd">
                <div class="promise-title">🏋️ Sport aujourd'hui</div>
                <button class="promise-cta" onclick="showPage('sport')">Ajouter →</button>
            </div>
            <div class="promise-empty">Pas encore d'exercice. Un peu de mouvement aujourd'hui ?</div>
        `;
        if (typeof refreshIcons === 'function') refreshIcons();
        return;
    }
    const totalKcal = exos.reduce((s, e) => s + (e.kcal || 0), 0);
    const totalMin = exos.reduce((s, e) => s + (e.duration || e.dur || 0), 0);
    const list = exos.slice(0, 3).map(e => `<li>✓ ${e.name || e.n || 'Exercice'}${e.duration ? ` · ${e.duration} min` : ''}${e.kcal ? ` · ${e.kcal} kcal` : ''}</li>`).join('');
    const more = exos.length > 3 ? `<li class="more">+${exos.length - 3} autre${exos.length - 3 > 1 ? 's' : ''}</li>` : '';
    el.innerHTML = `
        <div class="promise-hd">
            <div class="promise-title">🏋️ Sport aujourd'hui</div>
            <div class="promise-stat">${totalKcal} kcal${totalMin ? ` · ${totalMin} min` : ''}</div>
        </div>
        <ul class="promise-list">${list}${more}</ul>
    `;
}

/* ============================================================
   PROMESSE 3 — Objectif (mini-card dashboard)
   ============================================================ */
function renderGoalMini() {
    const el = document.getElementById('dash-goal-card');
    if (!el) return;
    const wh = (lsLoad('weight-history') || []).slice().sort((a, b) => a.d.localeCompare(b.d));
    const current = wh.length ? wh[wh.length - 1].v : S.w;
    const goal = S.g;
    const start = S.w;
    if (!goal || !start) {
        el.innerHTML = `
            <div class="empty-state empty-state-compact">
                <i data-lucide="target" class="empty-state-ico"></i>
                <div class="empty-state-title">Aucun objectif défini</div>
                <div class="empty-state-desc">Configure ton poids cible pour suivre ta trajectoire.</div>
                <button class="empty-state-cta" onclick="resetWizard()">
                    <i data-lucide="settings"></i>Définir mon objectif
                </button>
            </div>`;
        if (typeof refreshIcons === 'function') refreshIcons();
        return;
    }

    const direction = goal < start ? 'loss' : (goal > start ? 'gain' : 'maintain');
    const totalToGo = goal - start;
    const doneSoFar = current - start;
    const remaining = goal - current;
    const pctDone = totalToGo !== 0 ? Math.max(0, Math.min(1, doneSoFar / totalToGo)) : 0;

    // ETA — simple linear projection on last 14 entries
    let etaTxt = '';
    if (wh.length >= 3) {
        const recent = wh.slice(-14);
        const first = recent[0];
        const last = recent[recent.length - 1];
        const days = (new Date(last.d) - new Date(first.d)) / 86400000;
        const slope = days > 0 ? (last.v - first.v) / days : 0;
        if (slope !== 0 && Math.sign(slope) === Math.sign(remaining * -1)) {
            const daysToGoal = Math.abs(remaining / slope);
            if (daysToGoal < 365 * 2) {
                const eta = new Date();
                eta.setDate(eta.getDate() + Math.round(daysToGoal));
                etaTxt = `🎯 ETA ${eta.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
            }
        }
    }

    const remAbs = Math.abs(remaining).toFixed(1);
    const totalAbs = Math.abs(totalToGo).toFixed(1);
    const verb = direction === 'loss' ? 'à perdre' : direction === 'gain' ? 'à prendre' : 'à maintenir';

    el.innerHTML = `
        <div class="promise-hd">
            <div class="promise-title">⚖️ Objectif</div>
            <button class="promise-cta" onclick="showPage('poids')">Voir →</button>
        </div>
        <div class="goal-line">
            <span class="goal-current">${current.toFixed(1)} kg</span>
            <span class="goal-arrow">→</span>
            <span class="goal-target">${goal.toFixed(1)} kg</span>
            ${etaTxt ? `<span class="goal-eta">${etaTxt}</span>` : ''}
        </div>
        <div class="goal-progress">
            <div class="goal-progress-bg">
                <div class="goal-progress-fg" style="width:${(pctDone * 100).toFixed(1)}%"></div>
            </div>
        </div>
        <div class="goal-sub">Plus que <b>${remAbs} kg</b> ${verb} sur <b>${totalAbs} kg</b> total</div>
    `;
}

function renderMacroBars(eaten, target, mp, actualMacros) {
    const pr = MACROS_P[mp];
    const mdata = [
        { k: 'p', lbl: 'Protéines', col: 'var(--cyan)' },
        { k: 'l', lbl: 'Lipides', col: 'var(--pur)' },
        { k: 'g', lbl: 'Glucides', col: 'var(--grn)' },
    ];
    const hasActual = actualMacros && actualMacros.tracked > 0;
    document.getElementById('dash-macros').innerHTML = mdata.map(m => {
        const goalG = Math.round((target * pr[m.k]) / MACRO_KCAL[m.k]);
        const pct = Math.round(pr[m.k] * 100);
        // If actual macros tracked, use real grams; otherwise estimate from kcal ratio
        const actualG = hasActual ? (actualMacros[m.k] || 0) : Math.round((eaten / target) * goalG);
        const consPct = goalG > 0 ? Math.min(Math.round((actualG / goalG) * pct), pct) : 0;
        const consLabel = hasActual ? `${actualG}g` : `~${actualG}g`;
        return `<div class="mrow">
      <div class="mn">${m.lbl}</div>
      <div class="mtrack">
        <div class="mfill-goal"   style="width:${pct}%;background:${m.col}"></div>
        <div class="mfill-actual" style="width:${consPct}%;background:${m.col}"></div>
      </div>
      <div class="mv" style="color:${m.col}"><span class="macro-actual">${consLabel}</span><span class="macro-goal">/${goalG}g</span></div>
    </div>`;
    }).join('');
}

function renderWaterCtrl(day, dk, goal) {
    document.getElementById('water-count').textContent = day.water;
    document.getElementById('water-goal-ml').textContent = `/ ${goal} verres · ${goal * 250} ml`;
    const pct = goal > 0 ? Math.min(day.water / goal, 1) : 0;
    document.getElementById('water-bar-fg').style.width = (pct * 100) + '%';
    document.getElementById('water-btn-plus').onclick = () => { if (day.water < goal) { day.water++; saveDay(dk, day); renderWaterCtrl(day, dk, goal); } };
    document.getElementById('water-btn-minus').onclick = () => { if (day.water > 0) { day.water--; saveDay(dk, day); renderWaterCtrl(day, dk, goal); } };
}

function renderScore(day, eaten, target, mp, burned = 0) {
    const sEl = document.getElementById('score-num');
    const itemsEl = document.getElementById('score-items');

    // Avant midi sans aucun repas logué : on ne juge pas la journée naissante.
    const h = new Date().getHours();
    if (eaten === 0 && h < 12) {
        sEl.textContent = '—';
        sEl.style.background = `linear-gradient(135deg,var(--well),var(--acc))`;
        sEl.style.webkitBackgroundClip = 'text';
        sEl.style.webkitTextFillColor = 'transparent';
        sEl.style.backgroundClip = 'text';
        itemsEl.innerHTML = `<div class="score-item score-pending">⏰ Le score se construit avec ta journée. Logge ton premier repas pour démarrer.</div>`;
        return;
    }

    const pr = MACROS_P[mp]; let score = 0; const items = [];
    if (eaten > 0 && eaten <= target) { score += 4; items.push('✅ Calories dans l\'objectif'); }
    else if (eaten === 0) items.push('⬜ Ajoute tes repas');
    else items.push('❌ Budget dépassé');
    if (burned > 0) { score += 1; items.push(`✅ Exercice : +${burned} kcal brûlées`); }
    if (day.water >= Math.round(S.water * 0.75)) { score += 3; items.push('✅ Hydratation suffisante'); }
    else items.push(`💧 Bois plus d'eau (${day.water}/${S.water})`);
    const protMin = Math.round(S.w * 1.6);
    const protG = Math.round((target * pr.p) / 4);
    if (protG >= protMin) { score += 3; items.push(`✅ Protéines OK (≥${protMin}g)`); }
    else items.push(`🍖 Protéines à viser (${protMin}g)`);
    const col = score >= 8 ? 'var(--well)' : score >= 5 ? 'var(--warn)' : 'var(--red)';
    sEl.textContent = score + '/10';
    sEl.style.background = `linear-gradient(135deg,${col},var(--acc))`;
    sEl.style.webkitBackgroundClip = 'text';
    sEl.style.webkitTextFillColor = 'transparent';
    sEl.style.backgroundClip = 'text';
    itemsEl.innerHTML = items.map(s => `<div class="score-item">${s}</div>`).join('');
}

function renderCalorieCycling(cyc, target) {
    const cycCard = document.getElementById('cyc-card');
    if (cyc !== 'on') { cycCard.style.display = 'none'; return; }
    cycCard.style.display = '';
    const dow = (new Date().getDay() + 6) % 7;
    const cycCals = DAYS.map((_, i) => {
        if (i === 0 || i === 2 || i === 4 || i === 5) return Math.round(target * 1.10);
        if (i === 6) return Math.round(target * 0.90);
        return target;
    });
    document.getElementById('cyc-grid').innerHTML = DAYS.map((d, i) => `
    <div class="cyc-box${i === dow ? ' today' : ''}">
      <div class="wd">${d}</div>
      <div class="cd">${cycCals[i]}</div>
      <div class="cl">kcal</div>
    </div>`).join('');
}
