<?php
/**
 * EVENTIFY — My Registrations
 * GET — returns all registrations for logged-in user
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$user = requireAuth();

try {
    $db = getDB();
    $stmt = $db->prepare(
        'SELECT r.reg_id, r.seat_number, r.status, r.queue_position,
                r.registered_at,
                e.event_id, e.event_name, e.category, e.venue,
                e.event_date, e.event_time, e.capacity, e.registered, e.image
         FROM registrations r
         INNER JOIN events e ON e.event_id = r.event_id
         WHERE r.user_id = ?
         ORDER BY r.registered_at DESC'
    );
    $stmt->execute([$user['user_id']]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['reg_id']         = (int) $r['reg_id'];
        $r['seat_number']    = $r['seat_number'] !== null ? (int) $r['seat_number'] : null;
        $r['queue_position'] = $r['queue_position'] !== null ? (int) $r['queue_position'] : null;
        $r['event_id']       = (int) $r['event_id'];
        $r['capacity']       = (int) $r['capacity'];
        $r['registered']     = (int) $r['registered'];
    }
    unset($r);

    sendJSON(true, 'Registrations loaded', ['registrations' => $rows]);

} catch (PDOException $e) {
    error_log('my_registrations error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load registrations', null, 500);
}