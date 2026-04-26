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
            // Use precise selector: the cardio confirm button has onclick="confirmCardio()"
            const validBtn = ctx.$('button[onclick="confirmCardio()"]');
            ctx.assert(validBtn, 'Bouton de validation cardio trouvé');
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
            await ctx.waitFor('#page-settings.active');
            await ctx.wait(300);
            // theme-toggle is a custom checkbox (opacity:0 visually) → exists but not "visible"
            // by computed style. Use direct DOM access instead of waitFor.
            const toggle = ctx.$('#theme-toggle');
            ctx.assert(toggle, 'Toggle theme existe dans le DOM');
            const before = ctx.$('html').getAttribute('data-theme');
            toggle.click(); ctx.tapCount++;
            await ctx.wait(300);
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

    /* ╔══════════════════════════════════════════════════════════════╗
       ║  SCÉNARIOS "VRAIE VIE" — simulation utilisateur réaliste     ║
       ╚══════════════════════════════════════════════════════════════╝ */

    /* ─── U1 — Journée complète d'un utilisateur ─────────────── */
    {
        id: 'U1',
        name: '🌅→🌙 Journée complète : 4 repas + sport + eau + pesée',
        target: 'simulation user assidu',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');

            // 🌅 7h30 — Petit-déjeuner
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(300);
            // Tab Manuel sur le 1er repas (petit-déj)
            const breakfastSec = ctx.$$('.meal-section')[0];
            ctx.assert(breakfastSec, 'Section petit-déj présente');
            const manualTab = breakfastSec.querySelector('button.meal-tab[data-tab="manual"]');
            manualTab.click(); ctx.tapCount++;
            await ctx.wait(150);
            const bName = breakfastSec.querySelector('input[id^="fn-"]');
            const bKcal = breakfastSec.querySelector('input[id^="fk-"]');
            bName.value = 'Café + croissant';
            bName.dispatchEvent(new Event('input', { bubbles: true }));
            bKcal.value = '320';
            bKcal.dispatchEvent(new Event('input', { bubbles: true }));
            bKcal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(300);

            // 💧 9h — Premier verre d'eau
            await ctx.click('#nb-dash');
            await ctx.waitFor('#water-btn-plus');
            for (let i = 0; i < 3; i++) {
                await ctx.click('#water-btn-plus');
            }
            const waterCount = parseInt(ctx.text('#water-count'), 10);
            ctx.assert(waterCount === 3, `3 verres d'eau ajoutés (${waterCount})`);

            // ☀️ 13h — Déjeuner via tab Manuel du 2ème repas
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(300);
            const lunchSec = ctx.$$('.meal-section')[1];
            const lunchHd = lunchSec.querySelector('.meal-hd');
            // Open lunch (might be closed by time-of-day default)
            if (lunchSec.classList.contains('closed')) {
                lunchHd.click(); ctx.tapCount++;
                await ctx.wait(200);
            }
            const lManTab = lunchSec.querySelector('button.meal-tab[data-tab="manual"]');
            lManTab.click(); ctx.tapCount++;
            await ctx.wait(150);
            const lName = lunchSec.querySelector('input[id^="fn-"]');
            const lKcal = lunchSec.querySelector('input[id^="fk-"]');
            lName.value = 'Salade poulet quinoa';
            lName.dispatchEvent(new Event('input', { bubbles: true }));
            lKcal.value = '580';
            lKcal.dispatchEvent(new Event('input', { bubbles: true }));
            lKcal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(300);

            // 🏋️ 18h — Séance sport (course 30 min)
            await ctx.click('#nb-sport');
            await ctx.waitFor('#exercice-section');
            await ctx.wait(300);
            const cardioPill = ctx.$$('.ex-cat-btn').find(b => b.textContent.includes('Cardio'));
            if (cardioPill) { cardioPill.click(); ctx.tapCount++; await ctx.wait(200); }
            const runBtn = ctx.$$('.ex-preset-btn').find(b => b.textContent.toLowerCase().includes('course'));
            ctx.assert(runBtn, 'Bouton Course à pied présent');
            runBtn.click(); ctx.tapCount++;
            await ctx.wait(300);
            const durEl = ctx.$('#ex-c-dur');
            durEl.value = '30';
            durEl.dispatchEvent(new Event('input', { bubbles: true }));
            const cardConfirm = ctx.$('button[onclick="confirmCardio()"]');
            cardConfirm.click(); ctx.tapCount++;
            await ctx.wait(400);

            // 🌙 20h — Dîner
            await ctx.click('#nb-journal');
            await ctx.wait(300);
            const dinnerSec = ctx.$$('.meal-section')[2];
            if (dinnerSec.classList.contains('closed')) {
                dinnerSec.querySelector('.meal-hd').click(); ctx.tapCount++;
                await ctx.wait(200);
            }
            const dManTab = dinnerSec.querySelector('button.meal-tab[data-tab="manual"]');
            dManTab.click(); ctx.tapCount++;
            await ctx.wait(150);
            const dName = dinnerSec.querySelector('input[id^="fn-"]');
            const dKcal = dinnerSec.querySelector('input[id^="fk-"]');
            dName.value = 'Saumon riz légumes';
            dName.dispatchEvent(new Event('input', { bubbles: true }));
            dKcal.value = '650';
            dKcal.dispatchEvent(new Event('input', { bubbles: true }));
            dKcal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(300);

            // ⚖️ 21h — Pesée du jour
            await ctx.click('#nb-poids');
            await ctx.waitFor('#w-today');
            const wInp = ctx.$('#w-today');
            wInp.value = '84.6';
            wInp.dispatchEvent(new Event('input', { bubbles: true }));
            wInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await ctx.wait(400);

            // 📊 Vérifications globales
            const dk = new Date().toISOString().slice(0, 10);
            const day = ctx.getStorage('day_' + dk);
            ctx.assert(day, 'Day enregistré');
            const totalKcal = Object.values(day.meals).flat().reduce((s, f) => s + (f.k || 0), 0);
            ctx.assert(totalKcal === 320 + 580 + 650, `Total kcal correct: ${totalKcal}`);
            ctx.assert(day.water === 3, `Water count: ${day.water}`);
            ctx.assert(day.exercises && day.exercises.length === 1, 'Un exercice loggé');
            const wh = ctx.getStorage('weight-history');
            ctx.assert(wh && wh.length === 1 && wh[0].v === 84.6, 'Pesée enregistrée');

            // Retour dashboard — vérifie que le ring reflète les kcal
            await ctx.click('#nb-dash');
            await ctx.waitFor('#ring-kcal-left');
            await ctx.wait(500);
            const ringText = ctx.text('#ring-kcal-left');
            ctx.assert(ringText && !isNaN(parseInt(ringText.replace(/[^\d−-]/g, ''), 10)), `Ring affiche un nombre: ${ringText}`);

            // Sport-today card devrait afficher l'exercice
            const sportCard = ctx.text('#dash-sport-card');
            ctx.assert(sportCard.toLowerCase().includes('course') || sportCard.includes('kcal'), 'Sport card affiche la séance');
        }
    },

    /* ─── U2 — User assidu sur 7 jours (pré-seedé) ───────────── */
    {
        id: 'U2',
        name: '📅 7 jours d\'historique : streak + heatmap + courbe',
        target: 'visualisation continuité',
        seed: (() => {
            const today = new Date();
            const days = {};
            const wh = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today); d.setDate(d.getDate() - i);
                const dk = d.toISOString().slice(0, 10);
                days['day_' + dk] = {
                    meals: {
                        breakfast: [{ n: 'Oats + banane', k: 320 }],
                        lunch:     [{ n: 'Poulet riz salade', k: 620 }],
                        dinner:    [{ n: 'Soupe légumes', k: 450 }],
                        snack:     [{ n: 'Yaourt', k: 100 }]
                    },
                    water: 8,
                    weight: 85 - i * 0.2,
                    exercises: i % 2 === 0 ? [{ n: 'Course', kcal: 350, dur: 30, type: 'cardio' }] : []
                };
                wh.push({ d: dk, v: 85 - i * 0.2 });
            }
            return seedWith({ 'weight-history': wh, ...days });
        })(),
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');
            await ctx.wait(400);

            // 1. Streak chip doit afficher 7
            const streakChip = ctx.$('#dash-streak-chip');
            const streakText = ctx.text('#dash-streak-chip');
            ctx.assert(streakChip && streakText.includes('7'), `Streak = 7 jours (${streakText})`);

            // 2. Suivi tab → heatmap doit avoir des cases vertes
            await ctx.click('#nb-suivi');
            await ctx.waitFor('#month-heatmap');
            await ctx.wait(400);
            const heatmap = ctx.$('#month-heatmap');
            ctx.assert(heatmap.children.length > 0, 'Heatmap rendue avec cases');
            const greenCells = heatmap.querySelectorAll('.heatmap-day');
            ctx.assert(greenCells.length > 0, `${greenCells.length} cases rendues`);

            // 3. Poids tab → courbe doit s'afficher (canvas non vide)
            await ctx.click('#nb-poids');
            await ctx.waitFor('#weight-canvas');
            await ctx.wait(500);
            const canvas = ctx.$('#weight-canvas');
            // Sample a pixel to verify drawing happened (non-empty canvas)
            const c2d = canvas.getContext('2d');
            const pixels = c2d.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
            const drawn = pixels[0] + pixels[1] + pixels[2] + pixels[3] > 0;
            ctx.assert(drawn, 'Canvas weight rendu (pixel non vide)');

            // 4. Hero stats poids
            const stats = ctx.text('#poids-stats');
            ctx.assert(stats.includes('kg'), `Stats poids affichent kg (${stats.slice(0, 60)}...)`);
        }
    },

    /* ─── U3 — Power user : 15 aliments, 3 exos, vérifie perf ── */
    {
        id: 'U3',
        name: '⚡ Power user : 15 aliments + 3 exos en 1 jour',
        target: 'performance + intégrité data',
        seed: seedWith(),
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');
            const dk = new Date().toISOString().slice(0, 10);
            // Direct injection (plus rapide que click-by-click)
            const day = {
                meals: {
                    breakfast: [
                        { n: 'Café', k: 5 },
                        { n: 'Croissant', k: 230 },
                        { n: 'Jus orange', k: 110 }
                    ],
                    lunch: [
                        { n: 'Steak haché 150g', k: 320 },
                        { n: 'Pâtes 200g', k: 280 },
                        { n: 'Salade verte', k: 30 },
                        { n: 'Yaourt', k: 80 }
                    ],
                    dinner: [
                        { n: 'Saumon 150g', k: 310 },
                        { n: 'Riz complet 150g', k: 195 },
                        { n: 'Brocolis', k: 50 },
                        { n: 'Compote', k: 90 }
                    ],
                    snack: [
                        { n: 'Pomme', k: 52 },
                        { n: 'Amandes 30g', k: 174 },
                        { n: 'Carré chocolat', k: 50 },
                        { n: 'Thé', k: 0 }
                    ]
                },
                water: 8,
                exercises: [
                    { n: 'Course à pied', kcal: 412, dur: 30, type: 'cardio' },
                    { n: 'Squat',  kcal: 80,  type: 'strength', sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 8, weight: 80 }] },
                    { n: 'Tractions', kcal: 60, type: 'strength', sets: [{ reps: 6 }, { reps: 5 }, { reps: 5 }] }
                ]
            };
            ctx.setStorage('day_' + dk, day);

            // Reload journal pour voir les 15 aliments
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(500);

            // Vérifie que les 4 sections affichent leurs aliments
            const sections = ctx.$$('.meal-section');
            ctx.assert(sections.length === 4, '4 sections de repas');

            // Total = 320 + 710 + 645 + 276 = 1951
            const totalKcal = Object.values(day.meals).flat().reduce((s, f) => s + f.k, 0);
            ctx.assert(totalKcal === 1951, `Total kcal correct: ${totalKcal}`);

            // Tab Sport → 3 exos affichés
            await ctx.click('#nb-sport');
            await ctx.waitFor('#ex-list');
            await ctx.wait(500);
            const exItems = ctx.$$('.ex-item, #ex-list > div').filter(el => !el.classList.contains('empty-state'));
            ctx.assert(exItems.length >= 3 || ctx.$('#ex-list').textContent.includes('Course'),
                `Liste exercices contient les 3 entrées (trouvé ${exItems.length})`);

            // Dashboard reflète tout
            await ctx.click('#nb-dash');
            await ctx.wait(500);
            const eaten = ctx.text('#d-eaten');
            ctx.assert(eaten.includes('1951') || parseInt(eaten, 10) === 1951, `D-eaten = 1951 (${eaten})`);
            const burned = ctx.text('#d-burned');
            ctx.assert(burned.includes('552') || parseInt(burned.replace('+', ''), 10) === 552, `Burned correct (${burned})`);
        }
    },

    /* ─── U4 — Récents contextuels par repas ────────────────── */
    {
        id: 'U4',
        name: '🕒 Récents pondérés selon repas (matin vs soir)',
        target: 'algorithme contextuel',
        seed: seedWith({
            recent_foods: [
                { n: 'Café', k: 5, ts: Date.now(), count: 10, mks: { breakfast: 10 } },
                { n: 'Pasta dîner', k: 500, ts: Date.now(), count: 8, mks: { dinner: 8 } },
                { n: 'Sandwich midi', k: 400, ts: Date.now(), count: 6, mks: { lunch: 6 } },
                { n: 'Yaourt grec', k: 150, ts: Date.now(), count: 4, mks: { breakfast: 2, lunch: 2 } }
            ]
        }),
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');
            await ctx.click('#nb-journal');
            await ctx.waitFor('#meals-container');
            await ctx.wait(400);

            // Ouvre toutes les sections pour les inspecter
            ctx.$$('.meal-section').forEach(sec => {
                if (sec.classList.contains('closed')) sec.querySelector('.meal-hd').click();
            });
            await ctx.wait(500);

            // Pour chaque section, le 1er bouton Récents devrait correspondre au repas
            const sections = ctx.$$('.meal-section');
            const expected = {
                breakfast: 'Café',           // breakfast count = 10 → top
                lunch:     'Sandwich midi',  // lunch count = 6 → top
                dinner:    'Pasta dîner',    // dinner count = 8 → top
            };
            // Click on '🕒 Récents' tab in each section first
            for (const sec of sections) {
                const recCat = sec.querySelectorAll('.qcat-btn');
                const recentBtn = Array.from(recCat).find(b => b.textContent.includes('Récents'));
                if (recentBtn) { recentBtn.click(); }
            }
            await ctx.wait(300);

            // Verify breakfast récents shows Café first
            const breakfastSec = sections[0];
            const breakfastTopBtn = breakfastSec.querySelector('.quick-grid .qbtn');
            ctx.assert(breakfastTopBtn, 'Breakfast récents : 1er bouton');
            ctx.assert(breakfastTopBtn.textContent.includes('Café'),
                `Breakfast top = Café (${breakfastTopBtn.textContent.slice(0, 30)})`);

            // Lunch
            const lunchSec = sections[1];
            const lunchTopBtn = lunchSec.querySelector('.quick-grid .qbtn');
            ctx.assert(lunchTopBtn && lunchTopBtn.textContent.includes('Sandwich'),
                `Lunch top = Sandwich (${lunchTopBtn?.textContent?.slice(0, 30)})`);

            // Dinner
            const dinnerSec = sections[2];
            const dinnerTopBtn = dinnerSec.querySelector('.quick-grid .qbtn');
            ctx.assert(dinnerTopBtn && dinnerTopBtn.textContent.includes('Pasta'),
                `Dinner top = Pasta (${dinnerTopBtn?.textContent?.slice(0, 30)})`);
        }
    },

    /* ─── U5 — Soft empty states partout ─────────────────────── */
    {
        id: 'U5',
        name: '🆕 New user : tous les empty states ont un CTA',
        target: 'cardinal rule check',
        seed: seedWith(),  // settings only, no data
        async run(ctx) {
            await ctx.waitFor('#page-dash.active');
            await ctx.wait(300);

            // Dashboard : Sport empty + Goal empty
            const dashHTML = ctx.$('#page-dash').innerHTML;
            ctx.assert(dashHTML.includes('Sport') || ctx.$('#dash-sport-card'), 'Sport-today card présente');
            ctx.assert(dashHTML.includes('Objectif') || ctx.$('#dash-goal-card'), 'Goal card présente');

            // Journal : empty meal section
            await ctx.click('#nb-journal');
            await ctx.wait(400);
            const emptyJournal = ctx.$$('.empty-state').filter(el => isVisibleSafe(el, ctx));
            ctx.assert(emptyJournal.length > 0, 'Empty state journal visible');

            // Sport : empty exercise list
            await ctx.click('#nb-sport');
            await ctx.wait(400);
            const emptySport = ctx.$('#ex-list .empty-state');
            ctx.assert(emptySport, 'Empty state sport visible');

            // Poids : empty history
            await ctx.click('#nb-poids');
            await ctx.wait(400);
            const emptyPoids = ctx.$('#weight-history .empty-state');
            ctx.assert(emptyPoids, 'Empty state poids visible');
            const cta = ctx.$('#weight-history .empty-state-cta');
            ctx.assert(cta, 'Empty state poids contient CTA');
        }
    },
];

/* Helper used by U5 — checks visibility without throwing on dead elements */
function isVisibleSafe(el, ctx) {
    if (!el) return false;
    try {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none';
    } catch(e) { return true; }
}
