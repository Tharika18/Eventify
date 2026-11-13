<?php
/**
 * EVENTIFY — Admin: Waitlist (FIFO order)
 * GET ?event_id=
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

$event_id = (int) ($_GET['event_id'] ?? 0);

try {
    $db = getDB();

    $sql = 'SELECT r.reg_id, r.user_id, r.event_id, r.queue_position, r.registered_at,
                   u.user_name, u.email,
                   e.event_name, e.event_date
            FROM registrations r
            INNER JOIN users u ON u.user_id = r.user_id
            INNER JOIN events e ON e.event_id = r.event_id
            WHERE r.status = "waitlist"';
    $params = [];

    if ($event_id > 0) {
        $sql .= ' AND r.event_id = ?';
        $params[] = $event_id;
    }

    $sql .= ' ORDER BY r.queue_position ASC, r.registered_at ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['reg_id']         = (int) $r['reg_id'];
        $r['user_id']        = (int) $r['user_id'];
        $r['event_id']       = (int) $r['event_id'];
        $r['queue_position'] = (int) $r['queue_position'];
    }
    unset($r);

    sendJSON(true, 'Waitlist loaded', ['waitlist' => $rows]);

} catch (PDOException $e) {
    error_log('admin waitlist error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load waitlist', null, 500);
}