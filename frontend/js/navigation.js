/* ============================================================
   EVENTIFY — Sidebar / Navigation helpers
   - Toggle mobile sidebar
   - Auto-highlight active link
   - Logout handler
   - Populate user info from session
   ============================================================ */

const Nav = (function () {

    function currentFile() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1);
        return file || 'index.html';
    }

    function initSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const hamburger = document.querySelector('.hamburger');
        const closeBtn = document.querySelector('.sidebar-close');

        if (!sidebar) return;

        if (!overlay) {
            const ov = document.createElement('div');
            ov.className = 'sidebar-overlay';
            document.body.appendChild(ov);
        }

        const actualOverlay = document.querySelector('.sidebar-overlay');

        const open = () => {
            sidebar.classList.add('open');
            actualOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            sidebar.classList.remove('open');
            actualOverlay.classList.remove('visible');
            document.body.style.overflow = '';
        };

        if (hamburger) hamburger.addEventListener('click', open);
        if (closeBtn)  closeBtn.addEventListener('click', close);
        actualOverlay.addEventListener('click', close);

        // Close on nav link click (mobile)
        sidebar.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 640) close();
            });
        });

        // Auto-close on resize up
        window.addEventListener('resize', () => {
            if (window.innerWidth > 640) close();
        });
    }

    function highlightActive() {
        const file = currentFile();
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const target = href.substring(href.lastIndexOf('/') + 1);
            if (target === file) link.classList.add('active');
        });
    }

    async function populateUser() {
        const res = await API.sessionCheck();
        if (!res.success || !res.data || !res.data.loggedIn) return null;

        const user = res.data;
        document.querySelectorAll('[data-user-name]').forEach(el => {
            el.textContent = user.user_name;
        });
        document.querySelectorAll('[data-user-email]').forEach(el => {
            el.textContent = user.email;
        });
        document.querySelectorAll('[data-user-role]').forEach(el => {
            el.textContent = user.role;
        });
        document.querySelectorAll('[data-user-initial]').forEach(el => {
            el.textContent = (user.user_name || '?').charAt(0).toUpperCase();
        });
        return user;
    }

    function initLogout() {
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const ok = await Notify.confirm({
                    title: 'Log out?',
                    message: 'You will be signed out of your EVENTIFY account.',
                    confirmText: 'Log out',
                    variant: 'warning'
                });
                if (!ok) return;
                await API.logout();
                window.location.href = 'index.html';
            });
        });
    }

    function requireLogin(user) {
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    function requireAdmin(user) {
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    function redirectIfLoggedIn(user) {
        if (user && user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return true;
        }
        if (user) {
            window.location.href = 'user-dashboard.html';
            return true;
        }
        return false;
    }

    function init() {
        initSidebar();
        highlightActive();
        initLogout();
    }

    return {
        init,
        currentFile,
        populateUser,
        requireLogin,
        requireAdmin,
        redirectIfLoggedIn
    };
})();