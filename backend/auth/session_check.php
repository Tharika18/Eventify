<?php
/**
 * EVENTIFY — Session Check
 * GET — returns current session user
 */

require_once __DIR__ . '/../config/db.php';

if (empty($_SESSION['user_id'])) {
    sendJSON(false, 'Not logged in', ['loggedIn' => false]);
}

sendJSON(true, 'Session active', [
    'loggedIn'  => true,
    'user_id'   => (int) $_SESSION['user_id'],
    'user_name' => $_SESSION['user_name'] ?? '',
    'email'     => $_SESSION['email'] ?? '',
    'role'      => $_SESSION['role'] ?? 'user',
]);