<?php
/**
 * EVENTIFY — Admin Dashboard Stats
 * GET — returns aggregate real counts
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

try {
    $db = getDB();

    $totalEvents = (int) $db->query('SELECT COUNT(*) AS c FROM events')->fetch()['c'];
    $totalUsers  = (int) $db->query('SELECT COUNT(*) AS c FROM users WHERE role = "user"')->fetch()['c'];
    $totalRegs   = (int) $db->query('SELECT COUNT(*) AS c FROM registrations WHERE status != "cancelled"')->fetch()['c'];
    $allocated   = (int) $db->query('SELECT COUNT(*) AS c FROM registrations WHERE status = "allocated"')->fetch()['c'];
    $waitlist    = (int) $db->query('SELECT COUNT(*) AS c FROM registrations WHERE status = "waitlist"')->fetch()['c'];
    $upcoming    = (int) $db->query('SELECT COUNT(*) AS c FROM events WHERE event_date >= CURDATE()')->fetch()['c'];

    // Recent registrations
    $recent = $db->query(
        'SELECT r.reg_id, r.status, r.seat_number, r.registered_at,
                u.user_name, e.event_name
         FROM registrations r
         INNER JOIN users u ON u.user_id = r.user_id
         INNER JOIN events e ON e.event_id = r.event_id
         ORDER BY r.registered_at DESC LIMIT 10'
    )->fetchAll();

    // Seat utilization per event
    $util = $db->query(
        'SELECT event_id, event_name, capacity, registered
         FROM events ORDER BY event_date ASC LIMIT 6'
    )->fetchAll();

    sendJSON(true, 'Stats loaded', [
        'totals' => [
            'events'        => $totalEvents,
            'users'         => $totalUsers,
            'registrations' => $totalRegs,
            'allocated'     => $allocated,
            'waitlist'      => $waitlist,
            'upcoming'      => $upcoming,
        ],
        'recent_registrations' => $recent,
        'utilization'          => $util,
    ]);

} catch (PDOException $e) {
    error_log('dashboard_stats error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load stats', null, 500);
}