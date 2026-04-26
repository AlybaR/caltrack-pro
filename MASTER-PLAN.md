# 🎯 MASTER PLAN — Mise en marché Lyno

> **Plan d'attaque que tu peux suivre seul** si tu n'as plus de crédits Claude.
> Chaque action a ses pré-requis, instructions step-by-step, critère de complétion.
> Ordonné par dépendance + ROI.

---

## 📊 État actuel (snapshot)

| Domaine | Statut |
|---|---|
| Code app | ✅ Mature (5 surfaces v2) |
| Tests E2E | ✅ 22/22 passing |
| Design system | ✅ Documenté + appliqué |
| RGPD legal | ✅ privacy.html + terms.html live |
| Marketing | ✅ Landing + press kit prêts |
| Monétisation | ✅ Strategy + donation buttons |
| Email | ⏳ lyno.app1@gmail.com (à créer) |
| Logo HD | ⏳ À générer via logo-generator.html |
| Screenshots | ⏳ 8 captures à prendre |
| Play Console | ⏳ Compte à créer ($25) |
| Performance | ⚠️ Lighthouse 59 → à optimiser |
| Nom du projet | ⚠️ "Lyno" pris sur stores → renommer |
| Design icônes | ⚠️ Trop d'emojis dans le chrome → Lucide |
| Mobile UX food entry | ⚠️ À améliorer |

---

## 🚦 PHASES — ordre d'exécution

### **PHASE 0 — Décisions stratégiques (TOI, 30 min)**

Tu dois trancher AVANT toute action :

#### 0.1 — Nouveau nom (à choisir)
- [ ] **Caltria** / **MacroFlow** / **NutriRing** / **Lyno** / **Tracé** / autre ?
- [ ] Une fois décidé : me dire et je remplace partout en 1 commit (ou tu fais sed manuellement)

#### 0.2 — Stratégie hosting
- [ ] **Option A** : rester sur GitHub Pages (gratuit, suffisant pour le launch)
- [ ] **Option B** : migrer vers Vercel + custom domain (10€/an, look pro)
- [ ] Décision recommandée : **A maintenant, B après le launch si traction**

#### 0.3 — Marchés cibles
- [ ] FR uniquement au launch ?
- [ ] FR + EN dès le début ? (translate listing copy)
- [ ] Décision recommandée : **FR seul** (focus, mesure, puis EN à M+3)

---

### **PHASE 1 — Tech polish (MOI ou TOI, 2-3h)**

Items qui améliorent objectivement la qualité avant submit. Ordonnés par ROI.

#### 1.1 — Performance Lighthouse (1h, gain 59 → 85+)
- [ ] **TODO** : ajouter `defer` aux scripts `firebase-*-compat.js` dans `<head>` index.html
- [ ] **TODO** : ajouter `<link rel="preload" as="font" ...>` pour Outfit + Inter
- [ ] **TODO** : ajouter `<link rel="preconnect" href="https://www.gstatic.com">` pour Firebase
- [ ] **Critère validation** : Lighthouse Mobile Perf > 85, PWA = 100%

#### 1.2 — Lucide partout dans le chrome (45 min)
Remplacer les emojis dans les **titres de cards / boutons UI / nav** par des icônes Lucide.
- [ ] `🥩 Macros` → `<i data-lucide="beef">` + "Macros"
- [ ] `💧 Hydratation` → `<i data-lucide="droplet">` + "Hydratation"
- [ ] `⭐ Score santé` → `<i data-lucide="star">` + "Score santé"
- [ ] Garder les emojis pour le **contenu user** (catégories aliments, types d'exercices)
- [ ] **Fichiers à toucher** : `index.html`, `js/dashboard.js`, `js/journal.js`, `js/poids.js`, `js/suivi.js`
- [ ] **Critère validation** : aucun emoji dans les `card-t` titles

#### 1.3 — Mobile food entry refonte (1h)
Capture d'écran à fournir d'abord pour audit précis. Hypothèses :
- [ ] Inputs trop petits (cible : 48px height min mobile)
- [ ] Pas assez d'air entre éléments (gap 12px → 16px)
- [ ] Search bar pas sticky lors du scroll
- [ ] Tabs Rapide/Chercher/Manuel : padding insuffisant pour le pouce
- [ ] **Critère validation** : test runner J1 + J4 toujours pass

---

### **PHASE 2 — Renaming (MOI, 30 min)**

Une fois le nom choisi en Phase 0.1.

#### 2.1 — Search & replace
- [ ] Lyno → [Nouveau nom] dans : index.html, manifest.json, privacy/terms, PLAYSTORE-*, PRESS-KIT, MONETIZATION, README, ROADMAP, DESIGN-SYSTEM, landing.html
- [ ] Bundle ID `io.github.alybar.lyno` → `io.github.alybar.[newname]`
- [ ] Title meta tags
- [ ] Couleur theme inchangée (terracotta reste)

#### 2.2 — Buy Me a Coffee + GitHub Sponsors
- [ ] Update buymeacoffee.com/[newname]
- [ ] GitHub Sponsors : profile peut rester sur AlybaR

---

### **PHASE 3 — Visual assets (TOI, 1-2h)**

#### 3.1 — Logo HD
1. Sers le repo localement : `python -m http.server 8000`
2. Ouvre `http://localhost:8000/logo-generator.html`
3. Customise : couleurs, style (recommandé : "Feuille dans anneau")
4. Télécharge : `icon-192.png`, `icon-512.png`, `icon-1024.png`, `feature-graphic-1024x500.png`
5. Renomme + remplace dans le repo
6. Commit + push

#### 3.2 — 8 Screenshots
Sur ton tel Android, app installée comme PWA :
1. **Dashboard** avec hero ring rempli (~70%) + macros visibles
2. **Journal** avec un repas loggé via scanner
3. **Sport** avec une séance muscu en cours
4. **Poids** avec courbe descendante > 14 entries
5. **Suivi** avec heatmap + insights
6. **Wizard** étape 1 (3 promesses landing)
7. **Mode sombre** dashboard
8. **Auth** page (sync multi-device)

Specs : 1080×1920 minimum, pas de Chrome bar.

#### 3.3 — Optionnel : ajouter du texte sur screenshots via Canva
- "Scanne. Mange mieux. Progresse."
- "Pas de pub. Pas de tracker."
- Etc.

---

### **PHASE 4 — Compte Play Console (TOI, 15 min + 24-48h)**

1. https://play.google.com/console/signup
2. Choisis "Personnel"
3. Paye 25 USD (one-time)
4. Soumets ID → vérification 24-48h

---

### **PHASE 5 — PWABuilder (TOI, 30 min)**

Une fois logo + nom finalisés.

1. https://www.pwabuilder.com/
2. URL : `https://alybar.github.io/caltrack-pro/` (ou nouveau domaine si Phase 0.2 = B)
3. Vérifie scores PWA (tous verts)
4. **Package for stores** → Android
5. Configure :
   - Package ID : `io.github.alybar.[newname]`
   - App name : [Nouveau nom]
   - Version : 1.0.0
   - Status bar : `#D4633A`
   - Background : `#F9F7F4`
6. **Signing key** : Create new
7. ⚠️ **CRITIQUE** : sauvegarde `keystore.jks` + password + alias dans 3 endroits (Bitwarden + USB + cloud chiffré). **Si tu le perds, tu ne pourras plus jamais updater l'app.**
8. Generate → ZIP

---

### **PHASE 6 — Soumission Play Store (TOI, 1-2h)**

Suis `PLAYSTORE-CHECKLIST.md` section F. En résumé :

1. Play Console → Create app → [Nouveau nom]
2. Fill **Store listing** (copy depuis `PLAYSTORE-LISTING.md`)
3. Fill **Data Safety** (copy depuis `PLAYSTORE-LISTING.md`)
4. Fill **Content rating** (PEGI 3 / Tous publics)
5. Update `.well-known/assetlinks.json` avec le SHA256 du keystore PWABuilder
6. Upload AAB sur Production → Create release
7. **Roll out to Production**
8. Wait 24-72h

---

### **PHASE 7 — Web launch (MOI ou TOI, 1-2h)**

En parallèle de la review Google.

#### 7.1 — Landing page v2 (poussée Apple-grade)
**À implémenter** (si on a du temps avant ou pendant la review) :
- [ ] Hero avec parallax + counters animés ("100% gratuit · 0 pub · X téléchargements")
- [ ] Section "Comment ça marche" avec mock-screenshot 3 étapes (CSS animations scroll-triggered)
- [ ] Vidéo demo 30s embed (à enregistrer une fois l'app en prod)
- [ ] Section "Pourquoi nous" avec comparaison concurrents (table interactive)
- [ ] Testimonials (placeholder, à remplir après les premiers users)
- [ ] CTA stickyfloat en bas mobile
- [ ] Animations Lottie pour les emoji 3-promesses
- [ ] Mode sombre auto + toggle
- [ ] Custom domain : caltrack-app.com (10€/an)

#### 7.2 — Promotion organique (TOI)
J-7 → J+7 : suis le **launch sequence** de `PRESS-KIT.md`.

---

### **PHASE 8 — Post-launch monitoring (TOI, ~1h/sem)**

- [ ] Tracker Play Store : installs, désinstalls 1j/7j, ★ moyens
- [ ] Répondre aux **reviews ★** (cible : 100% sous 24h les 30 premiers jours)
- [ ] Itérer sur les bugs reportés
- [ ] Publier `STATS.md` trimestriel (transparence promise dans MONETIZATION.md)

---

## 📋 Quick reference — fichiers clés

| Fichier | Usage |
|---|---|
| `PLAYSTORE-CHECKLIST.md` | Master checklist 6 phases ship |
| `PLAYSTORE-LISTING.md` | Copy à coller dans Play Console |
| `PLAYSTORE-SUBMIT.md` | Guide step-by-step PWABuilder + Play Console |
| `PRESS-KIT.md` | Posts X/Reddit/LinkedIn ready |
| `MONETIZATION.md` | Stratégie revenus + engagements publics |
| `DESIGN-SYSTEM.md` | Référence canonical (à respecter) |
| `USER-JOURNEYS.md` | Protocole test ergo manuel |
| `tests/index.html` | Test runner E2E (lance `python -m http.server 8000`) |
| `logo-generator.html` | Outil pour générer icônes PNG |
| `landing.html` | Page marketing publique |
| `CHANGELOG.md` | Historique de tout |

---

## ⚠️ Pièges anticipés (lis-les)

1. **Keystore perdu** = impossible d'updater l'app. **3 backups dès le jour 1.**
2. **Privacy policy 404** au moment du submit = rejection. Test l'URL juste avant.
3. **Health & Fitness rejection** si tu mentionnes "diagnose" / "treat" / "guarantee weight loss". Reste sur "tracker".
4. **CORS** sur les API externes (OpenFoodFacts) — déjà géré, mais surveille.
5. **Emoji rendering différent** Android vs iOS — les emojis dans les screenshots peuvent différer.
6. **Service Worker pollution** entre versions — pour les utilisateurs existants, le SW v36 + skipWaiting + clients.claim doit gérer.

---

## 🎯 Si je n'ai plus de crédits avec Claude

Tu peux **continuer seul** :

1. **Bugs/améliorations** :
   - Lance `python -m http.server 8000` puis `http://localhost:8000/tests/`
   - Run All → identifie les ✕
   - Lis le diagnostic → cherche le sélecteur dans le code → fix

2. **Décisions design** :
   - Réfère-toi à `DESIGN-SYSTEM.md` (les 10 règles cardinales)
   - Vérifie : 1 token = 1 rôle, pas d'emoji chrome, tabular-nums, empty state avec CTA

3. **Marketing** :
   - Tous les posts sont dans `PRESS-KIT.md`
   - Adapte-les à ton ton, change `[LIEN]` par l'URL Play Store

4. **Monétisation** :
   - Phase 0-1 : donations only (déjà en place)
   - Phase 2 (M3-M6) : prépare Pro features en silencieux
   - Phase 3 (M6-M12) : lance Pro Lifetime €29

5. **Question d'aide** : Stack Overflow, Reddit r/PWA, ChatGPT pour code review, Claude (autre session) pour stratégie.

---

## 🚀 Plan optimal des 7 prochains jours

| Jour | Action | Acteur |
|---|---|---|
| **J0 (today)** | Décider nouveau nom + créer Gmail | Toi |
| **J0** | Renaming + Lighthouse perf fix + Lucide chrome | Moi |
| **J1** | Logo HD + 8 screenshots + landing v2 | Toi (assets) + Moi (landing) |
| **J1** | Compte Play Console + paiement | Toi |
| **J2-J3** | Wait Play Console verification | — |
| **J3** | PWABuilder + sauvegarde keystore | Toi |
| **J3** | Setup BMAC + GitHub Sponsors | Toi |
| **J4** | Soumission Play Store | Toi (avec mes templates) |
| **J4-J7** | Wait Google review | — |
| **J7** | LIVE 🎉 + start launch posts | Toi |

→ **Tu peux être live dans 7 jours.**

---

*Dernière mise à jour : 2026-04-26*
*Versionné publiquement sur GitHub.*
