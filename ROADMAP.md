# 🗺️ Roadmap — Lyno

**Objectif final :** vraie app de tracking complète — nourriture, sport, poids, objectifs.

Légende : ✅ fait · 🔥 priorité · ⏳ plus tard · ❄️ optionnel
Effort : S (<1h) · M (2-4h) · L (journée+)

---

## ✅ Déjà fait

- Wizard profil, BMR/TDEE, calorie cycling
- Journal 4 repas, OpenFoodFacts, favoris, copy-yesterday
- Exercice presets par catégorie
- Poids : courbe Bézier, IMC, filtres 7/30/all
- Suivi : streak, heatmap, projection vs réel
- PWA hors-ligne, notifications, export/import
- Mis en ligne sur GitHub Pages ✨
- **Phase 1 (nutrition)** : N1 portions, N2 scanner code-barres, N3 recettes ✅
- **Phase 2 (sport)** : S1 muscu séries/reps/charge, S2 cardio distance/FC, S3 progression + PR 1RM ✅
- **Phase 3 (corps & objectifs)** : C1 mensurations, C2 %MG Navy, O1 deadline, O2 jalons ✅
- **Refonte ergo** : onglets dédiés Journal / Sport / Corps / Poids / Suivi ✅
- **Phase 4 (analytics)** : A1 bilan intelligent 30j, A2 top foods + trends, O5 ETA prediction ✅
- **Phase 5 (polish)** : P1 dark mode, P3 undo toast ✅

---

## 🍽️ NOURRITURE

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| N1 | **Portions / quantités** (×0.5, ×2, édition en grammes) | 🔥 | M |
| N2 | **Scanner code-barres** (caméra + ZXing + OpenFoodFacts) | 🔥 | M |
| N3 | **Recettes** (combiner plusieurs aliments → template réutilisable) | 🔥 | M |
| N4 | **Planification repas** (semaine à venir, génère liste de courses) | ⏳ | L |
| N5 | **Micronutriments** (fibres, sel, sucre, vitamines) | ⏳ | M |
| N6 | **Photo de repas** (localStorage blob ou IndexedDB) | ⏳ | M |
| N7 | **Fenêtre alimentaire / jeûne intermittent** (16:8, timer) | ⏳ | S |
| N8 | **Cheat day tracker** (exclure du streak, 1/semaine) | ❄️ | S |

---

## 💪 SPORT

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| S1 | **Musculation : séries/reps/charge** (tracker par exercice) | 🔥 | L |
| S2 | **Cardio : distance / allure / durée** (course, vélo, natation) | 🔥 | M |
| S3 | **Historique progression** (charge max par exo, courbe) | 🔥 | M |
| S4 | **Programmes d'entraînement** (PPL, full body, split perso) | ⏳ | L |
| S5 | **1RM calculator** (Epley, Brzycki) | ⏳ | S |
| S6 | **Timer repos** (90s entre séries, son/vibration) | ⏳ | S |
| S7 | **Builder workout perso** (créer ses propres séances) | ⏳ | M |
| S8 | **Démos vidéo exos** (lien YouTube ou GIF) | ❄️ | M |

---

## ⚖️ CORPS

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| C1 | **Mesures corporelles** (taille, hanches, bras, cuisses, poitrine) | 🔥 | S |
| C2 | **% masse grasse** (méthode Navy, Jackson-Pollock) | 🔥 | S |
| C3 | **Photos progression** (comparateur avant/après) | ⏳ | M |
| C4 | **Ratio taille/hauteur** (indicateur santé viscérale) | ⏳ | S |
| C5 | **Courbe multi-mesures** (poids + taille + MG superposés) | ⏳ | M |

---

## 🎯 OBJECTIFS

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| O1 | **Objectifs avec deadline** ("75kg avant le 15 juin") | 🔥 | M |
| O2 | **Jalons intermédiaires** (−2kg, −5kg, −10kg avec célébrations) | 🔥 | S |
| O3 | **Badges / achievements** (premier jour, 7-day streak, etc.) | ⏳ | M |
| O4 | **Détection plateau** (poids stagne 10j → recommandation) | ⏳ | M |
| O5 | **Prédiction ETA** ("À ce rythme, objectif atteint le 3 août") | ⏳ | S |
| O6 | **Multi-objectifs** (perte puis stabilisation puis prise musculaire) | ❄️ | L |

---

## 📊 ANALYTICS

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| A1 | **Bilan hebdomadaire intelligent** (analyse auto + reco) | 🔥 | M |
| A2 | **Graph calories historique** (30j, 90j, 1an) | 🔥 | S |
| A3 | **Bilan mensuel PDF** (export) | ⏳ | M |
| A4 | **Corrélations** (sommeil vs poids, sport vs humeur) | ⏳ | L |
| A5 | **Comparaison semaines** (cette semaine vs semaine dernière) | ⏳ | S |
| A6 | **Meilleur jour / pire jour** (de la semaine) | ⏳ | S |

---

## 🌙 BIEN-ÊTRE

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| B1 | **Sommeil** (heures + qualité) | ⏳ | S |
| B2 | **Humeur / énergie** (1-5 par jour) | ⏳ | S |
| B3 | **Stress** | ❄️ | S |
| B4 | **Cycle menstruel** (option profil femme) | ❄️ | M |

---

## ✨ POLISH

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| P1 | **Mode sombre** (toggle + tokens CSS) | 🔥 | S |
| P2 | **Animations fines** (micro-interactions, haptic si mobile) | ⏳ | M |
| P3 | **Undo après delete** (toast "Annuler" 5s) | ⏳ | S |
| P4 | **Drag-to-reorder** (aliments, exos) | ⏳ | M |
| P5 | **i18n FR/EN** (traductions) | ❄️ | M |

---

## 🔌 INTÉGRATIONS (long terme)

| # | Feature | Prio | Effort |
|---|---------|------|--------|
| I1 | **Google Fit / Apple Health** | ❄️ | L |
| I2 | **Strava / Garmin / Fitbit** (import activités) | ❄️ | L |
| I3 | **Cloud backup optionnel** (Firebase/Supabase gratuit) | ❄️ | L |
| I4 | **Sync multi-appareils** | ❄️ | L |

---

## 🛣️ PLAN D'ATTAQUE CONSEILLÉ

**Phase 1 — Complétude nutrition (2-3 sessions)**
→ N1 Portions · N2 Code-barres · N3 Recettes

**Phase 2 — Complétude sport (2 sessions)**
→ S1 Musculation séries/reps · S2 Cardio distance/allure · S3 Progression

**Phase 3 — Corps & objectifs (1 session)**
→ C1 Mesures · C2 %MG · O1 Deadline · O2 Jalons

**Phase 4 — Intelligence (1 session)**
→ A1 Bilan hebdo · A2 Graph historique · O5 Prédiction ETA

**Phase 5 — Polish (1 session)**
→ P1 Dark mode · P3 Undo · P2 Animations

**Phase 6 — Bien-être (optionnel)**
→ B1 Sommeil · B2 Humeur

**Phase 7 — Intégrations (très long terme)**
→ I1-I4

---

*Total ~30 items · priorités 🔥 = 12 items · Phase 1-5 = vraie app complète.*
