# 🎯 Roadmap UX — Zéro friction quotidien

**Principe directeur** : pas de nouvelle feature. On rend l'existant *agréable à utiliser tous les jours*.

3 questions à se poser avant chaque item :
1. Je fais ça chaque matin, combien de **secondes** ?
2. Si je suis fatigué/pressé, je galère ou pas ?
3. Un user nouveau comprend en **5 secondes** ?

Légende : ✅ fait · 🔥 sprint en cours · ⏳ à faire
Effort : XS (<15min) · S (<1h) · M (1-3h) · L (>3h)

---

## 🚀 Sprint 1 — Morning critical path
> Logger un petit-déj identique à hier en **<10 secondes, 1 tap**.

| # | Item | Effort | Statut |
|---|------|--------|--------|
| UX1 | Catégorie **🕒 Récents** par défaut (top 12 aliments par récence × fréquence) | S | ✅ |
| UX2 | Bouton **📋 Copier hier** par repas (déjà là) | — | ✅ |
| UX3 | Édition inline grammes au tap (déjà là via `_editingFood`) | — | ✅ |
| UX4 | Bouton **📷 Scanner** direct sur dashboard (auto-pick repas selon heure) | XS | ✅ |
| UX5 | `Enter = submit` + `inputmode=decimal` partout | XS | ✅ |

---

## 👀 Sprint 2 — Glance at phone
> Comprendre l'état du jour en **1 seconde, sans réfléchir**.

| # | Item | Effort | Statut |
|---|------|--------|--------|
| UX6 | Greeting actionnable : "Il te reste **1247 kcal** et **2 repas**" | S | ✅ |
| UX7 | Chip "aujourd'hui" visible sur toutes les pages | XS | ⏳ |
| UX8 | Couleurs sémantiques cohérentes (vert/orange/rouge) partout | XS | 🟡 partiel |
| UX9 | Notifications enrichies (kcal restantes contextuel) | S | ⏳ |
| UX19 | Badge rouge sur bottom-nav si pas logué aujourd'hui | XS | ✅ |

---

## 💪 Sprint 3 — Anti-abandon
> Ne pas décrocher après 1 oubli.

| # | Item | Effort | Statut |
|---|------|--------|--------|
| UX10 | Rattrapage streak 12h (oubli hier → log avant midi OK) | S | ✅ |
| UX11 | Mode vacances (pause streak/rappels, pas de guilt) | S | ⏳ |
| UX12 | Rappel intelligent (rien logué à 14h → notif douce) | M | ⏳ |
| UX13 | "Welcome back" après absence 7j+ | S | ⏳ |

---

## ✨ Sprint 4 — Polish sensoriel

| # | Item | Effort | Statut |
|---|------|--------|--------|
| UX14 | Haptic feedback mobile (vibration courte sur tap clé) | S | ✅ |
| UX15 | Skeleton loaders (au lieu de "Chargement...") | S | ⏳ |
| UX16 | `inputmode=decimal` sur tous les champs numériques | XS | ✅ |
| UX17 | Pull-to-refresh sur dashboard | S | ⏳ |
| UX22 | Empty states guidés (CTA + visuel) | S | ✅ |
| UX23 | `prefers-color-scheme` auto-détecté au 1er launch | XS | ✅ |

---

## 🧭 Sprint 5 — Navigation native

| # | Item | Effort | Statut |
|---|------|--------|--------|
| UX18 | Swipe gauche/droite dans journal = jour précédent/suivant | M | ⏳ |
| UX20 | FAB "+" persistant sur dashboard | S | ⏳ |
| UX21 | Tuto 30s après wizard (3 bulles pointées) | M | ⏳ |
