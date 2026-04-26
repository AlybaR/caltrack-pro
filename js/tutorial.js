/* ============================================================
   tutorial.js — First-launch onboarding tutorial (UX21)
   Triggered after wizard completion. 3 spotlights, skip-able.
   ============================================================ */

const TUTORIAL_STEPS = [
    {
        target: '.ring-hero-card',
        title: 'Ton anneau de calories',
        body: 'Le chiffre central = combien tu peux encore manger aujourd\'hui. L\'anneau se remplit à mesure que tu logges tes repas.',
        position: 'bottom',
    },
    {
        target: '.quick-add-row',
        title: 'Ajouter un repas en 3 secondes',
        body: 'Tape <b>+ Ajouter un repas</b> pour logger. Le bouton <b>📷</b> ouvre direct le scanner code-barres.',
        position: 'bottom',
    },
    {
        target: '.bot-nav, .side-nav',
        title: 'Navigue entre les 7 onglets',
        body: 'Journal = tes repas · Sport = tes séances · Poids = ta courbe · Suivi = bilans hebdo. Tout depuis le bas de l\'écran.',
        position: 'top',
    },
];

let _tutorialStep = 0;

function maybeShowTutorial() {
    if (lsLoad('tutorial_seen') === true) return;
    // Only on dashboard, only after launchApp finished
    setTimeout(() => {
        if (!document.getElementById('page-dash')?.classList.contains('active')) return;
        showTutorialStep(0);
    }, 600);
}

function showTutorialStep(idx) {
    _tutorialStep = idx;
    const step = TUTORIAL_STEPS[idx];
    if (!step) { closeTutorial(true); return; }

    let overlay = document.getElementById('tutorial-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'tutorial-overlay';
        document.body.appendChild(overlay);
    }

    const target = document.querySelector(step.target);
    if (!target) {
        // Target not found — skip this step
        showTutorialStep(idx + 1);
        return;
    }

    const rect = target.getBoundingClientRect();
    const pad = 8;
    const top    = Math.max(rect.top - pad, 0);
    const left   = Math.max(rect.left - pad, 0);
    const width  = rect.width + pad * 2;
    const height = rect.height + pad * 2;

    // Bubble position
    const bubblePos = step.position === 'top'
        ? { bottom: (window.innerHeight - rect.top + 16) + 'px', top: 'auto' }
        : { top: (rect.bottom + 16) + 'px' };

    overlay.innerHTML = `
        <div class="tutorial-spotlight" style="top:${top}px;left:${left}px;width:${width}px;height:${height}px;"></div>
        <div class="tutorial-bubble" style="${Object.entries(bubblePos).map(([k,v])=>`${k}:${v}`).join(';')}">
            <div class="tutorial-step-num">${idx + 1} / ${TUTORIAL_STEPS.length}</div>
            <div class="tutorial-title">${step.title}</div>
            <div class="tutorial-body">${step.body}</div>
            <div class="tutorial-actions">
                <button class="tutorial-skip" onclick="closeTutorial(true)">Passer</button>
                <button class="tutorial-next" onclick="nextTutorialStep()">${idx === TUTORIAL_STEPS.length - 1 ? '✓ Compris' : 'Suivant →'}</button>
            </div>
        </div>
    `;

    // Scroll target into view smoothly
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function nextTutorialStep() {
    if (typeof haptic === 'function') haptic('tap');
    showTutorialStep(_tutorialStep + 1);
}

function closeTutorial(markSeen) {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.remove();
    if (markSeen) lsSave('tutorial_seen', true);
    if (typeof haptic === 'function') haptic('success');
}

// Hook into launchApp
const _origLaunchApp = window.launchApp;
if (typeof _origLaunchApp === 'function') {
    window.launchApp = function () {
        const r = _origLaunchApp.apply(this, arguments);
        maybeShowTutorial();
        return r;
    };
}
