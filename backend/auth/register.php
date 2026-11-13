<?php
/**
 * EVENTIFY — User Registration
 * POST { user_name, email, password }
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Method not allowed', null, 405);
}

$input = getJSONInput();

$user_name = trim($input['user_name'] ?? '');
$email     = trim($input['email'] ?? '');
$password  = $input['password'] ?? '';

// Validation
if ($user_name === '' || $email === '' || $password === '') {
    sendJSON(false, 'All fields are required');
}

if (strlen($user_name) < 2 || strlen($user_name) > 100) {
    sendJSON(false, 'Name must be between 2 and 100 characters');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJSON(false, 'Please enter a valid email address');
}

if (strlen($password) < 6) {
    sendJSON(false, 'Password must be at least 6 characters');
}

try {
    $db = getDB();

    // Check duplicate email
    $check = $db->prepare('SELECT user_id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        sendJSON(false, 'An account with this email already exists');
    }

    // Hash password
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $db->prepare(
        'INSERT INTO users (user_name, email, password, role)
         VALUES (?, ?, ?, "user")'
    );
    $stmt->execute([$user_name, $email, $hash]);

    $user_id = (int) $db->lastInsertId();

    sendJSON(true, 'Account created successfully', [
        'user_id'   => $user_id,
        'user_name' => $user_name,
        'email'     => $email,
        'role'      => 'user',
    ]);

} catch (PDOException $e) {
    error_log('Register error: ' . $e->getMessage());
    sendJSON(false, 'Registration failed. Please try again.', null, 500);
}