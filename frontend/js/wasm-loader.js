/* ============================================================
   EVENTIFY — WASM Loader
   Loads the compiled C core (eventify_core.js + .wasm)
   Provides a JS wrapper `Wasm` with the C function bindings.
   Gracefully falls back to pure-JS if WASM is unavailable.
   ============================================================ */

const Wasm = (function () {
    let module = null;
    let ready = false;
    let fallback = false;

    // Simple in-JS fallback (mirrors the C logic; used only if WASM fails to load)
    const fb = {
        events: new Map(), // event_id -> { capacity, registered, next_seat, regs: Map(user_id->reg), queue: [] }
        init() { this.events.clear(); return true; },
        createEvent(id, capacity) {
            if (this.events.has(id)) return 0;
            this.events.set(id, { capacity, registered: 0, next_seat: 1, regs: new Map(), queue: [] });
            return 1;
        },
        registerUser(event_id, user_id, reg_id) {
            const e = this.events.get(event_id);
            if (!e) return -1;
            for (const r of e.regs.values()) {
                if (r.user_id === user_id && r.status !== 2) return -1;
            }
            let status, seat = -1, queue_position = -1;
            if (e.registered < e.capacity) {
                seat = e.next_seat++;
                e.registered++;
                status = 0;
            } else {
                status = 1;
                e.queue.push({ user_id, reg_id });
                queue_position = e.queue.length;
            }
            e.regs.set(reg_id, { user_id, reg_id, seat, status, queue_position });
            return status === 0 ? seat : 0;
        },
        getQueuePosition(event_id, user_id) {
            const e = this.events.get(event_id);
            if (!e) return -1;
            for (let i = 0; i < e.queue.length; i++) {
                if (e.queue[i].user_id === user_id) return i + 1;
            }
            return -1;
        },
        getQueueSize(event_id) {
            const e = this.events.get(event_id);
            return e ? e.queue.length : -1;
        },
        getRegisteredCount(event_id) {
            const e = this.events.get(event_id);
            return e ? e.registered : -1;
        },
        allocateNextSeat(event_id) {
            const e = this.events.get(event_id);
            if (!e || e.queue.length === 0 || e.registered >= e.capacity) return -1;
            const n = e.queue.shift();
            const seat = e.next_seat++;
            e.registered++;
            for (const r of e.regs.values()) {
                if (r.user_id === n.user_id && r.status === 1) {
                    r.seat = seat; r.status = 0; r.queue_position = -1; break;
                }
            }
            return n.user_id;
        },
        cancelRegistration(event_id, user_id) {
            const e = this.events.get(event_id);
            if (!e) return -1;
            let target = null;
            for (const r of e.regs.values()) {
                if (r.user_id === user_id && r.status !== 2) { target = r; break; }
            }
            if (!target) return -1;

            const wasAllocated = target.status === 0;

            if (target.status === 1) {
                e.queue = e.queue.filter(q => q.user_id !== user_id);
            }

            target.status = 2;
            if (wasAllocated) e.registered--;

            if (wasAllocated && e.queue.length > 0) {
                return this.allocateNextSeat(event_id);
            }
            return 0;
        },
        findEvent(id) { return this.events.has(id) ? 1 : 0; },
        findRegistration(event_id, user_id) {
            const e = this.events.get(event_id);
            if (!e) return 0;
            for (const r of e.regs.values()) {
                if (r.user_id === user_id && r.status !== 2) return r.reg_id;
            }
            return 0;
        }
    };

    async function load() {
        if (ready) return true;
        try {
            // Emscripten MODULARIZE output exposes factory `EventifyCore`
            if (typeof EventifyCore !== 'function') {
                throw new Error('EventifyCore not found — WASM JS not loaded');
            }
            module = await EventifyCore();
            ready = true;
            module._js_init_system();
            console.log('[EVENTIFY] WASM core loaded');
            return true;
        } catch (err) {
            console.warn('[EVENTIFY] WASM unavailable, using JS fallback:', err.message);
            fallback = true;
            fb.init();
            return false;
        }
    }

    function usingFallback() { return fallback; }
    function isReady() { return ready || fallback; }

    // ---------- Public API ----------
    return {
        load,
        isReady,
        usingFallback,

        initSystem() {
            if (fallback) return fb.init() ? 1 : 0;
            return module ? module._js_init_system() : 0;
        },

        createEvent(event_id, name, capacity) {
            if (fallback) return fb.createEvent(event_id, capacity);
            if (!module) return 0;
            // For simplicity we ignore name in C; capacity is what matters
            return module.ccall('js_create_event', 'number',
                ['number', 'string', 'number'],
                [event_id, String(name || ''), capacity]);
        },

        registerUser(event_id, user_id, reg_id) {
            if (fallback) return fb.registerUser(event_id, user_id, reg_id);
            if (!module) return -1;
            return module._js_register_user(event_id, user_id, reg_id);
        },

        getQueuePosition(event_id, user_id) {
            if (fallback) return fb.getQueuePosition(event_id, user_id);
            if (!module) return -1;
            return module._js_get_queue_position(event_id, user_id);
        },

        getQueueSize(event_id) {
            if (fallback) return fb.getQueueSize(event_id);
            if (!module) return -1;
            return module._js_get_queue_size(event_id);
        },

        getRegisteredCount(event_id) {
            if (fallback) return fb.getRegisteredCount(event_id);
            if (!module) return -1;
            return module._js_get_registered_count(event_id);
        },

        allocateNextSeat(event_id) {
            if (fallback) return fb.allocateNextSeat(event_id);
            if (!module) return -1;
            return module._js_allocate_next_seat(event_id);
        },

        cancelRegistration(event_id, user_id) {
            if (fallback) return fb.cancelRegistration(event_id, user_id);
            if (!module) return -1;
            return module._js_cancel_registration(event_id, user_id);
        },

        findEvent(event_id) {
            if (fallback) return fb.findEvent(event_id);
            if (!module) return 0;
            return module._js_find_event(event_id);
        },

        findRegistration(event_id, user_id) {
            if (fallback) return fb.findRegistration(event_id, user_id);
            if (!module) return 0;
            return module._js_find_registration(event_id, user_id);
        }
    };
})();