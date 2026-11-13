<?php
/**
 * EVENTIFY — Get Single Event
 * GET ?event_id=
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$event_id = (int) ($_GET['event_id'] ?? 0);
if ($event_id <= 0) {
    sendJSON(false, 'Invalid event ID');
}

try {
    $db = getDB();
    $stmt = $db->prepare(
        'SELECT e.event_id, e.event_name, e.description, e.category, e.venue,
                e.event_date, e.event_time, e.capacity, e.registered, e.image,
                e.created_at, u.user_name AS created_by_name
         FROM events e
         LEFT JOIN users u ON u.user_id = e.created_by
         WHERE e.event_id = ? LIMIT 1'
    );
    $stmt->execute([$event_id]);
    $event = $stmt->fetch();

    if (!$event) {
        sendJSON(false, 'Event not found', null, 404);
    }

    $event['event_id']   = (int) $event['event_id'];
    $event['capacity']   = (int) $event['capacity'];
    $event['registered'] = (int) $event['registered'];
    $event['available']  = max(0, $event['capacity'] - $event['registered']);
    $event['is_full']    = $event['available'] <= 0;

    sendJSON(true, 'Event loaded', ['event' => $event]);

} catch (PDOException $e) {
    error_log('get_event error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load event', null, 500);
}