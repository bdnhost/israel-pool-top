<?php
/**
 * Pool Israel - Settings API
 * Handles system settings management
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    // Get action from JSON body for POST/PUT requests
    if (empty($action) && in_array($method, ['POST', 'PUT'])) {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
    }
    
    switch ($method) {
        case 'GET':
            handleGetRequest($db, $action);
            break;
            
        case 'POST':
        case 'PUT':
            handlePostRequest($db, $action);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Settings API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'שגיאה בשרת - אנא נסה שוב מאוחר יותר'
    ]);
}

/**
 * Handle GET requests
 */
function handleGetRequest($db, $action) {
    switch ($action) {
        case 'get_settings':
            getSettings($db);
            break;
            
        case 'get_setting':
            getSetting($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Handle POST/PUT requests
 */
function handlePostRequest($db, $action) {
    switch ($action) {
        case 'save_settings':
            saveSettings($db);
            break;
            
        case 'save_setting':
            saveSetting($db);
            break;
            
        case 'reset_settings':
            resetSettings($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Get all settings grouped by category
 */
function getSettings($db) {
    try {
        // Check if table exists first
        $stmt = $db->prepare("SHOW TABLES LIKE 'system_settings'");
        $stmt->execute();
        if ($stmt->rowCount() === 0) {
            // Return default settings if table doesn't exist
            echo json_encode([
                'success' => true,
                'settings' => getDefaultSettings()
            ]);
            return;
        }

        $stmt = $db->prepare("SELECT setting_key, setting_value, setting_type, description FROM system_settings ORDER BY setting_key");
        $stmt->execute();
        $settings_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        foreach ($settings_rows as $row) {
            $value = $row['setting_value'];

            // Convert based on type
            switch ($row['setting_type']) {
                case 'number':
                    $value = (float)$value;
                    break;
                case 'boolean':
                    $value = (bool)$value;
                    break;
                case 'json':
                    $value = json_decode($value, true);
                    break;
            }

            $settings[$row['setting_key']] = $value;
        }

        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'success' => true,
            'settings' => getDefaultSettings()
        ]);
    }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return [
        'max_contractors_per_quote' => 3,
        'sms_verification_timeout' => 300,
        'quote_auto_expire_days' => 30,
        'quote_fee_per_lead' => 20,
        'quote_fee_premium' => 35,
        'commission_rate' => 5,
        'sms_sender_name' => 'PoolIsrael',
        'system_email' => 'admin@israel-pool.top',
        'max_images_per_quote' => 5
    ];
}

/**
 * Get single setting
 */
function getSetting($db) {
    $category = $_GET['category'] ?? '';
    $key = $_GET['key'] ?? '';
    
    if (empty($category) || empty($key)) {
        echo json_encode(['success' => false, 'message' => 'Category and key are required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT * FROM system_settings 
        WHERE category = ? AND setting_key = ?
    ");
    $stmt->execute([$category, $key]);
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$setting) {
        echo json_encode(['success' => false, 'message' => 'Setting not found']);
        return;
    }
    
    // Parse setting value based on type
    $value = $setting['setting_value'];
    switch ($setting['setting_type']) {
        case 'integer':
            $value = (int)$value;
            break;
        case 'float':
            $value = (float)$value;
            break;
        case 'boolean':
            $value = (bool)$value;
            break;
        case 'json':
        case 'array':
            $value = json_decode($value, true);
            break;
    }
    
    echo json_encode([
        'success' => true,
        'setting' => [
            'value' => $value,
            'type' => $setting['setting_type'],
            'description' => $setting['description'],
            'is_public' => $setting['is_public'],
            'is_editable' => $setting['is_editable'],
            'validation_rules' => json_decode($setting['validation_rules'], true),
            'default_value' => $setting['default_value']
        ]
    ]);
}

/**
 * Save multiple settings
 */
function saveSettings($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $settings = $input['settings'] ?? [];
    
    if (empty($settings)) {
        echo json_encode(['success' => false, 'message' => 'No settings provided']);
        return;
    }
    
    $db->beginTransaction();
    
    try {
        foreach ($settings as $category => $categorySettings) {
            foreach ($categorySettings as $key => $value) {
                // Convert value to string for storage
                $stringValue = $value;
                if (is_array($value) || is_object($value)) {
                    $stringValue = json_encode($value);
                } elseif (is_bool($value)) {
                    $stringValue = $value ? '1' : '0';
                }
                
                $stmt = $db->prepare("
                    UPDATE system_settings 
                    SET setting_value = ?, updated_at = NOW()
                    WHERE category = ? AND setting_key = ? AND is_editable = 1
                ");
                $stmt->execute([$stringValue, $category, $key]);
            }
        }
        
        $db->commit();
        
        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, action, details, ip_address) 
            VALUES ('system', 'settings_update', ?, ?)
        ");
        $logStmt->execute([
            json_encode(['updated_settings' => array_keys($settings)]),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'הגדרות נשמרו בהצלחה'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בשמירת הגדרות: ' . $e->getMessage()
        ]);
    }
}

/**
 * Save single setting
 */
function saveSetting($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $category = $input['category'] ?? '';
    $key = $input['key'] ?? '';
    $value = $input['value'] ?? '';
    
    if (empty($category) || empty($key)) {
        echo json_encode(['success' => false, 'message' => 'Category and key are required']);
        return;
    }
    
    // Convert value to string for storage
    $stringValue = $value;
    if (is_array($value) || is_object($value)) {
        $stringValue = json_encode($value);
    } elseif (is_bool($value)) {
        $stringValue = $value ? '1' : '0';
    }
    
    $stmt = $db->prepare("
        UPDATE system_settings 
        SET setting_value = ?, updated_at = NOW()
        WHERE category = ? AND setting_key = ? AND is_editable = 1
    ");
    
    $result = $stmt->execute([$stringValue, $category, $key]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'הגדרה נשמרה בהצלחה'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'הגדרה לא נמצאה או לא ניתנת לעריכה'
        ]);
    }
}

/**
 * Reset settings to default values
 */
function resetSettings($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $category = $input['category'] ?? '';
    
    $whereClause = '';
    $params = [];
    
    if (!empty($category)) {
        $whereClause = 'WHERE category = ? AND is_editable = 1';
        $params[] = $category;
    } else {
        $whereClause = 'WHERE is_editable = 1';
    }
    
    $stmt = $db->prepare("
        UPDATE system_settings 
        SET setting_value = default_value, updated_at = NOW()
        {$whereClause}
    ");
    
    $result = $stmt->execute($params);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'הגדרות אופסו לברירת מחדל'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה באיפוס הגדרות'
        ]);
    }
}
?>
