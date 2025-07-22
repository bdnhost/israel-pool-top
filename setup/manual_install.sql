-- Pool Israel Database Setup
-- Run this SQL manually in phpMyAdmin or MySQL command line

-- Use the correct database
USE shlomion_israelpool;

-- 1. Create contractors table FIRST (no dependencies)
CREATE TABLE IF NOT EXISTS contractors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    city VARCHAR(100),
    categories JSON,
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    customer_city VARCHAR(100),
    customer_address TEXT,
    pool_type ENUM('concrete', 'fiberglass', 'modular', 'renovation') NOT NULL,
    pool_size VARCHAR(50),
    pool_depth VARCHAR(50),
    budget_range VARCHAR(50),
    project_timeline VARCHAR(50),
    additional_features JSON,
    special_requirements TEXT,
    images JSON,
    status ENUM('pending', 'assigned', 'completed', 'cancelled') DEFAULT 'pending',
    verification_code VARCHAR(6),
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_phone (customer_phone),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_verification (verification_code, verification_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create quote_assignments table (depends on contractors and quotes)
CREATE TABLE IF NOT EXISTS quote_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    contractor_id INT NOT NULL,
    assignment_type ENUM('regular', 'premium') DEFAULT 'regular',
    fee_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending',
    contractor_response TEXT,
    response_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (quote_id, contractor_id),
    INDEX idx_contractor (contractor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sms_type ENUM('verification', 'notification', 'marketing') DEFAULT 'verification',
    status ENUM('pending', 'sent', 'failed', 'delivered') DEFAULT 'pending',
    provider_response TEXT,
    quote_id INT NULL,
    contractor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE SET NULL,
    INDEX idx_phone (phone_number),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role ENUM('admin', 'manager', 'operator') DEFAULT 'operator',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create contractor_payments table
CREATE TABLE IF NOT EXISTS contractor_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contractor_id INT NOT NULL,
    quote_assignment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type ENUM('lead_fee', 'commission', 'subscription') DEFAULT 'lead_fee',
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_assignment_id) REFERENCES quote_assignments(id) ON DELETE CASCADE,
    INDEX idx_contractor (contractor_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin', 'contractor', 'customer') NOT NULL,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_type, user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample contractors
INSERT INTO contractors (title, description, phone, email, website, city, categories, rating, reviews_count, is_featured) VALUES
('בריכות אלון - מומחים בבריכות בטון', 'חברה מובילה בתחום בניית בריכות בטון מותאמות אישית. ניסיון של מעל 15 שנה.', '052-1234567', 'info@alon-pools.co.il', 'https://alon-pools.co.il', 'תל אביב', '["בטון", "עיצוב", "תחזוקה"]', 4.8, 127, TRUE),
('פיברגלס פרימיום - בריכות פיברגלס', 'התמחות בבריכות פיברגלס איכותיות עם התקנה מהירה ואחריות מלאה.', '053-2345678', 'sales@premium-fiber.co.il', 'https://premium-fiber.co.il', 'חיפה', '["פיברגלס", "התקנה מהירה"]', 4.6, 89, FALSE),
('בריכות מתועשות ישראל', 'פתרונות בריכות מתועשות חדשניים במחירים אטרקטיביים.', '054-3456789', 'contact@modular-pools.co.il', NULL, 'ירושלים', '["מתועש", "חסכוני"]', 4.4, 56, TRUE),
('שיפוצי בריכות מקצועיים', 'מומחים בשיפוץ ושדרוג בריכות קיימות. שירות מהיר ואמין.', '055-4567890', 'info@pool-renovations.co.il', NULL, 'נתניה', '["שיפוץ", "תחזוקה", "שדרוג"]', 4.7, 73, FALSE),
('אקווה דיזיין - בריכות יוקרה', 'עיצוב ובנייה של בריכות יוקרה עם פתרונות טכנולוגיים מתקדמים.', '056-5678901', 'design@aqua-design.co.il', 'https://aqua-design.co.il', 'הרצליה', '["יוקרה", "עיצוב", "טכנולוגיה"]', 4.9, 45, TRUE);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('quote_fee_per_lead', '20.00', 'number', 'עמלה בסיסית לכל ליד'),
('quote_fee_premium', '35.00', 'number', 'עמלה לליד בלעדי'),
('max_contractors_per_quote', '3', 'number', 'מספר מקסימלי של קבלנים לכל בקשה'),
('sms_verification_timeout', '300', 'number', 'זמן תוקף קוד SMS בשניות'),
('quote_auto_expire_days', '30', 'number', 'ימים לפני שבקשה מתיישנת'),
('system_email', 'admin@israel-pool.top', 'string', 'כתובת אימייל מערכת'),
('sms_sender_name', 'PoolIsrael', 'string', 'שם שולח SMS'),
('enable_image_upload', 'true', 'boolean', 'אפשר העלאת תמונות'),
('max_images_per_quote', '5', 'number', 'מספר מקסימלי תמונות לבקשה'),
('sms_api_key', 'iHXHOETxM', 'string', 'מפתח API של SMS'),
('sms_user', '0584995151', 'string', 'משתמש SMS'),
('sms_sender_phone', '0584995151', 'string', 'מספר שולח SMS');

-- Insert admin user (password: pool2024!)
INSERT INTO admin_users (username, password_hash, email, full_name, role, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@israel-pool.top', 'מנהל מערכת', 'admin', TRUE);

-- Show success message
SELECT 'Database setup completed successfully!' as Status;
SELECT COUNT(*) as 'Tables Created' FROM information_schema.tables WHERE table_schema = 'shlomion_israelpool';
SELECT COUNT(*) as 'Contractors Added' FROM contractors;
SELECT COUNT(*) as 'Settings Added' FROM system_settings;
