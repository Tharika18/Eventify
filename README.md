# Eventify – Event Management System

A Web-Based Event Management System developed using PHP, MySQL, HTML, CSS, JavaScript, C and WebAssembly.

## 1. Project Overview

Eventify is a web-based platform designed to simplify event creation, participant registration, seat allocation and event management. It provides separate interfaces for users and administrators to manage event-related activities through a centralized application.

## 2. Problem Statement

Managing events manually can make event creation, participant registration, seat allocation and tracking registrations difficult. Event organizers may face challenges in maintaining participant details, monitoring available seats and managing waiting lists.

Eventify aims to organize these activities through a centralized web application that simplifies event management and improves the registration process.

## 3. Project Objectives

- Provide a centralized platform for event management.
- Allow users to register and log in securely.
- Display available events and event details.
- Enable administrators to create, update and delete events.
- Manage event registrations and cancellations.
- Support seat allocation and queue management.
- Maintain registration and queue activity logs.
- Provide separate user and administrator interfaces.

## 4. Key Features

### User Module

- User registration and login.
- User dashboard.
- Browse available events.
- View event details.
- Register for events.
- View personal registrations.
- Cancel registrations.
- View waitlist information.
- Manage user profile.

### Admin Module

- Administrator dashboard.
- Create new events.
- Update existing events.
- Delete events.
- Manage registered users.
- View event registrations.
- Manage seat allocation.
- Manage waitlists.
- Generate and view reports.
- Monitor dashboard statistics.

### Core Processing

- C language core implementation.
- WebAssembly integration.
- JavaScript WebAssembly loader.
- Core processing through compiled WebAssembly modules.

## 5. Technologies Used

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | PHP |
| Database | MySQL |
| Database Management | phpMyAdmin |
| Core Module | C |
| WebAssembly | Emscripten |
| Local Server | XAMPP |
| Version Control | Git and GitHub |
| Development Environment | Visual Studio Code |

## 6. System Architecture

Eventify follows a frontend-backend-database architecture.

**Frontend Layer**
- HTML provides the application structure.
- CSS provides styling and responsive layouts.
- JavaScript handles user interactions and API communication.

**Backend Layer**
- PHP handles authentication and session management.
- Event APIs manage event creation and updates.
- Registration APIs manage event registrations and cancellations.
- Allocation APIs handle seat allocation and queue operations.
- Admin APIs support administrative functions and reports.

**Database Layer**
- MySQL stores user accounts, event details, registrations and queue logs.

**WebAssembly Layer**
- C source files implement the core processing module.
- Emscripten compiles the C module into WebAssembly.
- JavaScript loads the generated WebAssembly module.

## 7. Project Folder Structure

```text
Eventify/
│
├── backend/
│   ├── admin/
│   │   ├── dashboard_stats.php
│   │   ├── registrations.php
│   │   ├── reports.php
│   │   ├── users.php
│   │   └── waitlist.php
│   │
│   ├── allocation/
│   │   ├── assign_seat.php
│   │   ├── get_seats.php
│   │   └── queue_log.php
│   │
│   ├── auth/
│   │   ├── login.php
│   │   ├── logout.php
│   │   ├── register.php
│   │   └── session_check.php
│   │
│   ├── config/
│   │   └── db.example.php
│   │
│   ├── events/
│   │   ├── create_event.php
│   │   ├── delete_event.php
│   │   ├── get_event.php
│   │   ├── list_events.php
│   │   └── update_event.php
│   │
│   ├── registration/
│   │   ├── cancel.php
│   │   ├── my_registrations.php
│   │   └── register_user.php
│   │
│   └── logs/
│
├── c_core/
│   ├── eventify_core.c
│   ├── eventify_core.h
│   └── eventify_wrapper.c
│
├── database/
│   └── eventify.sql
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── events.html
│   ├── event-details.html
│   ├── user-dashboard.html
│   ├── admin-dashboard.html
│   └── profile.html
│
├── wasm_build/
│   ├── eventify_core.js
│   └── eventify_core.wasm
│
├── .gitignore
└── README.md
```

## 8. Database Structure

**Database Name:** `eventify`

The database contains the following tables:

| Table | Description |
|---|---|
| users | Stores user account information, email and role |
| events | Stores event details, venue, date, time and capacity |
| registrations | Maintains event registration records |
| queue_log | Maintains queue activity records |

The database is managed using MySQL and phpMyAdmin.

## 9. C and WebAssembly Integration

Eventify includes a C core module consisting of:

- `eventify_core.c`
- `eventify_core.h`
- `eventify_wrapper.c`

The C source files are compiled into WebAssembly using Emscripten.

The generated JavaScript and WebAssembly files are stored in the `wasm_build` directory:

- `eventify_core.js`
- `eventify_core.wasm`

The frontend includes a JavaScript WebAssembly loader to integrate the compiled module with the application.

## 10. Installation and Setup

### Requirements

- Linux, Windows or macOS
- XAMPP
- PHP
- MySQL
- Web browser
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Tharika18/Eventify.git
cd Eventify
```

### Step 2: Configure the Database

1. Start Apache and MySQL using XAMPP.
2. Open phpMyAdmin.
3. Create a database named `eventify`.
4. Select the database.
5. Import the `database/eventify.sql` file.

### Step 3: Configure the Backend

1. Open the `backend/config/` directory.
2. Copy `db.example.php`.
3. Rename the copied file to `db.php`.
4. Update the database credentials according to your local XAMPP configuration.

Example local configuration:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'eventify');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');
```

### Step 4: Run the Application

Place the Eventify project inside the XAMPP `htdocs` directory.

Open the application in your browser:

```text
http://localhost/Eventify/frontend/
```

For a local folder named `eventify`, use:

```text
http://localhost/eventify/frontend/
```

## 11. Demo Login Credentials

The following accounts are provided for local demonstration and testing.

| Role | Email | Password |
|---|---|---|
| Administrator | admin@eventify.com | Admin@123 |
| User | ram@gmail.com | ram@123 |

**Note:** These are demonstration credentials. Use only test accounts with sample data. Change the passwords before public deployment.

## 12. Backend API Modules

| Directory | Responsibility |
|---|---|
| auth | User registration, login, logout and session checks |
| events | Event creation, listing, updating and deletion |
| registration | Event registration and cancellation |
| allocation | Seat allocation and queue logging |
| admin | User management, reports, registrations and dashboard statistics |
| config | Database connection and configuration |

## 13. Security and Access Management

- Session-based authentication.
- Administrator access validation.
- PDO-based database connection.
- Prepared-statement configuration.
- Database credentials excluded from Git tracking.
- Separate user and administrator functionalities.

For public deployment, configure secure database credentials, restrict access to sensitive files, use HTTPS and change all demonstration passwords.

## 14. Future Enhancements

- Online payment integration.
- Email and SMS notifications.
- QR-code-based event check-in.
- Advanced event analytics.
- Improved mobile responsiveness.
- Cloud deployment.
- Enhanced event recommendation features.

## 15. GitHub Repository

**Project:** Eventify – Event Management System

**Developer:** G. Tharika

**GitHub Username:** Tharika18

**Repository Link:**

https://github.com/Tharika18/Eventify

## 16. Project Information

**Project Name:** Eventify  
**Project Type:** Web-Based Event Management System  
**Frontend:** HTML, CSS and JavaScript  
**Backend:** PHP  
**Database:** MySQL  
**Core Technologies:** C and WebAssembly  
**Development Environment:** Visual Studio Code and XAMPP

---

*Developed as a student project by G. Tharika.*