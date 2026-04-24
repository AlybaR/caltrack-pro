/* ============================================================
   wellness.js — Phase 6 : Bien-être (B1 sommeil + B2 humeur/énergie)
   Data shape (per day):
     day.wellness = { sleep:{h:7.5, q:4}, mood:4, energy:3 }
   All fields are optional — user logs what they want.
   ============================================================ */

const MOOD_EMOJI = ['😞', '😕', '🙂', '😊', '😄'];
const ENERGY_EMOJI = ['🪫', '🔋', '⚡', '⚡⚡', '⚡⚡⚡'];

/* ---------- Data helpers ---------- */
function getWellness(dk) {
    const day = getDay(dk);
    return day.wellness || {};
}

function saveWellness(dk, patch) {
    const day = getDay(dk);
    const cur = day.wellness || {};
    day.wellness = { ...cur, ...patch };
    // Clean empty sub-objects
    if (day.wellness.sleep && Object.keys(day.wellness.sleep).length === 0) delete day.wellness.sleep;
    saveDay(dk, day);
}

/* ---------- Actions ---------- */
function setSleepHours(val) {
    const dk = todayKey();
    const h = parseFloat(val);
    const cur = getWellness(dk).sleep || {};
    if (isNaN(h) || h <= 0 || h > 24) {
        const { h: _dropped, ...rest } = cur;
        saveWellness(dk, { sleep: rest });
    } else {
        saveWellness(dk, { sleep: { ...cur, h: Math.round(h * 10) / 10 } });
    }
    renderWellnessCard();
}

function setSleepQuality(q) {
    const dk = todayKey();
    const cur = getWellness(dk).sleep || {};
    // Toggle off if clicking same value
    const newQ = cur.q === q ? null : q;
    if (newQ === null) {
        const { q: _dropped, ...rest } = cur;
        saveWellness(dk, { sleep: rest });
    } else {
        saveWellness(dk, { sleep: { ...cur, q: newQ } });
    }
    renderWellnessCard();
}

function setMood(m) {
    const dk = todayKey();
    const cur = getWellness(dk).mood;
    saveWellness(dk, { mood: cur === m ? null : m });
    renderWellnessCard();
}

function setEnergy(e) {
    const dk = todayKey();
    const cur = getWellness(dk).energy;
    saveWellness(dk, { energy: cur === e ? null : e });
    renderWellnessCard();
}

/* ---------- Render ---------- */
function renderWellnessCard() {
    const el = document.getElementById('wellness-card');
    if (!el) return;
    const dk = todayKey();
    const w = getWellness(dk);
    const sleepH = w.sleep?.h ?? '';
    const sleepQ = w.sleep?.q ?? 0;
    const mood = w.mood ?? 0;
    const energy = w.energy ?? 0;

    const stars = (active, onclick) => Array.from({ length: 5 }, (_, i) => {
        const v = i + 1;
        return `<button class="sleep-star ${v <= active ? 'active' : ''}" onclick="${onclick}(${v})" aria-label="${v}">★</button>`;
    }).join('');

    const emojiRow = (list, active, onclick) => list.map((em, i) => {
        const v = i + 1;
        return `<button class="wl-emoji ${v === active ? 'active' : ''}" onclick="${onclick}(${v})" aria-label="${v}/5">${em}</button>`;
    }).join('');

    el.innerHTML = `
        <div class="card-t">🌙 Bien-être du jour</div>
        <div class="wl-row">
            <span class="wl-label">💤 Sommeil</span>
            <input type="number" class="sleep-input" step="0.25" min="0" max="24" placeholder="7.5"
                   value="${sleepH}" onchange="setSleepHours(this.value)" />
            <span class="wl-unit">h</span>
            <div class="sleep-stars">${stars(sleepQ, 'setSleepQuality')}</div>
        </div>
        <div class="wl-row">
            <span class="wl-label">🙂 Humeur</span>
            <div class="wl-emoji-row">${emojiRow(MOOD_EMOJI, mood, 'setMood')}</div>
        </div>
        <div class="wl-row">
            <span class="wl-label">⚡ Énergie</span>
            <div class="wl-emoji-row">${emojiRow(ENERGY_EMOJI, energy, 'setEnergy')}</div>
        </div>
        <div class="sleep-summary">${buildSummary(w)}</div>
    `;
}

function buildSummary(w) {
    const parts = [];
    if (w.sleep?.h) parts.push(`${w.sleep.h} h${w.sleep.q ? ' · ' + '★'.repeat(w.sleep.q) : ''}`);
    if (w.mood) parts.push(MOOD_EMOJI[w.mood - 1] + ' humeur ' + w.mood + '/5');
    if (w.energy) parts.push('⚡ énergie ' + w.energy + '/5');
    return parts.length ? parts.join(' · ') : 'Rien de loggé aujourd\'hui — tape au moins un champ';
}

/* ---------- Analytics hook (used by intelligence.js) ---------- */
function computeWellnessStats(days) {
    let sleepH = 0, sleepHN = 0, sleepQ = 0, sleepQN = 0;
    let moodS = 0, moodN = 0, energyS = 0, energyN = 0;
    days.forEach(({ day }) => {
        const w = day.wellness;
        if (!w) return;
        if (w.sleep?.h) { sleepH += w.sleep.h; sleepHN++; }
        if (w.sleep?.q) { sleepQ += w.sleep.q; sleepQN++; }
        if (w.mood) { moodS += w.mood; moodN++; }
        if (w.energy) { energyS += w.energy; energyN++; }
    });
    return {
        avgSleep: sleepHN ? +(sleepH / sleepHN).toFixed(1) : 0,
        avgSleepQuality: sleepQN ? +(sleepQ / sleepQN).toFixed(1) : 0,
        avgMood: moodN ? +(moodS / moodN).toFixed(1) : 0,
        avgEnergy: energyN ? +(energyS / energyN).toFixed(1) : 0,
        sleepDays: sleepHN,
        moodDays: moodN,
        energyDays: energyN,
    };
}
