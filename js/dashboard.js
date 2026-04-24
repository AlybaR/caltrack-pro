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
    if (h < 12) return `☀️ Bonjour, <span>${name}</span> !`;
    if (h < 18) return `💪 Bonne après-midi, <span>${name}</span> !`;
    if (h < 22) return `🌆 Bonsoir, <span>${name}</span> !`;
    return `🌙 Encore debout, <span>${name}</span> ? 😄`;
}

function renderDash() {
    const dk = todayKey();
    const day = getDay(dk);
    const eaten = totalKcal(day);
    const burned = totalBurned(day);
    const { target, tdee, bmr, water, rythme, mp, cyc } = S;
    const effectiveTarget = target + burned; // exercise expands the budget

    // Wellness card (B1 sommeil + B2 humeur/énergie)
    if (typeof renderWellnessCard === 'function') renderWellnessCard();

    // Micronutriments card (N5)
    if (typeof renderMicrosCard === 'function') renderMicrosCard();

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

    // Calorie ring — based on effectiveTarget
    const left = effectiveTarget - eaten;
    const pct = Math.min(eaten / effectiveTarget, 1);
    const circ = 2 * Math.PI * 90;
    const ringEl = document.getElementById('ring-cal');
    ringEl.style.strokeDasharray = circ;
    ringEl.style.strokeDashoffset = circ - circ * pct;

    const leftEl = document.getElementById('ring-kcal-left');
    leftEl.textContent = left >= 0 ? left : '−' + Math.abs(left);
    leftEl.style.webkitTextFillColor = left < 0 ? 'var(--red)' : '';
    document.getElementById('ring-sub-txt').textContent = left >= 0 ? 'kcal restants' : 'kcal dépassés';

    // Stat boxes
    document.getElementById('d-target').textContent = effectiveTarget;
    document.getElementById('d-eaten').textContent = eaten;
    document.getElementById('d-bmr').textContent = bmr;
    document.getElementById('d-tdee').textContent = tdee;
    document.getElementById('d-deficit').textContent = '−' + rythme;

    // Burned stat box
    const dBurnedEl = document.getElementById('d-burned');
    if (dBurnedEl) {
        dBurnedEl.textContent = burned > 0 ? '+' + burned : '0';
        dBurnedEl.style.color = burned > 0 ? 'var(--grn)' : 'var(--mut)';
    }

    // Left box colour
    const dLeftEl = document.getElementById('d-left');
    dLeftEl.textContent = left >= 0 ? left : '−' + Math.abs(left);
    dLeftEl.style.color = left < 0 ? 'var(--red)' : 'var(--grn)';

    // Ring stroke colour
    ringEl.style.stroke = left < 0 ? 'var(--red)' : '';

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
    renderScore(day, eaten, effectiveTarget, mp, burned);
    document.getElementById('dash-tip').innerHTML = `<strong>Conseil ·</strong> ${TIPS[new Date().getDate() % TIPS.length]}`;
    renderCalorieCycling(cyc, target);
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
    const pr = MACROS_P[mp]; let score = 0; const items = [];
    if (eaten > 0 && eaten <= target) { score += 4; items.push('✅ Calories dans l\'objectif'); }
    else if (eaten === 0) items.push('⬜ Ajoute tes repas');
    else items.push('❌ Budget dépassé');
    if (burned > 0) { score += 1; items.push(`✅ Exercice : +${burned} kcal brûlées`); }
    if (day.water >= Math.round(S.water * 0.75)) { score += 3; items.push('✅ Hydratation suffisante'); }
    else items.push(`❌ Bois plus d'eau (${day.water}/${S.water})`);
    const protMin = Math.round(S.w * 1.6);
    const protG = Math.round((target * pr.p) / 4);
    if (protG >= protMin) { score += 3; items.push(`✅ Protéines OK (≥${protMin}g)`); }
    else items.push(`❌ Protéines insuff. (cible ${protMin}g)`);
    const col = score >= 8 ? 'var(--grn)' : score >= 5 ? 'var(--yel)' : 'var(--red)';
    const sEl = document.getElementById('score-num');
    sEl.textContent = score + '/10';
    sEl.style.background = `linear-gradient(135deg,${col},var(--acc))`;
    sEl.style.webkitBackgroundClip = 'text'; sEl.style.webkitTextFillColor = 'transparent'; sEl.style.backgroundClip = 'text';
    document.getElementById('score-items').innerHTML = items.map(s => `<div class="score-item">${s}</div>`).join('');
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
