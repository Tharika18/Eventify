/* ============================================================
   EVENTIFY — App bootstrap
   Loads WASM, primes session, wires global behaviors.
   ============================================================ */

const App = (function () {

    async function bootstrap() {
        // Load WASM (non-blocking failure)
        try { await Wasm.load(); } catch (e) { console.warn(e); }

        // Wire up common nav (sidebar toggles, logout, active links)
        Nav.init();

        // Populate user info in sidebars/topbars if present
        const hasUserSlot = document.querySelector('[data-user-name]');
        if (hasUserSlot) {
            await Nav.populateUser();
        }

        // Animate any elements with .fade-in
        document.querySelectorAll('.fade-in').forEach(el => {
            el.style.animationDelay = (Math.random() * 0.2) + 's';
        });

        // Footer year
        document.querySelectorAll('[data-year]').forEach(el => {
            el.textContent = new Date().getFullYear();
        });
    }

    return { bootstrap };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.bootstrap();
});