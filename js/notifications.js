/* ============================================================
   notifications.js — Reminders for hydration & meals
   ============================================================ */

const NOTIF_KEY = 'notif_enabled';
let _notifTimers = [];

function notifEnabled() {
    return lsLoad(NOTIF_KEY) === true && Notification.permission === 'granted';
}

async function requestNotifPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

function sendNotif(title, body, icon = './icon-192.png') {
    if (!notifEnabled()) return;
    try { new Notification(title, { body, icon, silent: false }); } catch {}
}

function scheduleReminders() {
    // Clear existing timers
    _notifTimers.forEach(t => clearTimeout(t));
    _notifTimers = [];
    if (!notifEnabled()) return;

    const now = new Date();
    const schedules = [
        { h: 8,  m: 0,  title: '🌅 Petit-déjeuner',   body: 'N\'oublie pas de noter ton petit-déjeuner !' },
        { h: 10, m: 0,  title: '💧 Hydratation',        body: 'Un verre d\'eau ? Tu en es où ?' },
        { h: 12, m: 0,  title: '☀️ Déjeuner',           body: 'C\'est l\'heure du déjeuner — pense à noter !' },
        { h: 14, m: 0,  title: '💧 Hydratation',        body: 'Rappel eau — tu as bu assez aujourd\'hui ?' },
        { h: 16, m: 0,  title: '🍎 Collation',          body: 'Collation dans le budget ? Pense à la noter.' },
        { h: 16, m: 0,  title: '💧 Hydratation',        body: 'Plus que quelques heures — reste hydraté(e) !' },
        { h: 19, m: 0,  title: '🌙 Dîner',              body: 'Heure du dîner — note ton repas du soir !' },
        { h: 21, m: 0,  title: '📊 Bilan du jour',      body: 'As-tu noté tous tes repas ? Vérifie ton journal.' },
    ];

    schedules.forEach(({ h, m, title, body }) => {
        const target = new Date(now);
        target.setHours(h, m, 0, 0);
        if (target <= now) return; // already passed today
        const delay = target.getTime() - now.getTime();
        const t = setTimeout(() => sendNotif(title, body), delay);
        _notifTimers.push(t);
    });
}

function initNotifications() {
    if (!('Notification' in window)) return;
    scheduleReminders();
}

function setNotifEnabled(val) {
    lsSave(NOTIF_KEY, val);
    if (val) {
        requestNotifPermission().then(granted => {
            if (granted) { scheduleReminders(); showToast('🔔 Rappels activés !'); }
            else { lsSave(NOTIF_KEY, false); showToast('❌ Permission refusée'); }
        });
    } else {
        _notifTimers.forEach(t => clearTimeout(t));
        _notifTimers = [];
        showToast('🔕 Rappels désactivés');
    }
}
