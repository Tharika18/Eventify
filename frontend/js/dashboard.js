/* ============================================================
   EVENTIFY — Student Dashboard, My Registrations, My Waitlist, Profile
   ============================================================ */

const Dashboard = (function () {

    async function initUserDashboard() {
        const root = document.getElementById('userDashboard');
        if (!root) return;

        const session = await Auth.getSession();
        if (!Nav.requireLogin(session)) return;

        const res = await API.myRegistrations();
        const regs = (res.success && res.data && res.data.registrations) ? res.data.registrations : [];

        const allocated = regs.filter(r => r.status === 'allocated').length;
        const waitlist  = regs.filter(r => r.status === 'waitlist').length;
        const cancelled = regs.filter(r => r.status === 'cancelled').length;

        const now = new Date();
        const upcoming = regs.filter(r => {
            const d = new Date(r.event_date + 'T00:00:00');
            return r.status !== 'cancelled' && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }).length;

        // Populate stat tiles
        setText('statTotalRegs', regs.filter(r => r.status !== 'cancelled').length);
        setText('statAllocated', allocated);
        setText('statWaitlist', waitlist);
        setText('statUpcoming', upcoming);

        // Recent registrations
        const recentBox = document.getElementById('recentRegistrations');
        if (recentBox) {
            const recent = regs.filter(r => r.status !== 'cancelled').slice(0, 5);
            if (recent.length === 0) {
                recentBox.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">${Events.icon('calendar', 28)}</div>
                        <h4>No registrations yet</h4>
                        <p>Browse events and register to get started.</p>
                        <a href="events.html" class="btn btn-primary mt-4">Browse Events</a>
                    </div>`;
            } else {
                recentBox.innerHTML = recent.map(r => `
                    <div class="report-row">
                        <div>
                            <div class="rr-name">${Notify.escapeHtml(r.event_name)}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);">
                                ${Events.formatDate(r.event_date)} · ${Notify.escapeHtml(r.venue)}
                            </div>
                        </div>
                        <span class="badge ${r.status === 'allocated' ? 'badge-success' : r.status === 'waitlist' ? 'badge-warning' : 'badge-neutral'}">
                            ${r.status === 'allocated' ? 'Seat ' + r.seat_number : r.status === 'waitlist' ? 'Waitlist #' + r.queue_position : 'Cancelled'}
                        </span>
                    </div>
                `).join('');
            }
        }
    }

    async function initMyRegistrations() {
        const root = document.getElementById('myRegistrations');
        if (!root) return;

        const session = await Auth.getSession();
        if (!Nav.requireLogin(session)) return;

        root.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading your registrations...</p></div>`;

        const res = await API.myRegistrations();
        const regs = (res.success && res.data && res.data.registrations) ? res.data.registrations : [];

        if (regs.length === 0) {
            root.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${Events.icon('calendar', 28)}</div>
                    <h4>No registrations yet</h4>
                    <p>Explore events and register to see them here.</p>
                    <a href="events.html" class="btn btn-primary mt-4">Browse Events</a>
                </div>`;
            return;
        }

        root.innerHTML = `
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Venue</th>
                            <th>Seat / Position</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regs.map(r => `
                            <tr>
                                <td>
                                    <div style="font-weight:600;color:var(--navy);">${Notify.escapeHtml(r.event_name)}</div>
                                    <div style="font-size:0.78rem;color:var(--text-muted);">${Notify.escapeHtml(r.category)}</div>
                                </td>
                                <td>${Events.formatDate(r.event_date)}</td>
                                <td>${Notify.escapeHtml(r.venue)}</td>
                                <td>${r.status === 'allocated' ? 'Seat ' + r.seat_number : r.status === 'waitlist' ? '#' + r.queue_position : '—'}</td>
                                <td>
                                    <span class="badge ${r.status === 'allocated' ? 'badge-success' : r.status === 'waitlist' ? 'badge-warning' : 'badge-neutral'}">
                                        ${r.status}
                                    </span>
                                </td>
                                <td>
                                    ${r.status !== 'cancelled'
                                        ? `<button class="btn btn-sm btn-danger" data-cancel-reg="${r.reg_id}">Cancel</button>`
                                        : '<span style="color:var(--text-muted);font-size:0.85rem;">—</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        root.querySelectorAll('[data-cancel-reg]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const regId = parseInt(btn.getAttribute('data-cancel-reg'));
                const ok = await Notify.confirm({
                    title: 'Cancel registration?',
                    message: 'If you hold a seat, the first student on the waitlist will be promoted.',
                    confirmText: 'Yes, cancel',
                    variant: 'danger'
                });
                if (!ok) return;

                Notify.showLoading('Cancelling...');
                const res = await API.cancelRegistration(regId);
                Notify.hideLoading();

                if (!res.success) {
                    Notify.error(res.message || 'Cancellation failed');
                    return;
                }

                Notify.success('Registration cancelled');
                if (res.data && res.data.promoted) {
                    Notify.info('Waitlist promoted: seat #' + res.data.promoted.seat_number);
                }
                setTimeout(() => initMyRegistrations(), 800);
            });
        });
    }

    async function initMyWaitlist() {
        const root = document.getElementById('myWaitlist');
        if (!root) return;

        const session = await Auth.getSession();
        if (!Nav.requireLogin(session)) return;

        root.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading your waitlist...</p></div>`;

        const res = await API.myRegistrations();
        const regs = (res.success && res.data && res.data.registrations) ? res.data.registrations : [];
        const waiting = regs.filter(r => r.status === 'waitlist');

        if (waiting.length === 0) {
            root.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${Events.icon('clock', 28)}</div>
                    <h4>You are not on any waitlist</h4>
                    <p>When you register for a full event, you'll appear here.</p>
                    <a href="events.html" class="btn btn-primary mt-4">Browse Events</a>
                </div>`;
            return;
        }

        root.innerHTML = waiting.map(r => `
            <div class="card mb-4 fade-in">
                <div class="flex-between" style="align-items:flex-start;gap:16px;">
                    <div>
                        <div style="font-weight:700;color:var(--navy);font-size:1.05rem;">${Notify.escapeHtml(r.event_name)}</div>
                        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:4px;">
                            ${Events.formatDate(r.event_date)} · ${Notify.escapeHtml(r.venue)}
                        </div>
                        <div style="margin-top:12px;">
                            <span class="badge badge-warning">You are currently #${r.queue_position} in the waiting queue</span>
                        </div>
                        <div style="color:var(--text-muted);font-size:0.8rem;margin-top:10px;">
                            Joined: ${new Date(r.registered_at.replace(' ', 'T')).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.05em;font-weight:600;">Queue Position</div>
                        <div style="font-family:Poppins;font-size:2rem;font-weight:800;color:var(--primary);line-height:1;">#${r.queue_position}</div>
                        <button class="btn btn-sm btn-danger mt-4" data-cancel-reg="${r.reg_id}">Leave waitlist</button>
                    </div>
                </div>
            </div>
        `).join('');

        root.querySelectorAll('[data-cancel-reg]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const regId = parseInt(btn.getAttribute('data-cancel-reg'));
                const ok = await Notify.confirm({
                    title: 'Leave waitlist?',
                    message: 'You will lose your position in the queue.',
                    confirmText: 'Leave',
                    variant: 'danger'
                });
                if (!ok) return;

                Notify.showLoading('Removing...');
                const r2 = await API.cancelRegistration(regId);
                Notify.hideLoading();

                if (!r2.success) { Notify.error(r2.message); return; }
                Notify.success('Removed from waitlist');
                setTimeout(() => initMyWaitlist(), 700);
            });
        });
    }

    async function initProfile() {
        const root = document.getElementById('profileRoot');
        if (!root) return;

        const session = await Auth.getSession();
        if (!Nav.requireLogin(session)) return;

        const res = await API.myRegistrations();
        const regs = (res.success && res.data && res.data.registrations) ? res.data.registrations : [];
        const totalRegs = regs.filter(r => r.status !== 'cancelled').length;

        root.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">${Notify.escapeHtml((session.user_name || '?').charAt(0).toUpperCase())}</div>
                <h2 style="margin-bottom:4px;">${Notify.escapeHtml(session.user_name)}</h2>
                <p style="color:var(--text-muted);margin-bottom:24px;">${Notify.escapeHtml(session.email)}</p>

                <div class="profile-row">
                    <span class="label">Role</span>
                    <span class="value" style="text-transform:capitalize;">${Notify.escapeHtml(session.role)}</span>
                </div>
                <div class="profile-row">
                    <span class="label">Account ID</span>
                    <span class="value">#${session.user_id}</span>
                </div>
                <div class="profile-row">
                    <span class="label">Total Registrations</span>
                    <span class="value">${totalRegs}</span>
                </div>
                <div class="profile-row">
                    <span class="label">Email</span>
                    <span class="value">${Notify.escapeHtml(session.email)}</span>
                </div>

                <div class="mt-6" style="display:flex;gap:12px;flex-wrap:wrap;">
                    <a href="my-registrations.html" class="btn btn-secondary">My Registrations</a>
                    <button class="btn btn-danger" data-action="logout">Log out</button>
                </div>
            </div>
        `;
        Nav.init();
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    return {
        initUserDashboard,
        initMyRegistrations,
        initMyWaitlist,
        initProfile
    };
})();