/* ============================================================
   firebase-config.js — Plug your Firebase project config here.
   If `apiKey` is empty, the app falls back to local-only mode.
   ============================================================ */

const firebaseConfig = {
    apiKey: "",           // ← paste from Firebase console
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
};

// Set to `true` to force local-only mode even if config is present (for debug).
const FORCE_LOCAL_MODE = false;

const FIREBASE_ENABLED = !FORCE_LOCAL_MODE && !!firebaseConfig.apiKey;
