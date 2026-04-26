/* ============================================================
   firebase-config.js — Plug your Firebase project config here.
   If `apiKey` is empty, the app falls back to local-only mode.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyASlPcGnmkzMWA0f-3e9R8pZLkJnF2k2Is",
  authDomain: "caltrack-pro-bec1b.firebaseapp.com",
  projectId: "caltrack-pro-bec1b",
  storageBucket: "caltrack-pro-bec1b.firebasestorage.app",
  messagingSenderId: "675742866141",
  appId: "1:675742866141:web:632dc94fbdd0d803ff9934",
  measurementId: "G-8CHJ8KQF8L"
};

// Set to `true` to force local-only mode even if config is present (for debug).
const FORCE_LOCAL_MODE = false;

// Test runner detection — `?test=1` URL param forces local mode (no Firebase).
// This lets tests/index.html control the app deterministically without
// Firebase auth state interfering.
const _IS_TEST_MODE = (() => {
    try { return new URLSearchParams(location.search).get('test') === '1'; }
    catch (e) { return false; }
})();

const FIREBASE_ENABLED = !FORCE_LOCAL_MODE && !_IS_TEST_MODE && !!firebaseConfig.apiKey;
// Expose on window for diagnostics (test runner reads this)
window.FIREBASE_ENABLED = FIREBASE_ENABLED;
window._IS_TEST_MODE    = _IS_TEST_MODE;
