<?php
/**
 * EVENTIFY — Admin: List Users
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

try {
    $db = getDB();
    $stmt = $db->query(
        'SELECT u.user_id, u.user_name, u.email, u.role, u.created_at,
                (SELECT COUNT(*) FROM registrations r
                 WHERE r.user_id = u.user_id AND r.status != "cancelled") AS reg_count
         FROM users u
         ORDER BY u.created_at DESC'
    );
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['user_id']   = (int) $u['user_id'];
        $u['reg_count'] = (int) $u['reg_count'];
    }
    unset($u);

    sendJSON(true, 'Users loaded', ['users' => $users]);

} catch (PDOException $e) {
    error_log('admin users error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load users', null, 500);
}