CREATE TABLE IF NOT EXISTS student_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lrn VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20),
    section VARCHAR(50)
);

INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
VALUES
    ('301420000001', 'Juan', 'Dela Cruz', '10', 'Rizal'),
    ('301420000002', 'Maria', 'Santos', '9', 'Bonifacio'),
    ('301420000003', 'Pedro', 'Reyes', '8', 'Jacinto'),
    ('301420000004', 'Luisa', 'Garcia', '7', 'Mabini'),
    ('301420000005', 'Angela', 'Rivera', '10', 'Quezon')
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    grade_level = VALUES(grade_level),
    section = VALUES(section);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    lrn VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'guidance_counselor') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
    
--     -- Common fields
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     username VARCHAR(100) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     role ENUM('student', 'guidance_counselor') NOT NULL DEFAULT 'student',
    
--     -- Student-specific fields
--     lrn VARCHAR(20) UNIQUE,
--     student_email VARCHAR(150),
    
--     -- Parent / Guardian information (for students)
--     parent_name VARCHAR(150),
--     parent_email VARCHAR(150),
--     parent_contact VARCHAR(20),
    
--     -- Counselor-specific fields
--     counselor_id VARCHAR(50),
--     counselor_email VARCHAR(150),
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

CREATE TABLE IF NOT EXISTS concerns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('academic', 'behavioral', 'general', 'safety', 'other') DEFAULT 'general',
    status ENUM('pending', 'read', 'in_review', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    concern_id INT,
    message VARCHAR(500) NOT NULL,
    type ENUM('status_update', 'info') DEFAULT 'status_update',
    read_flag TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (concern_id) REFERENCES concerns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
    user_id INT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -- ==========================================
-- --  GUIDANCE CONCERN MANAGEMENT SYSTEM SCHEMA
-- --  With File Attachments Support (2025)
-- -- ==========================================

-- -- ============================
-- -- 1. STUDENT RECORDS TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS student_records (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     lrn VARCHAR(20) NOT NULL UNIQUE,
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     grade_level VARCHAR(20),
--     section VARCHAR(50),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
-- VALUES
--     ('301420000001', 'Juan', 'Dela Cruz', '10', 'Rizal'),
--     ('301420000002', 'Maria', 'Santos', '9', 'Bonifacio'),
--     ('301420000003', 'Pedro', 'Reyes', '8', 'Jacinto'),
--     ('301420000004', 'Luisa', 'Garcia', '7', 'Mabini'),
--     ('301420000005', 'Angela', 'Rivera', '10', 'Quezon')
-- ON DUPLICATE KEY UPDATE
--     first_name = VALUES(first_name),
--     last_name  = VALUES(last_name),
--     grade_level = VALUES(grade_level),
--     section = VALUES(section);

-- -- ============================
-- -- 2. USERS TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     username VARCHAR(100) NOT NULL UNIQUE,
--     lrn VARCHAR(20) UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     role ENUM('student', 'guidance_counselor', 'admin') 
--         NOT NULL DEFAULT 'student',

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--     FOREIGN KEY (lrn) REFERENCES student_records(lrn) ON DELETE SET NULL
-- );

-- CREATE INDEX idx_users_role ON users (role);

-- -- ============================
-- -- 3. CONCERNS TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS concerns (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     title VARCHAR(255) NOT NULL,
--     description TEXT NOT NULL,

--     category ENUM('academic', 'behavioral', 'general', 'safety', 'other') 
--         DEFAULT 'general',

--     severity ENUM('low', 'medium', 'high') DEFAULT 'low',

--     status ENUM('pending', 'read', 'in_review', 'resolved') 
--         DEFAULT 'pending',

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE INDEX idx_concerns_status ON concerns (status);
-- CREATE INDEX idx_concerns_category ON concerns (category);

-- -- ============================
-- -- 4. CONCERN ATTACHMENTS TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS concern_attachments (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     concern_id INT NOT NULL,

--     file_name VARCHAR(255) NOT NULL,
--     file_type VARCHAR(100) NOT NULL,
--     file_size BIGINT,
--     file_path VARCHAR(500) NOT NULL,  
--     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     FOREIGN KEY (concern_id) REFERENCES concerns(id) ON DELETE CASCADE
-- );

-- CREATE INDEX idx_attachments_concern ON concern_attachments (concern_id);

-- -- ============================
-- -- 5. NOTIFICATIONS TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS notifications (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     concern_id INT,

--     message VARCHAR(500) NOT NULL,
--     type ENUM('status_update', 'info') DEFAULT 'status_update',
--     read_flag TINYINT(1) DEFAULT 0,

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     FOREIGN KEY (concern_id) REFERENCES concerns(id) ON DELETE CASCADE
-- );

-- CREATE INDEX idx_notifications_user ON notifications (user_id);

-- -- ============================
-- -- 6. PASSWORD RESET TABLE
-- -- ============================
-- CREATE TABLE IF NOT EXISTS password_resets (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     token VARCHAR(255) NOT NULL UNIQUE,
--     expires_at DATETIME NOT NULL,
--     used TINYINT(1) DEFAULT 0,

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- -- ============================
-- -- 7. DEFAULT ADMIN (Optional)
-- -- ============================
-- INSERT INTO users (first_name, last_name, username, password_hash, role)
-- VALUES ('System', 'Admin', 'admin', '$2y$10$abcdefghijklmnopqrstuv', 'admin')
-- ON DUPLICATE KEY UPDATE username = username;

