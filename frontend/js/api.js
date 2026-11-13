/* ============================================================
   EVENTIFY — Central API Helper
   All backend calls go through this module.
   Base URL auto-detected to work under /eventify/ prefix.
   ============================================================ */

const API = (function () {
    // Auto-detect base path: works for http://localhost/eventify/...
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    // If served inside /eventify/frontend/... -> base = /eventify
    let base = '';
    const idx = pathParts.indexOf('eventify');
    if (idx >= 0) {
        base = '/' + pathParts.slice(0, idx + 1).join('/');
    }

    const API_ROOT = base + '/backend';

    async function request(url, options = {}) {
        const opts = {
            method: options.method || 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        };

        if (options.body !== undefined) {
            if (options.body instanceof FormData) {
                opts.body = options.body;
            } else {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(options.body);
            }
        }

        try {
            const res = await fetch(API_ROOT + url, opts);
            const text = await res.text();

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (parseErr) {
                console.error('Non-JSON response from', url, ':', text);
                return { success: false, message: 'Server returned invalid response' };
            }

            if (!res.ok && data.success === undefined) {
                data.success = false;
            }
            return data;
        } catch (err) {
            console.error('API error', url, err);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    function qs(params) {
        const parts = [];
        Object.keys(params || {}).forEach(k => {
            const v = params[k];
            if (v !== undefined && v !== null && v !== '') {
                parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return parts.length ? '?' + parts.join('&') : '';
    }

    return {
        API_ROOT,
        request,
        qs,

        // ---------- Auth ----------
        register: (payload) => request('/auth/register.php', { method: 'POST', body: payload }),
        login:    (payload) => request('/auth/login.php',    { method: 'POST', body: payload }),
        logout:   ()        => request('/auth/logout.php',   { method: 'POST' }),
        sessionCheck: ()    => request('/auth/session_check.php'),

        // ---------- Events ----------
        listEvents: (filters = {}) => request('/events/list_events.php' + qs(filters)),
        getEvent:   (event_id)     => request('/events/get_event.php' + qs({ event_id })),
        createEvent:(payload)      => request('/events/create_event.php', { method: 'POST', body: payload }),
        updateEvent:(payload)      => request('/events/update_event.php', { method: 'POST', body: payload }),
        deleteEvent:(event_id)     => request('/events/delete_event.php', { method: 'POST', body: { event_id } }),

        // ---------- Registration ----------
        registerForEvent: (event_id) => request('/registration/register_user.php', { method: 'POST', body: { event_id } }),
        cancelRegistration: (reg_id) => request('/registration/cancel.php', { method: 'POST', body: { reg_id } }),
        myRegistrations:   ()        => request('/registration/my_registrations.php'),

        // ---------- Allocation ----------
        assignSeat: (event_id, user_id) => request('/allocation/assign_seat.php', { method: 'POST', body: { event_id, user_id } }),
        queueLog:   (event_id)          => request('/allocation/queue_log.php' + qs({ event_id })),
        getSeats:   (event_id)          => request('/allocation/get_seats.php' + qs({ event_id })),

        // ---------- Admin ----------
        adminStats:   ()           => request('/admin/dashboard_stats.php'),
        adminUsers:   ()           => request('/admin/users.php'),
        adminRegs:    (filters={}) => request('/admin/registrations.php' + qs(filters)),
        adminWaitlist:(event_id)   => request('/admin/waitlist.php' + qs({ event_id })),
        adminReports: ()           => request('/admin/reports.php')
    };
})();