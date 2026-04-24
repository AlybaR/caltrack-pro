/* ============================================================
   scanner.js — Barcode scanner via ZXing-JS + OpenFoodFacts
   Flow :
     1) openScanner(mk) → full-screen modal, camera starts
     2) ZXing detects EAN/UPC → stops camera
     3) Fetch OpenFoodFacts by barcode
     4) Show product card → user enters grams → addFoodDirect()
   ============================================================ */

const ZXING_CDN = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js';

let _scannerStream = null;
let _codeReader = null;
let _scannerMealKey = null;
let _scannerActive = false;

/* ---------- Dynamic ZXing loader ---------- */
function loadZXing() {
    return new Promise((resolve, reject) => {
        if (typeof ZXing !== 'undefined') { resolve(); return; }
        const s = document.createElement('script');
        s.src = ZXING_CDN;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load ZXing'));
        document.head.appendChild(s);
    });
}

/* ---------- Main entry ---------- */
async function openScanner(mk) {
    _scannerMealKey = mk;
    _scannerActive = true;

    const modal = ensureScannerModal();
    modal.style.display = 'flex';
    showScannerView('camera');

    // Loading state
    const hint = document.getElementById('scanner-hint');
    if (hint) hint.textContent = '📷 Chargement du scanner...';

    try {
        await loadZXing();
    } catch {
        showScannerError('⚠️ Impossible de charger le scanner. Vérifie ta connexion.');
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showScannerError('⚠️ Caméra non supportée par ton navigateur.');
        return;
    }

    try {
        _scannerStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
    } catch (e) {
        if (e.name === 'NotAllowedError') {
            showScannerError('🔒 Permission caméra refusée. Autorise dans les réglages de ton navigateur.');
        } else {
            showScannerError('⚠️ Impossible d\'accéder à la caméra.');
        }
        return;
    }

    const video = document.getElementById('scanner-video');
    video.srcObject = _scannerStream;
    try { await video.play(); } catch {}

    if (hint) hint.textContent = '📷 Pointe vers un code-barres';

    // Start continuous scan
    _codeReader = new ZXing.BrowserMultiFormatReader();
    _codeReader.decodeFromStream(_scannerStream, video, (result, err) => {
        if (result && _scannerActive) {
            _scannerActive = false;
            onBarcodeDetected(result.getText());
        }
    });
}

/* ---------- Barcode → OpenFoodFacts lookup ---------- */
async function onBarcodeDetected(barcode) {
    stopCamera();
    showScannerView('loading');
    const loadEl = document.getElementById('scanner-loading-txt');
    if (loadEl) loadEl.textContent = `🔍 Recherche ${barcode}...`;

    if (!navigator.onLine) {
        showScannerError('⚠️ Hors-ligne — impossible de chercher ce produit.', barcode);
        return;
    }

    try {
        const res = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
            { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (data.status === 1 && data.product) {
            const p = data.product;
            const nut = p.nutriments || {};
            const kcal = Math.round(nut['energy-kcal_100g'] || nut['energy-kcal'] || 0);

            if (kcal === 0) {
                showScannerError('⚠️ Pas de données nutritionnelles pour ce produit.', barcode);
                return;
            }

            const salt = nut['salt_100g'] != null ? nut['salt_100g'] : (nut['sodium_100g'] != null ? nut['sodium_100g'] * 2.5 : null);
            const product = {
                n: (p.product_name_fr || p.product_name || 'Produit').slice(0, 60),
                brand: (p.brands || '').split(',')[0].trim(),
                k: kcal,
                p: Math.round(nut['proteins_100g'] || 0),
                l: Math.round(nut['fat_100g'] || 0),
                g: Math.round(nut['carbohydrates_100g'] || 0),
                fib: nut['fiber_100g'] != null ? +(+nut['fiber_100g']).toFixed(1) : undefined,
                suc: nut['sugars_100g'] != null ? +(+nut['sugars_100g']).toFixed(1) : undefined,
                sat: nut['saturated-fat_100g'] != null ? +(+nut['saturated-fat_100g']).toFixed(1) : undefined,
                sel: salt != null ? +(+salt).toFixed(2) : undefined,
                barcode,
            };
            showProductConfirm(product);
        } else {
            showScannerError('❌ Produit non trouvé dans OpenFoodFacts.', barcode);
        }
    } catch (e) {
        showScannerError('⚠️ Erreur réseau. Réessaie.');
    }
}

/* ---------- Product confirmation card ---------- */
function showProductConfirm(product) {
    showScannerView('confirm');
    const el = document.getElementById('scanner-confirm-body');
    el.innerHTML = `
        <div class="scanner-prod-name">${product.n}</div>
        ${product.brand ? `<div class="scanner-prod-brand">${product.brand}</div>` : ''}
        <div class="scanner-prod-macros">
            <span class="text-acc"><b>${product.k}</b> kcal</span> ·
            P<b>${product.p}</b>g · L<b>${product.l}</b>g · G<b>${product.g}</b>g
            <span class="scanner-prod-per">/ 100g</span>
        </div>
        <label class="scanner-qty-label">Quantité consommée :</label>
        <div class="scanner-qty-row">
            <input type="number" id="scanner-qty-input" value="100" min="1" max="2000" step="10" class="scanner-qty-input"/>
            <span>g</span>
            <span class="scanner-qty-preview">= <b id="scanner-qty-kcal">${product.k}</b> kcal</span>
        </div>
        <div class="scanner-actions">
            <button class="btn btn-acc" onclick='confirmScannedProduct(${JSON.stringify(product).replace(/'/g,"&#39;")})'>✓ Ajouter au repas</button>
            <button class="btn btn-ghost" onclick="restartScanner()">↻ Rescanner</button>
        </div>
    `;

    // Live preview of kcal based on grams
    const input = document.getElementById('scanner-qty-input');
    const out = document.getElementById('scanner-qty-kcal');
    if (input && out) {
        input.addEventListener('input', () => {
            const g = parseFloat(input.value) || 0;
            out.textContent = Math.round(product.k * g / 100);
        });
        setTimeout(() => { input.focus(); input.select(); }, 50);
    }
}

function confirmScannedProduct(product) {
    const input = document.getElementById('scanner-qty-input');
    const g = parseFloat(input?.value) || 100;
    if (g < 1) { showToast('⚠️ Quantité invalide'); return; }
    const qty = g / 100;
    const name = `${product.n}${product.brand ? ' — ' + product.brand : ''} (${g}g)`;
    const extras = {};
    ['fib', 'suc', 'sel', 'sat'].forEach(k => { if (product[k] != null) extras[k] = product[k]; });
    addFoodDirect(_scannerMealKey, name, product.k, product.p, product.l, product.g, qty, extras);
    showToast(`✅ ${product.n} ajouté`);
    closeScanner();
}

/* ---------- Error / restart / close ---------- */
function showScannerError(msg, barcode = null) {
    showScannerView('error');
    const el = document.getElementById('scanner-error-body');
    el.innerHTML = `
        <div class="scanner-error-msg">${msg}</div>
        ${barcode ? `<div class="scanner-error-code">Code : ${barcode}</div>` : ''}
        <div class="scanner-actions">
            <button class="btn btn-acc" onclick="restartScanner()">↻ Réessayer</button>
            <button class="btn btn-ghost" onclick="closeScanner()">Fermer</button>
        </div>
    `;
}

function restartScanner() {
    if (!_scannerMealKey) return;
    openScanner(_scannerMealKey);
}

function stopCamera() {
    if (_codeReader) {
        try { _codeReader.reset(); } catch {}
        _codeReader = null;
    }
    if (_scannerStream) {
        _scannerStream.getTracks().forEach(t => t.stop());
        _scannerStream = null;
    }
    const v = document.getElementById('scanner-video');
    if (v) v.srcObject = null;
}

function closeScanner() {
    _scannerActive = false;
    stopCamera();
    const modal = document.getElementById('scanner-modal');
    if (modal) modal.style.display = 'none';
}

/* ---------- View switcher (camera / loading / confirm / error) ---------- */
function showScannerView(view) {
    ['camera', 'loading', 'confirm', 'error'].forEach(v => {
        const el = document.getElementById('scanner-view-' + v);
        if (el) el.style.display = v === view ? 'flex' : 'none';
    });
}

/* ---------- Modal factory ---------- */
function ensureScannerModal() {
    let modal = document.getElementById('scanner-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'scanner-modal';
    modal.className = 'scanner-modal';
    modal.innerHTML = `
        <button class="scanner-close-btn" onclick="closeScanner()" aria-label="Fermer">✕</button>

        <!-- Camera view -->
        <div class="scanner-view" id="scanner-view-camera">
            <video id="scanner-video" autoplay playsinline muted></video>
            <div class="scanner-frame"></div>
            <div class="scanner-hint" id="scanner-hint">📷 Pointe vers un code-barres</div>
        </div>

        <!-- Loading view -->
        <div class="scanner-view" id="scanner-view-loading" style="display:none">
            <div class="scanner-spinner"></div>
            <div class="scanner-loading-txt" id="scanner-loading-txt">🔍 Recherche...</div>
        </div>

        <!-- Confirm view -->
        <div class="scanner-view" id="scanner-view-confirm" style="display:none">
            <div class="scanner-card" id="scanner-confirm-body"></div>
        </div>

        <!-- Error view -->
        <div class="scanner-view" id="scanner-view-error" style="display:none">
            <div class="scanner-card" id="scanner-error-body"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}
