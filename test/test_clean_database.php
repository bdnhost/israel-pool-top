<?php
/**
 * Pool Israel - Clean Database Test
 * בדיקה מהירה של מסד הנתונים הנקי
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בדיקת מסד נתונים נקי - Pool Israel</title>
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
            max-width: 1000px;
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
        
        .alert {
            background: rgba(255, 107, 53, 0.2);
            border: 1px solid #ff6b35;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧹 בדיקת מסד הנתונים הנקי</h1>
            <p>בדיקה מהירה של הגרסה הנקיה שפותרת בעיות מפתחות זרים</p>
        </div>

        <div class="alert">
            <h3>🚨 הודעה חשובה</h3>
            <p>הסקריפט הנקי מוחק את כל הטבלאות הקיימות ויוצר אותן מחדש</p>
            <p><strong>השתמש בו רק על מסד נתונים ריק או לבדיקות!</strong></p>
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
            echo '</div></div></body></html>';
            exit;
        }
        echo '</div>';

        // Check if tables exist
        echo '<div class="test-section">';
        echo '<h3>📋 בדיקת טבלאות קיימות</h3>';
        
        $stmt = $db->query("SHOW TABLES");
        $existing_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($existing_tables) > 0) {
            echo '<div class="warning">⚠️ נמצאו ' . count($existing_tables) . ' טבלאות קיימות במסד הנתונים</div>';
            
            echo '<table>';
            echo '<tr><th>שם הטבלה</th><th>מספר רשומות</th></tr>';
            
            foreach ($existing_tables as $table) {
                try {
                    $count_stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
                    $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    echo '<tr>';
                    echo '<td>' . $table . '</td>';
                    echo '<td>' . number_format($count) . '</td>';
                    echo '</tr>';
                } catch (Exception $e) {
                    echo '<tr>';
                    echo '<td>' . $table . '</td>';
                    echo '<td>שגיאה</td>';
                    echo '</tr>';
                }
            }
            echo '</table>';
            
            echo '<div class="info">💡 הסקריפט הנקי ימחק את כל הטבלאות הללו ויצור אותן מחדש</div>';
        } else {
            echo '<div class="success">✅ מסד הנתונים ריק - מוכן להתקנה נקיה</div>';
        }
        echo '</div>';

        // Check for foreign key constraints
        echo '<div class="test-section">';
        echo '<h3>🔗 בדיקת מפתחות זרים קיימים</h3>';
        
        try {
            $stmt = $db->query("
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE CONSTRAINT_SCHEMA = DATABASE() 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ");
            $foreign_keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($foreign_keys) > 0) {
                echo '<div class="warning">⚠️ נמצאו ' . count($foreign_keys) . ' מפתחות זרים קיימים</div>';
                echo '<div class="info">🔧 הסקריפט הנקי יטפל בהם אוטומטית עם SET FOREIGN_KEY_CHECKS = 0</div>';
                
                echo '<table>';
                echo '<tr><th>טבלה</th><th>שם המפתח</th><th>מקושר לטבלה</th></tr>';
                foreach (array_slice($foreign_keys, 0, 10) as $fk) {
                    echo '<tr>';
                    echo '<td>' . $fk['TABLE_NAME'] . '</td>';
                    echo '<td>' . $fk['CONSTRAINT_NAME'] . '</td>';
                    echo '<td>' . $fk['REFERENCED_TABLE_NAME'] . '</td>';
                    echo '</tr>';
                }
                echo '</table>';
                
                if (count($foreign_keys) > 10) {
                    echo '<div class="info">... ועוד ' . (count($foreign_keys) - 10) . ' מפתחות זרים</div>';
                }
            } else {
                echo '<div class="success">✅ לא נמצאו מפתחות זרים - התקנה תהיה חלקה</div>';
            }
            
        } catch (Exception $e) {
            echo '<div class="error">❌ שגיאה בבדיקת מפתחות זרים: ' . $e->getMessage() . '</div>';
        }
        echo '</div>';

        // Expected tables after installation
        echo '<div class="test-section">';
        echo '<h3>📋 טבלאות שייווצרו</h3>';
        
        $expected_tables = [
            'users' => 'משתמשי המערכת',
            'admin_users' => 'משתמשי ניהול',
            'system_settings' => 'הגדרות מערכת',
            'contractors' => 'קבלנים',
            'quote_requests' => 'בקשות הצעות מחיר',
            'quote_contractor_assignments' => 'הקצאת קבלנים',
            'reviews' => 'ביקורות',
            'quotes' => 'הצעות מחיר',
            'sms_verifications' => 'אימות SMS',
            'activity_logs' => 'יומן פעילות',
            'daily_stats' => 'סטטיסטיקות יומיות',
            'guides' => 'מדריכים'
        ];
        
        echo '<div class="success">✅ הסקריפט ייצור ' . count($expected_tables) . ' טבלאות חדשות</div>';
        
        echo '<table>';
        echo '<tr><th>שם הטבלה</th><th>תיאור</th></tr>';
        foreach ($expected_tables as $table => $description) {
            echo '<tr>';
            echo '<td>' . $table . '</td>';
            echo '<td>' . $description . '</td>';
            echo '</tr>';
        }
        echo '</table>';
        echo '</div>';

        // Installation instructions
        echo '<div class="test-section">';
        echo '<h3>📖 הוראות התקנה</h3>';
        
        echo '<div class="info">';
        echo '<h4>שלבי ההתקנה:</h4>';
        echo '<ol style="text-align: right; margin-right: 20px;">';
        echo '<li>ודא שיש לך גיבוי של הנתונים החשובים</li>';
        echo '<li>הרץ את הסקריפט: <code>pool_israel_clean_database.sql</code></li>';
        echo '<li>הסקריפט ימחק את כל הטבלאות הקיימות</li>';
        echo '<li>הסקריפט ייצור 12 טבלאות חדשות</li>';
        echo '<li>ייווצר משתמש אדמין: admin / password</li>';
        echo '<li>ייטענו הגדרות מערכת בסיסיות</li>';
        echo '</ol>';
        echo '</div>';
        
        echo '<div class="warning">';
        echo '<h4>⚠️ אזהרות:</h4>';
        echo '<ul style="text-align: right; margin-right: 20px;">';
        echo '<li>כל הנתונים הקיימים יימחקו!</li>';
        echo '<li>השתמש רק על מסד נתונים לבדיקות</li>';
        echo '<li>שנה את סיסמת האדמין אחרי ההתקנה</li>';
        echo '</ul>';
        echo '</div>';
        echo '</div>';

        // Statistics
        echo '<div class="stats-grid">';
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . count($existing_tables) . '</div>';
        echo '<div>טבלאות קיימות</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . count($expected_tables) . '</div>';
        echo '<div>טבלאות חדשות</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . (isset($foreign_keys) ? count($foreign_keys) : 0) . '</div>';
        echo '<div>מפתחות זרים</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">18</div>';
        echo '<div>הגדרות מערכת</div>';
        echo '</div>';
        echo '</div>';
        ?>

        <div style="text-align: center; margin-top: 30px;">
            <a href="pool_israel_clean_database.sql" class="btn" download>📥 הורד סקריפט נקי</a>
            <a href="test_database_connection_detailed.php" class="btn">🔍 בדיקה מפורטת</a>
            <a href="javascript:location.reload()" class="btn">🔄 רענן בדיקה</a>
        </div>
    </div>
</body>
</html>
