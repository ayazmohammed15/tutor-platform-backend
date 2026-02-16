CREATE DATABASE IF NOT EXISTS tutor_booking_db;
USE tutor_booking_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('student', 'tutor', 'admin') NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  education TEXT,
  experience_years INT DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  profile_image VARCHAR(500),
  subjects TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_approval_status (approval_status),
  INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  chapter_name VARCHAR(255) NOT NULL,
  topic_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_class (class_name),
  INDEX idx_chapter (chapter_name),
  INDEX idx_topic (topic_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutor_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tutor_subject (tutor_id, subject_id),
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_subject_id (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS availability_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_day_of_week (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  tutor_id INT NOT NULL,
  subject_id INT,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
  suggested_date DATE NULL,
  suggested_time TIME NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_request_id INT NOT NULL,
  student_id INT NOT NULL,
  tutor_id INT NOT NULL,
  subject_id INT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INT DEFAULT 60,
  status ENUM('scheduled', 'paid', 'completed', 'cancelled') DEFAULT 'scheduled',
  zoom_meeting_link VARCHAR(500),
  zoom_meeting_id VARCHAR(255),
  zoom_password VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_request_id) REFERENCES session_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(500),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_student_id (student_id),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('email', 'system', 'both') DEFAULT 'both',
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type VARCHAR(50),
  related_entity_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (email, password, full_name, role, is_verified)
VALUES ('admin@tutorplatform.com', '$2a$10$8ZqGqJ8XvZPjQYZ7yVwXOe1L.5wH7FqGKp1VQQKkYvXqF5fKYqGxu', 'Admin User', 'admin', TRUE);
