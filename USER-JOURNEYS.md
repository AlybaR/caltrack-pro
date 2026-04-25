# 🧪 User Journeys — protocole de test manuel

> **But** : valider que l'app sert efficacement les **3 promesses** :
> 1. Suivre ses calories
> 2. Suivre son sport
> 3. Suivre ses objectifs
>
> **Méthode** : tu joues chaque scénario chronomètre en main + tu notes les frictions.
> 0 = aucune friction · 5 = j'ai failli abandonner.

---

## 🌅 Promesse 1 — Calories

### J1. Petit-déjeuner identique à hier
**Contexte** : 7h45, je viens de me réveiller, je veux logger mon café + 2 toasts + jus d'orange comme hier.
- **Cible** : < 10 secondes, < 4 taps
- **Étapes attendues** : Ouvre app → Journal → Petit-déj → Récents → tap café → tap toasts → tap jus
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J2. Logger un produit avec code-barres
**Contexte** : je viens d'ouvrir un yaourt, je veux le logger avec le scanner.
- **Cible** : < 15 secondes (en comptant le scan caméra)
- **Étapes attendues** : Dashboard → 📷 → caméra → scan → quantité → ✓ Ajouter
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J3. Voir où j'en suis sur ma journée
**Contexte** : 14h, je sors de table, je veux savoir combien il me reste pour le soir.
- **Cible** : < 3 secondes après ouverture
- **Attendu** : la phrase d'intro doit me dire **directement** "Il te reste X kcal et Y repas"
- **Mesure** : ⏱ ___ sec · 😖 ___/5 · Phrase claire ? OUI/NON

### J4. Ajouter un aliment manuellement
**Contexte** : un plat maison non scannable. Je connais ~ses kcal.
- **Cible** : < 20 secondes
- **Étapes** : Journal → Repas → Manuel → nom → kcal → Entrée
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J5. Hydratation
**Contexte** : je viens de boire un verre d'eau, je veux l'ajouter.
- **Cible** : 1 tap
- **Mesure** : 👆 ___ taps · 😖 ___/5

---

## 🏋️ Promesse 2 — Sport

### J6. Logger une séance de course rapide
**Contexte** : je rentre de 30 min de course, ~5 km.
- **Cible** : < 20 secondes
- **Étapes** : Sport → Cardio → Course → durée → distance → ✓
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J7. Voir si j'ai fait du sport aujourd'hui
**Contexte** : 21h, je veux savoir si j'ai bougé aujourd'hui.
- **Cible** : info visible **dès le dashboard** (pas besoin de cliquer Sport)
- **Mesure** : Visible sur dash ? OUI/NON · 😖 ___/5

### J8. Logger une séance muscu (3 exos, 3 séries chacun)
**Contexte** : je viens de la salle, je veux logger développé couché 3×8 à 60kg + squat 3×8 à 80kg + tractions 3×8.
- **Cible** : < 90 secondes pour les 3 exos
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J9. Voir ma progression au développé couché
**Contexte** : je veux comparer mon 1RM cette semaine vs il y a 1 mois.
- **Cible** : < 5 taps
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

---

## ⚖️ Promesse 3 — Objectifs

### J10. Pesée du matin
**Contexte** : sortie de douche, je veux logger 84,3 kg.
- **Cible** : < 8 secondes, < 3 taps
- **Étapes** : Poids → input → Entrée
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

### J11. Voir si je suis sur la bonne trajectoire
**Contexte** : dimanche soir, je veux voir si j'avance assez vite vers mon objectif (-6 kg).
- **Cible** : info visible **dès le dashboard** (mini-card Objectif)
- **Attendu** : voir poids actuel, poids cible, ETA estimée, kg restants
- **Mesure** : Visible sur dash ? OUI/NON · ETA affichée ? OUI/NON · 😖 ___/5

### J12. Mettre à jour mon objectif
**Contexte** : je veux changer mon poids cible de 73 à 70 kg.
- **Cible** : < 30 secondes
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5 · J'ai trouvé ? OUI/NON

### J13. Voir l'évolution sur 30 jours
**Contexte** : je veux voir ma courbe de poids du mois.
- **Cible** : < 5 taps depuis dashboard
- **Mesure** : ⏱ ___ sec · 👆 ___ taps · 😖 ___/5

---

## 🆕 First-time user

### J14. Premier login, jamais utilisé l'app
**Contexte** : je télécharge l'app, je crée un compte, je remplis le wizard, j'arrive sur le dashboard. **Je veux logger mon petit-déj du jour.**
- **Cible** : du clic d'install au 1er repas loggé en < 5 minutes
- **Mesure** : ⏱ ___ min · 😖 ___/5 · Confusion principale = ___

### J15. Onboarding clair ?
**Question** : après avoir fini le wizard, est-ce que je sais quoi faire ensuite ?
- **Mesure** : OUI/NON · Quoi manquait = ___

---

## 💔 Anti-frictions à chasser

Si tu remarques **un de ces signaux**, c'est une URGENCE UX :

- [ ] J'ai dû scroller pour trouver une fonction primaire (ajouter repas, sport, peser)
- [ ] J'ai cherché plus de 3 secondes "comment faire X"
- [ ] J'ai tapé 2 fois pour ouvrir un truc (au lieu d'1 tap qui ouvre)
- [ ] Une page m'a affiché "Aucun..." sans me proposer de **comment commencer**
- [ ] J'ai regretté avoir tappé un bouton (mauvais wording → revenir en arrière)
- [ ] J'ai été démotivé par un chiffre ou une couleur (rouge inutile, score bas le matin)
- [ ] L'app a mis > 1 sec à réagir à un tap

---

## 📋 Comment me rendre les résultats

Soit tu remplis directement ce fichier, soit tu m'envoies un message du type :

```
J1: 12 sec / 5 taps / friction 2 → "j'ai pas trouvé Récents direct"
J2: 18 sec / 4 taps / friction 1
J3: 4 sec / 0 / OUI claire
...
```

À partir de là je sais **objectivement** où sont les douleurs réelles et on attaque dans l'ordre.
