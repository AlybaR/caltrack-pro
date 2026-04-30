# 🚀 Deploy Meki sur Vercel + Firebase config

Guide complet pour passer de GitHub Pages → Vercel (look pro + custom domain) avec
Firebase configuré pour les nouveaux domaines.

---

## 🎯 Pourquoi Vercel ?

| | GitHub Pages | Vercel |
|---|---|---|
| Coût | Gratuit | Gratuit (free tier large) |
| Custom domain | ✅ | ✅ |
| HTTPS auto | ✅ | ✅ |
| Edge CDN | Standard | **300+ edge nodes** (plus rapide partout) |
| Preview deploys par PR | ❌ | ✅ |
| Analytics intégré | ❌ | ✅ (Web Vitals gratuit) |
| Environment variables | ❌ | ✅ |
| Deploy depuis Git push | Manuel | **Auto** |
| Look "pro" pour DNS personnalisé | OK | Premium |

→ **Vercel gagne** sur tous les axes pour un launch sérieux.

---

## 📋 Étape 1 — Créer compte Vercel (3 min)

1. Va sur **https://vercel.com/signup**
2. Choisis **"Continue with GitHub"** (le plus simple — auto-link tes repos)
3. Autorise Vercel à lire tes repos publics
4. Tu arrives sur le dashboard

---

## 📦 Étape 2 — Importer le repo Meki (5 min)

1. Dashboard Vercel → **Add New… → Project**
2. Tu vois la liste de tes repos GitHub. Cherche **`AlybaR/LYNO`** (ou le nom actuel du repo)
3. Clique **Import**
4. Configure le projet :
   - **Project Name** : `meki` (ou ce que tu veux — devient `meki.vercel.app`)
   - **Framework Preset** : **Other** (pas de build, c'est statique)
   - **Root Directory** : `.` (laisse vide)
   - **Build Command** : laisse vide (pas de build needed)
   - **Output Directory** : `.` ou laisse vide
   - **Install Command** : laisse vide
5. Clique **Deploy**
6. Attends 30-60s → ton site est live sur `https://meki.vercel.app`

✅ Maintenant **chaque push sur main** redéploie automatiquement.

---

## 🌐 Étape 3 — Custom domain (optionnel mais conseillé) — 10 min + 10€/an

Pour avoir `meki.app` ou `meki-app.com` au lieu de `meki.vercel.app`.

### 3.1 Acheter le domaine

Options :
- **Namecheap** (~10-15€/an) — recommandé pour FR
- **Porkbun** (~8-12€/an) — moins cher
- **OVH** — FR-friendly mais interface vieillotte
- **Vercel Domains** (intégré, paie via Vercel)

Vérifier dispo : https://www.namecheap.com → search `meki.app` ou `meki-app.com` ou `getmeki.com` ou `meki.health`.

### 3.2 Connecter le domaine à Vercel

1. Vercel project → onglet **Settings → Domains**
2. Tape le domaine acheté → **Add**
3. Vercel te donne 2 records DNS à configurer :
   - **A record** : `76.76.21.21`
   - **CNAME (`www`)** : `cname.vercel-dns.com`
4. Va sur ton registrar (Namecheap), ajoute ces records
5. Attends 5-30 min (propagation DNS)
6. Vercel détecte automatiquement → HTTPS auto-généré (Let's Encrypt)

✅ `meki.app` pointe maintenant sur ton site Vercel.

---

## 🔥 Étape 4 — Firebase config (autoriser le nouveau domaine)

⚠️ **Critique** : sans ça, l'auth Firebase rejettera les logins depuis le nouveau domaine.

### 4.1 Authorized domains

1. Console Firebase → ton projet `meki-prod` (ou ce que tu as nommé)
2. **Authentication → Settings → Authorized domains**
3. Tu vois : `localhost`, `<projet>.firebaseapp.com`
4. Clique **Add domain**
5. Ajoute :
   - `meki.vercel.app`
   - `meki.app` (ton custom domain)
   - `www.meki.app` (variante www)
   - `alybar.github.io` (si tu gardes Pages en miroir, sinon retire)
6. **Save**

### 4.2 Vérifier Firestore rules

Aucune modif nécessaire — les rules sont par UID, pas par domaine. Mais vérifie :
- Console Firebase → **Firestore Database → Rules**
- Doit contenir :
  ```
  match /users/{uid}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```
- **Publish** si modifié.

### 4.3 (Optionnel) Variables d'environnement Vercel

Si tu veux protéger les clés Firebase (même si elles ne sont **pas secrètes** côté web, c'est plus propre) :

1. Vercel → Settings → Environment Variables
2. Ajoute :
   - `FIREBASE_API_KEY` = ta clé
   - `FIREBASE_AUTH_DOMAIN` = `meki-xxx.firebaseapp.com`
   - etc.
3. Pour utiliser dans le code, il faudrait modifier `js/firebase-config.js` pour lire des `process.env.*` — mais ça nécessite un build step, donc compliqué pour une app vanilla. **Skip pour MVP.**

---

## 🔄 Étape 5 — Update les URLs dans le code

Pour que privacy.html, terms.html, og:url et le manifest pointent vers le nouveau domaine.

### Dans le code, remplace `https://alybar.github.io/caltrack-pro/` par `https://meki.app/` (ou ton domaine):

Fichiers à mettre à jour :
- `manifest.json` (champ `id` et `start_url`)
- `landing.html` (og:url, og:image, liens internes)
- `privacy.html` (URL site)
- `terms.html` (référence)
- `PLAYSTORE-LISTING.md` (Privacy Policy URL pour Play Console)
- `PLAYSTORE-SUBMIT.md` (URL pour PWABuilder)
- `PRESS-KIT.md` (Website + Privacy URLs)

**Quand tu as le domaine final**, dis-moi → je fais le sed.

---

## 🌍 Étape 6 — Garder GitHub Pages en miroir (optionnel)

Tu peux garder les 2 hostings :
- `alybar.github.io/lyno/` → backup gratuit
- `meki.app` → primary

Pour Play Store TWA, tu utilises **un seul** domaine principal (le custom). Le `assetlinks.json` doit être sur ce domaine.

---

## 📊 Étape 7 — Analytics (Vercel Web Vitals — gratuit + privacy-friendly)

1. Vercel project → **Settings → Analytics**
2. Active **Web Analytics** (gratuit jusqu'à 2.5k events/mois)
3. Pas besoin d'ajouter de code — c'est intégré

Tu vois :
- Pageviews par page
- Core Web Vitals (LCP, FID, CLS) en prod réel
- Référents
- Pays / appareils

→ **0 cookie, 0 PII collectée** = compatible RGPD et notre promesse "no tracker tiers".

---

## 🚦 Étape 8 — DNS / SSL / HTTPS check final

Quand tout est en place, vérifier :

```bash
# DNS résout bien
dig meki.app +short   # doit donner 76.76.21.21

# HTTPS valide
curl -I https://meki.app   # doit retourner 200 + HTTPS

# Redirect www → apex (config Vercel automatique)
curl -I https://www.meki.app   # doit 308 → meki.app
```

Tester aussi dans navigateur :
- `https://meki.app` → app charge ✓
- `https://meki.app/privacy.html` → privacy charge ✓
- Login Firebase fonctionne ✓ (auth/unauthorized-domain ne doit PAS apparaître)

---

## 📋 Récap actions externes

| # | Action | Temps | Coût |
|---|---|---|---|
| 1 | Compte Vercel + import repo | 5 min | 0€ |
| 2 | Custom domain achat | 10 min | 10-15€/an |
| 3 | DNS Vercel ↔ registrar | 10 min + 30 min propag | 0€ |
| 4 | Firebase Authorized domains | 2 min | 0€ |
| 5 | Update URLs dans code | 5 min | 0€ |
| 6 | Vercel Analytics | 2 min | 0€ |

**Total : ~30 min de setup, 10-15€/an de domaine.**

---

## 🆘 Troubleshooting

### "auth/unauthorized-domain" après deploy
→ Étape 4.1 pas faite ou domaine pas encore propagé. Attends 5 min, vérifie liste authorized domains Firebase.

### Site ne charge pas après deploy
→ Vérifier dans Vercel logs (`Deployments → latest → Source`). Si erreur, c'est probablement un chemin de fichier (`./index.html` vs `/index.html`).

### Service Worker ne s'update pas après deploy
→ Normal, le SW est cached. Soit `Ctrl+Shift+R` soit attendre 24h. Pour forcer : bump cache key dans `sw.js`.

### PWA install prompt n'apparaît pas
→ Vérifier que le manifest est lisible : `https://meki.app/manifest.json` doit retourner JSON valide.

---

## ⏭️ Quand le domaine est en ligne

Dis-moi le domaine final → je :
1. Mets à jour toutes les URLs dans le code (sed)
2. Bump SW cache
3. Update manifest.json `id` field
4. Update les docs (PLAYSTORE-*, PRESS-KIT, etc.)
5. Push final
