-- Pool Israel Quote System Database Schema
-- Run this after the main contractors table is created

-- טבלת אימותי SMS
CREATE TABLE IF NOT EXISTS sms_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('customer_verification', 'contractor_registration') DEFAULT 'customer_verification',
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_phone_code (phone, code),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת בקשות הצעות מחיר
CREATE TABLE IF NOT EXISTS quote_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE NOT NULL, -- מספר בקשה ייחודי לתצוגה
    
    -- פרטי הלקוח
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    customer_city VARCHAR(50),
    customer_address TEXT,
    
    -- פרטי הפרויקט
    pool_type ENUM('concrete', 'fiberglass', 'modular', 'renovation', 'maintenance') NOT NULL,
    pool_size ENUM('small', 'medium', 'large', 'xl', 'unknown') NOT NULL,
    budget_range ENUM('under_100k', '100k_200k', '200k_300k', '300k_500k', 'over_500k', 'unknown') NOT NULL,
    project_location VARCHAR(200),
    preferred_timing ENUM('asap', '1_month', '1_3_months', '3_6_months', '6_12_months', 'flexible') NOT NULL,
    
    -- תיאור ודרישות מיוחדות
    description TEXT,
    special_requirements JSON, -- מערך של דרישות מיוחדות
    images JSON, -- מערך של נתיבי תמונות
    
    -- סטטוס ומעקב
    status ENUM('pending', 'sent_to_contractors', 'contractors_responded', 'customer_chose', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('normal', 'urgent', 'vip') DEFAULT 'normal',
    
    -- מטא דאטה
    source VARCHAR(50) DEFAULT 'website', -- מאיפה הגיעה הבקשה
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_request_number (request_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת קשר בין בקשות לקבלנים
CREATE TABLE IF NOT EXISTS quote_contractor_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_request_id INT NOT NULL,
    contractor_id INT NOT NULL,
    
    -- סטטוס השליחה
    sent_at TIMESTAMP NULL,
    sms_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    
    -- תגובת הקבלן
    viewed_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    response_type ENUM('interested', 'not_interested', 'need_more_info') NULL,
    estimated_price DECIMAL(10,2) NULL,
    estimated_duration VARCHAR(50) NULL,
    contractor_notes TEXT,
    
    -- עמלות
    fee_amount DECIMAL(8,2) DEFAULT 0.00,
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_paid_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_assignment (quote_request_id, contractor_id),
    INDEX idx_contractor_sent (contractor_id, sent_at),
    INDEX idx_quote_status (quote_request_id, response_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת הגדרות מערכת
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- הגדרות ברירת מחדל
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('quote_fee_per_lead', '20.00', 'number', 'עמלה בסיסית לכל ליד'),
('quote_fee_premium', '35.00', 'number', 'עמלה לליד בלעדי'),
('max_contractors_per_quote', '3', 'number', 'מספר מקסימלי של קבלנים לכל בקשה'),
('sms_verification_timeout', '300', 'number', 'זמן תוקף קוד SMS בשניות'),
('quote_auto_expire_days', '30', 'number', 'ימים לפני שבקשה מתיישנת'),
('system_email', 'admin@israel-pool.top', 'string', 'כתובת אימייל מערכת'),
('sms_sender_name', 'PoolIsrael', 'string', 'שם שולח SMS'),
('enable_image_upload', 'true', 'boolean', 'אפשר העלאת תמונות'),
('max_images_per_quote', '5', 'number', 'מספר מקסימלי תמונות לבקשה')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- טבלת לוגים למעקב
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('quote_request', 'contractor', 'sms', 'system') NOT NULL,
    entity_id INT,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת סטטיסטיקות (לדשבורד)
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE UNIQUE NOT NULL,
    quotes_created INT DEFAULT 0,
    quotes_sent INT DEFAULT 0,
    contractors_responded INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0.00,
    
    INDEX idx_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- פונקציה ליצירת מספר בקשה ייחודי
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_quote_number() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE quote_num VARCHAR(20);
    DECLARE counter INT DEFAULT 1;
    DECLARE today_str VARCHAR(8);
    
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    
    REPEAT
        SET quote_num = CONCAT('PQ', today_str, LPAD(counter, 3, '0'));
        SET counter = counter + 1;
    UNTIL NOT EXISTS (SELECT 1 FROM quote_requests WHERE request_number = quote_num)
    END REPEAT;
    
    RETURN quote_num;
END//
DELIMITER ;

-- טריגר ליצירת מספר בקשה אוטומטי
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_quote_insert 
BEFORE INSERT ON quote_requests
FOR EACH ROW
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        SET NEW.request_number = generate_quote_number();
    END IF;
END//
DELIMITER ;
