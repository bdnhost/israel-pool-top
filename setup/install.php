<?php
/**
 * Pool Israel Installation Script
 * Sets up the complete quote system database and initial data
 */

// Configuration
$config = [
    'db_host' => 'localhost',
    'db_name' => 'shlomion_israelpool',
    'db_user' => 'shlomion_israel-pool',
    'db_pass' => 'f^NUl$!VKKid',
    'admin_user' => 'admin',
    'admin_pass' => 'pool2024!',
    'sms_api_key' => 'iHXHOETxM',
    'sms_user' => '0584995151',
    'sms_sender' => '0584995151'
];

echo "<!DOCTYPE html>
<html lang='he' dir='rtl'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>התקנת מערכת Pool Israel</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .step { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .success { border-color: #28a745; background: #d4edda; }
        .error { border-color: #dc3545; background: #f8d7da; }
        .warning { border-color: #ffc107; background: #fff3cd; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🏊 התקנת מערכת Pool Israel</h1>
    <p>סקריפט זה יתקין את מסד הנתונים ויגדיר את המערכת המלאה.</p>";

try {
    // Step 1: Database Connection
    echo "<div class='step'>";
    echo "<h3>שלב 1: חיבור למסד נתונים</h3>";
    
    $pdo = new PDO(
        "mysql:host={$config['db_host']};charset=utf8mb4",
        $config['db_user'],
        $config['db_pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    );
    
    echo "✅ חיבור למסד נתונים הצליח<br>";
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$config['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$config['db_name']}`");
    
    echo "✅ מסד נתונים '{$config['db_name']}' נוצר/נבחר בהצלחה";
    echo "</div>";
    
    // Step 2: Create Tables
    echo "<div class='step'>";
    echo "<h3>שלב 2: יצירת טבלאות</h3>";
    
    // Create tables directly instead of reading SQL file
    $tables_created = 0;

    // Create contractors table FIRST (referenced by other tables)
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create quotes table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create quote_assignments table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create system_settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT,
            setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            INDEX idx_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create sms_logs table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create admin_users table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    $tables_created++;

    // Create contractor_payments table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    // Create activity_logs table
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $tables_created++;

    echo "✅ {$tables_created} טבלאות נוצרו בהצלחה";
    echo "</div>";
    
    // Step 3: Insert Sample Data
    echo "<div class='step'>";
    echo "<h3>שלב 3: הכנסת נתונים לדוגמה</h3>";
    
    // Insert sample contractors
    $sample_contractors = [
        [
            'title' => 'בריכות אלון - מומחים בבריכות בטון',
            'description' => 'חברה מובילה בתחום בניית בריכות בטון מותאמות אישית. ניסיון של מעל 15 שנה.',
            'phone' => '052-1234567',
            'email' => 'info@alon-pools.co.il',
            'website' => 'https://alon-pools.co.il',
            'city' => 'תל אביב',
            'categories' => '["בטון", "עיצוב", "תחזוקה"]',
            'rating' => 4.8,
            'reviews_count' => 127,
            'is_featured' => true
        ],
        [
            'title' => 'פיברגלס פרימיום - בריכות פיברגלס',
            'description' => 'התמחות בבריכות פיברגלס איכותיות עם התקנה מהירה ואחריות מלאה.',
            'phone' => '053-2345678',
            'email' => 'sales@premium-fiber.co.il',
            'website' => 'https://premium-fiber.co.il',
            'city' => 'חיפה',
            'categories' => '["פיברגלס", "התקנה מהירה"]',
            'rating' => 4.6,
            'reviews_count' => 89,
            'is_featured' => false
        ],
        [
            'title' => 'בריכות מתועשות ישראל',
            'description' => 'פתרונות בריכות מתועשות חדשניים במחירים אטרקטיביים.',
            'phone' => '054-3456789',
            'email' => 'contact@modular-pools.co.il',
            'city' => 'ירושלים',
            'categories' => '["מתועש", "חסכוני"]',
            'rating' => 4.4,
            'reviews_count' => 56,
            'is_featured' => true
        ],
        [
            'title' => 'שיפוצי בריכות מקצועיים',
            'description' => 'מומחים בשיפוץ ושדרוג בריכות קיימות. שירות מהיר ואמין.',
            'phone' => '055-4567890',
            'email' => 'info@pool-renovations.co.il',
            'city' => 'נתניה',
            'categories' => '["שיפוץ", "תחזוקה", "שדרוג"]',
            'rating' => 4.7,
            'reviews_count' => 73,
            'is_featured' => false
        ],
        [
            'title' => 'אקווה דיזיין - בריכות יוקרה',
            'description' => 'עיצוב ובנייה של בריכות יוקרה עם פתרונות טכנולוגיים מתקדמים.',
            'phone' => '056-5678901',
            'email' => 'design@aqua-design.co.il',
            'website' => 'https://aqua-design.co.il',
            'city' => 'הרצליה',
            'categories' => '["יוקרה", "עיצוב", "טכנולוגיה"]',
            'rating' => 4.9,
            'reviews_count' => 45,
            'is_featured' => true
        ]
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO contractors (title, description, phone, email, website, city, categories, rating, reviews_count, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title)
    ");
    
    $inserted = 0;
    foreach ($sample_contractors as $contractor) {
        $stmt->execute([
            $contractor['title'],
            $contractor['description'],
            $contractor['phone'],
            $contractor['email'],
            $contractor['website'] ?? null,
            $contractor['city'],
            $contractor['categories'],
            $contractor['rating'],
            $contractor['reviews_count'],
            $contractor['is_featured']
        ]);
        $inserted++;
    }
    
    echo "✅ {$inserted} קבלנים לדוגמה הוכנסו בהצלחה<br>";
    
    // Insert system settings
    $settings = [
        ['quote_fee_per_lead', '20.00', 'number', 'עמלה בסיסית לכל ליד'],
        ['quote_fee_premium', '35.00', 'number', 'עמלה לליד בלעדי'],
        ['max_contractors_per_quote', '3', 'number', 'מספר מקסימלי של קבלנים לכל בקשה'],
        ['sms_verification_timeout', '300', 'number', 'זמן תוקף קוד SMS בשניות'],
        ['quote_auto_expire_days', '30', 'number', 'ימים לפני שבקשה מתיישנת'],
        ['system_email', 'admin@israel-pool.top', 'string', 'כתובת אימייל מערכת'],
        ['sms_sender_name', 'PoolIsrael', 'string', 'שם שולח SMS'],
        ['enable_image_upload', 'true', 'boolean', 'אפשר העלאת תמונות'],
        ['max_images_per_quote', '5', 'number', 'מספר מקסימלי תמונות לבקשה'],
        ['sms_api_key', $config['sms_api_key'], 'string', 'מפתח API של SMS'],
        ['sms_user', $config['sms_user'], 'string', 'משתמש SMS'],
        ['sms_sender_phone', $config['sms_sender'], 'string', 'מספר שולח SMS']
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ");
    
    $settings_inserted = 0;
    foreach ($settings as $setting) {
        $stmt->execute($setting);
        $settings_inserted++;
    }
    
    echo "✅ {$settings_inserted} הגדרות מערכת הוגדרו בהצלחה<br>";

    // Create admin user
    $admin_password_hash = password_hash($config['admin_pass'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("
        INSERT INTO admin_users (username, password_hash, email, full_name, role, is_active)
        VALUES (?, ?, ?, ?, 'admin', TRUE)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    ");

    $stmt->execute([
        $config['admin_user'],
        $admin_password_hash,
        'admin@israel-pool.top',
        'מנהל מערכת'
    ]);

    echo "✅ משתמש אדמין נוצר בהצלחה";
    echo "</div>";
    
    // Step 4: Create Directories
    echo "<div class='step'>";
    echo "<h3>שלב 4: יצירת תיקיות</h3>";
    
    $directories = [
        '../uploads',
        '../uploads/quotes',
        '../uploads/quotes/' . date('Y'),
        '../uploads/quotes/' . date('Y/m'),
        '../logs'
    ];
    
    $created = 0;
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (mkdir($dir, 0755, true)) {
                $created++;
                echo "✅ תיקייה נוצרה: {$dir}<br>";
            } else {
                echo "⚠️ לא ניתן ליצור תיקייה: {$dir}<br>";
            }
        } else {
            echo "ℹ️ תיקייה כבר קיימת: {$dir}<br>";
        }
    }
    
    echo "✅ {$created} תיקיות חדשות נוצרו";
    echo "</div>";
    
    // Step 5: Configuration Files
    echo "<div class='step'>";
    echo "<h3>שלב 5: קבצי הגדרות</h3>";
    
    // Create database config file
    $db_config = "<?php
/**
 * Database Configuration
 * Generated by installation script
 */

class Database {
    private \$host = '{$config['db_host']}';
    private \$db_name = '{$config['db_name']}';
    private \$username = '{$config['db_user']}';
    private \$password = '{$config['db_pass']}';
    private \$conn;
    
    public function getConnection() {
        \$this->conn = null;
        
        try {
            \$this->conn = new PDO(
                \"mysql:host=\" . \$this->host . \";dbname=\" . \$this->db_name . \";charset=utf8mb4\",
                \$this->username,
                \$this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => \"SET NAMES utf8mb4\"
                ]
            );
        } catch(PDOException \$exception) {
            echo \"Connection error: \" . \$exception->getMessage();
        }
        
        return \$this->conn;
    }
}
?>";
    
    if (file_put_contents('../includes/database.php', $db_config)) {
        echo "✅ קובץ הגדרות מסד נתונים נוצר בהצלחה<br>";
    } else {
        echo "⚠️ לא ניתן ליצור קובץ הגדרות מסד נתונים<br>";
    }
    
    // Create .htaccess for security
    $htaccess = "# Pool Israel Security Settings
RewriteEngine On

# Protect sensitive files
<Files ~ \"\\.(sql|log|env)$\">
    Order allow,deny
    Deny from all
</Files>

# Protect includes directory
<Directory \"includes\">
    Order allow,deny
    Deny from all
</Directory>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css \"access plus 1 year\"
    ExpiresByType application/javascript \"access plus 1 year\"
    ExpiresByType image/png \"access plus 1 year\"
    ExpiresByType image/jpg \"access plus 1 year\"
    ExpiresByType image/jpeg \"access plus 1 year\"
</IfModule>";
    
    if (file_put_contents('../.htaccess', $htaccess)) {
        echo "✅ קובץ .htaccess נוצר בהצלחה<br>";
    }
    
    echo "✅ קבצי הגדרות הושלמו";
    echo "</div>";
    
    // Step 6: Final Summary
    echo "<div class='step success'>";
    echo "<h3>🎉 ההתקנה הושלמה בהצלחה!</h3>";
    echo "<p><strong>המערכת מוכנה לשימוש:</strong></p>";
    echo "<ul>";
    echo "<li>✅ מסד נתונים הוגדר עם כל הטבלאות הנדרשות</li>";
    echo "<li>✅ {$inserted} קבלנים לדוגמה הוכנסו</li>";
    echo "<li>✅ הגדרות מערכת הוגדרו</li>";
    echo "<li>✅ תיקיות הועלאה נוצרו</li>";
    echo "<li>✅ קבצי אבטחה הוגדרו</li>";
    echo "</ul>";
    
    echo "<h4>פרטי גישה:</h4>";
    echo "<ul>";
    echo "<li><strong>פאנל ניהול:</strong> <a href='../admin/index.html' target='_blank'>admin/index.html</a></li>";
    echo "<li><strong>משתמש אדמין:</strong> {$config['admin_user']}</li>";
    echo "<li><strong>סיסמת אדמין:</strong> {$config['admin_pass']}</li>";
    echo "<li><strong>דף קבלנים:</strong> <a href='../contractors_page.html' target='_blank'>contractors_page.html</a></li>";
    echo "<li><strong>דשבורד קבלן:</strong> <a href='../contractor/dashboard.html?contractor_id=1' target='_blank'>contractor/dashboard.html</a></li>";
    echo "</ul>";
    
    echo "<h4>הגדרות SMS:</h4>";
    echo "<ul>";
    echo "<li><strong>API Key:</strong> {$config['sms_api_key']}</li>";
    echo "<li><strong>משתמש:</strong> {$config['sms_user']}</li>";
    echo "<li><strong>שולח:</strong> {$config['sms_sender']}</li>";
    echo "</ul>";
    
    echo "<div class='warning'>";
    echo "<h4>⚠️ חשוב לבצע:</h4>";
    echo "<ol>";
    echo "<li>הגדר את סיסמת SMS בקובץ includes/SMSService.php</li>";
    echo "<li>בדוק שהשרת תומך ב-PHP 7.4+ ו-MySQL 5.7+</li>";
    echo "<li>ודא שתיקיית uploads/ ניתנת לכתיבה</li>";
    echo "<li>מחק את קובץ ההתקנה הזה לאחר השלמת ההגדרה</li>";
    echo "</ol>";
    echo "</div>";
    
    echo "<p><a href='../contractors_page.html' class='btn'>🏊 עבור לאתר</a></p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='step error'>";
    echo "<h3>❌ שגיאה בהתקנה</h3>";
    echo "<p><strong>שגיאה:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    echo "</div>";
}

echo "</body></html>";
?>
