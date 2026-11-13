/* ============================================================
   EVENTIFY — Admin functionality
   ============================================================ */

const Admin = (function () {

    async function guard() {
        const s = await Auth.getSession();
        if (!s || s.role !== 'admin') {
            Notify.error('Admin access required');
            setTimeout(() => { window.location.href = 'login.html'; }, 600);
            return null;
        }
        return s;
    }

    // -------- Dashboard --------
    async function initDashboard() {
        const root = document.getElementById('adminDashboard');
        if (!root) return;
        if (!await guard()) return;

        const res = await API.adminStats();
        if (!res.success || !res.data) {
            Notify.error(res.message || 'Failed to load stats');
            return;
        }

        const d = res.data;
        setText('aEvents', d.totals.events);
        setText('aUsers', d.totals.users);
        setText('aRegs', d.totals.registrations);
        setText('aAllocated', d.totals.allocated);
        setText('aWaitlist', d.totals.waitlist);
        setText('aUpcoming', d.totals.upcoming);

        // Recent registrations
        const recent = document.getElementById('recentRegsAdmin');
        if (recent) {
            if (!d.recent_registrations || d.recent_registrations.length === 0) {
                recent.innerHTML = '<div class="empty-state"><p>No recent registrations.</p></div>';
            } else {
                recent.innerHTML = d.recent_registrations.map(r => `
                    <div class="report-row">
                        <div>
                            <div class="rr-name">${Notify.escapeHtml(r.user_name)}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);">${Notify.escapeHtml(r.event_name)}</div>
                        </div>
                        <span class="badge ${r.status === 'allocated' ? 'badge-success' : r.status === 'waitlist' ? 'badge-warning' : 'badge-neutral'}">
                            ${r.status === 'allocated' ? 'Seat ' + r.seat_number : r.status}
                        </span>
                    </div>
                `).join('');
            }
        }

        // Utilization chart
        const util = document.getElementById('utilChart');
        if (util && d.utilization) {
            const max = Math.max(1, ...d.utilization.map(u => u.capacity));
            util.innerHTML = d.utilization.map(u => {
                const pct = Math.round((u.registered / Math.max(1, u.capacity)) * 100);
                return `
                    <div class="hbar-item">
                        <div class="hbar-label">${Notify.escapeHtml(u.event_name)}</div>
                        <div class="hbar-track">
                            <div class="hbar-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="hbar-val">${pct}%</div>
                    </div>
                `;
            }).join('');
        }
    }

    // -------- Events list --------
    async function initEventsList() {
        const root = document.getElementById('adminEventsTable');
        if (!root) return;
        if (!await guard()) return;

        async function load() {
            root.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading events...</p></div>';
            const res = await API.listEvents();
            if (!res.success || !res.data) {
                root.innerHTML = '<div class="empty-state"><p>Failed to load events.</p></div>';
                return;
            }
            const events = res.data.events || [];
            if (events.length === 0) {
                root.innerHTML = '<div class="empty-state"><h4>No events</h4><p>Create your first event.</p><a href="admin-create-event.html" class="btn btn-primary mt-4">Create Event</a></div>';
                return;
            }
            root.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Capacity</th>
                            <th>Registered</th>
                            <th>Available</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(e => `
                            <tr>
                                <td>
                                    <div style="font-weight:600;color:var(--navy);">${Notify.escapeHtml(e.event_name)}</div>
                                    <div style="font-size:0.78rem;color:var(--text-muted);">${Notify.escapeHtml(e.venue)}</div>
                                </td>
                                <td><span class="badge badge-primary">${Notify.escapeHtml(e.category)}</span></td>
                                <td>${Events.formatDate(e.event_date)}</td>
                                <td>${e.capacity}</td>
                                <td>${e.registered}</td>
                                <td>${e.available}</td>
                                <td>
                                    <div class="row-actions">
                                        <a class="icon-btn" href="admin-seats.html?event_id=${e.event_id}" title="Seats">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M4 18h16"/><path d="M6 22v-4"/><path d="M18 22v-4"/></svg>
                                        </a>
                                        <a class="icon-btn" href="admin-create-event.html?id=${e.event_id}" title="Edit">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </a>
                                        <button class="icon-btn danger" data-del="${e.event_id}" title="Delete">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            root.querySelectorAll('[data-del]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.getAttribute('data-del'));
                    const ok = await Notify.confirm({
                        title: 'Delete this event?',
                        message: 'All registrations and queue logs will be removed. This cannot be undone.',
                        confirmText: 'Delete',
                        variant: 'danger'
                    });
                    if (!ok) return;
                    Notify.showLoading('Deleting...');
                    const r = await API.deleteEvent(id);
                    Notify.hideLoading();
                    if (!r.success) { Notify.error(r.message); return; }
                    Notify.success('Event deleted');
                    load();
                });
            });
        }

        await load();
    }

    // -------- Create / Edit event --------
    async function initCreateEvent() {
        const form = document.getElementById('eventForm');
        if (!form) return;
        if (!await guard()) return;

        const params = new URLSearchParams(window.location.search);
        const editId = parseInt(params.get('id') || '0');
        const heading = document.getElementById('formHeading');
        const submitBtn = document.getElementById('submitBtn');

        if (editId) {
            if (heading) heading.textContent = 'Edit Event';
            if (submitBtn) submitBtn.textContent = 'Save Changes';

            const r = await API.getEvent(editId);
            if (r.success && r.data && r.data.event) {
                const e = r.data.event;
                form.event_name.value = e.event_name;
                form.description.value = e.description || '';
                form.category.value = e.category;
                form.venue.value = e.venue;
                form.event_date.value = e.event_date;
                form.event_time.value = e.event_time.substring(0, 5);
                form.capacity.value = e.capacity;
                form.image.value = e.image || '';
            }
        }

        form.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const payload = {
                event_id: editId || undefined,
                event_name: form.event_name.value.trim(),
                description: form.description.value.trim(),
                category: form.category.value,
                venue: form.venue.value.trim(),
                event_date: form.event_date.value,
                event_time: form.event_time.value,
                capacity: parseInt(form.capacity.value),
                image: form.image.value.trim()
            };

            if (!payload.event_name || !payload.category || !payload.venue ||
                !payload.event_date || !payload.event_time || !payload.capacity) {
                Notify.error('Please fill in all required fields');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const old = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Saving...';

            const res = editId ? await API.updateEvent(payload) : await API.createEvent(payload);

            btn.disabled = false;
            btn.innerHTML = old;

            if (!res.success) { Notify.error(res.message || 'Failed'); return; }
            Notify.success(editId ? 'Event updated' : 'Event created');
            setTimeout(() => { window.location.href = 'admin-events.html'; }, 800);
        });
    }

    // -------- Users --------
    async function initUsers() {
        const root = document.getElementById('adminUsersTable');
        if (!root) return;
        if (!await guard()) return;

        const res = await API.adminUsers();
        if (!res.success || !res.data) {
            root.innerHTML = '<div class="empty-state"><p>Failed to load users.</p></div>';
            return;
        }
        const users = res.data.users || [];
        root.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registrations</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td style="font-weight:600;color:var(--navy);">${Notify.escapeHtml(u.user_name)}</td>
                            <td>${Notify.escapeHtml(u.email)}</td>
                            <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}">${u.role}</span></td>
                            <td>${u.reg_count}</td>
                            <td>${new Date(u.created_at.replace(' ', 'T')).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // -------- Registrations --------
    async function initRegistrations() {
        const root = document.getElementById('adminRegsTable');
        if (!root) return;
        if (!await guard()) return;

        const res = await API.adminRegs({});
        if (!res.success || !res.data) {
            root.innerHTML = '<div class="empty-state"><p>Failed to load registrations.</p></div>';
            return;
        }
        const rows = res.data.registrations || [];
        if (rows.length === 0) {
            root.innerHTML = '<div class="empty-state"><h4>No registrations</h4></div>';
            return;
        }
        root.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Event</th>
                        <th>Seat</th>
                        <th>Queue Pos</th>
                        <th>Status</th>
                        <th>Registered</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>
                                <div style="font-weight:600;color:var(--navy);">${Notify.escapeHtml(r.user_name)}</div>
                                <div style="font-size:0.78rem;color:var(--text-muted);">${Notify.escapeHtml(r.email)}</div>
                            </td>
                            <td>${Notify.escapeHtml(r.event_name)}</td>
                            <td>${r.seat_number !== null ? r.seat_number : '—'}</td>
                            <td>${r.queue_position !== null ? '#' + r.queue_position : '—'}</td>
                            <td><span class="badge ${r.status === 'allocated' ? 'badge-success' : r.status === 'waitlist' ? 'badge-warning' : 'badge-neutral'}">${r.status}</span></td>
                            <td>${new Date(r.registered_at.replace(' ', 'T')).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // -------- Seats --------
    async function initSeats() {
        const root = document.getElementById('adminSeatsRoot');
        if (!root) return;
        if (!await guard()) return;

        const params = new URLSearchParams(window.location.search);
        let eventId = parseInt(params.get('event_id') || '0');

        // Populate event selector
        const list = await API.listEvents();
        const events = (list.success && list.data) ? list.data.events : [];

        const selector = document.getElementById('eventSelector');
        if (selector) {
            selector.innerHTML = '<option value="">— Select an event —</option>' +
                events.map(e => `<option value="${e.event_id}" ${e.event_id === eventId ? 'selected' : ''}>${Notify.escapeHtml(e.event_name)}</option>`).join('');

            selector.addEventListener('change', () => {
                const id = parseInt(selector.value || '0');
                if (id) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('event_id', id);
                    window.location.href = url.toString();
                }
            });
        }

        if (!eventId) {
            root.innerHTML = '<div class="empty-state"><h4>Select an event</h4><p>Choose an event above to view the seat grid.</p></div>';
            return;
        }

        root.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading seat map...</p></div>';

        const res = await API.getSeats(eventId);
        if (!res.success || !res.data) {
            root.innerHTML = '<div class="empty-state"><p>Failed to load seats.</p></div>';
            return;
        }

        const seats = res.data.seats || [];
        const occupied = seats.filter(s => s.status === 'occupied').length;
        const capacity = res.data.capacity;

        root.innerHTML = `
            <div class="seat-legend">
                <div class="seat-legend-item"><span class="swatch available"></span> Available</div>
                <div class="seat-legend-item"><span class="swatch occupied"></span> Occupied (${occupied})</div>
                <div class="seat-legend-item"><strong>${occupied} / ${capacity} seats filled</strong></div>
            </div>
            <div class="seat-grid">
                ${seats.map(s => `
                    <div class="seat ${s.status}" title="${s.status === 'occupied' ? Notify.escapeHtml(s.user_name || 'Occupied') : 'Seat ' + s.seat_number}">${String(s.seat_number).padStart(2, '0')}</div>
                `).join('')}
            </div>
        `;
    }

    // -------- Waitlist --------
    async function initWaitlist() {
        const root = document.getElementById('adminWaitlistRoot');
        if (!root) return;
        if (!await guard()) return;

        const params = new URLSearchParams(window.location.search);
        let eventId = parseInt(params.get('event_id') || '0');

        const list = await API.listEvents();
        const events = (list.success && list.data) ? list.data.events : [];

        const selector = document.getElementById('eventSelector');
        if (selector) {
            selector.innerHTML = '<option value="">All events</option>' +
                events.map(e => `<option value="${e.event_id}" ${e.event_id === eventId ? 'selected' : ''}>${Notify.escapeHtml(e.event_name)}</option>`).join('');
            selector.addEventListener('change', () => {
                const id = parseInt(selector.value || '0');
                const url = new URL(window.location.href);
                if (id) url.searchParams.set('event_id', id);
                else url.searchParams.delete('event_id');
                window.location.href = url.toString();
            });
        }

        root.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading waitlist...</p></div>';
        const res = await API.adminWaitlist(eventId);

        if (!res.success || !res.data) {
            root.innerHTML = '<div class="empty-state"><p>Failed to load waitlist.</p></div>';
            return;
        }

        const rows = res.data.waitlist || [];
        if (rows.length === 0) {
            root.innerHTML = '<div class="empty-state"><h4>Waitlist is empty</h4><p>No students currently waiting.</p></div>';
            return;
        }

        root.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Event</th>
                        <th>Joined</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td style="font-weight:700;color:var(--primary);">#${r.queue_position}</td>
                            <td>
                                <div style="font-weight:600;color:var(--navy);">${Notify.escapeHtml(r.user_name)}</div>
                                <div style="font-size:0.78rem;color:var(--text-muted);">${Notify.escapeHtml(r.email)}</div>
                            </td>
                            <td>${Notify.escapeHtml(r.event_name)}</td>
                            <td>${new Date(r.registered_at.replace(' ', 'T')).toLocaleString()}</td>
                            <td><span class="badge badge-warning">waiting</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // -------- Reports --------
    async function initReports() {
        const root = document.getElementById('adminReportsRoot');
        if (!root) return;
        if (!await guard()) return;

        const res = await API.adminReports();
        if (!res.success || !res.data) {
            root.innerHTML = '<div class="empty-state"><p>Failed to load reports.</p></div>';
            return;
        }
        const d = res.data;

        const maxCap = Math.max(1, ...(d.popular_events || []).map(e => e.registered));

        root.innerHTML = `
            <div class="reports-grid">
                <div class="report-card">
                    <h3>Popular Events</h3>
                    <div class="report-list">
                        ${(d.popular_events || []).map(e => `
                            <div class="report-row">
                                <div>
                                    <div class="rr-name">${Notify.escapeHtml(e.event_name)}</div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);">${Notify.escapeHtml(e.category)}</div>
                                </div>
                                <div class="rr-val">${e.registered}/${e.capacity}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-card">
                    <h3>Category Distribution</h3>
                    <div class="report-list">
                        ${(d.category_stats || []).map(c => `
                            <div class="report-row">
                                <div class="rr-name">${Notify.escapeHtml(c.category)}</div>
                                <div class="rr-val">${c.total}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-card" style="grid-column:1/-1;">
                    <h3>Seat Utilization</h3>
                    <div class="hbar-list">
                        ${(d.seat_utilization || []).map(u => `
                            <div class="hbar-item">
                                <div class="hbar-label">${Notify.escapeHtml(u.event_name)}</div>
                                <div class="hbar-track"><div class="hbar-fill" style="width:${u.percent}%"></div></div>
                                <div class="hbar-val">${u.percent}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-card" style="grid-column:1/-1;">
                    <h3>Waitlist Statistics</h3>
                    <div class="report-list">
                        ${(d.waitlist_stats || []).length === 0
                            ? '<div class="empty-state" style="padding:20px;"><p>No waitlists currently active.</p></div>'
                            : d.waitlist_stats.map(w => `
                                <div class="report-row">
                                    <div class="rr-name">${Notify.escapeHtml(w.event_name)}</div>
                                    <div class="rr-val">${w.waitlist_size} waiting</div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function setText(id, v) {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    }

    return {
        guard,
        initDashboard,
        initEventsList,
        initCreateEvent,
        initUsers,
        initRegistrations,
        initSeats,
        initWaitlist,
        initReports
    };
})();