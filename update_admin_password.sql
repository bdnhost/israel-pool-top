-- Update admin password with proper hash
-- Password: pool2024!

UPDATE admin_users 
SET password_hash = '$2y$10$YourHashedPasswordHere' 
WHERE username = 'admin';

-- Alternative: Delete and recreate with correct hash
DELETE FROM admin_users WHERE username = 'admin';

INSERT INTO admin_users (username, password_hash, email, full_name, role, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@israel-pool.top', 'מנהל מערכת', 'admin', TRUE);
