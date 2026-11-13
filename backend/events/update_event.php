<?php
/**
 * EVENTIFY — Update Event (Admin)
 * POST { event_id, event_name, description, category, venue, event_date, event_time, capacity, image }
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();
$input = getJSONInput();

$event_id    = (int) ($input['event_id'] ?? 0);
$event_name  = trim($input['event_name'] ?? '');
$description = trim($input['description'] ?? '');
$category    = trim($input['category'] ?? '');
$venue       = trim($input['venue'] ?? '');
$event_date  = trim($input['event_date'] ?? '');
$event_time  = trim($input['event_time'] ?? '');
$capacity    = (int) ($input['capacity'] ?? 0);
$image       = trim($input['image'] ?? '');

if ($event_id <= 0) {
    sendJSON(false, 'Invalid event ID');
}

if ($event_name === '' || $category === '' || $venue === '' ||
    $event_date === '' || $event_time === '' || $capacity <= 0) {
    sendJSON(false, 'All required fields must be filled');
}

if (strlen($event_time) === 5) {
    $event_time .= ':00';
}

try {
    $db = getDB();

    // Fetch current to validate capacity >= registered
    $cur = $db->prepare('SELECT registered FROM events WHERE event_id = ?');
    $cur->execute([$event_id]);
    $row = $cur->fetch();
    if (!$row) {
        sendJSON(false, 'Event not found', null, 404);
    }
    if ($capacity < (int)$row['registered']) {
        sendJSON(false, 'Capacity cannot be less than already registered (' . $row['registered'] . ')');
    }

    $stmt = $db->prepare(
        'UPDATE events SET
            event_name = ?, description = ?, category = ?, venue = ?,
            event_date = ?, event_time = ?, capacity = ?, image = ?
         WHERE event_id = ?'
    );
    $stmt->execute([
        $event_name, $description, $category, $venue,
        $event_date, $event_time, $capacity,
        $image !== '' ? $image : null,
        $event_id
    ]);

    sendJSON(true, 'Event updated successfully');

} catch (PDOException $e) {
    error_log('update_event error: ' . $e->getMessage());
    sendJSON(false, 'Failed to update event', null, 500);
}