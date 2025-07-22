<?php
/**
 * Pool Israel - Settings API (Fixed for existing database schema)
 * מתאים לטבלת system_settings הקיימת במסד הנתונים
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../includes/database.php';

// Authentication check for admin actions
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    // Get action from JSON body for POST/PUT requests
    if (empty($action) && in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
    }

    switch ($action) {
        case 'get_settings':
            getSettings($db);
            break;
            
        case 'get_setting':
            getSetting($db);
            break;
            
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

} catch (Exception $e) {
    http_response_code(500);
    error_log("Settings API Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}

/**
 * Get all settings (grouped logically by key prefix)
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

        $stmt = $db->prepare("
            SELECT setting_key, setting_value, setting_type, description, created_at, updated_at 
            FROM system_settings 
            ORDER BY setting_key
        ");
        $stmt->execute();
        $settings_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group settings by logical categories based on setting_key prefix
        $groupedSettings = [];
        foreach ($settings_rows as $row) {
            $value = $row['setting_value'];

            // Convert based on type
            switch ($row['setting_type']) {
                case 'number':
                    $value = (float)$value;
                    break;
                case 'boolean':
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    break;
                case 'json':
                    $value = json_decode($value, true);
                    break;
            }

            // Determine category from setting key
            $key = $row['setting_key'];
            if (strpos($key, 'sms_') === 0) {
                $category = 'sms';
            } elseif (strpos($key, 'quote_') === 0) {
                $category = 'quotes';
            } elseif (strpos($key, 'system_') === 0) {
                $category = 'system';
            } elseif (strpos($key, 'email_') === 0) {
                $category = 'email';
            } else {
                $category = 'general';
            }

            $groupedSettings[$category][$key] = [
                'value' => $value,
                'type' => $row['setting_type'],
                'description' => $row['description'],
                'updated_at' => $row['updated_at']
            ];
        }

        echo json_encode([
            'success' => true,
            'settings' => $groupedSettings
        ]);

    } catch (Exception $e) {
        error_log("Settings API Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to load settings: ' . $e->getMessage()]);
    }
}

/**
 * Get single setting by key only (no category needed)
 */
function getSetting($db) {
    $key = $_GET['key'] ?? '';
    
    if (empty($key)) {
        echo json_encode(['success' => false, 'message' => 'Setting key is required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT setting_key, setting_value, setting_type, description, created_at, updated_at 
        FROM system_settings 
        WHERE setting_key = ?
    ");
    $stmt->execute([$key]);
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$setting) {
        echo json_encode(['success' => false, 'message' => 'Setting not found']);
        return;
    }
    
    // Convert value based on type
    $value = $setting['setting_value'];
    switch ($setting['setting_type']) {
        case 'number':
            $value = (float)$value;
            break;
        case 'boolean':
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            break;
        case 'json':
            $value = json_decode($value, true);
            break;
    }
    $setting['setting_value'] = $value;
    
    echo json_encode([
        'success' => true,
        'setting' => $setting
    ]);
}

/**
 * Save multiple settings (no category grouping)
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
        $updatedCount = 0;
        
        // Handle both flat array and grouped array
        if (isset($settings['sms']) || isset($settings['quotes']) || isset($settings['general'])) {
            // Grouped format
            foreach ($settings as $category => $categorySettings) {
                foreach ($categorySettings as $key => $value) {
                    if (updateSingleSetting($db, $key, $value)) {
                        $updatedCount++;
                    }
                }
            }
        } else {
            // Flat format
            foreach ($settings as $key => $value) {
                if (updateSingleSetting($db, $key, $value)) {
                    $updatedCount++;
                }
            }
        }
        
        $db->commit();
        
        // Log activity
        try {
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, action, details, ip_address) 
                VALUES ('system', 'settings_update', ?, ?)
            ");
            $logStmt->execute([
                json_encode(['updated_count' => $updatedCount]),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        } catch (Exception $logError) {
            // Log error but don't fail the main operation
            error_log("Failed to log settings update: " . $logError->getMessage());
        }
        
        echo json_encode([
            'success' => true,
            'message' => "הגדרות נשמרו בהצלחה ({$updatedCount} הגדרות עודכנו)"
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
 * Helper function to update a single setting
 */
function updateSingleSetting($db, $key, $value) {
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
        WHERE setting_key = ?
    ");
    
    $result = $stmt->execute([$stringValue, $key]);
    return $result && $stmt->rowCount() > 0;
}

/**
 * Save single setting (no category needed)
 */
function saveSetting($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $key = $input['key'] ?? '';
    $value = $input['value'] ?? '';
    
    if (empty($key)) {
        echo json_encode(['success' => false, 'message' => 'Setting key is required']);
        return;
    }
    
    if (updateSingleSetting($db, $key, $value)) {
        echo json_encode([
            'success' => true,
            'message' => 'הגדרה נשמרה בהצלחה'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'הגדרה לא נמצאה או לא ניתן לעדכן'
        ]);
    }
}

/**
 * Reset settings to default values (no category filtering)
 */
function resetSettings($db) {
    try {
        // Get default settings
        $defaultSettings = getDefaultSettingsArray();
        
        $updatedCount = 0;
        foreach ($defaultSettings as $key => $defaultValue) {
            if (updateSingleSetting($db, $key, $defaultValue)) {
                $updatedCount++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "הגדרות אופסו לברירת מחדל ({$updatedCount} הגדרות עודכנו)"
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה באיפוס הגדרות: ' . $e->getMessage()
        ]);
    }
}

/**
 * Get default settings for fallback
 */
function getDefaultSettings() {
    return [
        'general' => [
            'system_email' => [
                'value' => 'admin@israel-pool.top',
                'type' => 'string',
                'description' => 'כתובת אימייל מערכת'
            ]
        ],
        'quotes' => [
            'quote_fee_per_lead' => [
                'value' => 20.00,
                'type' => 'number',
                'description' => 'עמלה בסיסית לכל ליד'
            ],
            'max_contractors_per_quote' => [
                'value' => 3,
                'type' => 'number',
                'description' => 'מספר מקסימלי של קבלנים לכל בקשה'
            ]
        ],
        'sms' => [
            'sms_sender_name' => [
                'value' => 'PoolIsrael',
                'type' => 'string',
                'description' => 'שם שולח SMS'
            ]
        ]
    ];
}

/**
 * Get default settings as flat array
 */
function getDefaultSettingsArray() {
    return [
        'system_email' => 'admin@israel-pool.top',
        'quote_fee_per_lead' => '20.00',
        'quote_fee_premium' => '35.00',
        'max_contractors_per_quote' => '3',
        'sms_verification_timeout' => '300',
        'quote_auto_expire_days' => '30',
        'sms_sender_name' => 'PoolIsrael',
        'enable_image_upload' => 'true',
        'max_images_per_quote' => '5'
    ];
}
?>
