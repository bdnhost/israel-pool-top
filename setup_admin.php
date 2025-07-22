<?php
/**
 * Pool Israel - Setup Admin User
 * יצירת משתמש אדמין ברירת מחדל
 */

require_once 'includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "<h1>הגדרת משתמש אדמין - Pool Israel</h1>";
    
    // Check if admin user already exists
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $stmt->execute();
    $adminCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($adminCount > 0) {
        echo "<p style='color: orange;'>⚠️ משתמש אדמין כבר קיים במערכת</p>";
        
        // Show existing admin users
        $stmt = $db->prepare("SELECT id, username, email, status, created_at FROM users WHERE role = 'admin'");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h2>משתמשי אדמין קיימים:</h2>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>שם משתמש</th><th>אימייל</th><th>סטטוס</th><th>תאריך יצירה</th></tr>";
        
        foreach ($admins as $admin) {
            echo "<tr>";
            echo "<td>{$admin['id']}</td>";
            echo "<td>{$admin['username']}</td>";
            echo "<td>{$admin['email']}</td>";
            echo "<td>{$admin['status']}</td>";
            echo "<td>{$admin['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        // Create default admin user
        $username = 'admin';
        $email = 'admin@israel-pool.top';
        $password = 'admin123'; // Change this in production!
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $db->prepare("
            INSERT INTO users (username, email, password_hash, role, status, created_at) 
            VALUES (?, ?, ?, 'admin', 'active', NOW())
        ");
        
        $result = $stmt->execute([$username, $email, $password_hash]);
        
        if ($result) {
            $adminId = $db->lastInsertId();
            
            echo "<p style='color: green;'>✅ משתמש אדמין נוצר בהצלחה!</p>";
            echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
            echo "<h3>פרטי התחברות:</h3>";
            echo "<p><strong>שם משתמש:</strong> {$username}</p>";
            echo "<p><strong>סיסמה:</strong> {$password}</p>";
            echo "<p><strong>אימייל:</strong> {$email}</p>";
            echo "<p style='color: red;'><strong>חשוב:</strong> שנה את הסיסמה לאחר ההתחברות הראשונה!</p>";
            echo "</div>";
            
            // Log the creation
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, entity_id, action, details, ip_address) 
                VALUES ('user', ?, 'admin_created', ?, ?)
            ");
            $logStmt->execute([
                $adminId,
                json_encode(['username' => $username, 'email' => $email]),
                $_SERVER['REMOTE_ADDR'] ?? 'localhost'
            ]);
            
        } else {
            echo "<p style='color: red;'>❌ שגיאה ביצירת משתמש אדמין</p>";
        }
    }
    
    // Test database tables
    echo "<h2>בדיקת טבלאות מסד הנתונים:</h2>";
    
    $tables = [
        'users' => 'משתמשים',
        'contractors' => 'קבלנים', 
        'quote_requests' => 'בקשות הצעות מחיר',
        'system_settings' => 'הגדרות מערכת',
        'activity_logs' => 'לוגי פעילות',
        'sms_verifications' => 'אימותי SMS'
    ];
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>טבלה</th><th>תיאור</th><th>מספר רשומות</th><th>סטטוס</th></tr>";
    
    foreach ($tables as $table => $description) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM `{$table}`");
            $stmt->execute();
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $status = "✅ קיימת";
            $color = "green";
        } catch (Exception $e) {
            $count = "N/A";
            $status = "❌ לא קיימת";
            $color = "red";
        }
        
        echo "<tr>";
        echo "<td><strong>{$table}</strong></td>";
        echo "<td>{$description}</td>";
        echo "<td>{$count}</td>";
        echo "<td style='color: {$color};'>{$status}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Test API endpoints
    echo "<h2>בדיקת נקודות API:</h2>";
    
    $apiEndpoints = [
        '/api/admin.php?action=get_stats' => 'סטטיסטיקות דשבורד',
        '/api/contractors.php?action=get_contractors' => 'רשימת קבלנים',
        '/api/settings.php?action=get_settings' => 'הגדרות מערכת'
    ];
    
    echo "<ul>";
    foreach ($apiEndpoints as $endpoint => $description) {
        echo "<li>";
        echo "<strong>{$description}:</strong> ";
        echo "<a href='{$endpoint}' target='_blank'>{$endpoint}</a>";
        echo "</li>";
    }
    echo "</ul>";
    
    echo "<h2>צעדים הבאים:</h2>";
    echo "<ol>";
    echo "<li>התחבר לדף האדמין: <a href='/admin/index.html' target='_blank'>/admin/index.html</a></li>";
    echo "<li>שנה את סיסמת האדמין</li>";
    echo "<li>בדוק שכל הפונקציות עובדות</li>";
    echo "<li>מחק את הקובץ הזה לאחר ההגדרה</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<h1 style='color: red;'>שגיאה בהגדרת המערכת</h1>";
    echo "<p>שגיאה: " . $e->getMessage() . "</p>";
    echo "<p>אנא בדוק את הגדרות החיבור למסד הנתונים</p>";
}
?>
