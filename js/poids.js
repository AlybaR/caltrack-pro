/* ============================================================
   poids.js — Weight tracking (v3)
   Improvements: Bézier-smooth curve, axis labels, period
   filter (7j/30j/all), stats bar, delete entries, IMC badge
   ============================================================ */

let _poidsFilter = '30'; // '7', '30', 'all'

/** Add today's weight entry */
function addWeight() {
    const v = parseFloat(document.getElementById('w-today').value);
    if (isNaN(v) || v < 20 || v > 500) {
        showToast('⚠️ Poids invalide (20–500 kg)');
        return;
    }

    const dk = todayKey();
    const day = getDay(dk);
    day.weight = v;
    saveDay(dk, day);

    const wh = lsLoad('weight-history') || [];
    const idx = wh.findIndex(x => x.d === dk);
    if (idx >= 0) wh[idx].v = v; else wh.push({ d: dk, v });
    lsSave('weight-history', wh);

    document.getElementById('w-today').value = '';
    renderPoids();
}

/** Delete a weight entry by date key */
function deleteWeight(dk) {
    let wh = lsLoad('weight-history') || [];
    const removed = wh.find(x => x.d === dk);
    wh = wh.filter(x => x.d !== dk);
    lsSave('weight-history', wh);
    renderPoids();
    if (removed) {
        showToast(`🗑 ${removed.v} kg supprimé`, () => {
            const cur = lsLoad('weight-history') || [];
            cur.push(removed);
            lsSave('weight-history', cur);
            renderPoids();
        });
    }
}

/** Set period filter and re-render */
function setPoidsFilter(val) {
    _poidsFilter = val;
    document.querySelectorAll('.period-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.period === val)
    );
    const wh = (lsLoad('weight-history') || []).sort((a, b) => a.d.localeCompare(b.d));
    drawWeightGraph(filterWh(wh));
}

function filterWh(wh) {
    if (_poidsFilter === 'all') return wh;
    const days = parseInt(_poidsFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const key = cutoff.toISOString().slice(0, 10);
    return wh.filter(x => x.d >= key);
}

/** Main render */
function renderPoids() {
    const wh = (lsLoad('weight-history') || []).sort((a, b) => a.d.localeCompare(b.d));
    renderPoidsStats(wh);
    drawWeightGraph(filterWh(wh));
    renderWeightHistory(wh);
    renderImcDisplay();
    renderEta(wh);
}

/* ---------- O5 — ETA prediction ---------- */
function renderEta(wh) {
    const el = document.getElementById('eta-card');
    if (!el) return;
    if (wh.length < 3 || !S.g) { el.style.display = 'none'; return; }
    // Use last 14 days (or all if <14) — linear regression slope (kg/day)
    const recent = wh.slice(-14);
    const t0 = new Date(recent[0].d + 'T12:00:00').getTime();
    const pts = recent.map(x => ({
        x: (new Date(x.d + 'T12:00:00').getTime() - t0) / 86400000,
        y: x.v,
    }));
    const n = pts.length;
    const sx = pts.reduce((s,p)=>s+p.x,0);
    const sy = pts.reduce((s,p)=>s+p.y,0);
    const sxy = pts.reduce((s,p)=>s+p.x*p.y,0);
    const sxx = pts.reduce((s,p)=>s+p.x*p.x,0);
    const denom = n*sxx - sx*sx;
    const slope = denom !== 0 ? (n*sxy - sx*sy) / denom : 0;  // kg/day

    const current = recent[recent.length-1].v;
    const toLose = current - S.g;

    let html, cls = '';
    if (Math.abs(slope) < 0.005) {
        html = `<div class="eta-line"><span>📊 Tendance stable</span><b>—</b></div>
                <div class="eta-sub">Pas assez de variation pour estimer (plateau ?)</div>`;
        cls = 'eta-neutral';
    } else if (toLose <= 0 && slope <= 0) {
        html = `<div class="eta-line"><span>🎯 Objectif atteint</span><b>✓</b></div>
                <div class="eta-sub">${current.toFixed(1)} kg · objectif ${S.g} kg</div>`;
        cls = 'eta-good';
    } else if ((toLose > 0 && slope >= 0) || (toLose < 0 && slope <= 0)) {
        html = `<div class="eta-line"><span>⚠️ Tu t'éloignes de l'objectif</span><b>—</b></div>
                <div class="eta-sub">Tendance ${slope>0?'+':''}${(slope*7).toFixed(2)} kg/sem sur 14j</div>`;
        cls = 'eta-warn';
    } else {
        const daysNeeded = Math.ceil(toLose / slope);
        const eta = new Date(); eta.setDate(eta.getDate() + daysNeeded);
        const etaLabel = eta.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
        const weekly = Math.abs(slope * 7).toFixed(2);
        html = `<div class="eta-line"><span>🎯 Objectif ${S.g} kg atteint</span><b>${etaLabel}</b></div>
                <div class="eta-sub">À ce rythme · ${weekly} kg/sem · encore ${daysNeeded} j</div>`;
        cls = 'eta-good';
    }
    el.className = 'card eta-card ' + cls;
    el.innerHTML = `<div class="card-t">🔮 Prédiction</div>${html}`;
    el.style.display = '';
}

/* ---------- Stats bar — Poids v2 ---------- */
function renderPoidsStats(wh) {
    const el = document.getElementById('poids-stats');
    if (!el) return;
    if (wh.length === 0) {
        el.innerHTML = '';
        // Also hide the period buttons when no data
        document.querySelectorAll('.period-btn').forEach(b => b.style.display = 'none');
        return;
    }

    // Show period buttons when we have ≥ 2 entries
    document.querySelectorAll('.period-btn').forEach(b => b.style.display = wh.length >= 2 ? '' : 'none');

    const vals = wh.map(x => x.v);
    const first = vals[0];
    const last = vals[vals.length - 1];
    const totalDelta = first - last; // positive = lost, negative = gained

    // Weekly delta — find entry from ~7 days ago
    const lastDate = new Date(wh[wh.length - 1].d + 'T12:00:00').getTime();
    const weekAgoTarget = lastDate - 7 * 86400000;
    let weekDelta = null;
    for (let i = wh.length - 2; i >= 0; i--) {
        const t = new Date(wh[i].d + 'T12:00:00').getTime();
        if (t <= weekAgoTarget + 86400000) { // within 1 day of 7 days ago
            weekDelta = wh[i].v - last;
            break;
        }
    }
    // If no entry far enough back, use first entry
    if (weekDelta === null && wh.length >= 2) {
        weekDelta = first - last;
    }

    // Sense direction: are we losing (good if goal < start) or gaining (good if goal > start)?
    const direction = (S.g && S.w) ? Math.sign(S.g - S.w) : -1; // -1 = loss target (default)
    const isProgress = (delta) => direction < 0 ? delta > 0 : direction > 0 ? delta < 0 : Math.abs(delta) < 0.2;
    const colorOf = (delta) => {
        if (Math.abs(delta) < 0.1) return 'var(--mut)';
        return isProgress(delta) ? 'var(--well)' : 'var(--red)';
    };
    const fmtDelta = (d) => {
        if (Math.abs(d) < 0.05) return '±0';
        return (d > 0 ? '−' : '+') + Math.abs(d).toFixed(1);
    };

    el.innerHTML = `
        <div class="sbox poids-hero">
            <div class="sv poids-hero-num">${last.toFixed(1)} <span class="poids-hero-unit">kg</span></div>
            <div class="sl">Poids actuel</div>
        </div>
        <div class="sbox">
            <div class="sv" style="color:${colorOf(weekDelta || 0)}">${fmtDelta(weekDelta || 0)} kg</div>
            <div class="sl">7 derniers jours</div>
        </div>
        <div class="sbox">
            <div class="sv" style="color:${colorOf(totalDelta)}">${fmtDelta(totalDelta)} kg</div>
            <div class="sl">Depuis le début</div>
        </div>
    `;
}

/* ---------- IMC display — Poids v2 (less alarmist) ---------- */
function renderImcDisplay() {
    const el = document.getElementById('imc-display');
    if (!el) return;
    const wh = lsLoad('weight-history') || [];
    const lastW = wh.length ? wh.sort((a, b) => b.d.localeCompare(a.d))[0].v : S.w;
    const imc = calcIMC(lastW, S.h);
    if (!imc) { el.innerHTML = ''; return; }

    // Soft semantic colors (no more alarmist orange-saturated bg)
    let accent;
    if (imc.val < 18.5)      accent = 'var(--info)';      // sous-poids — info, not alarm
    else if (imc.val < 25)   accent = 'var(--well)';      // normal — sage
    else if (imc.val < 30)   accent = 'var(--warn)';      // surpoids — warm gold
    else                     accent = 'var(--red)';       // obésité — red (legitimate alarm)

    // Label — drop the warning emojis from calcIMC
    const cleanLabel = imc.label.replace(/[⚠️💚]/g, '').trim();

    el.style.background = 'transparent';
    el.style.borderLeft = `3px solid ${accent}`;
    el.innerHTML = `
        <div class="imc-val" style="color:${accent}">${imc.val.toFixed(1)}</div>
        <div>
            <div class="imc-label fw7">${cleanLabel}</div>
            <div style="font-size:.72rem;color:var(--mut)">IMC · zone saine 18.5–24.9</div>
        </div>`;
}

/* ---------- Bézier-smoothed Canvas graph ---------- */
function drawWeightGraph(wh) {
    const canvas = document.getElementById('weight-canvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 300;
    const H = 240;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const PAD = { t: 24, r: 20, b: 36, l: 44 };
    const CW = W - PAD.l - PAD.r;
    const CH = H - PAD.t - PAD.b;

    if (wh.length < 2) {
        // Soft empty state — minimal grid + reassuring text
        ctx.strokeStyle = 'rgba(154,133,120,.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (let i = 0; i <= 4; i++) {
            const y = PAD.t + (CH / 4) * i;
            ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(154,133,120,.7)';
        ctx.font = '600 13px Outfit, Inter';
        ctx.textAlign = 'center';
        const msg = wh.length === 0
            ? 'Pèse-toi pour démarrer ta courbe'
            : 'Une 2ᵉ pesée et la courbe apparaît';
        ctx.fillText(msg, W / 2, H / 2 - 6);
        ctx.font = '11px Inter';
        ctx.fillStyle = 'rgba(154,133,120,.5)';
        ctx.fillText('Idéalement le matin, sortie de douche', W / 2, H / 2 + 14);
        return;
    }

    const vals = wh.map(x => x.v);
    const mn = Math.min(...vals, S.g || 0) - 1;
    const mx = Math.max(...vals) + 1;
    const toX = i => PAD.l + (i / (wh.length - 1)) * CW;
    const toY = v => PAD.t + CH - ((v - mn) / (mx - mn)) * CH;

    // Y axis
    const steps = 5;
    ctx.strokeStyle = 'rgba(46,51,72,.8)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(139,143,168,.6)';
    ctx.font = '10px Inter'; ctx.textAlign = 'right';
    for (let i = 0; i <= steps; i++) {
        const v = mn + ((mx - mn) / steps) * i;
        const y = toY(v);
        ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
        ctx.fillText(v.toFixed(1), PAD.l - 6, y + 3.5);
    }

    // X axis labels (first, last, middle)
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(139,143,168,.6)';
    [0, Math.floor(wh.length / 2), wh.length - 1].forEach(i => {
        if (i < wh.length) {
            const label = new Date(wh[i].d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            ctx.fillText(label, toX(i), H - PAD.b + 14);
        }
    });

    // Goal line
    if (S.g >= mn && S.g <= mx) {
        const gy = toY(S.g);
        ctx.beginPath(); ctx.setLineDash([5, 4]);
        ctx.moveTo(PAD.l, gy); ctx.lineTo(W - PAD.r, gy);
        ctx.strokeStyle = 'rgba(106,177,135,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(106,177,135,.8)'; ctx.textAlign = 'right';
        ctx.font = '10px Inter';
        ctx.fillText('🎯 ' + S.g + 'kg', W - PAD.r, gy - 5);
    }

    const pts = wh.map((x, i) => ({ x: toX(i), y: toY(x.v) }));

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b);
    grad.addColorStop(0, 'rgba(232,149,109,.28)');
    grad.addColorStop(1, 'rgba(232,149,109,.0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - PAD.b);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - PAD.b);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    // Bézier smooth curve (Catmull-Rom → cubic Bezier)
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1], curr = pts[i];
        const next = pts[i + 1] || curr;
        const prevprev = pts[i - 2] || prev;
        const cp1x = prev.x + (curr.x - prevprev.x) / 6;
        const cp1y = prev.y + (curr.y - prevprev.y) / 6;
        const cp2x = curr.x - (next.x - prev.x) / 6;
        const cp2y = curr.y - (next.y - prev.y) / 6;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
    }
    ctx.strokeStyle = 'var(--acc)'; ctx.strokeStyle = '#e8956d';
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#c9a96e'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0e0f14'; ctx.fill();
    });
}

/* ---------- History list ---------- */
function renderWeightHistory(wh) {
    const hp = document.getElementById('weight-history');
    if (!hp) return;
    const recent = wh.slice().reverse().slice(0, 14);
    if (recent.length === 0) {
        hp.innerHTML = `
            <div class="empty-state empty-state-compact">
                <i data-lucide="scale" class="empty-state-ico"></i>
                <div class="empty-state-title">Pas encore de pesée</div>
                <div class="empty-state-desc">Pèse-toi maintenant pour démarrer ta courbe.</div>
                <button class="empty-state-cta" onclick="document.getElementById('w-today')?.focus()">
                    <i data-lucide="plus"></i>Ajouter ma première pesée
                </button>
            </div>`;
        if (typeof refreshIcons === 'function') refreshIcons();
        return;
    }
    hp.innerHTML = recent.map(x => `
    <div class="hist-item">
      <span class="hist-date">
        ${new Date(x.d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
      <span style="display:flex;align-items:center;gap:10px;">
        <span class="hist-val">${x.v} kg</span>
        <button class="hist-del" onclick="deleteWeight('${x.d}')" title="Supprimer">✕</button>
      </span>
    </div>`).join('');
}
