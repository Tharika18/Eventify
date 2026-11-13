<?php
/**
 * EVENTIFY — List Events
 * GET ?category=&search=&availability=
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$category     = trim($_GET['category'] ?? '');
$search       = trim($_GET['search'] ?? '');
$availability = trim($_GET['availability'] ?? '');

try {
    $db = getDB();

    $sql = 'SELECT event_id, event_name, description, category, venue,
                   event_date, event_time, capacity, registered, image, created_at
            FROM events WHERE 1=1';
    $params = [];

    if ($category !== '' && strtolower($category) !== 'all') {
        $sql .= ' AND category = ?';
        $params[] = $category;
    }

    if ($search !== '') {
        $sql .= ' AND (event_name LIKE ? OR description LIKE ? OR venue LIKE ?)';
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    if ($availability === 'available') {
        $sql .= ' AND (capacity - registered) > 0';
    } elseif ($availability === 'full') {
        $sql .= ' AND (capacity - registered) <= 0';
    }

    $sql .= ' ORDER BY event_date ASC, event_time ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();

    // Cast numeric fields + compute available
    foreach ($events as &$e) {
        $e['event_id']   = (int) $e['event_id'];
        $e['capacity']   = (int) $e['capacity'];
        $e['registered'] = (int) $e['registered'];
        $e['available']  = max(0, $e['capacity'] - $e['registered']);
        $e['is_full']    = $e['available'] <= 0;
    }
    unset($e);

    sendJSON(true, 'Events loaded', ['events' => $events]);

} catch (PDOException $e) {
    error_log('list_events error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load events', null, 500);
}