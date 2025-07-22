<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בדיקה ותיקון מסד נתונים - Pool Israel</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 20px;
            background: #f5f5f5;
            margin: 0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2c5aa0;
        }
        .header h1 {
            color: #2c5aa0;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .step {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 2px solid #e9ecef;
        }
        .step h3 {
            color: #2c5aa0;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .result {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
        }
        .result.success {
            border-left: 5px solid #28a745;
            background: #f8fff9;
        }
        .result.error {
            border-left: 5px solid #dc3545;
            background: #fff8f8;
        }
        .result.warning {
            border-left: 5px solid #ffc107;
            background: #fffdf5;
        }
        button {
            background: #2c5aa0;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin: 5px;
            transition: all 0.3s ease;
        }
        button:hover {
            background: #1e3a8a;
            transform: translateY(-1px);
        }
        button.danger {
            background: #dc3545;
        }
        button.danger:hover {
            background: #c82333;
        }
        .config-form {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ffeaa7;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #495057;
        }
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 5px;
            font-size: 1rem;
        }
        .form-group input:focus {
            outline: none;
            border-color: #2c5aa0;
            box-shadow: 0 0 0 2px rgba(44, 90, 160, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 בדיקה ותיקון מסד נתונים</h1>
            <p>כלי לבדיקה ותיקון בעיות מסד נתונים של Pool Israel</p>
        </div>

        <!-- Step 1: Database Configuration -->
        <div class="step">
            <h3>שלב 1: הגדרת חיבור למסד נתונים</h3>
            <p>הזן את פרטי החיבור למסד הנתונים שלך:</p>
            
            <form class="config-form" method="post" action="">
                <div class="form-group">
                    <label for="db_host">שרת מסד נתונים (Host):</label>
                    <input type="text" id="db_host" name="db_host" value="localhost" required>
                </div>
                
                <div class="form-group">
                    <label for="db_name">שם מסד נתונים:</label>
                    <input type="text" id="db_name" name="db_name" value="poolisrael" required>
                </div>
                
                <div class="form-group">
                    <label for="db_username">שם משתמש:</label>
                    <input type="text" id="db_username" name="db_username" required>
                </div>
                
                <div class="form-group">
                    <label for="db_password">סיסמה:</label>
                    <input type="password" id="db_password" name="db_password">
                </div>
                
                <button type="submit" name="test_connection">בדוק חיבור</button>
                <button type="submit" name="save_config">שמור הגדרות</button>
            </form>
        </div>

        <!-- Step 2: Connection Test -->
        <div class="step">
            <h3>שלב 2: בדיקת חיבור</h3>
            <button onclick="testConnection()">בדוק חיבור למסד נתונים</button>
            <div id="connectionResult" class="result">לחץ על הכפתור לבדיקת החיבור</div>
        </div>

        <!-- Step 3: Table Check -->
        <div class="step">
            <h3>שלב 3: בדיקת טבלאות</h3>
            <button onclick="checkTables()">בדוק טבלאות</button>
            <button onclick="createTables()">צור טבלאות</button>
            <div id="tablesResult" class="result">לחץ על הכפתור לבדיקת הטבלאות</div>
        </div>

        <!-- Step 4: Data Check -->
        <div class="step">
            <h3>שלב 4: בדיקת נתונים</h3>
            <button onclick="checkData()">בדוק נתונים</button>
            <button onclick="populateData()">מלא נתונים לדוגמה</button>
            <div id="dataResult" class="result">לחץ על הכפתור לבדיקת הנתונים</div>
        </div>

        <!-- Step 5: API Test -->
        <div class="step">
            <h3>שלב 5: בדיקת API</h3>
            <button onclick="testAPI()">בדוק API</button>
            <div id="apiResult" class="result">לחץ על הכפתור לבדיקת ה-API</div>
        </div>

        <!-- Step 6: Fix Issues -->
        <div class="step">
            <h3>שלב 6: תיקון בעיות</h3>
            <button onclick="fixAllIssues()">תקן את כל הבעיות</button>
            <button class="danger" onclick="resetDatabase()">איפוס מלא של מסד הנתונים</button>
            <div id="fixResult" class="result">לחץ על הכפתור לתיקון הבעיות</div>
        </div>
    </div>

    <script>
        async function testConnection() {
            const result = document.getElementById('connectionResult');
            result.innerHTML = 'בודק חיבור למסד נתונים...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=test_connection');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ חיבור תקין למסד נתונים\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה בחיבור:\n${data.message}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה בבדיקת החיבור:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function checkTables() {
            const result = document.getElementById('tablesResult');
            result.innerHTML = 'בודק טבלאות...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=check_tables');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ בדיקת טבלאות הושלמה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `⚠️ בעיות בטבלאות:\n${data.message}`;
                    result.className = 'result warning';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה בבדיקת הטבלאות:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function createTables() {
            const result = document.getElementById('tablesResult');
            result.innerHTML = 'יוצר טבלאות...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=create_tables');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ טבלאות נוצרו בהצלחה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה ביצירת הטבלאות:\n${data.message}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה ביצירת הטבלאות:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function checkData() {
            const result = document.getElementById('dataResult');
            result.innerHTML = 'בודק נתונים...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=check_data');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ בדיקת נתונים הושלמה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `⚠️ בעיות בנתונים:\n${data.message}`;
                    result.className = 'result warning';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה בבדיקת הנתונים:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function populateData() {
            const result = document.getElementById('dataResult');
            result.innerHTML = 'ממלא נתונים לדוגמה...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=populate_data');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ נתונים לדוגמה נוספו בהצלחה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה במילוי הנתונים:\n${data.message}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה במילוי הנתונים:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function testAPI() {
            const result = document.getElementById('apiResult');
            result.innerHTML = 'בודק API...';
            result.className = 'result';
            
            try {
                const response = await fetch('../api/contractors.php?debug=1&limit=1');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ API עובד תקין:\nנמצאו ${data.pagination.total_count} קבלנים\nAPI מחזיר נתונים תקינים`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה ב-API:\n${JSON.stringify(data, null, 2)}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה בבדיקת ה-API:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function fixAllIssues() {
            const result = document.getElementById('fixResult');
            result.innerHTML = 'מתקן את כל הבעיות...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=fix_all');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ כל הבעיות תוקנו בהצלחה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה בתיקון הבעיות:\n${data.message}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה בתיקון הבעיות:\n${error.message}`;
                result.className = 'result error';
            }
        }

        async function resetDatabase() {
            if (!confirm('האם אתה בטוח שברצונך לאפס את כל מסד הנתונים? פעולה זו תמחק את כל הנתונים!')) {
                return;
            }
            
            const result = document.getElementById('fixResult');
            result.innerHTML = 'מאפס את מסד הנתונים...';
            result.className = 'result';
            
            try {
                const response = await fetch('database_check_and_fix.php?action=reset_database');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `✅ מסד הנתונים אופס בהצלחה:\n${data.message}`;
                    result.className = 'result success';
                } else {
                    result.innerHTML = `❌ שגיאה באיפוס מסד הנתונים:\n${data.message}`;
                    result.className = 'result error';
                }
            } catch (error) {
                result.innerHTML = `❌ שגיאה באיפוס מסד הנתונים:\n${error.message}`;
                result.className = 'result error';
            }
        }
    </script>
</body>
</html>

<?php
// PHP Backend for database operations
if (isset($_GET['action']) || isset($_POST['test_connection']) || isset($_POST['save_config'])) {
    header('Content-Type: application/json; charset=utf-8');
    
    // Handle form submissions
    if (isset($_POST['save_config'])) {
        $config_content = "<?php\n/**\n * Pool Israel - Configuration File\n */\n\nreturn [\n";
        $config_content .= "    'db_host' => '" . addslashes($_POST['db_host']) . "',\n";
        $config_content .= "    'db_name' => '" . addslashes($_POST['db_name']) . "',\n";
        $config_content .= "    'db_username' => '" . addslashes($_POST['db_username']) . "',\n";
        $config_content .= "    'db_password' => '" . addslashes($_POST['db_password']) . "',\n";
        $config_content .= "    'db_charset' => 'utf8mb4',\n";
        $config_content .= "];\n?>";
        
        if (file_put_contents('../includes/config.php', $config_content)) {
            echo json_encode(['success' => true, 'message' => 'הגדרות נשמרו בהצלחה']);
        } else {
            echo json_encode(['success' => false, 'message' => 'שגיאה בשמירת ההגדרות']);
        }
        exit;
    }
    
    $action = $_GET['action'] ?? '';
    
    try {
        switch ($action) {
            case 'test_connection':
                testDatabaseConnection();
                break;
            case 'check_tables':
                checkDatabaseTables();
                break;
            case 'create_tables':
                createDatabaseTables();
                break;
            case 'check_data':
                checkDatabaseData();
                break;
            case 'populate_data':
                populateSampleData();
                break;
            case 'fix_all':
                fixAllDatabaseIssues();
                break;
            case 'reset_database':
                resetDatabase();
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'פעולה לא מוכרת']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

function testDatabaseConnection() {
    try {
        require_once '../includes/database.php';
        $database = new Database();
        $db = $database->getConnection();
        
        $result = $db->query("SELECT 1")->fetch();
        echo json_encode(['success' => true, 'message' => 'חיבור למסד נתונים תקין']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בחיבור: ' . $e->getMessage()]);
    }
}

function checkDatabaseTables() {
    try {
        require_once '../includes/database.php';
        $database = new Database();
        $db = $database->getConnection();
        
        $tables = ['contractors', 'guides', 'users'];
        $existing_tables = [];
        $missing_tables = [];
        
        foreach ($tables as $table) {
            if ($database->tableExists($table)) {
                $existing_tables[] = $table;
            } else {
                $missing_tables[] = $table;
            }
        }
        
        $message = "טבלאות קיימות: " . implode(', ', $existing_tables) . "\n";
        if (!empty($missing_tables)) {
            $message .= "טבלאות חסרות: " . implode(', ', $missing_tables);
        }
        
        echo json_encode(['success' => empty($missing_tables), 'message' => $message]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בבדיקת טבלאות: ' . $e->getMessage()]);
    }
}

function createDatabaseTables() {
    try {
        require_once '../includes/database.php';
        $database = new Database();
        $database->createTables();
        
        echo json_encode(['success' => true, 'message' => 'כל הטבלאות נוצרו בהצלחה']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה ביצירת טבלאות: ' . $e->getMessage()]);
    }
}

function checkDatabaseData() {
    try {
        require_once '../includes/database.php';
        $database = new Database();
        $db = $database->getConnection();
        
        $contractors_count = $db->query("SELECT COUNT(*) as count FROM contractors")->fetch()['count'];
        
        $message = "נמצאו {$contractors_count} קבלנים במסד הנתונים";
        
        echo json_encode(['success' => $contractors_count > 0, 'message' => $message]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בבדיקת נתונים: ' . $e->getMessage()]);
    }
}

function populateSampleData() {
    try {
        require_once 'populate_contractors.php';
        echo json_encode(['success' => true, 'message' => 'נתונים לדוגמה נוספו בהצלחה']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה במילוי נתונים: ' . $e->getMessage()]);
    }
}

function fixAllDatabaseIssues() {
    try {
        createDatabaseTables();
        populateSampleData();
        echo json_encode(['success' => true, 'message' => 'כל הבעיות תוקנו בהצלחה']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בתיקון: ' . $e->getMessage()]);
    }
}

function resetDatabase() {
    try {
        require_once '../includes/database.php';
        $database = new Database();
        $db = $database->getConnection();
        
        $db->query("DROP TABLE IF EXISTS contractors");
        $db->query("DROP TABLE IF EXISTS guides");
        $db->query("DROP TABLE IF EXISTS users");
        
        createDatabaseTables();
        populateSampleData();
        
        echo json_encode(['success' => true, 'message' => 'מסד הנתונים אופס ונוצר מחדש בהצלחה']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה באיפוס: ' . $e->getMessage()]);
    }
}
?>
