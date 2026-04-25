# 🚀 Play Store — Master Checklist

> **Goal**: ship CalTrack Pro on Google Play Store in **3-7 jours**.
> Tracks the complete picture in one place.
> Mark items ✅ as you complete them.

---

## 📊 Progress overview

| Phase | Status |
|---|---|
| **A. App quality** | 🟡 In progress |
| **B. Visual assets** | 🔴 Not started |
| **C. Marketing prep** | 🔴 Not started |
| **D. Play Console setup** | 🔴 Not started |
| **E. Screenshots** | 🔴 Not started |
| **F. Submission** | 🔴 Not started |

---

## ✅ A. APP QUALITY (technical readiness)

### A1. Lighthouse audit — PWA must be 100%
- [ ] Open `https://alybar.github.io/caltrack-pro/` in Chrome
- [ ] F12 → Lighthouse → Mode **Mobile** → Categories: PWA + Perf + A11y + SEO
- [ ] Run audit
- [ ] **PWA = 100%** (REQUIRED for Play Store, otherwise rejection)
- [ ] Performance > 80
- [ ] Accessibility > 85
- [ ] SEO > 90
- [ ] If anything fails → tell me the exact error, I fix it

### A2. PWA installability
- [ ] Open URL on Android Chrome → menu "Install app" appears
- [ ] Install → app opens fullscreen, no browser bar
- [ ] Open in airplane mode → app still loads (offline)

### A3. Manifest validation
- [x] manifest.json complete (id, scope, lang, categories, shortcuts, screenshots placeholders)
- [x] icons.json includes 192 + 512 (any + maskable)
- [x] theme_color matches brand (#D4633A)
- [x] background_color matches design (#F9F7F4)

### A4. Legal docs (required to submit)
- [x] privacy.html live → `https://alybar.github.io/caltrack-pro/privacy.html`
- [x] terms.html live → `https://alybar.github.io/caltrack-pro/terms.html`
- [x] Contact email exposed (via Settings → Confidentialité → links)

### A5. Honest copy audit (avoid Play Store rejection)
- [x] Privacy text is truthful (Firebase mode mentions Google Cloud EU)
- [x] No false claims of "100% local" when sync is enabled
- [x] Medical disclaimer visible (terms.html for Health & Fitness category)
- [x] No hyperbolic claims ("guérit l'obésité", "garantie de perdre X kg")

### A6. Critical user journeys work
- [ ] Sign up → wizard → dashboard (< 3 min)
- [ ] Add a meal via Récents (< 5 sec)
- [ ] Scan a barcode → log a product
- [ ] Log an exercise
- [ ] Add a weight entry
- [ ] Theme toggle (light/dark) works
- [ ] Sign out → sign in again on same device → data restored from cloud

---

## 🎨 B. VISUAL ASSETS (the gap to cross before submit)

### B1. App icon (REQUIRED)
- [ ] **512×512 PNG** for Play Store listing
- [ ] **192×192 PNG** for PWA manifest
- [ ] **1024×1024 PNG** master (for future scaling)
- [ ] Optional: 16×16, 32×32 favicons
- [ ] Use `logo-generator.html` (in this repo) → fastest path
  OR Canva "App Icon Generator" with terracotta + sage palette

### B2. Feature graphic (REQUIRED)
- [ ] **1024×500 PNG**
- [ ] Brand color background (#D4633A gradient → #A8411D)
- [ ] Logo + tagline ("Suivi calories, sport, poids")
- [ ] Made in Canva / Figma in 15 min

### B3. Promo video (OPTIONAL — but doubles conversion)
- [ ] 30 sec YouTube video
- [ ] Screen recording of app + voice-over
- [ ] Script suggéré dans `PRESS-KIT.md`

---

## 📣 C. MARKETING PREP (parallel to submission)

### C1. Marketing landing page
- [x] `landing-website.html` created — drive Google traffic to install link
- [ ] Host on alybar.github.io/caltrack-pro/ as the public page (vs the app at `/app`)
  → optional, can keep current setup

### C2. Press kit
- [x] `PRESS-KIT.md` — copy templates for X/Twitter, Reddit r/loseit, TikTok script,
      LinkedIn announcement, ProductHunt teaser

### C3. Social channels
- [ ] X account `@caltrackpro` (or use perso)
- [ ] Reddit account ready
- [ ] TikTok account (optionnel mais très ROI pour fitness)
- [ ] Mailing list (optionnel — Mailchimp / Buttondown free tier)

### C4. Pre-launch teaser
- [ ] Post J-7 : "CalTrack Pro arrive sur Play Store dans 1 semaine. Voici ce que ça fait." + screenshots
- [ ] Post J-3 : "3 jours avant le launch. Bêta test ouvert ici → URL"
- [ ] Post J-day : "C'EST LIVE. Lien Play Store: ..."

---

## 💳 D. PLAY CONSOLE SETUP

### D1. Account
- [ ] Sign up at https://play.google.com/console/signup
- [ ] Choose Personal or Organization
- [ ] Pay 25 USD (one-time, no subscription)
- [ ] Verify identity (24-48h)

### D2. Create app
- [ ] App name: CalTrack Pro
- [ ] Default language: French (France)
- [ ] App or game: App
- [ ] Free or paid: Free
- [ ] Declarations: 3 boxes checked

### D3. Set up app section
- [ ] **App access**: All functionality available (or restricted to logged-in)
- [ ] **Ads**: No ads ✓
- [ ] **Content rating**: complete questionnaire (PEGI 3 expected)
- [ ] **Target audience**: 16-65+ (NOT for children)
- [ ] **Data safety**: complete using PLAYSTORE-LISTING.md template
- [ ] **News app**: No
- [ ] **COVID-19 contact tracing**: No
- [ ] **Government app**: No
- [ ] **Financial features**: No
- [ ] **Health features**: Yes → Tracker (NOT medical device)

### D4. Store listing
- [ ] Copy from PLAYSTORE-LISTING.md:
  - [ ] App name
  - [ ] Short description (max 80 chars)
  - [ ] Full description (max 4000 chars)
- [ ] Upload icon 512×512
- [ ] Upload feature graphic 1024×500
- [ ] Upload 8 phone screenshots
- [ ] Optional: tablet screenshots
- [ ] Optional: promo video URL

### D5. Store settings
- [ ] App category: Health & Fitness
- [ ] Tags: Calorie counter, Weight loss, Fitness tracker
- [ ] Contact: caltrack.app1@gmail.com + website URL

---

## 📸 E. SCREENSHOTS (your job — 30-60 min)

Take on a real Android device, app installed as PWA (NOT Chrome):

### 8 recommended screens (ordered by importance)
- [ ] **1. Dashboard** with hero ring at ~70% + macros visible (full meal logged)
- [ ] **2. Journal** with a meal logged via scanner (shows produit)
- [ ] **3. Sport** with a strength session in progress (sets/reps)
- [ ] **4. Poids** with a beautiful descending curve (>14 entries)
- [ ] **5. Suivi** with heatmap + 30-day insights
- [ ] **6. Wizard step 1** with the 3 promises landing first
- [ ] **7. Mode sombre** dashboard (showcase)
- [ ] **8. Auth/Login** page (showcase multi-device sync)

### Specs
- [ ] Min 1080×1920 (or higher 9:16)
- [ ] No Chrome address bar visible
- [ ] No status bar OR keep it clean (clock 9:41)

### ASO bonus
- [ ] Add text overlay on each screenshot via Canva ("Scanne. Mange mieux. Progresse.")
- [ ] Consistent background color for all 8 screenshots

---

## 🚢 F. SUBMISSION (final step)

### F1. PWABuilder (~30 min)
- [ ] Go to https://www.pwabuilder.com/
- [ ] URL: `https://alybar.github.io/caltrack-pro/`
- [ ] Verify all 4 scores green (PWA, Manifest, SW, Icons)
- [ ] Click "Package for stores" → Android (Google Play)
- [ ] Configure:
  - [ ] Package ID: `io.github.alybar.caltrack`
  - [ ] App name: CalTrack Pro
  - [ ] Version: 1.0.0
  - [ ] Status bar: #D4633A
  - [ ] Background: #F9F7F4
  - [ ] Splash: #F9F7F4
- [ ] Signing key: **Create new** → ⚠️ **SAVE keystore.jks + password + alias** in Bitwarden / 1Password / SAFE PLACE — losing it = no future updates ever
- [ ] Generate → download ZIP

### F2. Asset Links (10 min)
- [ ] Open `assetlinks.json` from PWABuilder ZIP
- [ ] Copy its content
- [ ] Replace `.well-known/assetlinks.json` in repo
- [ ] Commit + push
- [ ] Verify URL works: `https://alybar.github.io/caltrack-pro/.well-known/assetlinks.json`

### F3. Production release
- [ ] Play Console → Production → Create new release
- [ ] Upload `app-release-bundle.aab`
- [ ] Release name: `1.0.0 — Initial release`
- [ ] Release notes: copy from PLAYSTORE-LISTING.md
- [ ] Save → Review release
- [ ] Roll out to Production

### F4. Countries
- [ ] France + francophones (BE, CH, CA, MA, DZ, TN, SN…)
- [ ] Optional EN markets (UK, US, AU, IE)

### F5. Wait for review
- [ ] Google review: 24-72h typical, up to 7 days first time
- [ ] If rejected → email tells why → fix → resubmit
- [ ] If approved → APP IS LIVE 🎉

---

## 🆘 Common pitfalls (anticipated)

| Pitfall | How to avoid |
|---|---|
| Lighthouse PWA < 100% | Run audit BEFORE PWABuilder. Fix any red item. |
| Privacy policy 404 at submit | Test the URL the day of submission. |
| Keystore lost | Save in 3 places (Bitwarden + USB + cloud) the day you create it. |
| Data Safety form lies | Double-check: we DO collect email + UID + health data. |
| Health & Fitness rejected for medical claims | Disclaimer is in terms.html. Don't say "diagnose" or "treat". |
| Screenshots show Chrome bar | Always install as PWA before screenshotting. |
| Long verification of Play Console identity | Submit identity docs immediately; can take 48h. |

---

## 📅 Realistic timeline

| Day | Activity |
|---|---|
| **D-Day 0** | Setup Play Console + 25 USD payment |
| **D+1** | ID verification done → start filling app metadata |
| **D+1** | Generate logo + take 8 screenshots + feature graphic |
| **D+2** | Run Lighthouse → fix any blocker |
| **D+2** | Run PWABuilder → save keystore → upload AAB |
| **D+3** | Fill all forms (Data Safety, Content Rating, etc.) |
| **D+3** | Submit for review |
| **D+4 to D+7** | Google review |
| **D+7** | LIVE on Play Store ✨ |

---

## 🎯 Done = ?

You're ready to submit when:
- [ ] Lighthouse PWA = 100%
- [ ] All 8 screenshots taken
- [ ] Logo 512×512 + 1024×1024 ready
- [ ] Feature graphic 1024×500 ready
- [ ] Play Console account verified + paid
- [ ] AAB built via PWABuilder
- [ ] Keystore saved in 3 places
- [ ] assetlinks.json updated with real SHA256
- [ ] All form fields filled in Play Console

→ Push the **Roll out to Production** button. 🚀
