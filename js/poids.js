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
    wh = wh.filter(x => x.d !== dk);
    lsSave('weight-history', wh);
    renderPoids();
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
}

/* ---------- Stats bar ---------- */
function renderPoidsStats(wh) {
    const el = document.getElementById('poids-stats');
    if (!el) return;
    if (wh.length === 0) { el.innerHTML = ''; return; }
    const vals = wh.map(x => x.v);
    const first = vals[0];
    const last = vals[vals.length - 1];
    const lost = (first - last).toFixed(1);
    const min = Math.min(...vals).toFixed(1);
    const max = Math.max(...vals).toFixed(1);
    el.innerHTML = `
    <div class="sbox"><div class="sv text-acc">${last} kg</div><div class="sl">Poids actuel</div></div>
    <div class="sbox"><div class="sv text-grn">${lost > 0 ? '−' + lost : '+' + Math.abs(lost)} kg</div><div class="sl">Depuis le début</div></div>
    <div class="sbox"><div class="sv">${min} → ${max}</div><div class="sl">Min / Max</div></div>
  `;
}

/* ---------- IMC display ---------- */
function renderImcDisplay() {
    const el = document.getElementById('imc-display');
    if (!el) return;
    const wh = lsLoad('weight-history') || [];
    const lastW = wh.length ? wh.sort((a, b) => b.d.localeCompare(a.d))[0].v : S.w;
    const imc = calcIMC(lastW, S.h);
    if (!imc) { el.innerHTML = ''; return; }
    el.style.background = imc.bg;
    el.innerHTML = `
    <div class="imc-val">${imc.val.toFixed(1)}</div>
    <div>
      <div class="imc-label fw7">${imc.label}</div>
      <div style="font-size:.72rem;color:var(--mut)">IMC · normale 18.5–24.9</div>
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
        ctx.fillStyle = 'rgba(139,143,168,.5)';
        ctx.font = '13px Inter'; ctx.textAlign = 'center';
        ctx.fillText('Ajoute au moins 2 mesures pour voir le graphe', W / 2, H / 2);
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
        hp.innerHTML = `<div class="empty-state">Aucune mesure enregistrée</div>`;
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
