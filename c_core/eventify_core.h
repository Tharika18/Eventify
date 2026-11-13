#ifndef EVENTIFY_CORE_H
#define EVENTIFY_CORE_H

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_EVENTS 500
#define MAX_NAME 200
#define MAX_REG_PER_EVENT 1000

/* -------- Linked List: Registrations -------- */
typedef struct RegistrationNode {
    int reg_id;
    int user_id;
    int seat_number;      /* -1 if waitlist */
    int status;           /* 0=allocated, 1=waitlist, 2=cancelled */
    int queue_position;   /* -1 if allocated */
    struct RegistrationNode* next;
} RegistrationNode;

/* -------- FIFO Queue: Waitlist -------- */
typedef struct QueueNode {
    int user_id;
    int reg_id;
    int position;
    struct QueueNode* next;
} QueueNode;

typedef struct {
    QueueNode* front;
    QueueNode* rear;
    int size;
} WaitQueue;

/* -------- Linked List: Events -------- */
typedef struct EventNode {
    int event_id;
    char event_name[MAX_NAME];
    int capacity;
    int registered;
    int next_seat;                    /* next seat number to allocate */
    RegistrationNode* reg_head;       /* linked list of registrations */
    WaitQueue wait_queue;             /* FIFO waitlist */
    struct EventNode* next;
} EventNode;

/* -------- System -------- */
typedef struct {
    EventNode* events_head;
    int event_count;
    int initialized;
} EventifySystem;

/* -------- API -------- */
int  init_system(void);
EventNode* find_event(int event_id);
int  create_event(int event_id, const char* name, int capacity);
int  register_user(int event_id, int user_id, int reg_id);
int  get_queue_position(int event_id, int user_id);
int  get_queue_size(int event_id);
int  get_registered_count(int event_id);
int  allocate_next_seat(int event_id);
int  cancel_registration(int event_id, int user_id);
int  find_registration(int event_id, int user_id);

#ifdef __cplusplus
}
#endif

#endif /* EVENTIFY_CORE_H */