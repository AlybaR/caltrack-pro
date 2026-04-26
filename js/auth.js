/* ============================================================
   auth.js — Firebase Auth (email/password + Google) + session state
   Exposes:
     initAuth()            — called from window.onload
     signIn/Up/OutEmail()  — form handlers
     signInGoogle()
     currentAuthUser       — global
   ============================================================ */

let currentAuthUser = null;
let _authMode = 'signin'; // 'signin' | 'signup' | 'forgot'
let _authInitialized = false;

/** Entry point — called after Firebase SDK loaded. */
function initAuth() {
    if (!FIREBASE_ENABLED) return false;
    if (_authInitialized) return true;
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error('Firebase init failed:', e);
        return false;
    }
    // Firestore offline persistence — critical for PWA
    try {
        firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(() => { });
    } catch { }

    firebase.auth().onAuthStateChanged(user => {
        currentAuthUser = user;
        if (user) {
            hideAuthPage();
            if (typeof onUserReady === 'function') onUserReady(user);
        } else {
            showAuthPage();
        }
    });
    _authInitialized = true;
    return true;
}

/* ---------- UI ---------- */
function showAuthPage() {
    const landing = document.getElementById('landing');
    const wizard = document.getElementById('wizard');
    const botNav = document.getElementById('bot-nav');
    const sideNav = document.getElementById('side-nav');
    if (landing) landing.style.display = 'none';
    if (wizard) wizard.style.display = 'none';
    if (botNav) botNav.style.display = 'none';
    if (sideNav) sideNav.style.display = 'none';

    let page = document.getElementById('auth-page');
    if (!page) {
        page = document.createElement('div');
        page.id = 'auth-page';
        document.body.appendChild(page);
    }
    page.style.display = '';
    renderAuthForm();
}

function hideAuthPage() {
    const page = document.getElementById('auth-page');
    if (page) page.style.display = 'none';
}

function setAuthMode(mode) {
    _authMode = mode;
    renderAuthForm();
}

function renderAuthForm() {
    const page = document.getElementById('auth-page');
    if (!page) return;

    const title = _authMode === 'signup' ? 'Créer un compte'
                : _authMode === 'forgot' ? 'Mot de passe oublié'
                : 'Connexion';
    const btnLbl = _authMode === 'signup' ? 'Créer mon compte'
                 : _authMode === 'forgot' ? 'Envoyer le lien de reset'
                 : 'Se connecter';

    page.innerHTML = `
        <div class="auth-container">
            <div class="auth-logo">🌿</div>
            <h1 class="auth-title">Lyno</h1>
            <p class="auth-sub">${_authMode === 'signup' ? 'Ton suivi, synchronisé partout' : 'Bon retour parmi nous'}</p>

            <form class="auth-form" onsubmit="submitAuth(event)">
                <input type="email" id="auth-email" placeholder="Email" required autocomplete="email" />
                ${_authMode !== 'forgot' ? `
                    <input type="password" id="auth-password" placeholder="Mot de passe" required
                           autocomplete="${_authMode === 'signup' ? 'new-password' : 'current-password'}"
                           minlength="6" />
                ` : ''}
                <button type="submit" class="btn btn-acc auth-btn-submit">${btnLbl}</button>
            </form>

            <div id="auth-error" class="auth-error" style="display:none;"></div>

            ${_authMode !== 'forgot' ? `
                <div class="auth-divider"><span>ou</span></div>
                <button class="auth-btn-google" onclick="signInGoogle()">
                    <span class="gicon">G</span> Continuer avec Google
                </button>
            ` : ''}

            <div class="auth-links">
                ${_authMode === 'signin' ? `
                    <a onclick="setAuthMode('signup')">Créer un compte</a>
                    <span>·</span>
                    <a onclick="setAuthMode('forgot')">Mot de passe oublié</a>
                ` : _authMode === 'signup' ? `
                    <a onclick="setAuthMode('signin')">← J'ai déjà un compte</a>
                ` : `
                    <a onclick="setAuthMode('signin')">← Retour</a>
                `}
            </div>

            <div class="auth-legal">
                🔒 Tes données sont chiffrées en transit, stockées sur Google Cloud<br>
                et accessibles uniquement par toi.
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('auth-email')?.focus(), 60);
}

/* ---------- Handlers ---------- */
async function submitAuth(ev) {
    ev.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const pwd = document.getElementById('auth-password')?.value || '';
    const err = document.getElementById('auth-error');
    err.style.display = 'none';
    try {
        if (_authMode === 'signin') {
            await firebase.auth().signInWithEmailAndPassword(email, pwd);
        } else if (_authMode === 'signup') {
            await firebase.auth().createUserWithEmailAndPassword(email, pwd);
        } else {
            await firebase.auth().sendPasswordResetEmail(email);
            err.textContent = '✅ Email de reset envoyé !';
            err.style.color = 'var(--grn)';
            err.style.display = 'block';
        }
    } catch (e) {
        err.textContent = authErrorMsg(e.code || e.message);
        err.style.color = 'var(--red)';
        err.style.display = 'block';
    }
}

async function signInGoogle() {
    const err = document.getElementById('auth-error');
    err.style.display = 'none';
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
    } catch (e) {
        err.textContent = authErrorMsg(e.code || e.message);
        err.style.color = 'var(--red)';
        err.style.display = 'block';
    }
}

async function signOutUser() {
    if (!confirm('Se déconnecter ? Tes données locales restent sur cet appareil.')) return;
    try {
        await firebase.auth().signOut();
        // After sign-out, clear localStorage so next user starts fresh? Up to you — safer to leave.
        location.reload();
    } catch (e) { showToast('⚠️ ' + (e.message || 'Erreur')); }
}

function authErrorMsg(code) {
    const map = {
        'auth/invalid-email': 'Email invalide',
        'auth/user-not-found': 'Aucun compte avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/email-already-in-use': 'Un compte existe déjà avec cet email',
        'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères)',
        'auth/popup-closed-by-user': 'Connexion Google annulée',
        'auth/network-request-failed': 'Pas de connexion internet',
    };
    return '⚠️ ' + (map[code] || code);
}
