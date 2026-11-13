<?php
/**
 * EVENTIFY — Assign Seat (internal helper, admin-usable)
 * POST { event_id, user_id }
 * Used when admin manually assigns a seat.
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();
$input = getJSONInput();

$event_id = (int) ($input['event_id'] ?? 0);
$user_id  = (int) ($input['user_id'] ?? 0);

if ($event_id <= 0 || $user_id <= 0) {
    sendJSON(false, 'Invalid parameters');
}

try {
    $db = getDB();
    $db->beginTransaction();

    $stmt = $db->prepare(
        'SELECT reg_id, status, seat_number FROM registrations
         WHERE user_id = ? AND event_id = ? LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([$user_id, $event_id]);
    $reg = $stmt->fetch();

    if (!$reg) {
        $db->rollBack();
        sendJSON(false, 'Registration not found', null, 404);
    }

    if ($reg['status'] === 'allocated') {
        $db->rollBack();
        sendJSON(false, 'User already has a seat');
    }

    // Find next free seat
    $used = $db->prepare(
        'SELECT seat_number FROM registrations
         WHERE event_id = ? AND status = "allocated"'
    );
    $used->execute([$event_id]);
    $taken = array_map('intval', array_column($used->fetchAll(), 'seat_number'));

    $seat = 1;
    while (in_array($seat, $taken, true)) $seat++;

    $db->prepare(
        'UPDATE registrations
         SET status = "allocated", seat_number = ?, queue_position = NULL
         WHERE reg_id = ?'
    )->execute([$seat, $reg['reg_id']]);

    $db->prepare(
        'UPDATE events SET registered = registered + 1 WHERE event_id = ?'
    )->execute([$event_id]);

    $db->prepare(
        'INSERT INTO queue_log (event_id, user_id, action, position_at_action)
         VALUES (?, ?, "promote", ?)'
    )->execute([$event_id, $user_id, $seat]);

    $db->commit();

    sendJSON(true, 'Seat assigned', ['seat_number' => $seat]);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('assign_seat error: ' . $e->getMessage());
    sendJSON(false, 'Seat assignment failed', null, 500);
}