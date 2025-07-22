<?php
/**
 * Test Database Connection and Data
 * בדיקת חיבור למסד הנתונים ונתונים קיימים
 */

require_once 'includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "<h1>בדיקת חיבור למסד הנתונים - Pool Israel</h1>";
    echo "<p>חיבור למסד הנתונים: <strong style='color: green;'>✓ הצליח</strong></p>";
    
    // בדיקת טבלאות קיימות
    $tables = [
        'contractors' => 'קבלנים',
        'quote_requests' => 'בקשות הצעות מחיר',
        'users' => 'משתמשים',
        'sms_verifications' => 'אימותי SMS',
        'activity_logs' => 'לוגי פעילות',
        'system_settings' => 'הגדרות מערכת',
        'admin_users' => 'משתמשי אדמין',
        'daily_stats' => 'סטטיסטיקות יומיות'
    ];
    
    echo "<h2>טבלאות במסד הנתונים:</h2>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>טבלה</th><th>תיאור</th><th>מספר רשומות</th><th>סטטוס</th></tr>";
    
    foreach ($tables as $table => $description) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM `{$table}`");
            $stmt->execute();
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $status = "✓ קיימת";
            $color = "green";
        } catch (Exception $e) {
            $count = "N/A";
            $status = "✗ לא קיימת";
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
    
    // בדיקת נתוני קבלנים
    echo "<h2>דוגמת נתוני קבלנים:</h2>";
    try {
        $stmt = $db->prepare("SELECT id, title, city, phone, status, created_at FROM contractors LIMIT 5");
        $stmt->execute();
        $contractors = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($contractors)) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>שם</th><th>עיר</th><th>טלפון</th><th>סטטוס</th><th>תאריך יצירה</th></tr>";
            
            foreach ($contractors as $contractor) {
                echo "<tr>";
                echo "<td>{$contractor['id']}</td>";
                echo "<td>{$contractor['title']}</td>";
                echo "<td>{$contractor['city']}</td>";
                echo "<td>{$contractor['phone']}</td>";
                echo "<td>{$contractor['status']}</td>";
                echo "<td>{$contractor['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: orange;'>אין נתוני קבלנים במסד הנתונים</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>שגיאה בטעינת נתוני קבלנים: " . $e->getMessage() . "</p>";
    }
    
    // בדיקת נתוני בקשות
    echo "<h2>דוגמת בקשות הצעות מחיר:</h2>";
    try {
        $stmt = $db->prepare("SELECT id, customer_name, customer_phone, pool_type, status, created_at FROM quote_requests LIMIT 5");
        $stmt->execute();
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($quotes)) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>שם לקוח</th><th>טלפון</th><th>סוג בריכה</th><th>סטטוס</th><th>תאריך</th></tr>";
            
            foreach ($quotes as $quote) {
                echo "<tr>";
                echo "<td>{$quote['id']}</td>";
                echo "<td>{$quote['customer_name']}</td>";
                echo "<td>{$quote['customer_phone']}</td>";
                echo "<td>{$quote['pool_type']}</td>";
                echo "<td>{$quote['status']}</td>";
                echo "<td>{$quote['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: orange;'>אין בקשות הצעות מחיר במסד הנתונים</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>שגיאה בטעינת בקשות: " . $e->getMessage() . "</p>";
    }
    
    // בדיקת הגדרות מערכת
    echo "<h2>הגדרות מערכת:</h2>";
    try {
        $stmt = $db->prepare("SELECT setting_key, setting_value FROM system_settings LIMIT 10");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($settings)) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>מפתח</th><th>ערך</th></tr>";
            
            foreach ($settings as $setting) {
                echo "<tr>";
                echo "<td>{$setting['setting_key']}</td>";
                echo "<td>{$setting['setting_value']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: orange;'>אין הגדרות מערכת במסד הנתונים</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>שגיאה בטעינת הגדרות: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<h1 style='color: red;'>שגיאה בחיבור למסד הנתונים</h1>";
    echo "<p>שגיאה: " . $e->getMessage() . "</p>";
    echo "<p>אנא בדוק את הגדרות החיבור בקובץ includes/config.php</p>";
}
?>
