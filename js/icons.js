/* ============================================================
   icons.js — Lucide icons helper (Design System v2)
   Usage: <i data-lucide="flame"></i>  →  rendered SVG line-icon.
   Call refreshIcons() after any DOM mutation that injects icons.
   ============================================================ */

function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try { lucide.createIcons({ attrs: { 'stroke-width': 1.5 } }); } catch (e) {}
    }
}

/** Convenience helper: returns the HTML string for a Lucide icon. */
function ico(name, size = 22, cls = '') {
    return `<i data-lucide="${name}" class="lucide ${cls}" style="width:${size}px;height:${size}px;"></i>`;
}

// Initial pass after DOM ready
window.addEventListener('DOMContentLoaded', refreshIcons);

// Re-render after page navigation (showPage swaps content)
const _origShowPage = window.showPage;
if (typeof _origShowPage === 'function') {
    window.showPage = function (...args) {
        const r = _origShowPage.apply(this, args);
        setTimeout(refreshIcons, 0);
        return r;
    };
}
