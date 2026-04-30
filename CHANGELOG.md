# 📜 CHANGELOG — Meki

Trace complète de tous les changements depuis le début du projet.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/).

---

## [v1.0.0-rc] — 2026-04-26 (Release Candidate)

État : **shippable.** 22/22 tests E2E passent. Ergonomie validée. Reste : assets visuels + Play Console.

### Tests E2E (nouveau)
- ✅ Test runner auto-hébergé (`tests/index.html`) — 22 scénarios sans npm
- ✅ Stress tests : 1000 récents (491ms render), 90j historique (693ms), 50 aliments/repas, XSS edge cases
- ✅ Métriques ergonomiques : targetMs / targetTaps par scénario
- ✅ Returning user (U1b) : 8 taps pour 4 repas vs U1 fresh = 18 taps (-55%)

### Polish technique
- ✅ Swipe gauche/droite dans Journal = jour précédent/suivant
- ✅ Pull-to-refresh sur Dashboard
- ✅ Accessibilité : focus-visible, aria-labels nav, touch targets 44×44, skip-link

### Boot flash fix + récents par repas
- ✅ Plus de flash landing au boot (display:none par défaut + showLanding explicite)
- ✅ Récents pondérés par meal slot : café au breakfast, pasta au dinner

---

## [v0.9] — 2026-04-25 (Production-ready core)

### Surfaces refondues v2
- **Dashboard v2** : hero ring 240px gradient profond + halo breathing + count-up + stagger reveal cards
- **Dashboard v3** : focus 3 promesses (Calories / Sport / Objectifs). Score/Bien-être/Micros déplacés vers Suivi.
- **Journal v2** : 1 repas déplié à la fois selon l'heure, scanner compact, "Comme hier" CTA prominent
- **Sport v2** : récents par défaut, "Recommencer la séance d'hier", renaming Muscu détaillée/globale
- **Wizard v2** : 3 promesses landing, suggestion poids cible IMC, ETA live, options avancées repliées
- **Poids v2** : hero "poids actuel" XXL, Δ 7 jours sémantique, IMC apaisé, empty graph soigné

### Design system v2 — "Bien-être × Performance"
- ✅ `DESIGN-SYSTEM.md` canonical reference (palette, type scale, spacing, motion, 10 règles cardinales)
- ✅ Tokens : `--well` sage, `--info`, `--data`, `--warn-bg`, type scale 7 niveaux, spacing 4-base
- ✅ Lucide icons CDN + helper `ico()` + auto-refresh
- ✅ Empty state component canonique (Lucide + title + desc + CTA)

### Sprint 1-4 UX
- ✅ UX1-5 : Récents Journal, scan dashboard, Enter sur poids
- ✅ UX10 : grace 12h sur streak
- ✅ UX14 : haptic feedback (tap/success/warn/error)
- ✅ UX16 : inputmode=decimal mobile
- ✅ UX19 : badge rouge nav si pas logué
- ✅ UX22 : empty states avec CTA partout
- ✅ UX23 : prefers-color-scheme auto-détecté

### Play Store prep (E1-E4)
- ✅ Manifest complet (id, scope, lang, categories, shortcuts, screenshots placeholders)
- ✅ `privacy.html` + `terms.html` RGPD-compliant
- ✅ `PLAYSTORE-LISTING.md` : copy FR + EN + Data Safety pré-rempli
- ✅ `PLAYSTORE-SUBMIT.md` : guide step-by-step PWABuilder + Play Console
- ✅ `PLAYSTORE-CHECKLIST.md` : master checklist 6 phases
- ✅ `logo-generator.html` : outil canvas pour 192/512/1024 + feature graphic 1024×500
- ✅ `landing.html` : page marketing publique avec FAQ
- ✅ `PRESS-KIT.md` : posts X/Reddit/LinkedIn/PH/TikTok ready

### Monétisation
- ✅ `MONETIZATION.md` : stratégie zéro-management (donations + Pro Lifetime futur)
- ✅ Settings → Soutenir le projet (Buy Me a Coffee + GitHub Sponsors)

---

## [v0.8] — 2026-04-24 (Auth + Sync)

- ✅ Firebase Auth (Email + Google) + Firestore sync optionnelle
- ✅ Bidirectional sync localStorage ↔ Firestore (push-if-empty / pull-if-exists)
- ✅ Realtime listeners onSnapshot
- ✅ Privacy text dynamique selon mode local vs cloud
- ✅ Phase 4 Analytics : bilan 30j intelligent + insights
- ✅ Phase 5 : dark mode + undo toast + ETA prediction
- ✅ Phase 6 Wellness : sleep + mood + energy
- ✅ N5 Micronutriments : fibres / sucres / sel / sat

---

## [v0.7] — 2026-04-23 (Phases 1-3)

- ✅ Phase 1 Nutrition : N1 portions, N2 scanner code-barres ZXing, N3 recettes
- ✅ Phase 2 Sport : musculation séries/reps/charges, cardio distance/FC, progression Chart.js
- ✅ Phase 3 Corps : mensurations + photos + objectifs SMART + jalons

---

## [v0.6] — 2026-04-23 (MVP shipped)

- ✅ Wizard 3 étapes (Mifflin-St Jeor, TDEE, déficit calibré)
- ✅ Journal 4 repas avec OpenFoodFacts
- ✅ Poids avec courbe Bézier + IMC + filtres
- ✅ Suivi avec streak + heatmap + projection
- ✅ PWA hors-ligne + service worker

---

## Stats du projet (au 2026-04-26)

| Métrique | Valeur |
|---|---|
| Commits | 49 |
| Fichiers JS | 21 |
| Lignes CSS | ~4500 |
| Tests E2E | 22 |
| Surfaces refondues v2 | 5 (Dashboard / Journal / Sport / Wizard / Poids) |
| Documents stratégiques | 12 |
| Effort total estimé | ~80h dev solo |
