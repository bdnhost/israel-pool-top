<?php
// Pool Israel - Fixed Users API
// Works with user_summary view and system_users table

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
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
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    case 'get_users':
        getUsersList();
        break;
    case 'get_user_stats':
        getUserStats();
        break;
    case 'get_user':
        getUser();
        break;
    case 'create_user':
        createUser();
        break;
    case 'update_user':
        updateUser();
        break;
    case 'block_user':
        blockUser();
        break;
    case 'unblock_user':
        unblockUser();
        break;
    case 'delete_user':
        deleteUser();
        break;
    case 'export_users':
        exportUsers();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getUsersList() {
    global $db;
    
    try {
        // Get filters
        $search = $_GET['search'] ?? '';
        $userType = $_GET['user_type'] ?? '';
        $verificationStatus = $_GET['verification_status'] ?? '';
        $isActive = $_GET['is_active'] ?? '';
        $isBlocked = $_GET['is_blocked'] ?? '';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        // Build WHERE clause
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(display_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
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
            $params[] = $isActive;
        }
        
        if ($isBlocked !== '') {
            $whereConditions[] = "is_blocked = ?";
            $params[] = $isBlocked;
        }
        
        if (!empty($dateFrom)) {
            $whereConditions[] = "DATE(registration_date) >= ?";
            $params[] = $dateFrom;
        }
        
        if (!empty($dateTo)) {
            $whereConditions[] = "DATE(registration_date) <= ?";
            $params[] = $dateTo;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM users {$whereClause}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = $countStmt->fetchColumn();

        // Get users
        $sql = "
            SELECT
                id,
                username as display_name,
                username as name,
                email,
                role as user_type,
                CASE
                    WHEN status = 'active' THEN 'verified'
                    WHEN status = 'inactive' THEN 'pending'
                    WHEN status = 'banned' THEN 'rejected'
                    ELSE status
                END as verification_status,
                status = 'active' as is_active,
                status = 'banned' as is_blocked,
                created_at as registration_date,
                last_login,
                0 as total_quotes,
                0 as total_activities,
                DATEDIFF(CURDATE(), created_at) as days_since_registration
            FROM users
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format users data
        foreach ($users as &$user) {
            $user['registration_date_formatted'] = date('d/m/Y H:i', strtotime($user['registration_date']));
            $user['last_login_formatted'] = $user['last_login'] ? date('d/m/Y H:i', strtotime($user['last_login'])) : 'אף פעם';
            $user['days_since_registration'] = $user['days_since_registration'] ?? 0;
            $user['total_quotes'] = $user['total_quotes'] ?? 0;
            $user['total_activities'] = $user['total_activities'] ?? 0;
            $user['phone'] = ''; // Add empty phone field for compatibility
        }
        
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
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching users: ' . $e->getMessage()]);
    }
}

function getUserStats() {
    global $db;
    
    try {
        // Get current totals from the view
        $totalsSql = "
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as total_customers,
                SUM(CASE WHEN user_type = 'contractor' THEN 1 ELSE 0 END) as total_contractors,
                SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_users,
                SUM(CASE WHEN DATE(registration_date) = CURDATE() THEN 1 ELSE 0 END) as today_registrations
            FROM user_summary
        ";
        
        $stmt = $db->prepare($totalsSql);
        $stmt->execute();
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get growth data from user_statistics table
        $period = $_GET['period'] ?? 30;
        $growthSql = "
            SELECT 
                stat_date,
                new_registrations,
                new_customers,
                new_contractors,
                verified_users
            FROM user_statistics 
            WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY stat_date ASC
        ";
        
        $stmt = $db->prepare($growthSql);
        $stmt->execute([$period]);
        $growthData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format growth data for charts
        $dates = [];
        $registrations = [];
        $customers = [];
        $contractors = [];
        
        foreach ($growthData as $row) {
            $dates[] = $row['stat_date'];
            $registrations[] = intval($row['new_registrations']);
            $customers[] = intval($row['new_customers']);
            $contractors[] = intval($row['new_contractors']);
        }
        
        echo json_encode([
            'success' => true,
            'totals' => [
                'total_users' => intval($totals['total_users']),
                'total_customers' => intval($totals['total_customers']),
                'total_contractors' => intval($totals['total_contractors']),
                'verified_users' => intval($totals['verified_users']),
                'active_users' => intval($totals['active_users']),
                'blocked_users' => intval($totals['blocked_users']),
                'today_registrations' => intval($totals['today_registrations'])
            ],
            'growth' => [
                'dates' => $dates,
                'registrations' => $registrations,
                'customers' => $customers,
                'contractors' => $contractors
            ]
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching stats: ' . $e->getMessage()]);
    }
}

function getUser() {
    global $db;
    
    try {
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            return;
        }
        
        // Get user details from view
        $stmt = $db->prepare("SELECT * FROM user_summary WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }
        
        // Get user activities
        $activitiesStmt = $db->prepare("
            SELECT activity_type, activity_description, created_at 
            FROM user_activity_log 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        ");
        $activitiesStmt->execute([$userId]);
        $activities = $activitiesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user sessions
        $sessionsStmt = $db->prepare("
            SELECT ip_address, user_agent, created_at, expires_at, is_active 
            FROM user_sessions 
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
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching user: ' . $e->getMessage()]);
    }
}

function createUser() {
    global $db;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $phone = $input['phone'] ?? '';
        $userType = $input['user_type'] ?? 'customer';
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        
        if (empty($phone) || empty($userType)) {
            echo json_encode(['success' => false, 'message' => 'Phone and user type are required']);
            return;
        }
        
        // Check if user already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$name, $email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'משתמש עם שם או אימייל זה כבר קיים']);
            return;
        }

        // Create user
        $password_hash = password_hash('123456', PASSWORD_DEFAULT); // Default password
        $stmt = $db->prepare("
            INSERT INTO users (username, email, password_hash, role, status, created_at)
            VALUES (?, ?, ?, ?, 'active', NOW())
        ");
        
        $stmt->execute([
            $name ?: 'user_' . time(),
            $email,
            $password_hash,
            $userType
        ]);
        
        $userId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'משתמש נוצר בהצלחה',
            'user_id' => $userId
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error creating user: ' . $e->getMessage()]);
    }
}

function updateUser() {
    global $db;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? '';
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $verificationStatus = $input['verification_status'] ?? '';
        $isActive = $input['is_active'] ?? '';
        $notes = $input['notes'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
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
        
        if ($isActive !== '') {
            $updateFields[] = "is_active = ?";
            $params[] = $isActive;
        }
        
        if ($notes !== '') {
            $updateFields[] = "notes = ?";
            $params[] = $notes;
        }
        
        if (empty($updateFields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $updateFields[] = "updated_at = NOW()";
        $params[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'משתמש עודכן בהצלחה']);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating user: ' . $e->getMessage()]);
    }
}

function blockUser() {
    global $db;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? '';
        $reason = $input['reason'] ?? 'לא צוין';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            return;
        }
        
        $stmt = $db->prepare("
            UPDATE users
            SET status = 'banned', updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$userId]);
        
        echo json_encode(['success' => true, 'message' => 'משתמש נחסם בהצלחה']);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error blocking user: ' . $e->getMessage()]);
    }
}

function unblockUser() {
    global $db;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            return;
        }
        
        $stmt = $db->prepare("
            UPDATE users
            SET status = 'active', updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$userId]);
        
        echo json_encode(['success' => true, 'message' => 'חסימת משתמש בוטלה בהצלחה']);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error unblocking user: ' . $e->getMessage()]);
    }
}

function deleteUser() {
    global $db;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            return;
        }
        
        $stmt = $db->prepare("
            UPDATE users
            SET status = 'inactive', updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$userId]);
        
        echo json_encode(['success' => true, 'message' => 'משתמש הושבת בהצלחה']);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error deleting user: ' . $e->getMessage()]);
    }
}

function exportUsers() {
    global $db;

    try {
        // Get filters (same as getUsersList)
        $search = $_GET['search'] ?? '';
        $userType = $_GET['user_type'] ?? '';
        $verificationStatus = $_GET['verification_status'] ?? '';
        $isActive = $_GET['is_active'] ?? '';
        $isBlocked = $_GET['is_blocked'] ?? '';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';

        // Build WHERE clause
        $whereConditions = [];
        $params = [];

        if (!empty($search)) {
            $whereConditions[] = "(display_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

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
            $params[] = $isActive;
        }

        if ($isBlocked !== '') {
            $whereConditions[] = "is_blocked = ?";
            $params[] = $isBlocked;
        }

        if (!empty($dateFrom)) {
            $whereConditions[] = "DATE(registration_date) >= ?";
            $params[] = $dateFrom;
        }

        if (!empty($dateTo)) {
            $whereConditions[] = "DATE(registration_date) <= ?";
            $params[] = $dateTo;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get users for export
        $sql = "
            SELECT
                id,
                display_name,
                phone,
                email,
                user_type,
                verification_status,
                registration_date,
                last_login,
                is_active,
                is_blocked,
                contractor_city,
                contractor_rating,
                total_quotes,
                total_activities
            FROM user_summary
            {$whereClause}
            ORDER BY registration_date DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="users_export_' . date('Y-m-d') . '.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Create CSV output
        $output = fopen('php://output', 'w');

        // Add BOM for Hebrew support
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        // CSV headers
        fputcsv($output, [
            'מזהה',
            'שם',
            'טלפון',
            'אימייל',
            'סוג משתמש',
            'סטטוס אימות',
            'תאריך הרשמה',
            'התחברות אחרונה',
            'פעיל',
            'חסום',
            'עיר קבלן',
            'דירוג קבלן',
            'בקשות הצעות מחיר',
            'פעילויות'
        ]);

        // CSV data
        foreach ($users as $user) {
            fputcsv($output, [
                $user['id'],
                $user['display_name'],
                $user['phone'],
                $user['email'] ?: '',
                $user['user_type'],
                $user['verification_status'],
                $user['registration_date'],
                $user['last_login'] ?: '',
                $user['is_active'] ? 'כן' : 'לא',
                $user['is_blocked'] ? 'כן' : 'לא',
                $user['contractor_city'] ?: '',
                $user['contractor_rating'] ?: '',
                $user['total_quotes'] ?: 0,
                $user['total_activities'] ?: 0
            ]);
        }

        fclose($output);

    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error exporting users: ' . $e->getMessage()]);
    }
}
?>
