#include "eventify_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static EventifySystem g_sys;

/* ============================================================
 * Initialize system
 * ============================================================ */
int init_system(void)
{
    g_sys.events_head = NULL;
    g_sys.event_count = 0;
    g_sys.initialized = 1;
    return 1;
}

/* ============================================================
 * Find event by ID (linked list traversal)
 * ============================================================ */
EventNode* find_event(int event_id)
{
    EventNode* cur = g_sys.events_head;
    while (cur) {
        if (cur->event_id == event_id) return cur;
        cur = cur->next;
    }
    return NULL;
}

/* ============================================================
 * Create event (insert into linked list)
 * ============================================================ */
int create_event(int event_id, const char* name, int capacity)
{
    if (!g_sys.initialized) init_system();
    if (capacity <= 0) return 0;
    if (find_event(event_id)) return 0; /* already exists */

    EventNode* e = (EventNode*) calloc(1, sizeof(EventNode));
    if (!e) return 0;

    e->event_id   = event_id;
    e->capacity   = capacity;
    e->registered = 0;
    e->next_seat  = 1;
    e->reg_head   = NULL;
    e->wait_queue.front = NULL;
    e->wait_queue.rear  = NULL;
    e->wait_queue.size  = 0;

    if (name) {
        strncpy(e->event_name, name, MAX_NAME - 1);
        e->event_name[MAX_NAME - 1] = '\0';
    }

    /* Insert at head (order doesn't matter for lookup) */
    e->next = g_sys.events_head;
    g_sys.events_head = e;
    g_sys.event_count++;

    return 1;
}

/* ============================================================
 * Find registration within an event
 * ============================================================ */
int find_registration(int event_id, int user_id)
{
    EventNode* e = find_event(event_id);
    if (!e) return 0;

    RegistrationNode* r = e->reg_head;
    while (r) {
        if (r->user_id == user_id && r->status != 2) return r->reg_id;
        r = r->next;
    }
    return 0;
}

/* ============================================================
 * Enqueue into FIFO waitlist
 * ============================================================ */
static void enqueue(WaitQueue* q, int user_id, int reg_id)
{
    QueueNode* n = (QueueNode*) calloc(1, sizeof(QueueNode));
    if (!n) return;

    n->user_id  = user_id;
    n->reg_id   = reg_id;
    n->next     = NULL;

    if (q->rear == NULL) {
        q->front = q->rear = n;
        n->position = 1;
    } else {
        n->position = q->rear->position + 1;
        q->rear->next = n;
        q->rear = n;
    }
    q->size++;
}

/* ============================================================
 * Dequeue from FIFO waitlist
 * ============================================================ */
static QueueNode* dequeue(WaitQueue* q)
{
    if (q->front == NULL) return NULL;
    QueueNode* n = q->front;
    q->front = n->next;
    if (q->front == NULL) q->rear = NULL;

    /* Recompute positions */
    int pos = 1;
    QueueNode* cur = q->front;
    while (cur) { cur->position = pos++; cur = cur->next; }

    q->size--;
    return n;
}

/* ============================================================
 * Get queue position for user
 * ============================================================ */
int get_queue_position(int event_id, int user_id)
{
    EventNode* e = find_event(event_id);
    if (!e) return -1;

    QueueNode* cur = e->wait_queue.front;
    while (cur) {
        if (cur->user_id == user_id) return cur->position;
        cur = cur->next;
    }
    return -1;
}

int get_queue_size(int event_id)
{
    EventNode* e = find_event(event_id);
    return e ? e->wait_queue.size : -1;
}

int get_registered_count(int event_id)
{
    EventNode* e = find_event(event_id);
    return e ? e->registered : -1;
}

/* ============================================================
 * Allocate next seat — pop from queue, assign seat
 * Returns user_id of promoted student, or -1 if none
 * ============================================================ */
int allocate_next_seat(int event_id)
{
    EventNode* e = find_event(event_id);
    if (!e) return -1;
    if (e->registered >= e->capacity) return -1;
    if (e->wait_queue.size == 0) return -1;

    QueueNode* n = dequeue(&e->wait_queue);
    if (!n) return -1;

    int seat = e->next_seat++;
    e->registered++;

    /* Update registration node status */
    RegistrationNode* r = e->reg_head;
    while (r) {
        if (r->user_id == n->user_id && r->status == 1) {
            r->seat_number    = seat;
            r->status         = 0;
            r->queue_position = -1;
            break;
        }
        r = r->next;
    }

    int uid = n->user_id;
    free(n);
    return uid;
}

/* ============================================================
 * Register user — allocate OR waitlist
 * Returns:
 *   >0  seat number if allocated
 *    0  if enqueued (waitlist)
 *   -1  if error (duplicate / event not found)
 * ============================================================ */
int register_user(int event_id, int user_id, int reg_id)
{
    EventNode* e = find_event(event_id);
    if (!e) return -1;

    /* Duplicate check */
    RegistrationNode* cur = e->reg_head;
    while (cur) {
        if (cur->user_id == user_id && cur->status != 2) return -1;
        cur = cur->next;
    }

    RegistrationNode* r = (RegistrationNode*) calloc(1, sizeof(RegistrationNode));
    if (!r) return -1;

    r->reg_id  = reg_id;
    r->user_id = user_id;

    if (e->registered < e->capacity) {
        /* Allocate seat */
        int seat = e->next_seat++;
        r->seat_number    = seat;
        r->status         = 0;
        r->queue_position = -1;
        e->registered++;
    } else {
        /* Waitlist */
        r->seat_number    = -1;
        r->status         = 1;
        enqueue(&e->wait_queue, user_id, reg_id);
        r->queue_position = get_queue_position(event_id, user_id);
    }

    /* Insert at head of registration list */
    r->next = e->reg_head;
    e->reg_head = r;

    return (r->status == 0) ? r->seat_number : 0;
}

/* ============================================================
 * Cancel registration — promote FIFO next if applicable
 * Returns promoted user_id (>0) or 0 if none promoted, -1 error
 * ============================================================ */
int cancel_registration(int event_id, int user_id)
{
    EventNode* e = find_event(event_id);
    if (!e) return -1;

    RegistrationNode* r = e->reg_head;
    while (r) {
        if (r->user_id == user_id && r->status != 2) break;
        r = r->next;
    }
    if (!r) return -1;

    int was_allocated = (r->status == 0);

    /* Remove from queue if waitlisted */
    if (r->status == 1) {
        QueueNode* prev = NULL;
        QueueNode* cur  = e->wait_queue.front;
        while (cur) {
            if (cur->user_id == user_id) {
                if (prev) prev->next = cur->next;
                else       e->wait_queue.front = cur->next;
                if (cur == e->wait_queue.rear) e->wait_queue.rear = prev;
                e->wait_queue.size--;
                free(cur);
                break;
            }
            prev = cur;
            cur  = cur->next;
        }
        /* Recompute positions */
        int pos = 1;
        cur = e->wait_queue.front;
        while (cur) { cur->position = pos++; cur = cur->next; }
    }

    r->status = 2;
    if (was_allocated) {
        e->registered--;
    }

    /* Promote from FIFO if seat freed */
    int promoted_user = 0;
    if (was_allocated && e->wait_queue.size > 0) {
        promoted_user = allocate_next_seat(event_id);
    }

    return promoted_user;
}