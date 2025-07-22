<?php
/**
 * Simple Config Creator - Pool Israel
 * Creates the database.php config file
 */

// Configuration
$config = [
    'db_host' => 'localhost',
    'db_name' => 'shlomion_israelpool',
    'db_user' => 'shlomion_israel-pool',
    'db_pass' => 'f^NUl$!VKKid'
];

echo "<!DOCTYPE html>
<html lang='he' dir='rtl'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>יצירת קובץ הגדרות - Pool Israel</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .error { background: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔧 יצירת קובץ הגדרות Pool Israel</h1>";

try {
    // Create includes directory if not exists
    if (!is_dir('../includes')) {
        mkdir('../includes', 0755, true);
        echo "<p>✅ תיקיית includes נוצרה</p>";
    }
    
    // Create database config file
    $db_config = "<?php
/**
 * Database Configuration - Pool Israel
 * Generated automatically
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
    
    public function testConnection() {
        try {
            \$conn = \$this->getConnection();
            if (\$conn) {
                return true;
            }
        } catch(Exception \$e) {
            return false;
        }
        return false;
    }
}
?>";
    
    if (file_put_contents('../includes/database.php', $db_config)) {
        echo "<div class='success'>";
        echo "<h3>✅ הצלחה!</h3>";
        echo "<p>קובץ הגדרות מסד נתונים נוצר בהצלחה:</p>";
        echo "<p><strong>מיקום:</strong> includes/database.php</p>";
        echo "<p><strong>מסד נתונים:</strong> {$config['db_name']}</p>";
        echo "<p><strong>משתמש:</strong> {$config['db_user']}</p>";
        echo "</div>";
        
        // Test connection
        echo "<div class='success'>";
        echo "<h3>🔍 בדיקת חיבור</h3>";
        
        require_once '../includes/database.php';
        $db = new Database();
        
        if ($db->testConnection()) {
            echo "<p>✅ חיבור למסד נתונים עובד בהצלחה!</p>";
        } else {
            echo "<p>❌ שגיאה בחיבור למסד נתונים</p>";
        }
        echo "</div>";
        
    } else {
        echo "<div class='error'>";
        echo "<h3>❌ שגיאה</h3>";
        echo "<p>לא ניתן ליצור קובץ הגדרות מסד נתונים</p>";
        echo "<p>בדוק הרשאות תיקייה</p>";
        echo "</div>";
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
        echo "<p>✅ קובץ .htaccess נוצר לאבטחה</p>";
    }
    
    echo "<div class='success'>";
    echo "<h3>📋 השלבים הבאים:</h3>";
    echo "<ol>";
    echo "<li><strong>הרץ את קובץ ה-SQL:</strong> העלה את <code>create_missing_tables.sql</code> ל-phpMyAdmin</li>";
    echo "<li><strong>בדוק את האתר:</strong> <a href='../contractors_page.html' target='_blank'>דף קבלנים</a></li>";
    echo "<li><strong>בדוק API:</strong> <a href='../api/contractors.php?action=featured' target='_blank'>API קבלנים</a></li>";
    echo "<li><strong>פאנל אדמין:</strong> <a href='../admin/index.html' target='_blank'>admin/index.html</a> (admin/pool2024!)</li>";
    echo "</ol>";
    echo "</div>";
    
    echo "<div class='success'>";
    echo "<h3>🔧 עדכון נדרש:</h3>";
    echo "<p>עדכן את סיסמת SMS בקובץ <code>includes/SMSService.php</code> שורה 67:</p>";
    echo "<pre>'pass' => 'YOUR_SMS_PASSWORD', // החלף עם הסיסמה האמיתית</pre>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "<h3>❌ שגיאה</h3>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}

echo "<p><a href='../home.html' class='btn'>🏊 עבור לאתר</a></p>";
echo "</body></html>";
?>
