<?php
/**
 * EVENTIFY — User Login
 * POST { email, password }
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$input = getJSONInput();
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    sendJSON(false, 'Email and password are required');
}

try {
    $db = getDB();
    $stmt = $db->prepare(
        'SELECT user_id, user_name, email, password, role
         FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendJSON(false, 'Invalid email or password', null, 401);
    }

    // Start session
    session_regenerate_id(true);
    $_SESSION['user_id']   = (int) $user['user_id'];
    $_SESSION['user_name'] = $user['user_name'];
    $_SESSION['email']     = $user['email'];
    $_SESSION['role']      = $user['role'];

    sendJSON(true, 'Login successful', [
        'user_id'   => (int) $user['user_id'],
        'user_name' => $user['user_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
    ]);

} catch (PDOException $e) {
    error_log('Login error: ' . $e->getMessage());
    sendJSON(false, 'Login failed. Please try again.', null, 500);
}