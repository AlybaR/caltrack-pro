/* ============================================================
   micros.js — Phase N5 : Micronutriments (fibres / sucres / sel / graisses sat.)
   Daily targets (ANSES / OMS) for an average adult:
     Fibres   >= 25 g/j        (plus = mieux)
     Sucres  <= 50 g/j         (dont ajoutés idéalement < 25 g)
     Sel     <= 5 g/j          (OMS — ≈ 2 g sodium)
     Sat.    <= 20 g/j         (~ 10% des kcal pour 2000 kcal)
   Sign convention: .type = 'min' veut dire "à atteindre", 'max' = "à ne pas dépasser"
   ============================================================ */

const MICRO_DEFS = [
    { key: 'fib', name: 'Fibres',     unit: 'g', target: 25, type: 'min', ico: '🌾', color: 'var(--grn)' },
    { key: 'suc', name: 'Sucres',     unit: 'g', target: 50, type: 'max', ico: '🍬', color: 'var(--acc)' },
    { key: 'sel', name: 'Sel',        unit: 'g', target: 5,  type: 'max', ico: '🧂', color: 'var(--yel)' },
    { key: 'sat', name: 'Graisses sat.', unit: 'g', target: 20, type: 'max', ico: '🥓', color: 'var(--red)' },
];

/** Sum micros for a single day log (handles qty + missing fields). */
function sumMicrosForDay(day) {
    const out = { fib: 0, suc: 0, sel: 0, sat: 0, tracked: 0, total: 0 };
    if (!day || !day.meals) return out;
    MEAL_KEYS.forEach(mk => (day.meals[mk] || []).forEach(f => {
        const q = f.qty || 1;
        out.total++;
        let any = false;
        ['fib', 'suc', 'sel', 'sat'].forEach(k => {
            if (f[k] != null) { out[k] += f[k] * q; any = true; }
        });
        if (any) out.tracked++;
    }));
    // Round for display
    ['fib', 'suc', 'sel', 'sat'].forEach(k => { out[k] = +out[k].toFixed(1); });
    return out;
}

/** Render today's micros card (called from dashboard). */
function renderMicrosCard() {
    const el = document.getElementById('micros-card');
    if (!el) return;
    const dk = todayKey();
    const day = getDay(dk);
    const m = sumMicrosForDay(day);

    if (m.tracked === 0) {
        el.innerHTML = `
            <div class="card-t">🧪 Micronutriments du jour</div>
            <div class="micros-empty">Aucune donnée micro — scanne un produit ou logge un aliment OpenFoodFacts.</div>`;
        return;
    }

    const rows = MICRO_DEFS.map(def => {
        const val = m[def.key] || 0;
        const pct = Math.min((val / def.target) * 100, 100);
        let state = '';
        if (def.type === 'max') state = val > def.target ? 'over' : val > def.target * 0.8 ? 'warn' : 'good';
        else state = val >= def.target ? 'good' : val >= def.target * 0.6 ? 'warn' : 'under';
        const label = def.type === 'max'
            ? `${val.toFixed(1)} / ${def.target} ${def.unit}`
            : `${val.toFixed(1)} / ≥${def.target} ${def.unit}`;
        return `
            <div class="micro-row">
                <div class="micro-hd">
                    <span class="micro-ico">${def.ico}</span>
                    <span class="micro-name">${def.name}</span>
                    <span class="micro-val micro-${state}">${label}</span>
                </div>
                <div class="micro-bar"><div class="micro-bar-fg micro-${state}" style="width:${pct}%"></div></div>
            </div>`;
    }).join('');

    el.innerHTML = `
        <div class="card-t">🧪 Micronutriments du jour
            <span class="micros-sub">${m.tracked}/${m.total} aliments tracés</span>
        </div>
        ${rows}
    `;
}

/** 30-day micros stats (used by intelligence.js). */
function computeMicrosStats(days) {
    let fib = 0, suc = 0, sel = 0, sat = 0, d = 0;
    days.forEach(({ day }) => {
        const m = sumMicrosForDay(day);
        if (m.tracked === 0) return;
        fib += m.fib; suc += m.suc; sel += m.sel; sat += m.sat; d++;
    });
    if (d === 0) return null;
    return {
        days: d,
        avgFib: +(fib / d).toFixed(1),
        avgSuc: +(suc / d).toFixed(1),
        avgSel: +(sel / d).toFixed(2),
        avgSat: +(sat / d).toFixed(1),
    };
}
