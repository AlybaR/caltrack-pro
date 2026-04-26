/* ============================================================
   scenarios.js — User journeys to validate
   Each test:
   - id        : short identifier
   - name      : display label
   - target    : performance goal (informative)
   - fresh     : if false, do NOT clear localStorage before (default true)
   - seed      : object → pre-loaded into localStorage BEFORE iframe reload
                 (so the app boots with this state already present)
   - run(ctx)  : the test body, async function with ctx helpers
   ============================================================ */

const SAMPLE_SETTINGS = {
    name: 'Test',
    age: 30,
    h: 175,
    w: 85,
    g: 78,
    bf: null,
    sexe: 'h',
    act: 1.55,
    rythme: 500,
    mp: 'std',
    cyc: 'off',
    target: 2200,
    tdee: 2700,
    bmr: 1800,
    water: 12
};

// Helper to build seed with settings + optional extras
const seedWith = (...extras) => Object.assign({ settings: SAMPLE_SETTINGS }, ...extras);

const SCENARIOS = [
    /* ─── ONBOARDING ─────────────────────────────────────────── */
    {
        id: 'J14',
        name: 'First-time user — du landing au dashboard',
        target: '< 90 sec, < 15 taps',
        // No seed — fresh user starts on landing
        async run(ctx) {
            await ctx.waitFor('#landing', 8000);
            ctx.assert(ctx.exists('.landing-promises'), 'Landing affiche les 3 promesses');
            await ctx.click('button.btn-landing');
            await ctx.waitFor('#wizard');
            await ctx.waitFor('#ws1.active');
            await ctx.type('#w-name', 'Test');
            await ctx.type('#w-age', '30');
            await ctx.type('#w-height', '175');
            await ctx.type('#w-weight', '85');
            await ctx.type('#w-goal', '78');
            await ctx.wait(200);
            ctx.assert(ctx.exists('#imc-badge') && ctx.text('#imc-badge').includes('IMC'), 'Badge IMC apparaît');
            await ctx.click('button[onclick="wizGo2()"]');
            await ctx.waitFor('#ws2.active');
            await ctx.click('button[onclick="wizGo3()"]');
            await ctx.waitFor('#ws3.active');
            ctx.assert(ctx.exists('#wiz-recap') && ctx.text('#wiz-recap').length > 10, 'Récap rempli');
            await ctx.wait(300);
            ctx.assert(ctx.exists('#rythme-eta') && ctx.text('#rythme-eta').length > 5, 'ETA preview affichée');
            await ctx.click('button[onclick="wizFinish()"]');
            await ctx.waitFor('#page-dash.active');
            ctx.assert(ctx.exists('#ring-cal'), 'Hero ring visible sur dashboard');
        }
    },

    /* ─── DASHBOARD ──────────────────────────────────────────── */
    {
        id: 'J3',
        name: 'Dashboard — vue d\'ensemble en 3 sec',
        target: '< 3 sec, 0 tap',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');
            await ctx.waitFor('#dash-greeting');
            ctx.assert(ctx.text('#dash-greeting').length > 5, 'Greeting affiché');
            ctx.assert(ctx.exists('#dash-actionable'), 'Sous-titre actionnable présent');
            ctx.assert(ctx.exists('#ring-kcal-left'), 'Hero ring kcal visible');
            ctx.assert(ctx.exists('#dash-sport-card'), 'Promesse Sport présente');
            ctx.assert(ctx.exists('#dash-goal-card'), 'Promesse Objectif présente');
        }
    },

    /* ─── JOURNAL — quick add ────────────────────────────────── */
    {
        id: 'J1',
        name: 'Journal — ajouter un aliment via récents',
        target: '< 10 sec, < 4 taps',
        seed: seedWith({
            recent_foods: [
                { n: 'Test pomme', k: 52, p: 0, l: 0, g: 14, ts: Date.now(), count: 5 }
            ]
        }),
        async run(ctx) {
            await ctx.waitFor('#nb-journal');
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(300);
            const qbtn = ctx.$('.quick-grid .qbtn');
            ctx.assert(qbtn, 'Bouton récent visible');
            qbtn.click(); ctx.tapCount++;
            await ctx.wait(400);
            const dk = new Date().toISOString().slice(0, 10);
            const day = ctx.getStorage('day_' + dk);
            const hasMeal = day && day.meals && Object.values(day.meals).some(m => m.length > 0);
            ctx.assert(hasMeal, 'Aliment enregistré dans le jour');
        }
    },

    {
        id: 'J4',
        name: 'Journal — ajout manuel via tab Manuel',
        target: '< 20 sec',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-journal');
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(300);
            const manualTab = ctx.$('button.meal-tab[data-tab="manual"]');
            ctx.assert(manualTab, 'Onglet Manuel visible');
            manualTab.click(); ctx.tapCount++;
            await ctx.wait(200);
            const nameInput = ctx.$$('input[id^="fn-"]')[0];
            const kcalInput = ctx.$$('input[id^="fk-"]')[0];
            ctx.assert(nameInput && kcalInput, 'Inputs manuels visibles');
            nameInput.focus();
            nameInput.value = 'Plat maison';
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            kcalInput.value = '450';
            kcalInput.dispatchEvent(new Event('input', { bubbles: true }));
            kcalInput.focus();
            kcalInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(400);
            const dk = new Date().toISOString().slice(0, 10);
            const day = ctx.getStorage('day_' + dk);
            const hasManual = day && day.meals && Object.values(day.meals).some(m =>
                m.some(f => f.n === 'Plat maison' && f.k === 450));
            ctx.assert(hasManual, 'Plat manuel enregistré');
        }
    },

    /* ─── HYDRATATION ────────────────────────────────────────── */
    {
        id: 'J5',
        name: 'Hydratation — +1 verre d\'eau',
        target: '1 tap',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-dash');
            await ctx.click('#nb-dash');
            await ctx.waitFor('#water-btn-plus');
            const before = parseInt(ctx.text('#water-count'), 10);
            await ctx.click('#water-btn-plus');
            await ctx.wait(200);
            const after = parseInt(ctx.text('#water-count'), 10);
            ctx.assert(after === before + 1, `Verre ajouté (${before} → ${after})`);
        }
    },

    /* ─── SPORT — cardio ─────────────────────────────────────── */
    {
        id: 'J6',
        name: 'Sport — logger une session cardio',
        target: '< 20 sec',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-sport');
            await ctx.click('#nb-sport');
            await ctx.waitFor('#exercice-section');
            await ctx.wait(300);
            const cardioPill = ctx.$$('.ex-cat-btn').find(b => b.textContent.includes('Cardio'));
            if (cardioPill) { cardioPill.click(); ctx.tapCount++; await ctx.wait(200); }
            const firstPreset = ctx.$('.ex-preset-btn');
            ctx.assert(firstPreset, 'Preset cardio visible');
            firstPreset.click(); ctx.tapCount++;
            await ctx.wait(300);
            const durInput = ctx.$('#ex-c-dur');
            ctx.assert(durInput, 'Input durée affichée');
            durInput.focus();
            durInput.value = '30';
            durInput.dispatchEvent(new Event('input', { bubbles: true }));
            await ctx.wait(100);
            const validBtn = ctx.$$('button').find(b => /Ajouter|Valider|Confirmer/.test(b.textContent));
            ctx.assert(validBtn, 'Bouton de validation trouvé');
            validBtn.click(); ctx.tapCount++;
            await ctx.wait(500);
            const dk = new Date().toISOString().slice(0, 10);
            const day = ctx.getStorage('day_' + dk);
            ctx.assert(day && day.exercises && day.exercises.length > 0, 'Exercice enregistré');
        }
    },

    /* ─── POIDS ──────────────────────────────────────────────── */
    {
        id: 'J10',
        name: 'Poids — enregistrer la pesée du matin',
        target: '< 8 sec, 3 taps',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-poids');
            await ctx.click('#nb-poids');
            await ctx.waitFor('#w-today');
            const inp = ctx.$('#w-today');
            inp.focus();
            inp.value = '84.3';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(500);
            const wh = ctx.getStorage('weight-history') || [];
            ctx.assert(wh.length > 0 && Math.abs(wh[wh.length - 1].v - 84.3) < 0.01, 'Pesée 84.3 kg enregistrée');
        }
    },

    /* ─── OBJECTIF ───────────────────────────────────────────── */
    {
        id: 'J11',
        name: 'Dashboard — voir trajectoire vers objectif',
        target: 'visible sans clic',
        seed: (() => {
            const today = new Date();
            const wh = [];
            for (let i = 14; i >= 0; i -= 3) {
                const d = new Date(today); d.setDate(d.getDate() - i);
                wh.push({ d: d.toISOString().slice(0, 10), v: 85 - (14 - i) * 0.15 });
            }
            return seedWith({ 'weight-history': wh });
        })(),
        async run(ctx) {
            await ctx.waitFor('#nb-dash');
            await ctx.click('#nb-dash');
            await ctx.waitFor('#dash-goal-card');
            await ctx.wait(400);
            const goalText = ctx.text('#dash-goal-card');
            ctx.assert(goalText.includes('kg'), 'Card objectif affiche les poids');
            ctx.assert(ctx.exists('#dash-goal-card .goal-progress-fg'), 'Barre de progression rendue');
        }
    },

    /* ─── THEME ──────────────────────────────────────────────── */
    {
        id: 'T1',
        name: 'Theme — toggle clair / sombre',
        target: '1 tap',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-settings');
            await ctx.click('#nb-settings');
            await ctx.waitFor('#theme-toggle');
            const before = ctx.$('html').getAttribute('data-theme');
            const toggle = ctx.$('#theme-toggle');
            toggle.click(); ctx.tapCount++;
            await ctx.wait(200);
            const after = ctx.$('html').getAttribute('data-theme');
            ctx.assert(before !== after, `Theme switched (${before} → ${after})`);
        }
    },

    /* ─── NAV BADGES (UX19) ──────────────────────────────────── */
    {
        id: 'UX19',
        name: 'Bottom-nav — badge rouge si rien logué',
        target: 'visuel sans clic',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-dash');
            await ctx.click('#nb-dash');
            await ctx.wait(300);
            const journalBtn = ctx.$('#nb-journal');
            ctx.assert(journalBtn.classList.contains('has-badge'), 'Badge rouge sur Journal (rien logué aujourd\'hui)');
        }
    },

    /* ─── EMPTY STATES ───────────────────────────────────────── */
    {
        id: 'ES1',
        name: 'Empty states — Poids vide a un CTA',
        target: 'élément visible',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-poids');
            await ctx.click('#nb-poids');
            await ctx.waitFor('#weight-history');
            await ctx.wait(300);
            const empty = ctx.$('#weight-history .empty-state');
            ctx.assert(empty, 'Empty state poids visible');
            const cta = ctx.$('#weight-history .empty-state-cta');
            ctx.assert(cta, 'Empty state contient un CTA (cardinal rule)');
        }
    },

    /* ─── PAGE TRANSITIONS ───────────────────────────────────── */
    {
        id: 'NAV1',
        name: 'Navigation — toutes les pages s\'ouvrent sans erreur',
        target: '< 5 sec, 7 clics',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#nb-dash');
            const pages = ['dash', 'journal', 'sport', 'corps', 'poids', 'suivi', 'settings'];
            for (const p of pages) {
                await ctx.click('#nb-' + p);
                await ctx.wait(200);
                ctx.assert(ctx.$('#page-' + p).classList.contains('active'), `Page ${p} active`);
            }
        }
    },
];
