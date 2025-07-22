-- Pool Israel - Insert Data Only
-- Run this AFTER creating tables

-- Insert system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
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

-- Insert admin user - password: pool2024!
INSERT IGNORE INTO admin_users (username, password_hash, email, full_name, role, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@israel-pool.top', 'מנהל מערכת', 'admin', TRUE);
