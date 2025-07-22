<?php
/**
 * Users Management API
 * Comprehensive user management system for Pool Israel
 */

require_once '../includes/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
            handlePostRequest($db, $action);
            break;
            
        case 'PUT':
            handlePutRequest($db, $action);
            break;
            
        case 'DELETE':
            handleDeleteRequest($db, $action);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Users API Error: " . $e->getMessage());
    
    // Log to activity_logs table
    try {
        $stmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, action, details, ip_address) 
            VALUES ('system', 'api_error', ?, ?)
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

/**
 * Handle GET requests
 */
function handleGetRequest($db, $action) {
    switch ($action) {
        case 'get_users':
            getUsers($db);
            break;
            
        case 'get_user':
            getUser($db);
            break;
            
        case 'get_user_stats':
            getUserStats($db);
            break;
            
        case 'get_user_activity':
            getUserActivity($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Handle POST requests
 */
function handlePostRequest($db, $action) {
    switch ($action) {
        case 'create_user':
            createUser($db);
            break;
            
        case 'verify_user':
            verifyUser($db);
            break;
            
        case 'send_user_sms':
            sendUserSMS($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Handle PUT requests
 */
function handlePutRequest($db, $action) {
    switch ($action) {
        case 'update_user':
            updateUser($db);
            break;
            
        case 'block_user':
            blockUser($db);
            break;
            
        case 'unblock_user':
            unblockUser($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest($db, $action) {
    switch ($action) {
        case 'delete_user':
            deleteUser($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Get users with filtering and pagination
 */
function getUsers($db) {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $userType = $_GET['user_type'] ?? '';
    $verificationStatus = $_GET['verification_status'] ?? '';
    $isActive = $_GET['is_active'] ?? '';
    $isBlocked = $_GET['is_blocked'] ?? '';
    $dateFrom = $_GET['date_from'] ?? '';
    $dateTo = $_GET['date_to'] ?? '';
    $search = $_GET['search'] ?? '';
    
    $whereConditions = [];
    $params = [];
    
    if (!empty($userType)) {
        $whereConditions[] = "user_type = ?";
        $params[] = $userType;
    }
    
    if (!empty($verificationStatus)) {
        $whereConditions[] = "verification_status = ?";
        $params[] = $verificationStatus;
    }
    
    if ($isActive !== '') {
        $whereConditions[] = "is_active = ?";
        $params[] = $isActive ? 1 : 0;
    }
    
    if ($isBlocked !== '') {
        $whereConditions[] = "is_blocked = ?";
        $params[] = $isBlocked ? 1 : 0;
    }
    
    if (!empty($dateFrom)) {
        $whereConditions[] = "DATE(registration_date) >= ?";
        $params[] = $dateFrom;
    }
    
    if (!empty($dateTo)) {
        $whereConditions[] = "DATE(registration_date) <= ?";
        $params[] = $dateTo;
    }
    
    if (!empty($search)) {
        $whereConditions[] = "(name LIKE ? OR phone LIKE ? OR email LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get total count
    $countSql = "SELECT COUNT(*) FROM system_users {$whereClause}";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetchColumn();

    // Get users
    $sql = "
        SELECT
            su.*,
            CASE
                WHEN su.user_type = 'contractor' AND c.title IS NOT NULL THEN c.title
                WHEN su.name IS NOT NULL AND su.name != '' THEN su.name
                ELSE CONCAT('משתמש ', su.id)
            END as display_name,
            c.city as contractor_city,
            c.rating as contractor_rating,
            c.status as contractor_status,
            DATEDIFF(CURDATE(), su.registration_date) as days_since_registration,
            CASE
                WHEN su.is_blocked = 1 THEN 'חסום'
                WHEN su.is_active = 0 THEN 'לא פעיל'
                WHEN su.verification_status = 'pending' THEN 'ממתין לאימות'
                WHEN su.verification_status = 'rejected' THEN 'נדחה'
                ELSE 'פעיל'
            END as status_text
        FROM system_users su
        LEFT JOIN contractors c ON su.id = c.system_user_id AND su.user_type = 'contractor'
        {$whereClause}
        ORDER BY su.registration_date DESC
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($totalCount / $limit),
            'total_count' => $totalCount,
            'per_page' => $limit
        ]
    ]);
}

/**
 * Get single user details
 */
function getUser($db) {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    // Get user details
    $stmt = $db->prepare("
        SELECT
            su.*,
            CASE
                WHEN su.user_type = 'contractor' AND c.title IS NOT NULL THEN c.title
                WHEN su.name IS NOT NULL AND su.name != '' THEN su.name
                ELSE CONCAT('משתמש ', su.id)
            END as display_name,
            c.city as contractor_city,
            c.rating as contractor_rating,
            c.status as contractor_status
        FROM system_users su
        LEFT JOIN contractors c ON su.id = c.system_user_id AND su.user_type = 'contractor'
        WHERE su.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'משתמש לא נמצא']);
        return;
    }
    
    // Get user activity
    $activityStmt = $db->prepare("
        SELECT * FROM user_activity_log 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
    ");
    $activityStmt->execute([$userId]);
    $activities = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get user sessions
    $sessionsStmt = $db->prepare("
        SELECT * FROM user_sessions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $sessionsStmt->execute([$userId]);
    $sessions = $sessionsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'activities' => $activities,
        'sessions' => $sessions
    ]);
}

/**
 * Get user statistics
 */
function getUserStats($db) {
    $period = $_GET['period'] ?? '30'; // days
    
    // Get daily stats
    $sql = "
        SELECT * FROM user_statistics 
        WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY stat_date DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$period]);
    $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary stats
    $summarySql = "
        SELECT 
            SUM(new_registrations) as total_new_registrations,
            SUM(new_customers) as total_new_customers,
            SUM(new_contractors) as total_new_contractors,
            SUM(verified_users) as total_verified_users,
            AVG(active_users) as avg_active_users
        FROM user_statistics 
        WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ";
    
    $stmt = $db->prepare($summarySql);
    $stmt->execute([$period]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get current totals from system_users table
    $totalsSql = "
        SELECT
            COUNT(*) as total_users,
            SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as total_customers,
            SUM(CASE WHEN user_type = 'contractor' THEN 1 ELSE 0 END) as total_contractors,
            SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_users,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
            SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_users,
            SUM(CASE WHEN DATE(registration_date) = CURDATE() THEN 1 ELSE 0 END) as today_registrations
        FROM system_users
    ";
    
    $stmt = $db->query($totalsSql);
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'daily_stats' => $dailyStats,
        'summary' => $summary,
        'totals' => $totals
    ]);
}

/**
 * Get user activity logs
 */
function getUserActivity($db) {
    $userId = $_GET['user_id'] ?? '';
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT * FROM user_activity_log 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$userId, $limit, $offset]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM user_activity_log WHERE user_id = ?");
    $countStmt->execute([$userId]);
    $totalCount = $countStmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'activities' => $activities,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($totalCount / $limit),
            'total_count' => $totalCount,
            'per_page' => $limit
        ]
    ]);
}

/**
 * Create new user
 */
function createUser($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $phone = $input['phone'] ?? '';
    $userType = $input['user_type'] ?? 'customer';
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    
    if (empty($phone)) {
        echo json_encode(['success' => false, 'message' => 'מספר טלפון נדרש']);
        return;
    }
    
    // Check if user already exists
    $stmt = $db->prepare("SELECT id FROM system_users WHERE phone = ?");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'משתמש עם מספר טלפון זה כבר קיים']);
        return;
    }

    // Create user
    $stmt = $db->prepare("
        INSERT INTO system_users (phone, user_type, name, email, verification_status, ip_address, user_agent)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    ");
    
    $result = $stmt->execute([
        $phone,
        $userType,
        $name,
        $email,
        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    if ($result) {
        $userId = $db->lastInsertId();
        
        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO user_activity_log (user_id, activity_type, activity_description, ip_address) 
            VALUES (?, 'profile_update', 'User created by admin', ?)
        ");
        $logStmt->execute([$userId, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        
        echo json_encode([
            'success' => true,
            'message' => 'משתמש נוצר בהצלחה',
            'user_id' => $userId
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'שגיאה ביצירת משתמש']);
    }
}

/**
 * Update user
 */
function updateUser($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? '';
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $verificationStatus = $input['verification_status'] ?? '';
    $isActive = $input['is_active'] ?? null;
    $notes = $input['notes'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    $updateFields = [];
    $params = [];
    
    if (!empty($name)) {
        $updateFields[] = "name = ?";
        $params[] = $name;
    }
    
    if (!empty($email)) {
        $updateFields[] = "email = ?";
        $params[] = $email;
    }
    
    if (!empty($verificationStatus)) {
        $updateFields[] = "verification_status = ?";
        $params[] = $verificationStatus;
    }
    
    if ($isActive !== null) {
        $updateFields[] = "is_active = ?";
        $params[] = $isActive ? 1 : 0;
    }
    
    if (!empty($notes)) {
        $updateFields[] = "notes = ?";
        $params[] = $notes;
    }
    
    if (empty($updateFields)) {
        echo json_encode(['success' => false, 'message' => 'אין שדות לעדכון']);
        return;
    }
    
    $updateFields[] = "updated_at = NOW()";
    $params[] = $userId;
    
    $sql = "UPDATE system_users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO user_activity_log (user_id, activity_type, activity_description, ip_address) 
            VALUES (?, 'profile_update', 'Profile updated by admin', ?)
        ");
        $logStmt->execute([$userId, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        
        echo json_encode(['success' => true, 'message' => 'משתמש עודכן בהצלחה']);
    } else {
        echo json_encode(['success' => false, 'message' => 'שגיאה בעדכון משתמש']);
    }
}

/**
 * Block user
 */
function blockUser($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? '';
    $reason = $input['reason'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE system_users
        SET is_blocked = TRUE, blocked_reason = ?, blocked_at = NOW(), blocked_by = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    if ($stmt->execute([$reason, $_SESSION['admin_user_id'], $userId])) {
        echo json_encode(['success' => true, 'message' => 'משתמש נחסם בהצלחה']);
    } else {
        echo json_encode(['success' => false, 'message' => 'שגיאה בחסימת משתמש']);
    }
}

/**
 * Unblock user
 */
function unblockUser($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE system_users
        SET is_blocked = FALSE, blocked_reason = NULL, blocked_at = NULL, blocked_by = NULL, updated_at = NOW()
        WHERE id = ?
    ");
    
    if ($stmt->execute([$userId])) {
        echo json_encode(['success' => true, 'message' => 'חסימת משתמש בוטלה בהצלחה']);
    } else {
        echo json_encode(['success' => false, 'message' => 'שגיאה בביטול חסימת משתמש']);
    }
}

/**
 * Delete user (soft delete - mark as inactive)
 */
function deleteUser($db) {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'מזהה משתמש נדרש']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE system_users
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = ?
    ");
    
    if ($stmt->execute([$userId])) {
        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO user_activity_log (user_id, activity_type, activity_description, ip_address) 
            VALUES (?, 'profile_update', 'User deactivated by admin', ?)
        ");
        $logStmt->execute([$userId, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        
        echo json_encode(['success' => true, 'message' => 'משתמש הושבת בהצלחה']);
    } else {
        echo json_encode(['success' => false, 'message' => 'שגיאה בהשבתת משתמש']);
    }
}
?>
