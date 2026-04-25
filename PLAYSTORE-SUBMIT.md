# 🚀 Play Store — guide de soumission step-by-step

> Guide complet pour publier CalTrack Pro sur le Play Store en mode **TWA** (Trusted Web Activity).
> Une PWA → un APK signé → upload Play Console → review → live.
> **Temps total : ~2-4h de travail réparties sur 3-7 jours** (review Google = 1-3 jours).

---

## 📋 Pré-requis (à valider AVANT de commencer)

- [ ] **Compte Google** (un perso ou pro)
- [ ] **25 USD** de frais d'inscription Play Console (one-time)
- [ ] **Logo HD 512×512** PNG (à créer ou améliorer l'actuel)
- [ ] **8 screenshots** de l'app (voir PLAYSTORE-LISTING.md)
- [ ] **Feature graphic 1024×500** PNG (à créer)
- [ ] **Privacy Policy live** ✅ déjà fait → `https://alybar.github.io/caltrack-pro/privacy.html`
- [ ] **Terms live** ✅ déjà fait → `https://alybar.github.io/caltrack-pro/terms.html`
- [ ] **PWA passe Lighthouse PWA test** (à valider, voir étape 0)

---

## 🧪 Étape 0 — Audit qualité PWA (avant tout)

Avant d'investir 25 USD, vérifier que la PWA est saine.

### 0.1 Lighthouse (10 min)
1. Ouvre Chrome → https://alybar.github.io/caltrack-pro/
2. F12 → onglet **Lighthouse**
3. Coche : **Progressive Web App**, **Performance**, **Accessibility**, **Best Practices**, **SEO**
4. Mode : **Mobile** (important — Play Store cible mobile)
5. **Analyze page load**

**Cibles minimales avant soumission :**
- PWA : **100%** (sinon Play Store rejettera)
- Performance : > 80
- Accessibility : > 85
- Best Practices : > 85
- SEO : > 90

Si un des scores est en dessous, **dis-moi quel test échoue**, je le fix.

### 0.2 Installabilité
1. Sur Chrome desktop → barre URL → icône "Installer"
2. Sur Android → ouvre l'URL → Menu → "Installer l'application"
3. L'app doit s'installer comme PWA, fonctionner offline.

✅ Si OK, on passe à l'étape 1.

---

## 🎨 Étape 1 — Logo HD + assets visuels (1-2h)

### Option A — Le faire vite avec Canva
1. Canva (gratuit) → cherche template **App Icon Generator**
2. Couleur de fond : `#D4633A` (terracotta CalTrack)
3. Symbole : feuille stylisée 🌿 (notre signature) ou silhouette anneau
4. Export PNG :
   - 1024×1024 (master)
   - 512×512 (Play Store)
   - 192×192 (favicon)

### Option B — Le faire pro avec Figma + IA
1. Figma + plugin **Diagram (logo AI)** — génère 5 variantes en 1 prompt
2. Prompt suggéré : *"Minimalist health-tracking app icon, sage leaf merged with circular ring, terracotta + cream palette, premium feel"*
3. Affiner manuellement, exporter en SVG + PNG

### Option C — Garder l'emoji actuel (déconseillé pour Play Store)
Possible mais ton listing fera amateur. **Investis 1h pour un vrai logo.**

### Une fois le logo prêt :
- Sauve `icon-512.png` (512×512) → écrase l'existant dans le repo
- Sauve `icon-1024.png` (1024×1024) → ajoute au repo
- Régénère favicon `icon-192.png` (192×192)

### Screenshots (30-60 min)
Sur ton téléphone Android :
1. Active **Mode développeur → Capture sans status bar** (ou utilise un screenshot tool)
2. Ouvre l'app installée comme PWA (pas via Chrome avec barre URL)
3. Capture les 8 écrans listés dans PLAYSTORE-LISTING.md
4. Format requis : 1080×1920 minimum (ratio 9:16)
5. Pas de barre Chrome visible

**Astuce ASO** : ajoute du texte sur chaque screenshot via Canva (titre court par-dessus, ex: "Scanne. Mange mieux. Progresse.")

### Feature graphic (15 min)
- 1024×500 px
- Hero : ton logo + tagline ("Suivi calories, sport, poids")
- Couleur fond : terracotta gradient
- Affichage Play Store : tout en haut de la fiche

---

## 📦 Étape 2 — Wrapper TWA via PWABuilder (30 min)

C'est la voie **la plus simple**. Pas besoin d'Android Studio.

1. Va sur **https://www.pwabuilder.com/**
2. Entre l'URL : `https://alybar.github.io/caltrack-pro/`
3. PWABuilder analyse → te montre un score (PWA, Manifest, Service Worker, Icons)
4. Si tout est vert → clique **Package for stores**
5. Sélectionne **Android (Google Play)**
6. Configure :
   - **Package ID** : `io.github.alybar.caltrack` (à conserver, c'est ton bundle ID)
   - **App name** : `CalTrack Pro`
   - **Launcher name** : `CalTrack`
   - **App version** : `1.0.0`
   - **Version code** : `1`
   - **Display mode** : `Standalone`
   - **Status bar color** : `#D4633A`
   - **Background color** : `#F9F7F4`
   - **Splash color** : `#F9F7F4`
   - **Signing key** :
     - Première fois → **Create new** (PWABuilder génère et te donne le keystore)
     - **CRUCIAL : sauvegarde ton keystore.jks + le mot de passe + les alias** dans un endroit ultra-sûr (Bitwarden / 1Password / coffre-fort). Si tu le perds, tu ne pourras **plus jamais mettre à jour** l'app.
7. Clique **Generate** → télécharge le ZIP
8. Le ZIP contient :
   - `app-release-bundle.aab` ← **c'est ça que tu uploades sur Play Console**
   - `app-release-signed.apk` (pour test direct sur téléphone)
   - `signing-key-info.txt` (info clé)
   - `assetlinks.json` (à publier sur ton site)

---

## 🔗 Étape 3 — Configurer l'asset links (10 min)

Le TWA exige que ton domaine "prouve" qu'il connaît ton app, sinon Chrome affichera la barre URL en haut (= moche).

1. Ouvre le `assetlinks.json` du ZIP PWABuilder
2. Copie son contenu
3. Remplace celui dans `.well-known/assetlinks.json` du repo :
   ```bash
   # Le fichier existe déjà avec un placeholder.
   # Remplace par le contenu du ZIP (qui contient ton vrai SHA256 fingerprint).
   ```
4. Commit + push
5. Vérifie que ça répond bien :
   `https://alybar.github.io/caltrack-pro/.well-known/assetlinks.json`
6. Test final : https://developers.google.com/digital-asset-links/tools/generator
   - Hosting site : `alybar.github.io/caltrack-pro`
   - Package name : `io.github.alybar.caltrack`
   - Hash : (celui de ton signing key)
   - **Test statement** → doit être ✅

---

## 💳 Étape 4 — Compte Play Console (15 min + 25 USD)

1. **https://play.google.com/console/signup**
2. Choisis : **Personnel** ou **Organisation** (si org → vérification d'identité plus longue)
3. Paye **25 USD** (carte bleue, one-time, pas d'abonnement)
4. Vérifie ton identité (pièce d'identité, ~24-48h)
5. Une fois validé → tu peux créer une app

---

## 📝 Étape 5 — Créer la fiche Play Store (1-2h)

Dans Play Console → **Create app** :

### 5.1 Détails de base
- **App name** : CalTrack Pro
- **Default language** : Français (France)
- **App or game** : App
- **Free or paid** : Free
- **Declarations** : coche les 3 cases (politiques respectées)

### 5.2 Set up your app (sidebar)

#### App content
- **Privacy policy** : `https://alybar.github.io/caltrack-pro/privacy.html`
- **App access** : All functionality available (or "Some functionality restricted" si tu veux mettre l'auth)
- **Ads** : No ads
- **Content rating** : remplis le questionnaire (CalTrack Pro = "Reference" + "Health & Fitness", pas de violence, pas de contenu adulte → rating PEGI 3 ou Tous publics)
- **Target audience** : Age 16-65+ (pas pour enfants)
- **News app** : No
- **COVID-19 contact tracing** : No
- **Data safety** : remplis selon PLAYSTORE-LISTING.md (voir section dédiée)
- **Government app** : No
- **Financial features** : No
- **Health features** : Yes → Health/Fitness/Wellness tracker (PAS dispositif médical)

#### Store listing
- **App name** : CalTrack Pro
- **Short description** : copy from PLAYSTORE-LISTING.md
- **Full description** : copy from PLAYSTORE-LISTING.md
- **App icon** : upload icon-512.png (HD)
- **Feature graphic** : upload feature-1024x500.png
- **Phone screenshots** : 8 PNG (min 2 obligatoire, recommandé 8)
- **Tablet screenshots** : optionnel mais aide au ranking
- **Video** : optionnel (lien YouTube 30s, recommandé)

#### Store settings
- **App category** : Health & Fitness
- **Tags** : Calorie counter, Weight loss, Fitness tracker
- **Contact details** :
  - Email : `caltrack.support@proton.me`
  - Website : `https://alybar.github.io/caltrack-pro/`
  - Phone : optionnel (peut sauter)

### 5.3 Production release

1. **Create new release** → **Production**
2. Upload `app-release-bundle.aab`
3. **Release name** : `1.0.0 — Initial release`
4. **Release notes** :
   ```
   🎉 Première version publique de CalTrack Pro !

   Une app simple pour 3 choses :
   • Suivre tes calories (scanner code-barres, macros, micros)
   • Suivre ton sport (cardio + muscu)
   • Atteindre ton objectif (poids, ETA, mensurations)

   100% offline-ready · Sync optionnelle · Sans pub · RGPD
   ```
5. **Save** puis **Review release**
6. **Roll out to Production**

### 5.4 Countries
Choisis les pays cibles : **France** + tous les pays francophones (Belgique, Suisse, Canada, Maroc, Algérie, Tunisie, Sénégal…) + UK + US si tu publies aussi en EN.

---

## ⏳ Étape 6 — Review Google (1-7 jours)

Google review automatiquement + manuellement. Délais constatés :
- Apps simples (comme CalTrack Pro) : **24-72h**
- Première publi : peut être 7 jours
- Si rejet : email avec raisons précises → tu corriges → resoumets

### Raisons fréquentes de rejet (à anticiper)
- ❌ **Privacy policy non accessible** → vérifie URL avant submit
- ❌ **Data safety form incohérent** avec ce que l'app fait → revérifier
- ❌ **App fonctionne pas ou crash** au lancement → tester APK localement avant
- ❌ **Politique Health & Fitness non respectée** : si tu mentionnes "perte de poids" → ajouter disclaimer médical (✅ déjà fait dans terms.html)
- ❌ **Contenu trompeur** dans description (ex: "guérit l'obésité") → on a évité ça

---

## 🔄 Étape 7 — Mises à jour futures

À chaque update :
1. Modifie le code → push GitHub Pages (auto-déployé)
2. **Important** : la PWA se met à jour TOUTE SEULE pour les users (via SW). Tu n'as **pas besoin** de re-soumettre tant que c'est juste de l'HTML/JS/CSS.
3. **Re-soumission Play Store nécessaire SEULEMENT si** :
   - Tu changes le logo / couleur du splash
   - Tu changes le manifest.json (display, scope, etc.)
   - Tu changes le bundle ID (jamais)
4. Pour re-soumettre :
   - Refais l'étape 2 (PWABuilder) avec **version code +1** (ex: 1 → 2 → 3)
   - Important : utilise le **même keystore** que la 1ère fois
   - Upload nouveau AAB sur Play Console → Production → Create release

---

## 🎯 Récap — checklist d'auto-soumission

```
[ ] Lighthouse PWA = 100%
[ ] Logo HD 512×512 prêt
[ ] 8 screenshots prêts
[ ] Feature graphic 1024×500 prêt
[ ] privacy.html live et accessible
[ ] terms.html live et accessible
[ ] Compte Play Console créé + payé (25 USD)
[ ] PWABuilder → AAB généré + keystore sauvegardé en lieu sûr
[ ] assetlinks.json sur GitHub Pages (avec vrai SHA256)
[ ] Fiche Play Store remplie (titre, description, screenshots, contact)
[ ] Data safety form complété
[ ] Content rating obtenu
[ ] Release créée + uploadée
[ ] Roll out → Production
```

Quand tu coches tout ça → **CalTrack Pro est en review chez Google.** 🚀

---

## 🆘 Aide en cas de blocage

À chaque étape, si tu bloques :
1. Capture le message d'erreur exact
2. Envoie-moi ici
3. Je te débugge en quelques minutes

Le piège #1 = le **keystore perdu** → impossible de mettre à jour. Sauvegarde-le **maintenant**.
Le piège #2 = oublier de cocher la case **"This app is GDPR-compliant"** dans Play Console.
Le piège #3 = privacy policy 404 au moment du submit (toujours retester l'URL juste avant submit).
