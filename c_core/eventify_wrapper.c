#include "eventify_core.h"
#include <emscripten.h>

/* ============================================================
 * Emscripten-exported wrappers
 * All functions are prefixed with js_ for JS clarity
 * ============================================================ */

EMSCRIPTEN_KEEPALIVE
int js_init_system(void) {
    return init_system();
}

EMSCRIPTEN_KEEPALIVE
int js_create_event(int event_id, const char* name, int capacity) {
    return create_event(event_id, name, capacity);
}

EMSCRIPTEN_KEEPALIVE
int js_register_user(int event_id, int user_id, int reg_id) {
    return register_user(event_id, user_id, reg_id);
}

EMSCRIPTEN_KEEPALIVE
int js_get_queue_position(int event_id, int user_id) {
    return get_queue_position(event_id, user_id);
}

EMSCRIPTEN_KEEPALIVE
int js_get_queue_size(int event_id) {
    return get_queue_size(event_id);
}

EMSCRIPTEN_KEEPALIVE
int js_get_registered_count(int event_id) {
    return get_registered_count(event_id);
}

EMSCRIPTEN_KEEPALIVE
int js_allocate_next_seat(int event_id) {
    return allocate_next_seat(event_id);
}

EMSCRIPTEN_KEEPALIVE
int js_cancel_registration(int event_id, int user_id) {
    return cancel_registration(event_id, user_id);
}

EMSCRIPTEN_KEEPALIVE
int js_find_event(int event_id) {
    return find_event(event_id) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
int js_find_registration(int event_id, int user_id) {
    return find_registration(event_id, user_id);
}