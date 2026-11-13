<?php
/**
 * EVENTIFY — Queue Log (Admin)
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
    if ($event_id > 0) {
        $stmt = $db->prepare(
            'SELECT q.log_id, q.event_id, q.user_id, q.action,
                    q.position_at_action, q.timestamp,
                    u.user_name, e.event_name
             FROM queue_log q
             LEFT JOIN users u ON u.user_id = q.user_id
             LEFT JOIN events e ON e.event_id = q.event_id
             WHERE q.event_id = ?
             ORDER BY q.timestamp DESC LIMIT 500'
        );
        $stmt->execute([$event_id]);
    } else {
        $stmt = $db->query(
            'SELECT q.log_id, q.event_id, q.user_id, q.action,
                    q.position_at_action, q.timestamp,
                    u.user_name, e.event_name
             FROM queue_log q
             LEFT JOIN users u ON u.user_id = q.user_id
             LEFT JOIN events e ON e.event_id = q.event_id
             ORDER BY q.timestamp DESC LIMIT 500'
        );
    }

    $logs = $stmt->fetchAll();
    foreach ($logs as &$l) {
        $l['log_id']             = (int) $l['log_id'];
        $l['event_id']           = (int) $l['event_id'];
        $l['user_id']            = (int) $l['user_id'];
        $l['position_at_action'] = $l['position_at_action'] !== null
            ? (int) $l['position_at_action'] : null;
    }
    unset($l);

    sendJSON(true, 'Queue log loaded', ['logs' => $logs]);

} catch (PDOException $e) {
    error_log('queue_log error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load queue log', null, 500);
}