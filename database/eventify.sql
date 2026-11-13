-- ============================================================
-- EVENTIFY DATABASE
-- Event Registration & Intelligent Seat Queue Allocation System
-- ============================================================

CREATE DATABASE IF NOT EXISTS eventify
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE eventify;

-- ============================================================
-- TABLE: users
-- ============================================================
DROP TABLE IF EXISTS queue_log;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: events
-- ============================================================
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    registered INT NOT NULL DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_date (event_date),
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: registrations
-- ============================================================
CREATE TABLE registrations (
    reg_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    seat_number INT DEFAULT NULL,
    status ENUM('allocated', 'waitlist', 'cancelled') NOT NULL DEFAULT 'waitlist',
    queue_position INT DEFAULT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event (user_id, event_id),
    INDEX idx_event_status (event_id, status),
    INDEX idx_user (user_id),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id)
        REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: queue_log
-- ============================================================
CREATE TABLE queue_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    action ENUM('enqueue', 'dequeue', 'promote', 'cancel') NOT NULL,
    position_at_action INT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event (event_id),
    CONSTRAINT fk_log_event FOREIGN KEY (event_id)
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEMO USERS
-- Passwords (hashed with password_hash()):
--   admin@eventify.com    -> Admin@123
--   student@eventify.com  -> Student@123
-- ============================================================
INSERT INTO users (user_name, email, password, role) VALUES
('Admin User',   'admin@eventify.com',
 '$2y$10$YQ8b1lKnJXzJkZ8mJzZ4WOhG3Q1YxL0mRr2nJ0rQ9y7Y4sV8bJq2u', 'admin'),
('Student User', 'student@eventify.com',
 '$2y$10$wJXk4m8QzP4N0mLrY5cJ9uX8pQ2vR7yH6sN3tB1kM5wF0gD7cE2S', 'user');

-- NOTE: If password_hash() differs on your PHP version, regenerate with:
--   php -r "echo password_hash('Admin@123', PASSWORD_DEFAULT);"
-- and replace the hash above.

-- ============================================================
-- SAMPLE EVENTS
-- ============================================================
INSERT INTO events (event_name, description, category, venue, event_date, event_time, capacity, registered, image, created_by) VALUES
('AI Innovation Summit',
 'A premier summit bringing together AI researchers, industry leaders, and students to explore breakthroughs in artificial intelligence, machine learning, and generative models. Features keynote talks, panel discussions, and live demos.',
 'AI & Technology', 'Main Auditorium, Block A', '2026-03-15', '10:00:00', 100, 0, 'ai-event.jpg', 1),

('College Hackathon 2026',
 'A 24-hour coding marathon where teams build innovative solutions to real-world problems. Mentors from top tech companies, exciting prizes, and networking opportunities. Open to all departments.',
 'Hackathons', 'Innovation Lab, Block C', '2026-03-22', '09:00:00', 60, 0, 'hackathon.jpg', 1),

('Web Development Workshop',
 'Hands-on workshop covering modern web development with HTML5, CSS3, JavaScript, and backend fundamentals. Build and deploy your first full-stack application. Laptops required.',
 'Workshops', 'Computer Lab 2, Block B', '2026-03-10', '14:00:00', 40, 0, 'workshop.jpg', 1),

('Career Development Seminar',
 'Interactive seminar on resume building, interview preparation, LinkedIn optimization, and career paths in tech. Includes mock interviews and one-on-one mentoring sessions.',
 'Career', 'Seminar Hall, Block D', '2026-03-18', '11:00:00', 80, 0, 'career.jpg', 1),

('Cultural Fest 2026',
 'Annual cultural celebration featuring music, dance, drama, art exhibitions, and food stalls. A vibrant showcase of talent and diversity across the campus.',
 'Cultural', 'Open Grounds, Main Campus', '2026-03-25', '16:00:00', 200, 0, 'cultural.jpg', 1),

('Annual Sports Meet',
 'Inter-department sports competition featuring cricket, football, basketball, athletics, and more. Register your team and compete for the championship trophy.',
 'Sports', 'Sports Complex', '2026-03-28', '08:00:00', 150, 0, 'sports.jpg', 1);
 INSERT INTO users (user_name, email, password, role) VALUES
('Admin User', 'admin@eventify.com',
 '$2y$10$ll9DcLVnlQudgt1eib9eH.F34X4NOwCUAqdGEu0K6zCc9g7qXtazq', 'admin'),
('Ramkumar', 'ram@gmail.com',
 '$2y$10$tf8WZt69uZRy0/7saFr.4e4oOt10ZSB8dilyyYJSgo6BspdTgVjRa', 'user');

-- ============================================================
-- VERIFICATION QUERIES (optional, run manually)
-- ============================================================
-- SELECT * FROM users;
-- SELECT * FROM events;
-- SHOW TABLES;