<?php
/**
 * EVENTIFY — Admin: Reports
 * GET — real aggregate data for charts
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

try {
    $db = getDB();

    // Popular events (by non-cancelled registrations)
    $popular = $db->query(
        'SELECT e.event_id, e.event_name, e.category, e.capacity, e.registered,
                (SELECT COUNT(*) FROM registrations r
                 WHERE r.event_id = e.event_id AND r.status = "waitlist") AS waitlist_count
         FROM events e
         ORDER BY e.registered DESC
         LIMIT 10'
    )->fetchAll();

    // Category distribution
    $byCategory = $db->query(
        'SELECT category, COUNT(*) AS total
         FROM events GROUP BY category ORDER BY total DESC'
    )->fetchAll();

    // Seat utilization
    $util = $db->query(
        'SELECT event_id, event_name, capacity, registered,
                ROUND((registered / NULLIF(capacity,0)) * 100, 2) AS percent
         FROM events ORDER BY percent DESC'
    )->fetchAll();

    // Waitlist stats
    $wlStats = $db->query(
        'SELECT e.event_id, e.event_name,
                COUNT(r.reg_id) AS waitlist_size
         FROM events e
         LEFT JOIN registrations r
           ON r.event_id = e.event_id AND r.status = "waitlist"
         GROUP BY e.event_id, e.event_name
         HAVING waitlist_size > 0
         ORDER BY waitlist_size DESC'
    )->fetchAll();

    sendJSON(true, 'Reports loaded', [
        'popular_events'      => $popular,
        'category_stats'      => $byCategory,
        'seat_utilization'    => $util,
        'waitlist_stats'      => $wlStats,
    ]);

} catch (PDOException $e) {
    error_log('reports error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load reports', null, 500);
}