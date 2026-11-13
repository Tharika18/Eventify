/* ============================================================
   EVENTIFY — Events Listing, Filters, Details, Register
   ============================================================ */

const Events = (function () {

    const CATEGORY_ICON = {
        'AI & Technology': 'cpu',
        'Hackathons': 'code',
        'Workshops': 'wrench',
        'Career': 'briefcase',
        'Cultural': 'music',
        'Sports': 'trophy',
        'Seminars': 'mic',
        'Academic': 'graduation-cap'
    };

    function icon(name, size = 18) {
        const paths = {
            cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
            code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
            wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
            briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
            trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
            mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
            'graduation-cap': '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>',
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
            clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
            map: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
            users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'
        };

        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
    }

    function formatDate(d) {
        if (!d) return '';
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatTime(t) {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    function statusClass(event) {
        if (event.available <= 0) return 'full';

        const pct = event.registered / Math.max(1, event.capacity);

        if (pct >= 0.8) return 'filling';

        return 'open';
    }

    function statusLabel(event) {
        if (event.available <= 0) return 'Full';

        const pct = event.registered / Math.max(1, event.capacity);

        if (pct >= 0.8) return 'Filling Fast';

        return 'Open';
    }

    /*
     * eventCardHTML
     *
     * opts.registeredEventIds:
     * Array/Set containing event IDs already registered
     * by the currently logged-in student.
     */
    function eventCardHTML(event, opts = {}) {

        const pct = Math.min(
            100,
            Math.round(
                (event.registered / Math.max(1, event.capacity)) * 100
            )
        );

        const status = statusClass(event);

        const imageSrc = event.image
            ? `images/${event.image}`
            : '';

        const imageBlock = event.image
            ? `<img src="${imageSrc}"
                    alt="${Notify.escapeHtml(event.event_name)}"
                    onerror="this.style.display='none';this.parentNode.querySelector('.placeholder').style.display='flex';">
               <div class="placeholder" style="display:none;">
                    ${Notify.escapeHtml(event.category)}
               </div>`
            : `<div class="placeholder">
                    ${Notify.escapeHtml(event.category)}
               </div>`;

        const back = opts.showBack
            ? `<a href="events.html" class="back-link">
                    ${icon('arrowLeft', 16)} Back to Events
               </a>`
            : '';

        // -----------------------------------------------------
        // CHECK WHETHER CURRENT USER ALREADY REGISTERED
        // -----------------------------------------------------

        const registeredIds = opts.registeredEventIds || new Set();

        const isRegistered =
            registeredIds instanceof Set
                ? registeredIds.has(Number(event.event_id))
                : Array.from(registeredIds).includes(Number(event.event_id));

        let actionButton = '';

        if (isRegistered) {

            actionButton = `
                <button
                    class="btn btn-secondary"
                    disabled
                    style="cursor:not-allowed;opacity:0.75;">
                    ✓ Registered
                </button>
            `;

        } else {

            actionButton = `
                <button
                    class="btn btn-primary"
                    data-register-event="${event.event_id}">
                    ${event.available > 0 ? 'Register' : 'Join Waitlist'}
                </button>
            `;
        }

        return `
            ${back}

            <article class="event-card fade-in">

                <div class="event-image">
                    ${imageBlock}

                    <span class="event-category-badge">
                        ${Notify.escapeHtml(event.category)}
                    </span>

                    <span class="event-status-badge ${status}">
                        ${statusLabel(event)}
                    </span>
                </div>

                <div class="event-body">

                    <h3 class="event-title">
                        ${Notify.escapeHtml(event.event_name)}
                    </h3>

                    <div class="event-meta">

                        <div class="event-meta-item">
                            ${icon('calendar', 15)}
                            ${formatDate(event.event_date)}
                        </div>

                        <div class="event-meta-item">
                            ${icon('clock', 15)}
                            ${formatTime(event.event_time)}
                        </div>

                        <div class="event-meta-item">
                            ${icon('map', 15)}
                            ${Notify.escapeHtml(event.venue)}
                        </div>

                        <div class="event-meta-item">
                            ${icon('users', 15)}
                            ${event.registered}/${event.capacity} registered
                        </div>

                    </div>

                    <div class="event-progress">

                        <div class="progress-bar">
                            <div
                                class="progress-fill ${status === 'full'
                                    ? 'full'
                                    : status === 'filling'
                                        ? 'warn'
                                        : ''}"
                                style="width:${pct}%">
                            </div>
                        </div>

                        <div class="progress-text">
                            <span>${event.available} seats left</span>
                            <span>${pct}% full</span>
                        </div>

                    </div>

                    <div class="event-actions">

                        <a
                            href="event-details.html?id=${event.event_id}"
                            class="btn btn-secondary">
                            View Details
                        </a>

                        ${actionButton}

                    </div>

                </div>

            </article>
        `;
    }


    // =========================================================
    // GET CURRENT USER REGISTRATION IDS
    // =========================================================

    async function getRegisteredEventIds() {

        const registeredEventIds = new Set();

        try {

            const session = await Auth.getSession();

            // Not logged in → no registered events to mark
            if (!session) {
                return registeredEventIds;
            }

            const res = await API.myRegistrations();

            if (!res || !res.success || !res.data) {
                return registeredEventIds;
            }

            /*
             * Support both possible API response formats:
             *
             * data.registrations
             * data.items
             */

            const registrations =
                res.data.registrations ||
                res.data.items ||
                [];

            registrations.forEach(reg => {

                /*
                 * Only active registrations count here.
                 *
                 * Cancelled registration should allow
                 * the student to register again.
                 */

                if (
                    reg.status === 'allocated' ||
                    reg.status === 'waitlist'
                ) {

                    const eventId = Number(
                        reg.event_id ??
                        reg.eventId ??
                        reg.event?.event_id
                    );

                    if (eventId) {
                        registeredEventIds.add(eventId);
                    }
                }
            });

        } catch (error) {

            console.error(
                'Unable to load registered events:',
                error
            );
        }

        return registeredEventIds;
    }


    // =========================================================
    // EVENTS LISTING PAGE
    // =========================================================

    async function initEventsPage() {

        const grid = document.getElementById('eventsGrid');

        if (!grid) return;

        const searchInput =
            document.getElementById('searchInput');

        const categorySelect =
            document.getElementById('categoryFilter');

        const dateFilter =
            document.getElementById('dateFilter');

        const availFilter =
            document.getElementById('availabilityFilter');


        // Populate categories
        const categories = [
            'AI & Technology',
            'Hackathons',
            'Workshops',
            'Career',
            'Cultural',
            'Sports',
            'Seminars',
            'Academic'
        ];

        if (categorySelect) {

            categories.forEach(c => {

                const opt =
                    document.createElement('option');

                opt.value = c;
                opt.textContent = c;

                categorySelect.appendChild(opt);
            });
        }


        async function load() {

            grid.innerHTML = `
                <div class="loading-state" style="grid-column:1/-1;">
                    <div class="spinner"></div>
                    <p>Loading events...</p>
                </div>
            `;


            const filters = {

                search: searchInput
                    ? searchInput.value.trim()
                    : '',

                category: categorySelect
                    ? categorySelect.value
                    : '',

                availability: availFilter
                    ? availFilter.value
                    : ''
            };


            // Load events
            const res =
                await API.listEvents(filters);


            if (
                !res.success ||
                !res.data ||
                !res.data.events
            ) {

                grid.innerHTML = `
                    <div class="empty-state"
                         style="grid-column:1/-1;">

                        <div class="empty-icon">
                            ${icon('search', 28)}
                        </div>

                        <h4>No events found</h4>

                        <p>
                            Try adjusting your search or filters.
                        </p>

                    </div>
                `;

                return;
            }


            let events = res.data.events;


            // -------------------------------------------------
            // LOAD USER REGISTRATIONS
            // -------------------------------------------------

            const registeredEventIds =
                await getRegisteredEventIds();


            // -------------------------------------------------
            // DATE FILTER
            // -------------------------------------------------

            if (dateFilter && dateFilter.value) {

                const now = new Date();

                const today =
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    );


                events = events.filter(e => {

                    const d =
                        new Date(
                            e.event_date + 'T00:00:00'
                        );


                    if (dateFilter.value === 'today') {

                        return d.getTime() === today.getTime();

                    } else if (dateFilter.value === 'week') {

                        const weekEnd =
                            new Date(today);

                        weekEnd.setDate(
                            today.getDate() + 7
                        );

                        return d >= today && d <= weekEnd;

                    } else if (dateFilter.value === 'month') {

                        const monthEnd =
                            new Date(today);

                        monthEnd.setMonth(
                            today.getMonth() + 1
                        );

                        return d >= today && d <= monthEnd;
                    }

                    return true;
                });
            }


            if (events.length === 0) {

                grid.innerHTML = `
                    <div class="empty-state"
                         style="grid-column:1/-1;">

                        <div class="empty-icon">
                            ${icon('search', 28)}
                        </div>

                        <h4>No events match your filters</h4>

                        <p>
                            Try clearing filters or searching something else.
                        </p>

                    </div>
                `;

                return;
            }


            // -------------------------------------------------
            // RENDER EVENTS WITH REGISTRATION STATUS
            // -------------------------------------------------

            grid.innerHTML = events
                .map(e =>
                    eventCardHTML(e, {
                        registeredEventIds
                    })
                )
                .join('');


            // -------------------------------------------------
            // REGISTER BUTTONS
            // -------------------------------------------------

            grid
                .querySelectorAll('[data-register-event]')
                .forEach(btn => {

                    btn.addEventListener(
                        'click',
                        () => {

                            quickRegister(
                                parseInt(
                                    btn.getAttribute(
                                        'data-register-event'
                                    )
                                )
                            );

                        }
                    );
                });
        }


        // -----------------------------------------------------
        // SEARCH DEBOUNCE
        // -----------------------------------------------------

        let t = null;

        if (searchInput) {

            searchInput.addEventListener(
                'input',
                () => {

                    clearTimeout(t);

                    t = setTimeout(
                        load,
                        300
                    );
                }
            );
        }


        // -----------------------------------------------------
        // FILTERS
        // -----------------------------------------------------

        [
            categorySelect,
            dateFilter,
            availFilter
        ].forEach(el => {

            if (el) {
                el.addEventListener(
                    'change',
                    load
                );
            }
        });


        await load();
    }


    // =========================================================
    // QUICK REGISTER
    // =========================================================

    async function quickRegister(eventId) {

        const session =
            await Auth.getSession();


        if (!session) {

            Notify.warning(
                'Please log in to register'
            );

            setTimeout(
                () => {
                    window.location.href =
                        'login.html';
                },
                800
            );

            return;
        }


        const ok =
            await Notify.confirm({

                title:
                    'Register for this event?',

                message:
                    'We will allocate a seat or add you to the FIFO waitlist.',

                confirmText:
                    'Yes, register'
            });


        if (!ok) return;


        Notify.showLoading(
            'Registering...'
        );


        const res =
            await API.registerForEvent(
                eventId
            );


        Notify.hideLoading();


        if (!res.success) {

            Notify.error(
                res.message ||
                'Registration failed'
            );

            return;
        }


        const d = res.data;


        if (d.status === 'allocated') {

            Notify.success(
                `Seat #${d.seat_number} allocated!`
            );

        } else {

            Notify.info(
                `Added to waitlist. Position: #${d.queue_position}`
            );
        }


        setTimeout(
            () => {
                window.location.href =
                    'my-registrations.html';
            },
            1000
        );
    }


    // =========================================================
    // EVENT DETAILS PAGE
    // =========================================================

    async function initDetailPage() {

        const root =
            document.getElementById(
                'eventDetail'
            );

        if (!root) return;


        const params =
            new URLSearchParams(
                window.location.search
            );

        const eventId =
            parseInt(
                params.get('id') || '0'
            );


        if (!eventId) {

            root.innerHTML = `
                <div class="empty-state">

                    <h4>Event not specified</h4>

                    <a
                        class="btn btn-primary"
                        href="events.html">
                        Browse Events
                    </a>

                </div>
            `;

            return;
        }


        root.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading event...</p>
            </div>
        `;


        const res =
            await API.getEvent(
                eventId
            );


        if (
            !res.success ||
            !res.data ||
            !res.data.event
        ) {

            root.innerHTML = `
                <div class="empty-state">

                    <h4>Event not found</h4>

                    <a
                        class="btn btn-primary"
                        href="events.html">
                        Back to Events
                    </a>

                </div>
            `;

            return;
        }


        const e =
            res.data.event;


        const imageSrc =
            e.image
                ? `images/${e.image}`
                : '';


        // -----------------------------------------------------
        // CHECK IF THIS EVENT IS ALREADY REGISTERED
        // -----------------------------------------------------

        const registeredEventIds =
            await getRegisteredEventIds();


        const isRegistered =
            registeredEventIds.has(
                Number(e.event_id)
            );


        let detailButtonText =
            e.available > 0
                ? 'Register Now'
                : 'Join Waitlist';


        if (isRegistered) {
            detailButtonText =
                '✓ Registered';
        }


        root.innerHTML = `

            <a
                href="events.html"
                class="back-link">
                ${icon('arrowLeft', 16)}
                Back to Events
            </a>


            <div class="detail-hero">

                ${imageSrc
                    ? `<img
                            src="${imageSrc}"
                            alt=""
                            onerror="this.style.display='none'">`
                    : ''}

                <div class="detail-hero-content">

                    <span class="badge badge-primary">
                        ${Notify.escapeHtml(e.category)}
                    </span>

                    <h1>
                        ${Notify.escapeHtml(e.event_name)}
                    </h1>

                </div>

            </div>


            <div class="detail-layout">

                <div>

                    <div class="detail-section">

                        <h3>
                            About this event
                        </h3>

                        <p
                            style="color:var(--text);white-space:pre-line;">
                            ${Notify.escapeHtml(
                                e.description ||
                                'No description provided.'
                            )}
                        </p>

                    </div>


                    <div class="detail-section">

                        <h3>
                            Event details
                        </h3>

                        <div class="detail-info-grid">

                            <div class="detail-info-item">

                                <div class="di-icon">
                                    ${icon('calendar', 20)}
                                </div>

                                <div>
                                    <div class="di-label">
                                        Date
                                    </div>

                                    <div class="di-value">
                                        ${formatDate(e.event_date)}
                                    </div>
                                </div>

                            </div>


                            <div class="detail-info-item">

                                <div class="di-icon">
                                    ${icon('clock', 20)}
                                </div>

                                <div>
                                    <div class="di-label">
                                        Time
                                    </div>

                                    <div class="di-value">
                                        ${formatTime(e.event_time)}
                                    </div>
                                </div>

                            </div>


                            <div class="detail-info-item">

                                <div class="di-icon">
                                    ${icon('map', 20)}
                                </div>

                                <div>
                                    <div class="di-label">
                                        Venue
                                    </div>

                                    <div class="di-value">
                                        ${Notify.escapeHtml(e.venue)}
                                    </div>
                                </div>

                            </div>


                            <div class="detail-info-item">

                                <div class="di-icon">
                                    ${icon('users', 20)}
                                </div>

                                <div>
                                    <div class="di-label">
                                        Capacity
                                    </div>

                                    <div class="di-value">
                                        ${e.registered} / ${e.capacity}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <aside>

                    <div class="register-card">

                        <div class="price-tag">
                            ${e.available > 0
                                ? 'Open'
                                : 'Waitlist'}
                        </div>

                        <div class="avail-info">
                            ${e.available}
                            of
                            ${e.capacity}
                            seats available
                        </div>


                        <div class="info-row">
                            <span class="k">
                                Category
                            </span>

                            <span class="v">
                                ${Notify.escapeHtml(e.category)}
                            </span>
                        </div>


                        <div class="info-row">
                            <span class="k">
                                Registered
                            </span>

                            <span class="v">
                                ${e.registered}
                            </span>
                        </div>


                        <div class="info-row">
                            <span class="k">
                                Available
                            </span>

                            <span class="v">
                                ${e.available}
                            </span>
                        </div>


                        <div class="info-row">
                            <span class="k">
                                Organizer
                            </span>

                            <span class="v">
                                ${Notify.escapeHtml(
                                    e.created_by_name ||
                                    'EVENTIFY'
                                )}
                            </span>
                        </div>


                        <button
                            class="btn ${isRegistered
                                ? 'btn-secondary'
                                : 'btn-primary'} btn-block mt-6"
                            id="registerBtn"
                            ${isRegistered
                                ? 'disabled'
                                : ''}>

                            ${detailButtonText}

                        </button>


                        <div id="registrationResult"></div>

                    </div>

                </aside>

            </div>
        `;


        // -----------------------------------------------------
        // REGISTER BUTTON
        // -----------------------------------------------------

        const registerBtn =
            document.getElementById(
                'registerBtn'
            );


        if (!registerBtn || isRegistered) {
            return;
        }


        registerBtn.addEventListener(
            'click',
            async () => {

                const session =
                    await Auth.getSession();


                if (!session) {

                    Notify.warning(
                        'Please log in to register'
                    );

                    setTimeout(
                        () => {
                            window.location.href =
                                'login.html';
                        },
                        800
                    );

                    return;
                }


                const ok =
                    await Notify.confirm({

                        title:
                            'Confirm registration',

                        message:
                            'Register for "' +
                            e.event_name +
                            '"?',

                        confirmText:
                            'Register'
                    });


                if (!ok) return;


                Notify.showLoading(
                    'Processing...'
                );


                const r =
                    await API.registerForEvent(
                        e.event_id
                    );


                Notify.hideLoading();


                const box =
                    document.getElementById(
                        'registrationResult'
                    );


                if (!r.success) {

                    Notify.error(
                        r.message ||
                        'Registration failed'
                    );

                    box.innerHTML = `
                        <div
                            class="registration-result"
                            style="
                                background:#FEE2E2;
                                border:1px solid #FCA5A5;
                                color:#991B1B;
                            ">

                            <strong>
                                Error
                            </strong>

                            ${Notify.escapeHtml(
                                r.message
                            )}

                        </div>
                    `;

                    return;
                }


                const d =
                    r.data;


                if (d.status === 'allocated') {

                    Notify.success(
                        'Seat allocated: #' +
                        d.seat_number
                    );


                    box.innerHTML = `
                        <div class="registration-result allocated">

                            <strong>
                                Seat Allocated ✓
                            </strong>

                            Your seat number is
                            <b>${d.seat_number}</b>.

                            See
                            <a href="my-registrations.html">
                                My Registrations
                            </a>.

                        </div>
                    `;

                } else {

                    Notify.info(
                        'Added to waitlist: #' +
                        d.queue_position
                    );


                    box.innerHTML = `
                        <div class="registration-result waitlist">

                            <strong>
                                Added to Waitlist
                            </strong>

                            You are
                            <b>#${d.queue_position}</b>
                            in the FIFO queue.

                            If a seat frees up,
                            you will be promoted automatically.

                        </div>
                    `;
                }
            }
        );
    }


    // =========================================================
    // GLOBAL REGISTER BUTTONS
    // =========================================================

    function wireGlobalRegisterButtons() {

        document
            .querySelectorAll(
                '[data-register-event]'
            )
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        quickRegister(
                            parseInt(
                                btn.getAttribute(
                                    'data-register-event'
                                )
                            )
                        );

                    }
                );
            });
    }


    // =========================================================
    // HOME PAGE
    // =========================================================

    async function initHomePage() {

        const featuredGrid =
            document.getElementById(
                'featuredEvents'
            );


        if (featuredGrid) {

            const res =
                await API.listEvents();


            if (
                res.success &&
                res.data &&
                res.data.events
            ) {

                const featured =
                    res.data.events.slice(0, 3);


                // Get current student's registrations
                const registeredEventIds =
                    await getRegisteredEventIds();


                featuredGrid.innerHTML =
                    featured
                        .map(e =>
                            eventCardHTML(e, {
                                registeredEventIds
                            })
                        )
                        .join('');


                /*
                 * Only unregistered cards contain
                 * [data-register-event].
                 */
                wireGlobalRegisterButtons();
            }
        }


        // Category chips
        document
            .querySelectorAll(
                '[data-category]'
            )
            .forEach(chip => {

                chip.addEventListener(
                    'click',
                    () => {

                        const cat =
                            chip.getAttribute(
                                'data-category'
                            );

                        window.location.href =
                            'events.html?category=' +
                            encodeURIComponent(cat);
                    }
                );
            });


        // Stats counters
        const statRes =
            await API.listEvents();


        if (
            statRes.success &&
            statRes.data
        ) {

            const events =
                statRes.data.events || [];


            const totalEvents =
                events.length;


            const totalCapacity =
                events.reduce(
                    (s, e) =>
                        s + Number(e.capacity || 0),
                    0
                );


            const totalRegistered =
                events.reduce(
                    (s, e) =>
                        s + Number(e.registered || 0),
                    0
                );


            setCounter(
                'statEvents',
                totalEvents
            );

            setCounter(
                'statCapacity',
                totalCapacity
            );

            setCounter(
                'statRegistered',
                totalRegistered
            );

            setCounter(
                'statCategories',
                new Set(
                    events.map(
                        e => e.category
                    )
                ).size
            );
        }


        // Home search
        const homeSearch =
            document.getElementById(
                'homeSearch'
            );


        if (homeSearch) {

            const form =
                homeSearch.closest('form') ||
                homeSearch;


            const go = () => {

                const q =
                    homeSearch.value.trim();


                window.location.href =
                    'events.html' +
                    (
                        q
                            ? '?search=' +
                              encodeURIComponent(q)
                            : ''
                    );
            };


            homeSearch.addEventListener(
                'keypress',
                e => {

                    if (e.key === 'Enter') {

                        e.preventDefault();

                        go();
                    }
                }
            );


            const btn =
                homeSearch.parentElement
                    .querySelector('button');


            if (btn) {
                btn.addEventListener(
                    'click',
                    go
                );
            }
        }
    }


    // =========================================================
    // COUNTER
    // =========================================================

    function setCounter(id, target) {

        const el =
            document.getElementById(id);


        if (!el) return;


        let cur = 0;


        const step =
            Math.max(
                1,
                Math.ceil(target / 40)
            );


        const tick = () => {

            cur += step;


            if (cur >= target) {

                el.textContent =
                    target;

                return;
            }


            el.textContent =
                cur;


            requestAnimationFrame(
                tick
            );
        };


        tick();
    }


    // =========================================================
    // URL FILTERS
    // =========================================================

    function prefillFiltersFromURL() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const cat =
            params.get('category');


        const search =
            params.get('search');


        const searchInput =
            document.getElementById(
                'searchInput'
            );


        const categorySelect =
            document.getElementById(
                'categoryFilter'
            );


        if (
            search &&
            searchInput
        ) {

            searchInput.value =
                search;
        }


        if (
            cat &&
            categorySelect
        ) {

            setTimeout(
                () => {

                    categorySelect.value =
                        cat;

                },
                200
            );
        }
    }


    // =========================================================
    // PUBLIC API
    // =========================================================

    return {

        initHomePage,

        initEventsPage,

        initDetailPage,

        prefillFiltersFromURL,

        eventCardHTML,

        icon,

        formatDate,

        formatTime,

        wireGlobalRegisterButtons
    };

})();