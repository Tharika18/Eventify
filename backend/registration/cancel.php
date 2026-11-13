<?php
/**
 * EVENTIFY — Cancel Registration
 * POST { reg_id }
 * Logic:
 *   1. Verify user owns this registration
 *   2. Mark cancelled
 *   3. If it was allocated, decrement event.registered
 *   4. Find FIRST waitlisted user (by queue_position)
 *   5. Promote them -> allocated, assign the freed seat
 *   6. Recompute queue positions
 *   7. Insert queue_log rows
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$user = requireAuth();
$input = getJSONInput();
$reg_id = (int) ($input['reg_id'] ?? 0);

if ($reg_id <= 0) {
    sendJSON(false, 'Invalid registration ID');
}

try {
    $db = getDB();
    $db->beginTransaction();

    // Fetch registration + lock
    $stmt = $db->prepare(
        'SELECT reg_id, user_id, event_id, seat_number, status
         FROM registrations WHERE reg_id = ? FOR UPDATE'
    );
    $stmt->execute([$reg_id]);
    $reg = $stmt->fetch();

    if (!$reg) {
        $db->rollBack();
        sendJSON(false, 'Registration not found', null, 404);
    }

    // Authorization: owner or admin
    if ((int)$reg['user_id'] !== $user['user_id'] && $user['role'] !== 'admin') {
        $db->rollBack();
        sendJSON(false, 'You cannot cancel this registration', null, 403);
    }

    if ($reg['status'] === 'cancelled') {
        $db->rollBack();
        sendJSON(false, 'Registration is already cancelled');
    }

    $event_id   = (int) $reg['event_id'];
    $was_alloc  = ($reg['status'] === 'allocated');
    $freed_seat = $was_alloc ? (int) $reg['seat_number'] : null;

    // Mark cancelled
    $upd = $db->prepare(
        'UPDATE registrations SET status = "cancelled", queue_position = NULL
         WHERE reg_id = ?'
    );
    $upd->execute([$reg_id]);

    // Decrement event.registered if seat was held
    if ($was_alloc) {
        $db->prepare(
            'UPDATE events SET registered = GREATEST(registered - 1, 0)
             WHERE event_id = ?'
        )->execute([$event_id]);
    }

    // Log cancel
    $db->prepare(
        'INSERT INTO queue_log (event_id, user_id, action, position_at_action)
         VALUES (?, ?, "cancel", ?)'
    )->execute([$event_id, $reg['user_id'], $freed_seat]);

    // Promote FIRST waitlisted user if a seat was freed
    $promoted = null;

    if ($was_alloc) {
        $w = $db->prepare(
            'SELECT reg_id, user_id FROM registrations
             WHERE event_id = ? AND status = "waitlist"
             ORDER BY queue_position ASC LIMIT 1
             FOR UPDATE'
        );
        $w->execute([$event_id]);
        $first = $w->fetch();

        if ($first) {
            $db->prepare(
                'UPDATE registrations
                 SET status = "allocated", seat_number = ?, queue_position = NULL
                 WHERE reg_id = ?'
            )->execute([$freed_seat, $first['reg_id']]);

            $db->prepare(
                'UPDATE events SET registered = registered + 1 WHERE event_id = ?'
            )->execute([$event_id]);

            $db->prepare(
                'INSERT INTO queue_log (event_id, user_id, action, position_at_action)
                 VALUES (?, ?, "promote", ?)'
            )->execute([$event_id, $first['user_id'], $freed_seat]);

            $promoted = [
                'user_id'     => (int) $first['user_id'],
                'seat_number' => $freed_seat,
            ];
        }
    }

    // Recompute remaining queue positions
    $q = $db->prepare(
        'SELECT reg_id FROM registrations
         WHERE event_id = ? AND status = "waitlist"
         ORDER BY queue_position ASC, registered_at ASC'
    );
    $q->execute([$event_id]);
    $rows = $q->fetchAll();

    $pos = 1;
    $updPos = $db->prepare('UPDATE registrations SET queue_position = ? WHERE reg_id = ?');
    foreach ($rows as $row) {
        $updPos->execute([$pos++, $row['reg_id']]);
    }

    $db->commit();

    sendJSON(true, 'Registration cancelled', [
        'promoted' => $promoted,
    ]);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('cancel error: ' . $e->getMessage());
    sendJSON(false, 'Cancellation failed', null, 500);
}