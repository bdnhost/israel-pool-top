<?php
/**
 * Admin API
 * Handles admin panel data requests and management functions
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
require_once '../includes/functions.php';
require_once '../includes/SMSService.php';

// Production authentication check
session_start();

// Actions that don't require authentication
$public_actions = ['login', 'check_auth', 'get_stats', 'get_quotes'];
$current_action = $_GET['action'] ?? $_POST['action'] ?? '';

// Get action from JSON body for POST/PUT requests
if (empty($current_action) && in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $current_action = $input['action'] ?? '';
}

// Check authentication for protected actions
if (!in_array($current_action, $public_actions)) {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
        exit();
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $smsService = new SMSService($db);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    // For POST requests, also check JSON body for action
    if (empty($action) && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
    }

    // Debug: Log the action for troubleshooting
    if (isset($_GET['debug'])) {
        error_log("Admin API - Method: {$method}, Action: {$action}");
    }

    switch ($method) {
        case 'GET':
            handleGetRequest($db, $smsService, $action);
            break;
            
        case 'POST':
            handlePostRequest($db, $smsService, $action);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Admin API Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());

    // Log to activity_logs table
    try {
        $stmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, action, details, ip_address)
            VALUES ('system', 'error', ?, ?)
        ");
        $stmt->execute([
            json_encode(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    } catch (Exception $logError) {
        error_log("Failed to log error to database: " . $logError->getMessage());
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'שגיאה בשרת - אנא נסה שוב מאוחר יותר'
    ]);
}

function handleGetRequest($db, $smsService, $action) {
    switch ($action) {
        case 'get_stats':
            getDashboardStats($db);
            break;
            
        case 'get_quotes':
            getQuotes($db);
            break;
            
        case 'get_sms_logs':
            getSMSLogs($db);
            break;
            
        case 'get_settings':
            getSettings($db);
            break;
            
        case 'get_recent_activity':
            getRecentActivity($db);
            break;
            
        case 'check_sms_balance':
            checkSMSBalance($smsService);
            break;
            
        case 'get_quote_details':
            getQuoteDetails($db, $_GET['quote_id'] ?? $_GET['id'] ?? '');
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

function handlePostRequest($db, $smsService, $action) {
    switch ($action) {
        case 'save_settings':
            saveSettings($db);
            break;
            
        case 'update_quote_status':
            updateQuoteStatus($db);
            break;

        case 'update_quote':
            updateQuote($db);
            break;
            
        case 'send_bulk_sms':
            sendBulkSMS($db, $smsService);
            break;
            
        case 'login':
            adminLogin($db);
            break;

        case 'check_auth':
            checkAuth();
            break;

        case 'change_password':
            changePassword($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Get dashboard statistics
 */
function getDashboardStats($db) {
    try {
        $stats = [];
        
        // Total quotes
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM quote_requests");
        $stmt->execute();
        $stats['total_quotes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Today's quotes
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM quote_requests WHERE DATE(created_at) = CURDATE()");
        $stmt->execute();
        $stats['today_quotes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total contractors
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM contractors WHERE status = 'active'");
        $stmt->execute();
        $stats['total_contractors'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total SMS sent
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM sms_verifications");
        $stmt->execute();
        $stats['total_sms'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Conversion rate (quotes that got responses)
        $stmt = $db->prepare("
            SELECT
                COUNT(DISTINCT qr.id) as total_quotes,
                COUNT(DISTINCT qca.quote_request_id) as responded_quotes
            FROM quote_requests qr
            LEFT JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id AND qca.response_at IS NOT NULL
            WHERE qr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute();
        $conversion_data = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['conversion_rate'] = $conversion_data['total_quotes'] > 0 ? 
            round(($conversion_data['responded_quotes'] / $conversion_data['total_quotes']) * 100, 1) : 0;
        
        // Calculate changes (compared to previous period)
        $stats['quotes_change'] = calculateChange($db, 'quote_requests', 'created_at');
        $stats['contractors_change'] = calculateChange($db, 'contractors', 'created_at');
        $stats['sms_change'] = calculateChange($db, 'activity_logs', 'created_at', "entity_type = 'sms'");
        $stats['conversion_change'] = 0; // Simplified for now
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get quotes with pagination and filtering
 */
function getQuotes($db) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 50;
        $status = $_GET['status'] ?? '';
        $search = $_GET['search'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        $where_conditions = ['1=1'];
        $params = [];
        
        if (!empty($status)) {
            $where_conditions[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($search)) {
            $where_conditions[] = "(customer_name LIKE ? OR customer_phone LIKE ? OR request_number LIKE ?)";
            $search_param = "%{$search}%";
            $params[] = $search_param;
            $params[] = $search_param;
            $params[] = $search_param;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM quote_requests WHERE {$where_clause}";
        $stmt = $db->prepare($count_sql);
        $stmt->execute($params);
        $total_count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get quotes
        $sql = "
            SELECT qr.*,
                   COUNT(qca.id) as contractors_count,
                   COUNT(CASE WHEN qca.response_at IS NOT NULL THEN 1 END) as responses_count
            FROM quote_requests qr
            LEFT JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id
            WHERE {$where_clause}
            GROUP BY qr.id
            ORDER BY qr.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'quotes' => $quotes,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($total_count / $limit),
                'total_count' => (int)$total_count,
                'per_page' => (int)$limit
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get SMS logs
 */
function getSMSLogs($db) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 100;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM sms_verifications");
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        $sql = "
            SELECT
                sv.*,
                CASE
                    WHEN sv.recipient_type = 'contractor' AND c.title IS NOT NULL THEN c.title
                    ELSE NULL
                END as contractor_name,
                0.15 as cost
            FROM sms_verifications sv
            LEFT JOIN contractors c ON sv.phone = c.phone AND sv.recipient_type = 'contractor'
            ORDER BY sv.created_at DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([$limit, $offset]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'logs' => $logs,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($totalCount / $limit),
                'total_count' => (int)$totalCount,
                'per_page' => (int)$limit
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get system settings
 */
function getSettings($db) {
    try {
        $stmt = $db->prepare("SELECT setting_key, setting_value FROM system_settings");
        $stmt->execute();
        $settings_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = [];
        foreach ($settings_rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Save system settings
 */
function saveSettings($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $settings = $input['settings'] ?? [];
        
        $db->beginTransaction();
        
        foreach ($settings as $key => $value) {
            $stmt = $db->prepare("
                INSERT INTO system_settings (setting_key, setting_value) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $stmt->execute([$key, $value]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'הגדרות נשמרו בהצלחה'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get recent activity
 */
function getRecentActivity($db) {
    try {
        $limit = $_GET['limit'] ?? 20;
        
        $sql = "
            SELECT * FROM activity_logs 
            ORDER BY created_at DESC 
            LIMIT ?
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$limit]);
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'activities' => $activities
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Check SMS balance
 */
function checkSMSBalance($smsService) {
    try {
        $balance = $smsService->checkBalance();
        
        echo json_encode([
            'success' => true,
            'balance' => $balance['available'] ?? 'לא זמין'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get quote details
 */
function getQuoteDetails($db, $quote_id) {
    try {
        if (empty($quote_id)) {
            throw new Exception('Quote ID is required');
        }
        
        // Get quote details
        $stmt = $db->prepare("
            SELECT qr.*,
                   GROUP_CONCAT(
                       CONCAT(c.title, ':', qca.contractor_response, ':', qca.response_at)
                       SEPARATOR '|'
                   ) as contractor_responses
            FROM quote_requests qr
            LEFT JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id
            LEFT JOIN contractors c ON qca.contractor_id = c.id
            WHERE qr.id = ?
            GROUP BY qr.id
        ");
        $stmt->execute([$quote_id]);
        $quote = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$quote) {
            throw new Exception('Quote not found');
        }
        
        // Parse special requirements and images
        $quote['special_requirements'] = json_decode($quote['special_requirements'] ?? '[]', true);
        $quote['images'] = json_decode($quote['images'] ?? '[]', true);
        
        echo json_encode([
            'success' => true,
            'quote' => $quote
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Update quote status
 */
function updateQuoteStatus($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $quote_id = $input['quote_id'] ?? '';
        $status = $input['status'] ?? '';
        
        if (empty($quote_id) || empty($status)) {
            throw new Exception('Quote ID and status are required');
        }
        
        $stmt = $db->prepare("UPDATE quote_requests SET status = ? WHERE id = ?");
        $stmt->execute([$status, $quote_id]);
        
        // Log the activity
        $stmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, entity_id, action, details) 
            VALUES ('quote_request', ?, 'status_updated', ?)
        ");
        $stmt->execute([$quote_id, json_encode(['new_status' => $status])]);
        
        echo json_encode([
            'success' => true,
            'message' => 'סטטוס עודכן בהצלחה'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Send bulk SMS
 */
function sendBulkSMS($db, $smsService) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $recipients = $input['recipients'] ?? [];
        $message = $input['message'] ?? '';
        
        if (empty($recipients) || empty($message)) {
            throw new Exception('Recipients and message are required');
        }
        
        $sent_count = 0;
        $failed_count = 0;
        
        foreach ($recipients as $phone) {
            $result = $smsService->sendSMS($phone, $message);
            if ($result['success']) {
                $sent_count++;
            } else {
                $failed_count++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "נשלחו {$sent_count} הודעות, {$failed_count} נכשלו",
            'sent_count' => $sent_count,
            'failed_count' => $failed_count
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Check authentication status
 */
function checkAuth() {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        echo json_encode([
            'success' => true,
            'authenticated' => true,
            'user' => [
                'username' => $_SESSION['admin_username'] ?? '',
                'full_name' => $_SESSION['admin_full_name'] ?? '',
                'role' => $_SESSION['admin_role'] ?? ''
            ]
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'authenticated' => false
        ]);
    }
}

/**
 * Change admin password
 */
function changePassword($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';

    // Validation
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        echo json_encode(['success' => false, 'message' => 'כל השדות נדרשים']);
        return;
    }

    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'הסיסמאות החדשות אינן תואמות']);
        return;
    }

    if (strlen($newPassword) < 6) {
        echo json_encode(['success' => false, 'message' => 'הסיסמה חייבת להכיל לפחות 6 תווים']);
        return;
    }

    // Get current admin user
    $adminUsername = $_SESSION['admin_username'] ?? '';
    if (empty($adminUsername)) {
        echo json_encode(['success' => false, 'message' => 'משתמש לא מזוהה']);
        return;
    }

    try {
        // Verify current password
        $stmt = $db->prepare("
            SELECT id, password_hash
            FROM users
            WHERE username = ? AND role = 'admin' AND status = 'active'
        ");
        $stmt->execute([$adminUsername]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
            echo json_encode(['success' => false, 'message' => 'הסיסמה הנוכחית שגויה']);
            return;
        }

        // Update password
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $db->prepare("
            UPDATE users
            SET password_hash = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $result = $updateStmt->execute([$newPasswordHash, $user['id']]);

        if ($result) {
            // Log the password change
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, entity_id, action, details, ip_address)
                VALUES ('user', ?, 'password_changed', ?, ?)
            ");
            $logStmt->execute([
                $user['id'],
                json_encode(['username' => $adminUsername, 'changed_by' => 'self']),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'הסיסמה שונתה בהצלחה'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'שגיאה בעדכון הסיסמה']);
        }

    } catch (Exception $e) {
        error_log("Password change error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'שגיאה בשינוי הסיסמה']);
    }
}

/**
 * Admin login
 */
function adminLogin($db) {

    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($username) || empty($password)) {
            echo json_encode([
                'success' => false,
                'message' => 'שם משתמש וסיסמה נדרשים'
            ]);
            return;
        }

        // Check user in database (using users table with admin role)
        $stmt = $db->prepare("
            SELECT id, username, password_hash, username as full_name, role, status = 'active' as is_active
            FROM users
            WHERE username = ? AND role = 'admin' AND status = 'active'
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            // Update last login
            $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            // Log successful login
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, entity_id, action, details, ip_address)
                VALUES ('system', ?, 'admin_login', ?, ?)
            ");
            $logStmt->execute([
                $user['id'],
                json_encode(['username' => $user['username'], 'role' => $user['role']]),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            // Set session
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user_id'] = $user['id'];
            $_SESSION['admin_username'] = $user['username'];
            $_SESSION['admin_role'] = $user['role'];
            $_SESSION['admin_full_name'] = $user['full_name'];

            echo json_encode([
                'success' => true,
                'message' => 'התחברות בוצעה בהצלחה',
                'user' => [
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            // Log failed login attempt
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, action, details, ip_address)
                VALUES ('system', 'admin_login_failed', ?, ?)
            ");
            $logStmt->execute([
                json_encode(['username' => $username, 'reason' => 'invalid_credentials']),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => false,
                'message' => 'שם משתמש או סיסמה שגויים'
            ]);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בשרת: ' . $e->getMessage()]);
    }
}

/**
 * Calculate percentage change compared to previous period
 */
function calculateChange($db, $table, $date_column, $additional_where = '') {
    try {
        $where_clause = $additional_where ? "WHERE {$additional_where}" : '';
        
        // Current period (last 30 days)
        $stmt = $db->prepare("
            SELECT COUNT(*) as current_count 
            FROM {$table} 
            {$where_clause}
            " . ($additional_where ? " AND " : " WHERE ") . "
            {$date_column} >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute();
        $current = $stmt->fetch(PDO::FETCH_ASSOC)['current_count'];
        
        // Previous period (30-60 days ago)
        $stmt = $db->prepare("
            SELECT COUNT(*) as previous_count 
            FROM {$table} 
            {$where_clause}
            " . ($additional_where ? " AND " : " WHERE ") . "
            {$date_column} >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
            AND {$date_column} < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute();
        $previous = $stmt->fetch(PDO::FETCH_ASSOC)['previous_count'];
        
        if ($previous == 0) return $current > 0 ? 100 : 0;
        
        return round((($current - $previous) / $previous) * 100, 1);
        
    } catch (Exception $e) {
        return 0;
    }
}

/**
 * Update quote details
 */
function updateQuote($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['quote_id'])) {
            echo json_encode(['success' => false, 'message' => 'נתונים חסרים']);
            return;
        }

        $quote_id = $input['quote_id'];

        // Build update query dynamically
        $updateFields = [];
        $params = [];

        $allowedFields = [
            'customer_name', 'customer_phone', 'customer_city',
            'pool_type', 'pool_size', 'budget_range',
            'project_location', 'status', 'additional_details'
        ];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updateFields)) {
            echo json_encode(['success' => false, 'message' => 'אין שדות לעדכון']);
            return;
        }

        // Add updated_at
        $updateFields[] = "updated_at = NOW()";
        $params[] = $quote_id;

        $sql = "UPDATE quote_requests SET " . implode(', ', $updateFields) . " WHERE id = ?";

        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);

        if ($result) {
            // Log the update
            error_log("Quote updated: ID=$quote_id, Fields=" . implode(',', array_keys($input)));

            // Log to activity_logs
            $logStmt = $db->prepare("
                INSERT INTO activity_logs (entity_type, entity_id, action, details)
                VALUES ('quote_request', ?, 'updated', ?)
            ");
            $logStmt->execute([$quote_id, json_encode($input)]);

            echo json_encode([
                'success' => true,
                'message' => 'בקשה עודכנה בהצלחה',
                'quote_id' => $quote_id
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'שגיאה בעדכון הבקשה']);
        }

    } catch (Exception $e) {
        error_log("Error in updateQuote: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'שגיאה בעדכון הבקשה']);
    }
}
?>
