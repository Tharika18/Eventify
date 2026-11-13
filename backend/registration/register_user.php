<?php
/**
 * EVENTIFY — Register User for Event
 * POST { event_id }
 * Logic:
 *   1. Verify login
 *   2. Check event exists
 *   3. Check duplicate
 *   4. If seat available -> allocate (next free seat number)
 *   5. Else -> waitlist (FIFO position = existing waitlist count + 1)
 *   6. Insert registration row
 *   7. Insert queue_log row
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$user = requireAuth();
$input = getJSONInput();
$event_id = (int) ($input['event_id'] ?? 0);

if ($event_id <= 0) {
    sendJSON(false, 'Invalid event ID');
}

try {
    $db = getDB();
    $db->beginTransaction();

    // Lock event row for consistency
    $stmt = $db->prepare(
        'SELECT event_id, capacity, registered FROM events
         WHERE event_id = ? FOR UPDATE'
    );
    $stmt->execute([$event_id]);
    $event = $stmt->fetch();

    if (!$event) {
        $db->rollBack();
        sendJSON(false, 'Event not found', null, 404);
    }

    // Duplicate check (non-cancelled)
    $dup = $db->prepare(
        'SELECT reg_id FROM registrations
         WHERE user_id = ? AND event_id = ? AND status != "cancelled"
         LIMIT 1'
    );
    $dup->execute([$user['user_id'], $event_id]);
    if ($dup->fetch()) {
        $db->rollBack();
        sendJSON(false, 'You are already registered for this event');
    }

    $capacity   = (int) $event['capacity'];
    $registered = (int) $event['registered'];

    if ($registered < $capacity) {
        // -------- ALLOCATE --------
        // Find next available seat number
        $seatStmt = $db->prepare(
            'SELECT seat_number FROM registrations
             WHERE event_id = ? AND status = "allocated"
             ORDER BY seat_number ASC'
        );
        $seatStmt->execute([$event_id]);
        $used = array_map('intval', array_column($seatStmt->fetchAll(), 'seat_number'));

        $seat = 1;
        while (in_array($seat, $used, true)) $seat++;

        $ins = $db->prepare(
            'INSERT INTO registrations
             (user_id, event_id, priority, seat_number, status, queue_position)
             VALUES (?, ?, 0, ?, "allocated", NULL)'
        );
        $ins->execute([$user['user_id'], $event_id, $seat]);
        $reg_id = (int) $db->lastInsertId();

        $upd = $db->prepare(
            'UPDATE events SET registered = registered + 1 WHERE event_id = ?'
        );
        $upd->execute([$event_id]);

        $log = $db->prepare(
            'INSERT INTO queue_log (event_id, user_id, action, position_at_action)
             VALUES (?, ?, "dequeue", ?)'
        );
        $log->execute([$event_id, $user['user_id'], $seat]);

        $db->commit();

        sendJSON(true, 'Seat allocated successfully', [
            'status'         => 'allocated',
            'seat_number'    => $seat,
            'reg_id'         => $reg_id,
            'queue_position' => null,
        ]);
    } else {
        // -------- WAITLIST --------
        $qStmt = $db->prepare(
            'SELECT COUNT(*) AS c FROM registrations
             WHERE event_id = ? AND status = "waitlist"'
        );
        $qStmt->execute([$event_id]);
        $position = (int) $qStmt->fetch()['c'] + 1;

        $ins = $db->prepare(
            'INSERT INTO registrations
             (user_id, event_id, priority, seat_number, status, queue_position)
             VALUES (?, ?, 0, NULL, "waitlist", ?)'
        );
        $ins->execute([$user['user_id'], $event_id, $position]);
        $reg_id = (int) $db->lastInsertId();

        $log = $db->prepare(
            'INSERT INTO queue_log (event_id, user_id, action, position_at_action)
             VALUES (?, ?, "enqueue", ?)'
        );
        $log->execute([$event_id, $user['user_id'], $position]);

        $db->commit();

        sendJSON(true, 'Added to waitlist', [
            'status'         => 'waitlist',
            'seat_number'    => null,
            'reg_id'         => $reg_id,
            'queue_position' => $position,
        ]);
    }

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('register_user error: ' . $e->getMessage());
    sendJSON(false, 'Registration failed. Please try again.', null, 500);
}