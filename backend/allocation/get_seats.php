<?php
/**
 * EVENTIFY — Get Seats (Admin)
 * GET ?event_id=
 * Returns full seat map: number, status, user
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(false, 'Method not allowed', null, 405);
}

requireAdmin();

$event_id = (int) ($_GET['event_id'] ?? 0);
if ($event_id <= 0) {
    sendJSON(false, 'Invalid event ID');
}

try {
    $db = getDB();

    $ev = $db->prepare('SELECT capacity FROM events WHERE event_id = ?');
    $ev->execute([$event_id]);
    $event = $ev->fetch();
    if (!$event) {
        sendJSON(false, 'Event not found', null, 404);
    }

    $capacity = (int) $event['capacity'];

    $stmt = $db->prepare(
        'SELECT r.seat_number, r.user_id, r.status, u.user_name, u.email
         FROM registrations r
         INNER JOIN users u ON u.user_id = r.user_id
         WHERE r.event_id = ? AND r.status = "allocated"
         ORDER BY r.seat_number ASC'
    );
    $stmt->execute([$event_id]);
    $rows = $stmt->fetchAll();

    $seatMap = [];
    for ($i = 1; $i <= $capacity; $i++) {
        $seatMap[$i] = [
            'seat_number' => $i,
            'status'      => 'available',
            'user_id'     => null,
            'user_name'   => null,
            'email'       => null,
        ];
    }

    foreach ($rows as $r) {
        $sn = (int) $r['seat_number'];
        if (isset($seatMap[$sn])) {
            $seatMap[$sn]['status']    = 'occupied';
            $seatMap[$sn]['user_id']   = (int) $r['user_id'];
            $seatMap[$sn]['user_name'] = $r['user_name'];
            $seatMap[$sn]['email']     = $r['email'];
        }
    }

    $seats = [];
    for ($i = 1; $i <= $capacity; $i++) {
        $seats[] = [
            'seat_number' => $i,
            'status'      => $seatMap[$i]['status'],
            'user_name'   => $seatMap[$i]['user_name'],
        ];
    }

    sendJSON(true, 'Seats loaded', [
        'capacity' => $capacity,
        'seats'    => $seats,
    ]);

} catch (PDOException $e) {
    error_log('get_seats error: ' . $e->getMessage());
    sendJSON(false, 'Failed to load seats', null, 500);
}