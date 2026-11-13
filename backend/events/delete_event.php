<?php
/**
 * EVENTIFY — Delete Event (Admin)
 * POST { event_id }
 * Cascade deletes registrations & queue_log via FK ON DELETE CASCADE
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();
$input = getJSONInput();
$event_id = (int) ($input['event_id'] ?? 0);

if ($event_id <= 0) {
    sendJSON(false, 'Invalid event ID');
}

try {
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM events WHERE event_id = ?');
    $stmt->execute([$event_id]);

    if ($stmt->rowCount() === 0) {
        sendJSON(false, 'Event not found', null, 404);
    }

    sendJSON(true, 'Event deleted successfully');

} catch (PDOException $e) {
    error_log('delete_event error: ' . $e->getMessage());
    sendJSON(false, 'Failed to delete event', null, 500);
}