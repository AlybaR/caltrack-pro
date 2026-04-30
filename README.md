# 🌿 Meki

Suivi scientifique de calories, macros, poids et hydratation — **100 % local, 100 % hors-ligne**.

## ✨ Fonctionnalités

- 🔥 Calcul BMR / TDEE (Mifflin-St Jeor + Katch-McArdle)
- 📋 Journal de repas avec 4 repas, quick-add, recherche OpenFoodFacts
- 💪 Suivi d'exercices avec presets par catégorie
- ⚖️ Courbe de poids lissée (Bézier) + IMC
- 📅 Streak quotidien + heatmap mensuelle
- 💧 Hydratation
- ⭐ Score santé du jour
- 📱 PWA installable, fonctionne hors-ligne

## 🔒 Vie privée

Toutes les données sont stockées **uniquement** dans le `localStorage` de ton navigateur. Aucune donnée n'est envoyée vers un serveur. Aucune inscription requise.

## 🚀 Lancer en local

```bash
python -m http.server 8000
```

Puis ouvre http://localhost:8000

## 📦 Stack

- HTML / CSS / JS vanilla (aucune dépendance)
- Service Worker (mode hors-ligne)
- localStorage (persistance)
- OpenFoodFacts API (recherche d'aliments)

## 📄 Licence

Usage personnel.
