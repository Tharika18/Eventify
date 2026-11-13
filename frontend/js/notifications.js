/* ============================================================
   EVENTIFY — Toasts + Modals + Loading
   ============================================================ */

const Notify = (function () {

    let toastContainer = null;

    function ensureToastContainer() {
        if (toastContainer) return toastContainer;
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(toastContainer);
        return toastContainer;
    }

    const ICONS = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const TITLES = {
        success: 'Success',
        error:   'Error',
        warning: 'Warning',
        info:    'Info'
    };

    function show(message, type = 'info', title = null, duration = 3500) {
        const container = ensureToastContainer();
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title || TITLES[type] || 'Notice')}</div>
                <div class="toast-msg">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        const close = () => {
            el.classList.add('leaving');
            setTimeout(() => el.remove(), 300);
        };

        el.querySelector('.toast-close').addEventListener('click', close);
        container.appendChild(el);

        if (duration > 0) {
            setTimeout(close, duration);
        }
        return { close };
    }

    // ---------- Modal ----------
    function confirm(opts = {}) {
        return new Promise(resolve => {
            const {
                title = 'Are you sure?',
                message = '',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                variant = 'info', // info | warning | danger
                icon = null
            } = opts;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            const defaultIcon = variant === 'danger'
                ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
                : variant === 'warning'
                    ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                    : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

            const btnClass = variant === 'danger' ? 'btn-danger'
                            : variant === 'warning' ? 'btn-primary'
                            : 'btn-primary';

            overlay.innerHTML = `
                <div class="modal" role="dialog" aria-modal="true">
                    <div class="modal-icon ${variant}">${icon || defaultIcon}</div>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(message)}</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" data-act="cancel">${escapeHtml(cancelText)}</button>
                        <button class="btn ${btnClass}" data-act="confirm">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('visible'));

            const close = (result) => {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.remove(), 200);
                document.removeEventListener('keydown', onKey);
                resolve(result);
            };

            const onKey = (e) => {
                if (e.key === 'Escape') close(false);
                if (e.key === 'Enter') close(true);
            };

            overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => close(false));
            overlay.querySelector('[data-act="confirm"]').addEventListener('click', () => close(true));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });
            document.addEventListener('keydown', onKey);
        });
    }

    // ---------- Loading overlay ----------
    let loadingEl = null;
    function showLoading(text = 'Loading...') {
        if (loadingEl) return;
        loadingEl = document.createElement('div');
        loadingEl.className = 'modal-overlay visible';
        loadingEl.innerHTML = `
            <div class="modal" style="max-width:320px;text-align:center;padding:32px;">
                <div class="spinner" style="margin:0 auto 16px;"></div>
                <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">${escapeHtml(text)}</p>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }

    function hideLoading() {
        if (loadingEl) {
            loadingEl.remove();
            loadingEl = null;
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return {
        success: (msg, title) => show(msg, 'success', title),
        error:   (msg, title) => show(msg, 'error', title),
        warning: (msg, title) => show(msg, 'warning', title),
        info:    (msg, title) => show(msg, 'info', title),
        show,
        confirm,
        showLoading,
        hideLoading,
        escapeHtml
    };
})();