<?php
/**
 * EVENTIFY — Create Event (Admin)
 * POST { event_name, description, category, venue, event_date, event_time, capacity, image }
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$admin = requireAdmin();
$input = getJSONInput();

$event_name  = trim($input['event_name'] ?? '');
$description = trim($input['description'] ?? '');
$category    = trim($input['category'] ?? '');
$venue       = trim($input['venue'] ?? '');
$event_date  = trim($input['event_date'] ?? '');
$event_time  = trim($input['event_time'] ?? '');
$capacity    = (int) ($input['capacity'] ?? 0);
$image       = trim($input['image'] ?? '');

if ($event_name === '' || $category === '' || $venue === '' ||
    $event_date === '' || $event_time === '' || $capacity <= 0) {
    sendJSON(false, 'All required fields must be filled');
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $event_date)) {
    sendJSON(false, 'Invalid date format (YYYY-MM-DD)');
}

if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $event_time)) {
    sendJSON(false, 'Invalid time format (HH:MM)');
}

if (strlen($event_time) === 5) {
    $event_time .= ':00';
}

try {
    $db = getDB();
    $stmt = $db->prepare(
        'INSERT INTO events
         (event_name, description, category, venue, event_date, event_time,
          capacity, registered, image, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    );
    $stmt->execute([
        $event_name, $description, $category, $venue,
        $event_date, $event_time, $capacity,
        $image !== '' ? $image : null,
        $admin['user_id']
    ]);

    $event_id = (int) $db->lastInsertId();

    sendJSON(true, 'Event created successfully', ['event_id' => $event_id]);

} catch (PDOException $e) {
    error_log('create_event error: ' . $e->getMessage());
    sendJSON(false, 'Failed to create event', null, 500);
}