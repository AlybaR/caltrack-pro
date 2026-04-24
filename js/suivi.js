/* ============================================================
   suivi.js — Weekly tracking tab (v3)
   Improvements: streak counter, monthly heatmap, richer
   stats, Canvas projection graph, motivation messages
   ============================================================ */

const MOTIVATION = [
  { min: 0, max: 2, msg: '🌱 Chaque grand voyage commence par un premier pas. Tu es sur la bonne voie !' },
  { min: 3, max: 5, msg: '🔥 3 jours dans l\'objectif — l\'habitude commence à se former. Continue !' },
  { min: 6, max: 9, msg: '⚡ Une semaine presque parfaite ! Ton corps s\'adapte, tiens bon.' },
  { min: 10, max: 20, msg: '💪 Double chiffre ! Tu construis quelque chose de solide. Fier(e) ?' },
  { min: 21, max: 99, msg: '🏆 Plus de 3 semaines de suite — tu as créé une vraie habitude. Impressionnant !' },
];

function getMotivation(streak) {
  return MOTIVATION.find(m => streak >= m.min && streak <= m.max)?.msg
    || '🌟 Chaque journée dans l\'objectif est une victoire.';
}

// Timezone-safe local date key from a Date object
const toLocalKey = d => { const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().slice(0, 10); };

/* ---------- Main render ---------- */
function renderSuivi() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;

  // Current week dates
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i);
    return toLocalKey(d);
  });

  const streak = calcStreak();

  renderStreakBanner(streak);
  renderWeekGrid(week, dow);
  renderWeeklyStats(week, dow);
  renderMonthHeatmap(now);
  renderProjectionGraph();
  if (typeof renderIntelligence === 'function') renderIntelligence();
  renderMotivation(streak);
}

/* ---------- Streak ---------- */
function calcStreak() {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dk = toLocalKey(d);
    const day = getDay(dk);
    const k = totalKcal(day);
    if (k > 0 && k <= S.target) streak++;
    else if (i > 0) break; // allow today to be incomplete
  }
  return streak;
}

function renderStreakBanner(streak) {
  const el = document.getElementById('streak-banner');
  if (!el) return;
  el.innerHTML = `
    <span style="font-size:1.8rem">${streak > 0 ? '🔥' : '💤'}</span>
    <div>
      <div class="streak-num">${streak} jour${streak > 1 ? 's' : ''}</div>
      <div class="streak-txt">de suite dans l'objectif</div>
    </div>`;
  // Pulse animation on new personal best
  const prevBest = parseInt(sessionStorage.getItem('best-streak') || '0', 10);
  if (streak > prevBest) {
    sessionStorage.setItem('best-streak', streak);
    el.classList.remove('new-record');
    void el.offsetWidth;
    el.classList.add('new-record');
  }
}

/* ---------- Week grid ---------- */
function renderWeekGrid(week, dow) {
  document.getElementById('week-grid').innerHTML = week.map((dk, i) => {
    const day = getDay(dk);
    const k = totalKcal(day);
    const isFut = i > dow;
    const isOk = !isFut && k > 0 && k <= S.target;
    let cls = 'wday';
    if (isFut) cls += ' fut';
    else if (isOk) cls += ' ok';
    else if (k > 0) cls += ' nok';
    return `<div class="${cls}">
      <div class="wd">${DAYS[i]}</div>
      <div class="wk">${isFut ? '—' : k > 0 ? k : '·'}</div>
    </div>`;
  }).join('');
}

/* ---------- Weekly stats ---------- */
function renderWeeklyStats(week, dow) {
  let totalK = 0, daysData = 0, daysOk = 0;
  week.forEach((dk, i) => {
    if (i > dow) return;
    const k = totalKcal(getDay(dk));
    if (k > 0) { totalK += k; daysData++; }
    if (k > 0 && k <= S.target) daysOk++;
  });
  const avg = daysData > 0 ? Math.round(totalK / daysData) : 0;
  const wh = lsLoad('weight-history') || [];
  const wkW = wh.filter(x => week.includes(x.d)).sort((a, b) => a.d.localeCompare(b.d));
  const wLost = wkW.length >= 2
    ? (wkW[0].v - wkW[wkW.length - 1].v).toFixed(1)
    : null;

  document.getElementById('weekly-stats').innerHTML = `
    <div class="card">
      <div class="card-t">Jours dans l'objectif</div>
      <div class="serif" style="font-size:2.2rem;font-weight:700;color:var(--grn)">
        ${daysOk}<span style="font-size:1rem;color:var(--mut)"> / ${dow + 1}</span>
      </div>
    </div>
    <div class="card">
      <div class="card-t">Moy. kcal / jour</div>
      <div class="serif" style="font-size:2.2rem;font-weight:700;color:var(--acc)">${avg || '—'}</div>
    </div>
    ${wLost !== null ? `
    <div class="card">
      <div class="card-t">Poids perdu sur la semaine</div>
      <div class="serif" style="font-size:2.2rem;font-weight:700;color:var(--cyan)">−${wLost} kg</div>
    </div>` : ''}
  `;
}

/* ---------- Monthly heatmap ---------- */
function renderMonthHeatmap(now) {
  const el = document.getElementById('month-heatmap');
  if (!el) return;

  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0

  const todayStr = toLocalKey(now);
  let html = DAYS.map(d => `<div class="hmap-day empty" style="font-size:.58rem;color:var(--mut);background:transparent;font-weight:700">${d}</div>`).join('');

  for (let i = 0; i < startDow; i++) html += `<div class="hmap-day empty"></div>`;

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    const dk = toLocalKey(date);
    const day = getDay(dk);
    const k = totalKcal(day);
    const isFut = dk > todayStr;
    let cls = 'hmap-day';
    if (dk === todayStr) cls += ' today';
    if (!isFut && k > 0 && k <= S.target) cls += ' ok';
    else if (!isFut && k > S.target) cls += ' nok';
    html += `<div class="${cls}" title="${dk}: ${k} kcal">${d}</div>`;
  }
  el.innerHTML = html;
}

/* ---------- Projection graph (Canvas) ---------- */
function renderProjectionGraph() {
  const canvas = document.getElementById('proj-canvas');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 300;
  const H = 180;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const perWeek = (S.rythme * 7) / 7700;
  const weeks = Math.min(Math.ceil((S.w - S.g) / perWeek), 20);
  if (weeks <= 0) return;

  const PAD = { t: 16, r: 16, b: 28, l: 48 };
  const CW = W - PAD.l - PAD.r;
  const CH = H - PAD.t - PAD.b;

  // Theory points
  const theory = [{ w: S.w, wk: 0 }];
  for (let i = 1; i <= weeks; i++) {
    theory.push({ w: Math.max(S.w - perWeek * i, S.g), wk: i });
  }

  // Actual from weight-history
  const wh = (lsLoad('weight-history') || []).sort((a, b) => a.d.localeCompare(b.d));
  const startDate = wh[0]?.d ? new Date(wh[0].d + 'T12:00:00') : new Date();
  const actual = wh.map(x => {
    const diffDays = (new Date(x.d + 'T12:00:00') - startDate) / 86400000;
    return { w: x.v, wk: diffDays / 7 };
  });

  const minW = Math.min(S.g, ...theory.map(p => p.w), ...actual.map(p => p.w)) - 0.5;
  const maxW = Math.max(S.w, ...actual.map(p => p.w)) + 0.5;
  const maxWk = weeks;

  const toX = wk => PAD.l + (wk / maxWk) * CW;
  const toY = w => PAD.t + CH - ((w - minW) / (maxW - minW)) * CH;

  // Y axis
  ctx.strokeStyle = 'rgba(46,51,72,.6)'; ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(139,143,168,.6)'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
  [S.g, S.w, (S.g + S.w) / 2].forEach(v => {
    const y = toY(v);
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
    ctx.fillText(v.toFixed(0) + 'kg', PAD.l - 5, y + 3.5);
  });

  // Theory curve (dashed)
  ctx.beginPath(); ctx.setLineDash([5, 4]);
  theory.forEach((p, i) => i === 0 ? ctx.moveTo(toX(p.wk), toY(p.w)) : ctx.lineTo(toX(p.wk), toY(p.w)));
  ctx.strokeStyle = 'rgba(139,143,168,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.setLineDash([]);

  // Actual curve (solid)
  if (actual.length >= 2) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(232,149,109,.25)'); grad.addColorStop(1, 'rgba(232,149,109,0)');
    ctx.beginPath();
    ctx.moveTo(toX(actual[0].wk), H - PAD.b);
    actual.forEach(p => ctx.lineTo(toX(p.wk), toY(p.w)));
    ctx.lineTo(toX(actual[actual.length - 1].wk), H - PAD.b);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    actual.forEach((p, i) => i === 0 ? ctx.moveTo(toX(p.wk), toY(p.w)) : ctx.lineTo(toX(p.wk), toY(p.w)));
    ctx.strokeStyle = '#e8956d'; ctx.lineWidth = 2.5; ctx.stroke();

    actual.forEach(p => {
      ctx.beginPath(); ctx.arc(toX(p.wk), toY(p.w), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a96e'; ctx.fill();
    });
  }

  // Legend
  ctx.font = '10px Inter'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(139,143,168,.7)';
  ctx.fillText('- - Programme théorique', PAD.l + 4, PAD.t - 2);
  if (actual.length >= 1) {
    ctx.fillStyle = '#e8956d';
    ctx.fillText('── Réel', PAD.l + 140, PAD.t - 2);
  }
}

/* ---------- Motivation ---------- */
function renderMotivation(streak) {
  const el = document.getElementById('motivation-box');
  if (!el) return;
  el.textContent = getMotivation(streak);
}
