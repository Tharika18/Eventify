<?php
/**
 * EVENTIFY — Admin: List Registrations
 * GET ?event_id=&status=
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

$event_id = (int) ($_GET['event_id'] ?? 0);
$status   = trim($_GET['status'] ?? '');

try {
    $db = getDB();
    $sql = 'SELECT r.reg_id, r.user_id, r.event_id, r.priority, r.seat_number,
                   r.status, r.queue_position, r.registered_at,
                   u.user_name, u.email,
                   e.event_name, e.event_date
            FROM registrations r
            INNER JOIN users u ON u.user_id = r.user_id
            INNER JOIN events e ON e.event_id = r.event_id
            WHERE 1=1';
    $params = [];

    if ($event_id > 0) {
        $sql .= ' AND r.event_id = ?';
        $params[] = $event_id;
    }
    if (in_array($status, ['allocated', 'waitlist', 'cancelled'], true)) {
        $sql .= ' AND r.status = ?';
        $params[] = $status;
    }

    $sql .= ' ORDER BY r.registered_at DESC LIMIT 500';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['reg_id']         = (int) $r['reg_id'];
        $r['user_id']        = (int) $r['user_id'];
        $r['event_id']       = (int) $r['event_id'];
        $r['priority']       = (int) $r['priority'];
        $r['seat_number']    = $r['seat_number'] !== null ? (int) $r['seat_number'] : null;
        $r['queue_position'] = $r['queue_position'] !== null ? (int) $r['queue_position'] : null;
    }
    unset($r);

    sendJSON(true, 'Registrations loaded', ['registrations' => $rows]);

} catch (PDOException $e) {
    error_log('admin registrations error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load registrations', null, 500);
}