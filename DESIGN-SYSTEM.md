# 🎨 Meki — Design System v2

> **Direction : "Bien-être × Performance"**
> Inspirations : Oura · Apple Fitness · Linear · MacroFactor

L'app doit faire ressentir **deux choses simultanément** :
1. **Calme** (bien-être, durable, sans pression) — palette terreuse, sauge, beaucoup d'air
2. **Précision** (performance, data, mesure) — typographie tabulaire, nombres mis en scène, hiérarchie nette

---

## 🎨 Palette

### Surfaces (warm neutrals — pas de gris bleus)
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg`   | `#F9F7F4` | `#13110F` | Fond app |
| `--bg2`  | `#FDFCFB` | `#1A1714` | Fond élevé |
| `--card` | `#FFFFFF` | `#211D19` | Card |
| `--bdr`  | `#EDE5DB` | `#2C2722` | Border 1 (subtle) |
| `--bdr2` | `#D9CDBE` | `#3A3328` | Border 2 (plus visible) |

### Brand
| Token | Hex | Usage |
|---|---|---|
| `--acc`     | `#C8512A` | Accent terracotta — CTA, hero, marque |
| `--acc2`    | `#A8411D` | Hover/active variant |
| `--acc-bg`  | `rgba(200,81,42,.07)` | Background ghost |

### Sémantique (les couleurs ont un RÔLE strict)
| Token | Hex | Rôle | NE JAMAIS utiliser pour |
|---|---|---|---|
| `--well`    | `#84A98C` | **Bien-être / progression positive** (sage, doux) | Erreurs, alertes |
| `--grn`     | `#3D7A40` | **Succès, validé, objectif atteint** (plus saturé) | Décoration |
| `--info`    | `#5B8DAC` | **Information, eau, données neutres** (cyan calme) | CTA |
| `--data`    | `#7B61D6` | **Analytics, graphiques, insights** (violet doux) | Texte |
| `--warn`    | `#B47420` | **Attention, modération** | Erreurs |
| `--red`     | `#BC3535` | **Erreur, dépassement, danger** | Rappels positifs |

### Texte
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--txt`   | `#15110E` | `#F5F0EA` | Texte principal |
| `--txt2`  | `#4A3C30` | `#C9C0B5` | Texte secondaire |
| `--mut`   | `#9A8578` | `#8C7F71` | Labels, captions |
| `--faint` | `#C4B4A5` | `#5C5249` | Très discret |

---

## ✍️ Typographie

### Familles
- **Display (titres, hero numbers)** : `Outfit` 600-800
- **Body** : `Inter` 400-500
- **Tabular** (chiffres alignés) : `Outfit` avec `font-variant-numeric: tabular-nums`

### Échelle stricte
| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-display` | `2.5rem` (40px) | 800 | Hero numbers (kcal restantes, score) |
| `--text-h1`      | `1.75rem` (28px) | 700 | Page titles |
| `--text-h2`      | `1.25rem` (20px) | 700 | Card titles |
| `--text-h3`      | `1rem` (16px) | 600 | Sub-headings |
| `--text-body`    | `0.9375rem` (15px) | 400 | Texte courant |
| `--text-small`   | `0.8125rem` (13px) | 500 | Labels, hints |
| `--text-caption` | `0.6875rem` (11px) | 600 | Micro labels (uppercase) |

### Règle d'or pour les nombres
**Tous les nombres affichant des données doivent utiliser `font-variant-numeric: tabular-nums`** pour éviter le "jitter" quand les chiffres changent (ex: kcal qui s'incrémentent).

---

## 📐 Espacement (echelle 4-base)

```
--sp-1: 4px    (gap micro)
--sp-2: 8px    (gap dense)
--sp-3: 12px   (gap default)
--sp-4: 16px   (padding card interne)
--sp-5: 24px   (padding card externe, gap entre sections)
--sp-6: 32px   (entre groupes majeurs)
--sp-7: 48px   (rare — top de page)
--sp-8: 64px   (rare — splash, hero)
```

**Règle** : on n'invente pas de valeur intermédiaire. Si 16 est trop, on prend 12 ou 24.

---

## 🔘 Rayons

| Token | Px | Usage |
|---|---|---|
| `--r-xs` | 6 | Pills, badges, petites pastilles |
| `--r-sm` | 10 | Inputs, boutons compacts |
| `--r-md` | 14 | Boutons, sections internes |
| `--r-lg` | 20 | Cards principales |
| `--r-xl` | 28 | Hero card, modals |
| `--r-full` | 999 | Cercles, pills navigationnelles |

---

## 🎬 Motion

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--mo-fast` | 120ms | `ease-out` | Tap feedback, hover |
| `--mo-mid`  | 240ms | `cubic-bezier(.32,.72,0,1)` | Page transitions, modals |
| `--mo-slow` | 600ms | `cubic-bezier(.32,.72,0,1)` | Data reveals, ring animations |
| `--mo-spring` | 800ms | `cubic-bezier(.34,1.56,.64,1)` | Bounce subtil (success) |

**Règle bien-être** : pas d'animation agressive. Pas de bounce sur tout. Réservé aux moments de récompense.

---

## 🔣 Iconographie — décision tranchée

### Lucide pour le **chrome** (UI)
- Boutons, navigation, titres de cards, stats labels
- Stroke `1.5px`, taille par défaut `22px`
- Couleur héritée de `currentColor`

### Emojis pour le **contenu utilisateur**
- Catégories d'aliments (🍖 🌾 🥦 🍎 🥛)
- Types d'exercices (🏃 🚴 🏊)
- Bien-être (😞😕🙂😊😄)
- Repas (🌅 ☀️ 🌙 🍎)

### Tailles
| Token | Px | Usage |
|---|---|---|
| `--ico-xs` | 16 | Inline texte |
| `--ico-sm` | 20 | Boutons compacts |
| `--ico-md` | 22 | Default |
| `--ico-lg` | 28 | Stats grid, cards |
| `--ico-hero` | 48 | Empty states, illustrations |

---

## 🌟 Composants hero

### Ring de calories (Dashboard)
- Taille : 240×240 mobile, 280×280 desktop
- Stroke : 18px
- Gradient : `--acc` → `--acc2` (45°)
- Animation au load : `stroke-dashoffset` sur 1.4s `--mo-slow`
- Chiffre central : `--text-display` × 1.5 (60px sur mobile)
- Sub-text : "kcal restantes" en `--text-small` muet

### États sémantiques
- **0-50%** consommé : ring `--acc` (chemin nominal)
- **50-90%** : ring `--acc` (toujours OK)
- **90-100%** : ring `--well` (objectif atteint, vert sauge)
- **>100%** : ring `--red` (dépassement)

---

## 📱 Empty states (signature visuelle)

Chaque empty state suit ce template :
```
┌────────────────────┐
│   🎯 illustration  │ ← Lucide icon hero (48px) en --acc
│                    │
│   Titre court      │ ← --text-h3, --txt
│   Phrase guidante  │ ← --text-body, --mut
│                    │
│   [ CTA primaire ] │ ← bouton plein, jamais "vide"
└────────────────────┘
```

**Pas de "Aucun … encore"** sans CTA. Toujours dire **comment commencer**.

---

## ✅ Règles cardinales

1. **Une couleur = un rôle**. Pas de violet utilisé pour 3 contextes différents.
2. **Pas d'emojis pour le chrome**. Les titres de cards, labels, actions = Lucide.
3. **`tabular-nums` sur tous les chiffres data**.
4. **Pas de border si on peut s'en passer** (utilise des fonds différents).
5. **Pas plus de 3 niveaux d'élévation** par écran.
6. **Le hero ring doit toujours être l'élément le plus saillant** du dashboard.
7. **Pas de "Sync..." comme statut visible** dans le header — pastille discrète seulement.
8. **Empty states ont toujours un CTA**.
9. **Les nombres importants > toute autre information** sur leur écran.
10. **Le mode sombre n'est jamais juste l'inversion** — c'est un design dédié.
