/* ============================================================
   progression.js — Sport progression charts (Chart.js)
   Renders inside the Suivi page. Loads Chart.js lazily from CDN.
   ============================================================ */

const CHARTJS_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
let _chartLoading = null;
let _progCharts = {}; // { kcal7: instance, volume: instance, distance: instance }
let _progMode = '7'; // '7' | '30'

function loadChartJS() {
    if (typeof Chart !== 'undefined') return Promise.resolve();
    if (_chartLoading) return _chartLoading;
    _chartLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = CHARTJS_CDN;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.head.appendChild(s);
    });
    return _chartLoading;
}

/* ---------------------------------------------------------------
   Data aggregation — walk `day_*` keys
   --------------------------------------------------------------- */
function getLastNDays(n) {
    const days = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const off = d.getTimezoneOffset() * 60000;
        const key = new Date(d.getTime() - off).toISOString().slice(0, 10);
        const day = lsLoad('day_' + key) || { exercises: [] };
        days.push({ key, date: d, day });
    }
    return days;
}

function aggregateKcalBurned(days) {
    return days.map(({ day }) =>
        (day.exercises || []).reduce((s, e) => s + (e.kcal || 0), 0)
    );
}

function aggregateStrengthVolume(days) {
    return days.map(({ day }) =>
        (day.exercises || []).reduce((s, e) =>
            e.type === 'strength' && e.sets
                ? s + e.sets.reduce((a, x) => a + (x.reps || 0) * (x.weight || 0), 0)
                : s
        , 0)
    );
}

function aggregateCardioDistance(days) {
    return days.map(({ day }) =>
        (day.exercises || []).reduce((s, e) =>
            e.type === 'cardio' && e.dist ? s + e.dist : s
        , 0)
    );
}

/* ---------- Best 1RM per lift (all-time) ---------- */
function computePRs() {
    const allDays = Object.keys(localStorage).filter(k => k.startsWith('day_'));
    const prs = {}; // { exName: { oneRM, reps, weight, date } }
    allDays.forEach(k => {
        try {
            const day = JSON.parse(localStorage.getItem(k));
            (day.exercises || []).forEach(e => {
                if (e.type !== 'strength' || !e.sets) return;
                e.sets.forEach(s => {
                    if (!s.reps || !s.weight) return;
                    const oneRM = s.reps === 1 ? s.weight : Math.round(s.weight * (1 + s.reps / 30));
                    if (!prs[e.n] || oneRM > prs[e.n].oneRM) {
                        prs[e.n] = { oneRM, reps: s.reps, weight: s.weight, date: k.slice(4) };
                    }
                });
            });
        } catch {}
    });
    return prs;
}

/* ---------------------------------------------------------------
   Main render — called from suivi.js
   --------------------------------------------------------------- */
async function renderProgression() {
    const container = document.getElementById('progression-section');
    if (!container) return;

    const n = parseInt(_progMode, 10);
    const days = getLastNDays(n);

    const kcal = aggregateKcalBurned(days);
    const volume = aggregateStrengthVolume(days);
    const distance = aggregateCardioDistance(days);

    const totalKcalBurned = kcal.reduce((a, b) => a + b, 0);
    const totalVolume = volume.reduce((a, b) => a + b, 0);
    const totalDist = distance.reduce((a, b) => a + b, 0);
    const sessionsCount = days.filter(({ day }) => (day.exercises || []).length > 0).length;

    const hasData = totalKcalBurned > 0 || totalVolume > 0 || totalDist > 0;

    container.innerHTML = `
        <div class="prog-header">
            <div class="card-t" style="margin-bottom:0;">Progression</div>
            <div class="prog-period-btns">
                <button class="prog-p-btn ${_progMode === '7' ? 'active' : ''}" onclick="setProgMode('7')">7j</button>
                <button class="prog-p-btn ${_progMode === '30' ? 'active' : ''}" onclick="setProgMode('30')">30j</button>
            </div>
        </div>

        ${!hasData ? `
            <div class="empty-state empty-state-compact">
                <i data-lucide="bar-chart-3" class="empty-state-ico"></i>
                <div class="empty-state-title">Pas encore de progression</div>
                <div class="empty-state-desc">Ajoute des exercices ci-dessus pour voir tes statistiques.</div>
            </div>
        ` : `
            <div class="prog-stats-row">
                <div class="prog-stat"><div class="prog-stat-v">${sessionsCount}</div><div class="prog-stat-l">Séances</div></div>
                <div class="prog-stat"><div class="prog-stat-v">${totalKcalBurned}</div><div class="prog-stat-l">kcal brûlées</div></div>
                ${totalVolume > 0 ? `<div class="prog-stat"><div class="prog-stat-v">${(totalVolume / 1000).toFixed(1)}<small>T</small></div><div class="prog-stat-l">Volume</div></div>` :
                  totalDist > 0 ? `<div class="prog-stat"><div class="prog-stat-v">${totalDist.toFixed(1)}<small>km</small></div><div class="prog-stat-l">Distance</div></div>` :
                  `<div class="prog-stat"><div class="prog-stat-v">${days.filter(({day}) => (day.exercises||[]).length>0).length}</div><div class="prog-stat-l">Jours actifs</div></div>`}
            </div>

            <div class="prog-chart-wrap"><canvas id="prog-kcal-chart"></canvas></div>

            <div id="prog-prs"></div>
        `}
    `;
    if (typeof refreshIcons === 'function') refreshIcons();

    if (!hasData) return;

    try {
        await loadChartJS();
    } catch {
        container.innerHTML += '<div class="empty-state">⚠️ Impossible de charger les graphiques.</div>';
        return;
    }

    const labels = days.map(({ date }) => {
        if (n <= 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
        return date.getDate() + '/' + (date.getMonth() + 1);
    });

    Object.values(_progCharts).forEach(c => { try { c.destroy(); } catch {} });
    _progCharts = {};

    const baseOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#8B7D70' } },
            y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#8B7D70' }, grid: { color: 'rgba(200,81,42,0.08)' } }
        }
    };

    _progCharts.kcal = new Chart(document.getElementById('prog-kcal-chart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'kcal brûlées',
                data: kcal,
                backgroundColor: 'rgba(200,81,42,0.75)',
                borderRadius: 6,
            }]
        },
        options: {
            ...baseOpts,
            plugins: {
                ...baseOpts.plugins,
                title: { display: true, text: '🔥 Kcal brûlées', color: '#3B2F26', font: { size: 12, weight: 'bold' }, align: 'start' }
            }
        }
    });

    // Volume + distance charts removed — info already in stats row.
    // 1 chart only (kcal brûlées) = page plus simple, focus sur l'essentiel.

    renderPRs();
}

function renderPRs() {
    const el = document.getElementById('prog-prs');
    if (!el) return;
    const prs = computePRs();
    const entries = Object.entries(prs).sort((a, b) => b[1].oneRM - a[1].oneRM).slice(0, 8);
    if (entries.length === 0) return;
    el.innerHTML = `
        <div class="prog-prs-title">🏆 Records personnels (1RM estimé)</div>
        <div class="prog-prs-list">
            ${entries.map(([name, pr]) => `
                <div class="prog-pr-row">
                    <span class="prog-pr-name">${name}</span>
                    <span class="prog-pr-val"><b>${pr.oneRM}</b> kg <small>(${pr.reps}×${pr.weight})</small></span>
                </div>
            `).join('')}
        </div>
    `;
}

function setProgMode(mode) {
    _progMode = mode;
    renderProgression();
}
