/* ============================================================
   settings.js — Settings tab (v3)
   Features: profile chip, edit profile (opens wizard),
   export JSON, import JSON, reset, app version
   ============================================================ */

const APP_VERSION = '3.0.0';

function renderSettings() {
    // Theme toggle
    const tTog = document.getElementById('theme-toggle');
    const tStat = document.getElementById('theme-status');
    if (tTog && tStat) {
        const theme = lsLoad('theme') || 'light';
        tTog.checked = theme === 'dark';
        tStat.textContent = theme === 'dark' ? 'Sombre' : 'Clair';
    }

    // Notifications toggle
    const toggle = document.getElementById('notif-toggle');
    const status = document.getElementById('notif-status');
    if (toggle && status) {
        const enabled = lsLoad('notif_enabled') === true && Notification.permission === 'granted';
        toggle.checked = enabled;
        if (!('Notification' in window)) {
            status.textContent = 'Non supporté sur ce navigateur';
            toggle.disabled = true;
        } else if (Notification.permission === 'denied') {
            status.textContent = 'Permission refusée dans le navigateur';
            toggle.disabled = true;
        } else {
            status.textContent = enabled ? 'Activés' : 'Désactivés';
            toggle.disabled = false;
        }
    }

    // Profile chip
    const el = document.getElementById('settings-profile');
    if (el) {
        const initials = (S.name || 'U').charAt(0).toUpperCase();
        const wh = lsLoad('weight-history') || [];
        const lastW = wh.length ? wh.sort((a, b) => b.d.localeCompare(a.d))[0].v : S.w;
        const imcData = calcIMC(lastW, S.h);
        const imc = imcData ? imcData.val.toFixed(1) : '—';
        const email = (typeof currentAuthUser !== 'undefined' && currentAuthUser) ? currentAuthUser.email : '';
        el.innerHTML = `
      <div class="profile-chip">
        <div class="profile-avatar">${initials}</div>
        <div class="profile-info">
          <div class="profile-name">${S.name || 'Mon profil'}</div>
          <div class="profile-stats">${S.w} kg → ${S.g} kg · IMC ${imc} · ${S.target} kcal/j</div>
          ${email ? `<div class="profile-stats" style="font-size:.72rem;opacity:.75;">☁️ ${email}</div>` : ''}
        </div>
        <span class="profile-edit" onclick="resetWizard()">Modifier ✏️</span>
      </div>
    `;
    }

    // Sign-out row (Firebase only, when logged in)
    renderSignOutRow();

    // Privacy text — honest, depends on mode
    renderPrivacyText();
}

function renderPrivacyText() {
    const el = document.getElementById('privacy-text');
    if (!el) return;
    const firebaseMode = (typeof FIREBASE_ENABLED !== 'undefined') && FIREBASE_ENABLED;
    const authed = (typeof currentAuthUser !== 'undefined') && currentAuthUser;
    const linksRow = `
        <div style="margin-top:14px;display:flex;gap:14px;flex-wrap:wrap;">
            <a href="privacy.html" target="_blank" rel="noopener"
               style="color:var(--acc);font-weight:600;font-size:.82rem;">Politique de confidentialité ↗</a>
            <a href="terms.html" target="_blank" rel="noopener"
               style="color:var(--acc);font-weight:600;font-size:.82rem;">Conditions d'utilisation ↗</a>
        </div>`;
    if (firebaseMode && authed) {
        el.innerHTML = `
            🔒 <strong style="color:var(--txt)">Tes données sont chiffrées en transit</strong> (HTTPS) et stockées
            sur Google Firebase (UE). Elles te sont accessibles uniquement après authentification.
            <br><br>
            Données stockées : email, profil (poids, objectif, macros), repas, exercices, mensurations, poids.
            ${linksRow}
        `;
    } else {
        el.innerHTML = `
            🔒 Mode local — toutes tes données sont stockées
            <strong style="color:var(--txt)">uniquement sur ton appareil</strong>.
            Aucune donnée n'est envoyée vers un serveur.
            ${linksRow}
        `;
    }
}

function renderSignOutRow() {
    const firebaseMode = (typeof FIREBASE_ENABLED !== 'undefined') && FIREBASE_ENABLED;
    const authed = (typeof currentAuthUser !== 'undefined') && currentAuthUser;
    let card = document.getElementById('signout-card');
    if (!firebaseMode || !authed) { if (card) card.remove(); return; }
    if (card) return; // already rendered
    const page = document.getElementById('page-settings');
    if (!page) return;
    card = document.createElement('div');
    card.id = 'signout-card';
    card.className = 'card';
    card.style.marginBottom = '10px';
    card.innerHTML = `
        <div class="card-t">Compte</div>
        <div class="settings-row" onclick="signOutUser()">
            <div class="sr-left">
                <div class="sr-icon">🚪</div>
                <div class="sr-info">
                    <div class="sr-label">Se déconnecter</div>
                    <div class="sr-sub">Tes données restent sur cet appareil</div>
                </div>
            </div>
            <div class="sr-right">›</div>
        </div>
    `;
    // Insert just before the "Zone de danger" card
    const dangerCard = [...page.querySelectorAll('.card-t')].find(t => t.textContent.includes('Zone de danger'));
    if (dangerCard) page.insertBefore(card, dangerCard.parentElement);
    else page.appendChild(card);
}

/* ---------- Export JSON ---------- */
function exportData() {
    const data = {
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        settings: S,
        weightHistory: lsLoad('weight-history') || [],
        // Export all day logs for last 365 days
        days: {},
    };
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const off = d.getTimezoneOffset() * 60000;
        const dk = new Date(d.getTime() - off).toISOString().slice(0, 10);
        const day = lsLoad('day_' + dk);
        if (day) data.days[dk] = day;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `caltrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('✅ Données exportées !');
}

/* ---------- Import JSON ---------- */
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('❌ Fichier trop volumineux (max 2 Mo)'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.settings || typeof data.settings !== 'object') throw new Error('Format invalide');
                // Validate minimum required fields
                const s = data.settings;
                if (!s.age || !s.h || !s.w) throw new Error('Données incomplètes');
                lsSave('settings', s);
                if (data.weightHistory && Array.isArray(data.weightHistory)) lsSave('weight-history', data.weightHistory);
                if (data.days && typeof data.days === 'object') {
                    Object.entries(data.days).forEach(([dk, day]) => {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dk)) lsSave('day_' + dk, day);
                    });
                }
                S = s;
                // Recalculate derived nutritional values after import
                calcNutrition();
                showToast('✅ Données importées !');
                setTimeout(() => { launchApp(); }, 800);
            } catch (err) {
                alert('❌ Fichier invalide ou corrompu : ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/* ---------- Reset all data ---------- */
function resetAllData() {
    if (!confirm('⚠️ Supprimer TOUTES les données ? Cette action est irréversible.')) return;
    if (!confirm('Dernière confirmation — effacer tout ?')) return;
    localStorage.clear();
    location.reload();
}
