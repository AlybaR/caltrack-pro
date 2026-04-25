# 🧪 Test Runner — CalTrack Pro

Simulation E2E auto-hébergée. Aucune installation requise.

## 🚀 Comment l'utiliser

### Local (recommandé)
1. Sers le repo localement (sinon les iframes peuvent être bloquées) :
   ```bash
   # Option 1 : Python (dispo partout)
   python -m http.server 8000

   # Option 2 : Node
   npx serve .

   # Option 3 : VS Code Live Server extension
   ```
2. Ouvre `http://localhost:8000/tests/`
3. Clique **▶ Run All** (ou clique un test individuellement)

### Sur GitHub Pages (live)
Tu peux aussi ouvrir directement :
`https://alybar.github.io/caltrack-pro/tests/`

## 📊 Ce que tu vois

- **Sidebar gauche** : tous les scénarios avec status (⏸ idle / ⏳ running / ✓ pass / ✕ fail) + temps écoulé
- **Centre** : iframe de l'app, tu vois les clics et navigations en live
- **Bas** : console avec chaque étape (timestamps, actions, asserts)
- **Header** : compteurs `total / pass / fail / time total`

## ➕ Ajouter un test

Édite `scenarios.js`, ajoute un objet :

```js
{
    id: 'JX',
    name: 'Description courte',
    target: '< X sec',
    fresh: true,           // Optionnel — clear localStorage avant (défaut true)
    async run(ctx) {
        await ctx.click('#nb-journal');
        await ctx.waitFor('#meals-container');
        ctx.assert(ctx.exists('.meal-section'), 'Sections de repas visibles');
    }
}
```

## 🛠 API ctx

| Méthode | Effet |
|---|---|
| `ctx.click(sel)` | Clique l'élément, incrémente tapCount |
| `ctx.type(sel, val)` | Remplit un input + dispatch input/change events |
| `ctx.pressEnter(sel?)` | Simule la touche Enter |
| `ctx.waitFor(sel, ms?)` | Attends qu'un élément apparaisse (default 5s) |
| `ctx.wait(ms)` | Pause |
| `ctx.exists(sel)` | Booléen |
| `ctx.visible(sel)` | Booléen (display + offsetParent) |
| `ctx.text(sel)` | Texte de l'élément |
| `ctx.$(sel)` | Raw querySelector dans iframe |
| `ctx.$$(sel)` | Raw querySelectorAll dans iframe |
| `ctx.getStorage(key)` | Lit localStorage iframe |
| `ctx.setStorage(key, val)` | Écrit localStorage iframe (utile pour pré-remplir) |
| `ctx.assert(cond, msg)` | Throw si false |

## 🚧 Limitations volontaires

- **Pas de Firebase/Sync testé** — nécessite backend
- **Pas de scanner caméra** — nécessite hardware
- **Pas de notifications push** — nécessite permission user
- **Pas de vraie touch event** — `click()` simule mais pas le swipe
- **Pas de screenshots automatiques** — utilise les screenshots manuels du navigateur si besoin

## 🎯 Couverture actuelle (12 scénarios)

| Catégorie | Tests |
|---|---|
| Onboarding | J14 (first-time wizard) |
| Dashboard | J3, J11, UX19, J5 |
| Journal | J1 (récents), J4 (manuel) |
| Sport | J6 (cardio) |
| Poids | J10 (pesée), ES1 (empty state) |
| Theme | T1 |
| Navigation | NAV1 (toutes pages) |

→ **Couvre les 3 promesses + onboarding + UX critique**.

## 📝 Output suggéré pour rapport

Quand tu cliques **Run All**, le résultat te dit :
- Combien de tests ✓ vs ✕
- Temps total
- Détails des échecs dans la console

Si un test fail → la console te montre la ligne d'erreur précise.
Tu me copies-colles le message → je fix.
