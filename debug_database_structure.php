<?php
/**
 * Pool Israel - Database Structure Debug
 * בדיקת מבנה מסד הנתונים shlomion_israelpool
 */

require_once 'includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "<h1>🔍 בדיקת מבנה מסד הנתונים - shlomion_israelpool</h1>";
    echo "<style>
        body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; }
        .table-name { background-color: #e3f2fd; font-weight: bold; }
        .error { color: red; }
        .success { color: green; }
        .warning { color: orange; }
    </style>";
    
    // רשימת הטבלאות שצריך לבדוק
    $criticalTables = [
        'system_settings' => 'הגדרות מערכת',
        'admin_users' => 'משתמשי אדמין',
        'users' => 'משתמשים',
        'system_users' => 'משתמשי מערכת',
        'settings' => 'הגדרות',
        'contractors' => 'קבלנים',
        'quote_requests' => 'בקשות הצעות מחיר',
        'activity_logs' => 'לוגי פעילות',
        'sms_verifications' => 'אימותי SMS'
    ];
    
    echo "<h2>📋 בדיקת קיום טבלאות:</h2>";
    echo "<table>";
    echo "<tr><th>שם טבלה</th><th>תיאור</th><th>סטטוס</th><th>מספר רשומות</th></tr>";
    
    $existingTables = [];
    
    foreach ($criticalTables as $tableName => $description) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM `{$tableName}`");
            $stmt->execute();
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $status = "<span class='success'>✅ קיימת</span>";
            $existingTables[] = $tableName;
        } catch (Exception $e) {
            $count = "N/A";
            $status = "<span class='error'>❌ לא קיימת</span>";
        }
        
        echo "<tr>";
        echo "<td><strong>{$tableName}</strong></td>";
        echo "<td>{$description}</td>";
        echo "<td>{$status}</td>";
        echo "<td>{$count}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // בדיקת מבנה הטבלאות הקיימות
    foreach ($existingTables as $tableName) {
        echo "<h2>🔧 מבנה טבלה: {$tableName}</h2>";
        
        try {
            $stmt = $db->prepare("DESCRIBE `{$tableName}`");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table>";
            echo "<tr class='table-name'><th>שם עמודה</th><th>סוג נתונים</th><th>NULL</th><th>מפתח</th><th>ברירת מחדל</th><th>נוסף</th></tr>";
            
            foreach ($columns as $column) {
                echo "<tr>";
                echo "<td><strong>{$column['Field']}</strong></td>";
                echo "<td>{$column['Type']}</td>";
                echo "<td>{$column['Null']}</td>";
                echo "<td>{$column['Key']}</td>";
                echo "<td>{$column['Default']}</td>";
                echo "<td>{$column['Extra']}</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // דוגמת נתונים
            if (in_array($tableName, ['system_settings', 'admin_users', 'users'])) {
                echo "<h3>📄 דוגמת נתונים מ-{$tableName}:</h3>";
                $stmt = $db->prepare("SELECT * FROM `{$tableName}` LIMIT 3");
                $stmt->execute();
                $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($samples)) {
                    echo "<table>";
                    // כותרות
                    echo "<tr class='table-name'>";
                    foreach (array_keys($samples[0]) as $key) {
                        echo "<th>{$key}</th>";
                    }
                    echo "</tr>";
                    
                    // נתונים
                    foreach ($samples as $row) {
                        echo "<tr>";
                        foreach ($row as $value) {
                            $displayValue = strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value;
                            echo "<td>{$displayValue}</td>";
                        }
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='warning'>⚠️ הטבלה ריקה</p>";
                }
            }
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ שגיאה בקריאת מבנה הטבלה: " . $e->getMessage() . "</p>";
        }
    }
    
    // בדיקת שאילתות בעייתיות
    echo "<h2>🚨 בדיקת שאילתות בעייתיות:</h2>";
    
    $problematicQueries = [
        "SELECT * FROM system_settings WHERE category = 'test'" => "בדיקת עמודה category בטבלה system_settings",
        "SELECT * FROM admin_users LIMIT 1" => "בדיקת טבלה admin_users",
        "SELECT * FROM system_users LIMIT 1" => "בדיקת טבלה system_users"
    ];
    
    echo "<table>";
    echo "<tr><th>שאילתה</th><th>תיאור</th><th>תוצאה</th></tr>";
    
    foreach ($problematicQueries as $query => $description) {
        try {
            $stmt = $db->prepare($query);
            $stmt->execute();
            $result = "<span class='success'>✅ עובדת</span>";
        } catch (Exception $e) {
            $result = "<span class='error'>❌ שגיאה: " . $e->getMessage() . "</span>";
        }
        
        echo "<tr>";
        echo "<td><code>{$query}</code></td>";
        echo "<td>{$description}</td>";
        echo "<td>{$result}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // המלצות לתיקון
    echo "<h2>💡 המלצות לתיקון:</h2>";
    echo "<div style='background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;'>";
    echo "<h3>בעיות שזוהו:</h3>";
    echo "<ul>";
    
    if (!in_array('admin_users', $existingTables)) {
        echo "<li><strong>טבלה admin_users לא קיימת</strong> - יש להשתמש בטבלה users עם role='admin'</li>";
    }
    
    if (!in_array('system_users', $existingTables)) {
        echo "<li><strong>טבלה system_users לא קיימת</strong> - יש להשתמש בטבלה users</li>";
    }
    
    echo "<li><strong>עמודה category</strong> - יש לבדוק אם קיימת בטבלה system_settings</li>";
    echo "<li><strong>התאמת שאילתות</strong> - יש לעדכן את כל קבצי ה-API</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<h1 style='color: red;'>❌ שגיאה קריטית בחיבור למסד הנתונים</h1>";
    echo "<p>שגיאה: " . $e->getMessage() . "</p>";
    echo "<p>אנא בדוק את הגדרות החיבור בקובץ includes/config.php</p>";
}
?>
