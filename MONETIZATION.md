# 💰 Stratégie de monétisation — CalTrack Pro

> **Posture** : un dev solo qui veut **une app qui rapporte sans gérer de gens**.
> Zero customer support live. Zero community management. Zero B2B sales call.
> Tout doit fonctionner en mode "set & forget".

---

## 🎯 Principes directeurs

1. **Zéro management de personnes** — pas de Discord à modérer, pas d'emails à répondre en masse, pas d'appels client
2. **L'app reste utilisable gratuitement** sur les 3 promesses (calories, sport, poids)
3. **Pas de pubs, pas de trackers, pas de vente de données** — non négociable
4. **Multi-mois pour mûrir** : on monétise sérieusement quand la traction est là (~5-10k MAU)
5. **Tout passe par Stripe / plateformes** qui gèrent la facturation, la TVA, les remboursements

---

## 💸 Les 7 leviers possibles (filtre "zero management")

| # | Levier | Compatible "zéro people management" | Revenu potentiel | Effort dev |
|---|---|---|---|---|
| **1** | **Donations** (BMAC + GH Sponsors) | ✅ Total — plateformes gèrent tout | Faible (€0–500/mo) | XS |
| **2** | **Pro Lifetime €29 one-time** | ✅ Stripe Checkout, zéro support | **Moyen-élevé (€2k-15k/an)** | S-M |
| **3** | **Pro Subscription €4.99/mo** | ✅ Stripe gère churn/billing | **Élevé (€500-5000/mo récurrent)** | M |
| **4** | **Affiliate links discrets** (Amazon balance, livre nutrition) | ✅ Liens passifs, 0 contact | Faible (€20-200/mo) | XS |
| **5** | **App Store iOS €4.99 one-time** | ✅ Apple gère tout, paiement passif | Moyen (~€500-2k/mo si traction) | L (port) |
| **6** | **Theme packs cosmetic €2.99** | ✅ Stripe one-time | Faible (€50-300/mo) | M |
| **7** | **Anchor sponsor annuel** (1 partenaire/an, ex: marque de protéines éthique) | 🟡 Demande 1 négo/an | Élevé (€2-10k/an) | XS |

**Rejected** (incompatible avec "zéro management") :
- ❌ B2B coachs/diététiciens → trop de sales calls
- ❌ Newsletter → écrire chaque mois = effort continu
- ❌ Cours/ebooks payants → contenu à produire
- ❌ Communauté Discord → modération
- ❌ Customer support email → demande chronophage

---

## 📅 Plan en 4 phases (12-18 mois jusqu'à €1-2k/mois)

### **Phase 0 — Maintenant (M0–M3) : pas de monétisation**

> Objectif : atteindre **2-5k installs**. Construire la confiance.

À faire :
- ✅ **Settings → Soutenir le projet** (BMAC + GH Sponsors visible mais discret)
- ✅ Documenter ouvertement **MONETIZATION.md** (transparence = trust)
- ❌ Aucun paywall, aucun Pro tier, aucune pub
- 📈 Track quotidien : Play Store installs, ★ ratings, MAU Firebase

Revenus attendus : **€0–50/mois** (donations early supporters)

### **Phase 1 — M3–M6 : préparer Pro en silencieux**

> Objectif : **5-10k installs**, ★4.5+ Play Store, retours réguliers.

À faire :
- 🛠 Coder en silencieux les **3-4 features Pro** (cf. backlog ci-dessous)
- 🛠 Setup **Stripe** (compte FR, comptes auto-entrepreneur si nécessaire)
- 🛠 Préparer **Pro paywall doux** (jamais bloquant, "Découvre Pro" non-intrusif)
- 📣 Annoncer en avance : "Pro arrive M6 — early access €19 lifetime"

Revenus attendus : **€50–200/mois** (donations qui montent)

### **Phase 2 — M6–M12 : LANCEMENT Pro Lifetime €29**

> Le moment où ça commence à rapporter.

Lancement :
- 🚀 **Pro Lifetime €29** (promo first 500 → €19)
- 🚀 OU formule double : **€4.99/mo subscription OU €29 lifetime** (laisse l'utilisateur choisir)
- 🛠 **Stripe Checkout** pur passif — l'app vérifie le statut Pro via Firestore custom claim
- 📣 Comm transparence : "Voilà pourquoi je passe payant. L'app de base reste gratuite."

Conversions visées (industrie standard 1-3% sur freemium honnête) :
- 10k installs × 1.5% conversion × €29 = **€4 350 one-time**
- + recurring 2-3% des nouveaux installs/mois

Revenus attendus M12 : **€300-1000/mois** (mix lifetime + sub)

### **Phase 3 — M12–M18 : diversification passive**

> Si traction continue (15-30k MAU), on diversifie sans ajouter de management.

À ajouter :
- 🛠 **Theme packs cosmetic €2.99** (sage / océan / forêt) → Stripe one-time
- 🛠 **Section "Outils que j'utilise"** dans Settings avec **affiliates discrets** (balance connectée, livre nutrition, rouleau massage) — disclaimer visible
- 🤝 **Anchor sponsor annuel** : 1 marque éthique (protéines bio, app de méditation) qui sponsorise discrètement (mention en bas de Settings) → €2-5k/an signed annually
- 🛠 **Port iOS App Store** payant €4.99 one-time (si la PWA performe sur Android)

Revenus attendus M18 : **€1500–3000/mois** (vision A atteinte ✅)

---

## 🛠 Pro Features Backlog (pour Phase 2)

Le pack Pro doit avoir **3-4 features** que l'utilisateur free veut clairement, sans rendre l'app free amputée.

### Top candidates (effort × valeur)

| Feature | Valeur user | Effort dev | Compat zéro support |
|---|---|---|---|
| **Sync Apple Health / Google Fit** | 🔥 Très élevée | M | ✅ |
| **Export PDF mensuel** (récap macros + photos progress) | 🟢 Élevée | S | ✅ |
| **AI weekly review** (LLM analyse semaine, conseils perso) | 🔥 Très élevée | M | ⚠️ Coûts API |
| **Custom recipes** (import URL, recipe.json-ld) | 🟢 Élevée | M | ✅ |
| **Multi-profil famille** (1 compte = 4 profils) | 🟡 Moyenne | M | ✅ |
| **Plateau auto-fix** (algorithme reco refeed/déficit) | 🟢 Élevée | M | ✅ |
| **Wearable sync** (Garmin, Fitbit, Polar) | 🔥 Si user en a un | L | ✅ |

### Mon pack Pro recommandé (pack v1)
1. **Sync santé** (Apple Health + Google Fit) → vrai différenciateur
2. **Export PDF mensuel** → tangible, partageable
3. **Plateau auto-fix** → vrai service intelligent
4. **Custom recipes** import → utilité quotidienne

→ Ce pack coûte ~3-4 semaines de dev. Lifetime €29 le finance après ~150 ventes.

---

## 🚫 Ce qu'on ne fera JAMAIS

- ❌ Pubs (AdMob, Google AdSense, etc.)
- ❌ Vente de données (anonymisées ou non)
- ❌ Trackers tiers (Facebook Pixel, GA, etc.)
- ❌ Paywall sur les 3 promesses (calories / sport / poids)
- ❌ Free trial qui devient débit auto sans clic explicite
- ❌ Push notifications marketing
- ❌ Email marketing à la base utilisateurs (sauf si opt-in explicite)
- ❌ Coach virtuel "achète ce supplément"

---

## 💡 Setup légal minimal (FR)

Pour vendre proprement et sans surprise :

- **Statut auto-entrepreneur** (micro-BNC) — gratuit, déclaration en ligne, max €77 700/an de CA, plafond largement OK
- **Stripe Atlas** ou Stripe FR — gère paiements + TVA EU automatique (Stripe Tax payant si > €100k CA)
- **No website T&Cs personnel** : l'app a déjà `terms.html` et `privacy.html`
- **Compta** : 1 fichier Excel + déclaration trimestrielle URSSAF — pas besoin de comptable jusqu'à €30k+/an
- **Banque** : compte pro Qonto / Shine (~€7-15/mois) ou compte perso séparé pour les premiers €

---

## 📊 Transparence publique (engagement)

Tous les **3 mois**, je publie sur GitHub un fichier `STATS.md` :
- Nombre d'installs Play Store
- MAU (Monthly Active Users)
- Revenus du trimestre (donations + sales)
- Coûts (Firebase, domaine, etc.)
- Heures consacrées au projet

Pourquoi : la confiance ne se déclare pas, elle se prouve.

---

## ⚖️ Engagements long terme

1. **Si je dois monétiser au-delà du plan ci-dessus**, j'annonce 3 mois en avance avec rationale.
2. **Si je rachète / suis racheté** : préavis 6 mois pour les utilisateurs cloud, open-source des features Pro si shutdown.
3. **Les 3 promesses (calories / sport / poids) restent gratuites pour toujours** — sur l'honneur.

---

## 💬 Questions ?

📧 caltrack.app@gmail.com
🐙 [Issues GitHub](https://github.com/AlybaR/caltrack-pro/issues)

*Dernière mise à jour : 25 avril 2026*
*Versionné publiquement — toute modification est traçable.*
