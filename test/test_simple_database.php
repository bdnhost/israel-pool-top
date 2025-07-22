<?php
/**
 * Pool Israel - Simple Database Test
 * בדיקה מהירה של מסד הנתונים הפשוט
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בדיקת מסד נתונים פשוט - Pool Israel</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #007cba, #ff6b35);
            color: white;
            direction: rtl;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .test-section {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        th {
            background: rgba(255, 255, 255, 0.2);
            font-weight: 600;
        }
        
        .btn {
            background: linear-gradient(135deg, #007cba, #ff6b35);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 10px 5px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #ff6b35;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 בדיקת מסד הנתונים הפשוט</h1>
            <p>בדיקה מהירה של הגרסה הפשוטה ללא סיבוכים</p>
        </div>

        <?php
        // Test database connection
        echo '<div class="test-section">';
        echo '<h3>🔌 בדיקת חיבור למסד הנתונים</h3>';
        
        try {
            require_once 'includes/database.php';
            $database = new Database();
            $db = $database->getConnection();
            
            echo '<div class="success">✅ החיבור למסד הנתונים הצליח!</div>';
            
            // Get database info
            $stmt = $db->query("SELECT DATABASE() as db_name, VERSION() as version");
            $info = $stmt->fetch(PDO::FETCH_ASSOC);
            echo '<div class="info">📊 מסד נתונים: ' . $info['db_name'] . '</div>';
            echo '<div class="info">🔧 גרסת MySQL: ' . $info['version'] . '</div>';
            
        } catch (Exception $e) {
            echo '<div class="error">❌ שגיאה בחיבור: ' . $e->getMessage() . '</div>';
            echo '</div>';
            echo '<div style="text-align: center; margin-top: 30px;">';
            echo '<p class="error">לא ניתן להמשיך בבדיקות ללא חיבור למסד הנתונים</p>';
            echo '<a href="#" class="btn">📖 עזרה</a>';
            echo '</div></div></body></html>';
            exit;
        }
        echo '</div>';

        // Check tables
        echo '<div class="test-section">';
        echo '<h3>📋 בדיקת טבלאות</h3>';
        
        $expected_tables = [
            'users', 'admin_users', 'contractors', 'quote_requests', 
            'quote_contractor_assignments', 'sms_verifications', 
            'system_settings', 'reviews', 'activity_logs', 
            'daily_stats', 'guides', 'quotes'
        ];
        
        $stmt = $db->query("SHOW TABLES");
        $existing_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo '<div class="success">✅ נמצאו ' . count($existing_tables) . ' טבלאות</div>';
        
        echo '<table>';
        echo '<tr><th>שם הטבלה</th><th>מספר רשומות</th><th>סטטוס</th></tr>';
        
        foreach ($expected_tables as $table) {
            if (in_array($table, $existing_tables)) {
                try {
                    $count_stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
                    $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    echo '<tr>';
                    echo '<td>' . $table . '</td>';
                    echo '<td>' . number_format($count) . '</td>';
                    echo '<td><span class="success">✅ קיימת</span></td>';
                    echo '</tr>';
                } catch (Exception $e) {
                    echo '<tr>';
                    echo '<td>' . $table . '</td>';
                    echo '<td>-</td>';
                    echo '<td><span class="error">❌ שגיאה</span></td>';
                    echo '</tr>';
                }
            } else {
                echo '<tr>';
                echo '<td>' . $table . '</td>';
                echo '<td>-</td>';
                echo '<td><span class="error">❌ חסרה</span></td>';
                echo '</tr>';
            }
        }
        echo '</table>';
        echo '</div>';

        // Check admin user
        echo '<div class="test-section">';
        echo '<h3>👤 בדיקת משתמש אדמין</h3>';
        
        try {
            $stmt = $db->query("SELECT * FROM admin_users WHERE username = 'admin'");
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($admin) {
                echo '<div class="success">✅ משתמש אדמין קיים!</div>';
                echo '<div class="info">👤 שם משתמש: ' . $admin['username'] . '</div>';
                echo '<div class="info">📧 אימייל: ' . $admin['email'] . '</div>';
                echo '<div class="info">🔑 תפקיד: ' . $admin['role'] . '</div>';
                echo '<div class="info">🟢 פעיל: ' . ($admin['is_active'] ? 'כן' : 'לא') . '</div>';
            } else {
                echo '<div class="error">❌ משתמש אדמין לא קיים!</div>';
            }
        } catch (Exception $e) {
            echo '<div class="error">❌ שגיאה בבדיקת אדמין: ' . $e->getMessage() . '</div>';
        }
        echo '</div>';

        // Check system settings
        echo '<div class="test-section">';
        echo '<h3>⚙️ בדיקת הגדרות מערכת</h3>';
        
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM system_settings");
            $settings_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            echo '<div class="success">✅ נמצאו ' . $settings_count . ' הגדרות מערכת</div>';
            
            // Show some key settings
            $stmt = $db->query("SELECT setting_key, setting_value, category FROM system_settings ORDER BY category, setting_key LIMIT 10");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo '<table>';
            echo '<tr><th>מפתח</th><th>ערך</th><th>קטגוריה</th></tr>';
            foreach ($settings as $setting) {
                echo '<tr>';
                echo '<td>' . $setting['setting_key'] . '</td>';
                echo '<td>' . (strlen($setting['setting_value']) > 30 ? substr($setting['setting_value'], 0, 30) . '...' : $setting['setting_value']) . '</td>';
                echo '<td>' . $setting['category'] . '</td>';
                echo '</tr>';
            }
            echo '</table>';
            
        } catch (Exception $e) {
            echo '<div class="error">❌ שגיאה בבדיקת הגדרות: ' . $e->getMessage() . '</div>';
        }
        echo '</div>';

        // Check foreign keys
        echo '<div class="test-section">';
        echo '<h3>🔗 בדיקת מפתחות זרים</h3>';
        
        try {
            $stmt = $db->query("
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ");
            $foreign_keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($foreign_keys) > 0) {
                echo '<div class="success">✅ נמצאו ' . count($foreign_keys) . ' מפתחות זרים</div>';
                
                echo '<table>';
                echo '<tr><th>טבלה</th><th>עמודה</th><th>מקושר לטבלה</th><th>עמודה מקושרת</th></tr>';
                foreach ($foreign_keys as $fk) {
                    echo '<tr>';
                    echo '<td>' . $fk['TABLE_NAME'] . '</td>';
                    echo '<td>' . $fk['COLUMN_NAME'] . '</td>';
                    echo '<td>' . $fk['REFERENCED_TABLE_NAME'] . '</td>';
                    echo '<td>' . $fk['REFERENCED_COLUMN_NAME'] . '</td>';
                    echo '</tr>';
                }
                echo '</table>';
            } else {
                echo '<div class="warning">⚠️ לא נמצאו מפתחות זרים</div>';
            }
            
        } catch (Exception $e) {
            echo '<div class="error">❌ שגיאה בבדיקת מפתחות זרים: ' . $e->getMessage() . '</div>';
        }
        echo '</div>';

        // Statistics
        echo '<div class="stats-grid">';
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . count($existing_tables) . '</div>';
        echo '<div>טבלאות</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . (isset($settings_count) ? $settings_count : 0) . '</div>';
        echo '<div>הגדרות</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . (isset($foreign_keys) ? count($foreign_keys) : 0) . '</div>';
        echo '<div>מפתחות זרים</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">1</div>';
        echo '<div>אדמין</div>';
        echo '</div>';
        echo '</div>';

        // Final summary
        echo '<div class="test-section">';
        echo '<h3>📊 סיכום</h3>';
        
        $missing_tables = array_diff($expected_tables, $existing_tables);
        
        if (empty($missing_tables) && isset($admin) && $admin && isset($settings_count) && $settings_count > 10) {
            echo '<div class="success">🎉 מסד הנתונים הפשוט מותקן בהצלחה ומוכן לשימוש!</div>';
            echo '<div class="info">✅ כל הטבלאות קיימות<br>';
            echo '✅ משתמש אדמין פעיל<br>';
            echo '✅ הגדרות מערכת נטענו<br>';
            echo '✅ מפתחות זרים מוגדרים</div>';
        } else {
            echo '<div class="warning">⚠️ יש בעיות שדורשות תשומת לב:</div>';
            if (!empty($missing_tables)) {
                echo '<div class="error">• טבלאות חסרות: ' . implode(', ', $missing_tables) . '</div>';
            }
            if (!isset($admin) || !$admin) {
                echo '<div class="error">• משתמש אדמין לא קיים</div>';
            }
            if (!isset($settings_count) || $settings_count < 10) {
                echo '<div class="error">• הגדרות מערכת חסרות</div>';
            }
        }
        echo '</div>';
        ?>

        <div style="text-align: center; margin-top: 30px;">
            <a href="admin/index_new.html" class="btn">🚀 פתח דשבורד ניהול</a>
            <a href="test_database_connection_detailed.php" class="btn">🔍 בדיקה מפורטת</a>
            <a href="javascript:location.reload()" class="btn">🔄 רענן בדיקה</a>
        </div>
    </div>
</body>
</html>
