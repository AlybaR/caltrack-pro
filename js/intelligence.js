/* ============================================================
   intelligence.js — Phase 4 Analytics + Insights
   A1: patterns, top foods, best/worst days, adherence trends
   A2: rule-based insights (no LLM) with tone & priority
   Renders into #intelligence-section (Suivi page)
   ============================================================ */

const DOW_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/* ---------- Data walk ---------- */
function getAllDays(n = 30) {
    const days = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const off = d.getTimezoneOffset() * 60000;
        const key = new Date(d.getTime() - off).toISOString().slice(0, 10);
        const day = lsLoad('day_' + key);
        if (day) days.push({ key, date: d, day });
    }
    return days;
}

/* ---------- A1: Analytics ---------- */
function computeAnalytics() {
    const days = getAllDays(30);
    if (days.length === 0) return null;

    const target = S.target || 2000;
    let sumKcal = 0, sumBurn = 0, daysLogged = 0, daysInTarget = 0, daysOver = 0, daysUnder = 0;
    const dowKcal = Array(7).fill(0), dowCount = Array(7).fill(0);
    const foodFreq = {};
    let exerciseDays = 0, macrosTracked = 0, totalP = 0, totalL = 0, totalG = 0;

    days.forEach(({ date, day }) => {
        const dow = date.getDay();
        const eaten = MEAL_KEYS.reduce((s, mk) =>
            s + (day.meals?.[mk] || []).reduce((a, f) => a + (f.k || 0) * (f.qty || 1), 0), 0);
        const burn = (day.exercises || []).reduce((s, e) => s + (e.kcal || 0), 0);
        sumKcal += eaten;
        sumBurn += burn;
        if (eaten > 0) {
            daysLogged++;
            dowKcal[dow] += eaten;
            dowCount[dow]++;
            const deviation = Math.abs(eaten - target) / target;
            if (deviation <= 0.1) daysInTarget++;
            else if (eaten > target) daysOver++;
            else daysUnder++;
        }
        if ((day.exercises || []).length > 0) exerciseDays++;
        // Food frequency
        MEAL_KEYS.forEach(mk => (day.meals?.[mk] || []).forEach(f => {
            const n = (f.n || '').split('(')[0].trim();
            if (n) foodFreq[n] = (foodFreq[n] || 0) + 1;
        }));
        // Macros
        MEAL_KEYS.forEach(mk => (day.meals?.[mk] || []).forEach(f => {
            const q = f.qty || 1;
            if (f.p != null || f.l != null || f.g != null) macrosTracked++;
            if (f.p != null) totalP += f.p * q;
            if (f.l != null) totalL += f.l * q;
            if (f.g != null) totalG += f.g * q;
        }));
    });

    const bestDowIdx = dowCount.map((c, i) => c > 0 ? dowKcal[i] / c : Infinity)
        .reduce((best, avg, i, arr) => Math.abs(avg - target) < Math.abs(arr[best] - target) ? i : best, 0);
    const worstDowIdx = dowCount.map((c, i) => c > 0 ? dowKcal[i] / c : -1)
        .reduce((worst, avg, i, arr) => avg > arr[worst] ? i : worst, 0);

    const topFoods = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const avgKcal = daysLogged > 0 ? Math.round(sumKcal / daysLogged) : 0;
    const avgBurn = days.length > 0 ? Math.round(sumBurn / days.length) : 0;
    const avgDeficit = daysLogged > 0 ? Math.round((target + avgBurn - avgKcal)) : 0;

    // Wellness (B1/B2) — optional
    const wellness = typeof computeWellnessStats === 'function' ? computeWellnessStats(days) : null;

    // Micronutrients (N5) — optional
    const micros = typeof computeMicrosStats === 'function' ? computeMicrosStats(days) : null;

    return {
        daysLogged, daysInTarget, daysOver, daysUnder,
        avgKcal, avgBurn, avgDeficit, target,
        bestDow: dowCount[bestDowIdx] > 0 ? DOW_NAMES[bestDowIdx] : null,
        worstDow: dowCount[worstDowIdx] > 0 ? DOW_NAMES[worstDowIdx] : null,
        topFoods,
        exerciseDays,
        exerciseRate: days.length > 0 ? (exerciseDays / days.length * 7).toFixed(1) : 0,
        avgP: macrosTracked > 0 && daysLogged > 0 ? Math.round(totalP / daysLogged) : 0,
        avgL: macrosTracked > 0 && daysLogged > 0 ? Math.round(totalL / daysLogged) : 0,
        avgG: macrosTracked > 0 && daysLogged > 0 ? Math.round(totalG / daysLogged) : 0,
        adherencePct: daysLogged > 0 ? Math.round(daysInTarget / daysLogged * 100) : 0,
        wellness,
        micros,
    };
}

/* ---------- A2: Rule-based insights ---------- */
function computeInsights(a) {
    if (!a) return [];
    const insights = [];

    if (a.adherencePct >= 70) insights.push({ ico: '🎯', tone: 'good', txt: `Excellente adhésion : ${a.adherencePct}% des jours dans ta fenêtre cible (±10%).` });
    else if (a.adherencePct >= 40) insights.push({ ico: '📊', tone: 'neutral', txt: `Adhésion à ${a.adherencePct}% — tu peux viser 70%+ pour des résultats constants.` });
    else if (a.daysLogged >= 5) insights.push({ ico: '⚠️', tone: 'warn', txt: `Seulement ${a.adherencePct}% de jours dans l'objectif. Réduis la fenêtre ou revois ton target.` });

    if (a.daysOver > a.daysUnder && a.daysOver >= 3) insights.push({ ico: '🍽', tone: 'warn', txt: `Tu dépasses ton objectif ${a.daysOver}j / ${a.daysLogged} — essaie d'anticiper les repas.` });
    if (a.daysUnder > a.daysOver && a.daysUnder >= 5) insights.push({ ico: '🔋', tone: 'info', txt: `${a.daysUnder} jours sous-mangés — attention aux fringales et à la fatigue.` });

    if (a.avgDeficit > 0) insights.push({ ico: '📉', tone: 'good', txt: `Déficit moyen : ${a.avgDeficit} kcal/j → ~${(a.avgDeficit * 7 / 7700).toFixed(2)} kg/semaine théorique.` });
    else if (a.avgDeficit < -100) insights.push({ ico: '📈', tone: 'warn', txt: `Surplus moyen de ${-a.avgDeficit} kcal/j — pas de déficit actuellement.` });

    if (a.exerciseRate > 3.5) insights.push({ ico: '🏋️', tone: 'good', txt: `${a.exerciseRate} séances/semaine en moyenne — routine solide !` });
    else if (a.exerciseRate > 0 && a.exerciseRate < 2) insights.push({ ico: '🚶', tone: 'info', txt: `${a.exerciseRate} séance/semaine — essaie d'ajouter 1–2 sessions par semaine.` });
    else if (a.exerciseRate === '0.0' || a.exerciseRate === 0) insights.push({ ico: '💤', tone: 'info', txt: `Pas d'exercice enregistré sur 30j — même 20 min de marche comptent.` });

    const proteinPerKg = (a.avgP && S.w) ? a.avgP / S.w : 0;
    if (proteinPerKg > 1.6) insights.push({ ico: '💪', tone: 'good', txt: `${a.avgP}g protéines/j (${proteinPerKg.toFixed(1)} g/kg) — idéal pour préserver le muscle en déficit.` });
    else if (proteinPerKg > 0 && proteinPerKg < 1.2) insights.push({ ico: '🥩', tone: 'warn', txt: `Seulement ${proteinPerKg.toFixed(1)}g/kg de protéines — vise 1.6–2.2 g/kg en perte de poids.` });

    if (a.bestDow && a.worstDow && a.bestDow !== a.worstDow) {
        insights.push({ ico: '📅', tone: 'info', txt: `Ton meilleur jour : ${a.bestDow} · Jour à surveiller : ${a.worstDow}.` });
    }

    // Streak / motivation
    const streak = typeof calcStreak === 'function' ? calcStreak() : 0;
    if (streak >= 7) insights.push({ ico: '🔥', tone: 'good', txt: `${streak} jours consécutifs dans l'objectif — tu es en feu !` });
    else if (streak >= 3) insights.push({ ico: '✨', tone: 'info', txt: `${streak} jours consécutifs — l'habitude se forme (vise 7).` });

    // Wellness insights (B1/B2)
    const w = a.wellness;
    if (w) {
        if (w.sleepDays >= 5) {
            if (w.avgSleep < 6.5) insights.push({ ico: '😴', tone: 'warn', txt: `Sommeil moyen : ${w.avgSleep} h — sous 7h, la satiété et les fringales empirent.` });
            else if (w.avgSleep >= 7.5) insights.push({ ico: '💤', tone: 'good', txt: `Sommeil solide (${w.avgSleep} h/j) — ton corps récupère bien.` });
        }
        if (w.moodDays >= 5 && w.avgMood < 2.8) insights.push({ ico: '😕', tone: 'info', txt: `Humeur moyenne ${w.avgMood}/5 — vérifie sommeil, stress, ou un déficit trop agressif.` });
        else if (w.moodDays >= 5 && w.avgMood >= 4) insights.push({ ico: '😊', tone: 'good', txt: `Humeur moyenne ${w.avgMood}/5 — bon signe que ton plan est soutenable.` });
        if (w.energyDays >= 5 && w.avgEnergy < 2.8) insights.push({ ico: '🪫', tone: 'warn', txt: `Énergie basse (${w.avgEnergy}/5) — pense glucides, hydratation, micronutriments.` });
    }

    // Micronutrients insights (N5) — needs 5+ days of tracked micros
    const m = a.micros;
    if (m && m.days >= 5) {
        if (m.avgFib < 18) insights.push({ ico: '🌾', tone: 'warn', txt: `Fibres : ${m.avgFib} g/j — vise 25 g (légumes, légumineuses, avoine, fruits avec peau).` });
        else if (m.avgFib >= 25) insights.push({ ico: '🌾', tone: 'good', txt: `Fibres : ${m.avgFib} g/j — au-dessus de la recommandation 👏` });

        if (m.avgSel > 5) insights.push({ ico: '🧂', tone: 'warn', txt: `Sel : ${m.avgSel} g/j — > 5 g OMS. Attention aux plats préparés et charcuteries.` });

        if (m.avgSuc > 60) insights.push({ ico: '🍬', tone: 'warn', txt: `Sucres : ${m.avgSuc} g/j — réduis boissons et produits ultra-transformés.` });
        else if (m.avgSuc < 25 && m.days >= 10) insights.push({ ico: '🍬', tone: 'good', txt: `Sucres contrôlés (${m.avgSuc} g/j) — excellent.` });

        if (m.avgSat > 22) insights.push({ ico: '🥓', tone: 'warn', txt: `Graisses saturées : ${m.avgSat} g/j — limite > 20 g dépassée. Remplace beurre/charcuterie par huile d'olive/poisson.` });
    }

    return insights;
}

/* ---------- Render ---------- */
function renderIntelligence() {
    const c = document.getElementById('intelligence-section');
    if (!c) return;
    const a = computeAnalytics();

    if (!a || a.daysLogged < 3) {
        c.innerHTML = `
            <div class="card-t">🧠 Analyse & Insights</div>
            <div class="empty-state meal-empty">
                📊 Pas assez de données<br>
                <small>Logge au moins 3 jours pour voir tes patterns et recommandations</small>
            </div>`;
        return;
    }

    const insights = computeInsights(a);

    c.innerHTML = `
        <div class="card-t">🧠 Analyse sur 30 jours</div>

        <div class="intel-stats">
            <div class="intel-stat"><div class="intel-stat-v">${a.daysLogged}</div><div class="intel-stat-l">jours loggés</div></div>
            <div class="intel-stat"><div class="intel-stat-v text-acc">${a.adherencePct}<small>%</small></div><div class="intel-stat-l">dans la cible</div></div>
            <div class="intel-stat"><div class="intel-stat-v">${a.avgKcal}</div><div class="intel-stat-l">kcal/j moyen</div></div>
            <div class="intel-stat"><div class="intel-stat-v ${a.avgDeficit > 0 ? 'text-grn' : 'text-red'}">${a.avgDeficit > 0 ? '−' : '+'}${Math.abs(a.avgDeficit)}</div><div class="intel-stat-l">déficit/j</div></div>
        </div>

        <div class="intel-macro-row">
            <div class="intel-macro"><b>${a.avgP}</b><small>g P</small></div>
            <div class="intel-macro"><b>${a.avgL}</b><small>g L</small></div>
            <div class="intel-macro"><b>${a.avgG}</b><small>g G</small></div>
            <div class="intel-macro"><b>${a.exerciseRate}</b><small>séances/sem</small></div>
        </div>

        ${insights.length > 0 ? `
            <div class="intel-insights-title">💡 Recommandations</div>
            <div class="intel-insights">
                ${insights.map(i => `
                    <div class="intel-insight intel-${i.tone}">
                        <span class="intel-ins-ico">${i.ico}</span>
                        <span class="intel-ins-txt">${i.txt}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${a.topFoods.length > 0 ? `
            <div class="intel-insights-title">🏆 Tes aliments favoris</div>
            <div class="intel-top-foods">
                ${a.topFoods.map(([n, c], i) => `
                    <div class="intel-food-row">
                        <span class="intel-food-rank">#${i + 1}</span>
                        <span class="intel-food-name">${n}</span>
                        <span class="intel-food-count">×${c}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}
