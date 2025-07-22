<?php
// Pool Israel - Simple SMS Test (No Database)
// Just tests SMS connection without any database dependencies

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

switch($action) {
    case 'test_connection':
        testSMSConnection();
        break;
    case 'get_balance':
        getSMSBalance();
        break;
    case 'send_test':
        sendTestSMS();
        break;
    case 'get_logs':
        getSMSLogs();
        break;
    case 'get_stats':
        getSMSStats();
        break;
    case 'send_verification':
        sendTestSMS(); // Use same function for now
        break;
    case 'status':
    default:
        echo json_encode([
            'success' => true,
            'message' => 'SMS API is working',
            'available_actions' => [
                'test_connection',
                'get_balance',
                'send_test',
                'get_logs',
                'get_stats',
                'send_verification'
            ]
        ]);
}

function testSMSConnection() {
    // Just call getSMSBalance since it's the same test
    getSMSBalance();
    return;
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $balanceUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בחיבור: ' . $error,
            'details' => [
                'curl_error' => $error,
                'http_code' => $httpCode
            ]
        ]);
        return;
    }
    
    if ($httpCode !== 200) {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בשרת SMS: HTTP ' . $httpCode,
            'details' => [
                'http_code' => $httpCode,
                'response' => $response
            ]
        ]);
        return;
    }
    
    $apiResponse = json_decode($response, true);
    
    echo json_encode([
        'success' => true,
        'message' => 'חיבור לשרת SMS תקין',
        'api_response' => $apiResponse,
        'balance' => $apiResponse['balance'] ?? 'לא ידוע'
    ]);
}

function getSMSBalance() {
    $apiKey = 'iHXHOETxM';
    $user = '0544995151';
    $password = '59505289';
    $balanceUrl = 'https://api.sms4free.co.il/ApiSMS/v2/GetBalance';
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $balanceUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בחיבור: ' . $error]);
        return;
    }
    
    $apiResponse = json_decode($response, true);

    echo json_encode([
        'success' => true,
        'balance' => $apiResponse['balance'] ?? 0,
        'currency' => 'ILS',
        'api_response' => $apiResponse,
        'raw_response' => $response,
        'response_length' => strlen($response),
        'json_error' => json_last_error_msg()
    ]);
}

function sendTestSMS() {
    $input = json_decode(file_get_contents('php://input'), true);
    $phone = $input['phone'] ?? '';
    $message = $input['message'] ?? 'הודעת בדיקה מ Pool Israel';
    
    if (empty($phone)) {
        echo json_encode(['success' => false, 'message' => 'מספר טלפון נדרש']);
        return;
    }
    
    // Clean phone number
    $cleanPhone = cleanPhoneNumber($phone);
    
    if (!isValidPhone($cleanPhone)) {
        echo json_encode(['success' => false, 'message' => 'מספר טלפון לא תקין: ' . $cleanPhone]);
        return;
    }
    
    $apiKey = 'iHXHOETxM';
    $user = '0544995151';
    $password = '59505289';
    $sender = 'poolisrael';
    $sendUrl = 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS';
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password,
        'sender' => $sender,
        'recipient' => $cleanPhone,
        'msg' => $message
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $sendUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בחיבור: ' . $error]);
        return;
    }
    
    $apiResponse = json_decode($response, true);
    
    echo json_encode([
        'success' => $apiResponse['status'] === 'success',
        'message' => $apiResponse['status'] === 'success' ? 'SMS נשלח בהצלחה' : 'שגיאה בשליחת SMS: ' . ($apiResponse['message'] ?? 'שגיאה לא ידועה'),
        'sms_id' => $apiResponse['sms_id'] ?? null,
        'api_response' => $apiResponse,
        'phone_used' => $cleanPhone,
        'original_phone' => $phone
    ]);
}

function cleanPhoneNumber($phone) {
    // Remove all non-digits
    $clean = preg_replace('/\D/', '', $phone);
    
    // Convert to Israeli format
    if (strlen($clean) === 10 && substr($clean, 0, 1) === '0') {
        return '972' . substr($clean, 1);
    } elseif (strlen($clean) === 9) {
        return '972' . $clean;
    } elseif (strlen($clean) === 12 && substr($clean, 0, 3) === '972') {
        return $clean;
    }
    
    return $clean;
}

function isValidPhone($phone) {
    // Israeli mobile numbers: 972-5X-XXXXXXX or 972-7X-XXXXXXX
    return preg_match('/^972[5-9]\d{8}$/', $phone);
}

function getSMSLogs() {
    require_once '../includes/database.php';

    try {
        $database = new Database();
        $db = $database->getConnection();

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = ($page - 1) * $limit;

        $recipientType = $_GET['recipient_type'] ?? '';
        $messageType = $_GET['message_type'] ?? '';
        $status = $_GET['status'] ?? '';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';

        $whereConditions = [];
        $params = [];

        if (!empty($recipientType)) {
            $whereConditions[] = "recipient_type = ?";
            $params[] = $recipientType;
        }

        if (!empty($messageType)) {
            $whereConditions[] = "type = ?";
            $params[] = $messageType;
        }

        if (!empty($status)) {
            $whereConditions[] = "status = ?";
            $params[] = $status;
        }

        if (!empty($dateFrom)) {
            $whereConditions[] = "DATE(created_at) >= ?";
            $params[] = $dateFrom;
        }

        if (!empty($dateTo)) {
            $whereConditions[] = "DATE(created_at) <= ?";
            $params[] = $dateTo;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get total count
        $countSql = "SELECT COUNT(*) FROM sms_verifications {$whereClause}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = $countStmt->fetchColumn();

        // Get SMS logs
        $sql = "
            SELECT
                sv.*,
                CASE
                    WHEN c.title IS NOT NULL THEN c.title
                    ELSE 'לקוח'
                END as contractor_name,
                0.15 as cost,
                CASE
                    WHEN sv.verified = 1 THEN 'sent'
                    ELSE 'failed'
                END as status,
                CASE
                    WHEN c.title IS NOT NULL THEN 'contractor'
                    ELSE 'customer'
                END as recipient_type
            FROM sms_verifications sv
            LEFT JOIN contractors c ON sv.phone = c.phone
            {$whereClause}
            ORDER BY sv.created_at DESC
            LIMIT ? OFFSET ?
        ";

        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'logs' => $logs,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalCount / $limit),
                'total_count' => $totalCount,
                'per_page' => $limit
            ]
        ]);

    } catch (Exception $e) {
        error_log("SMS Logs Error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בטעינת לוגי SMS: ' . $e->getMessage()
        ]);
    }
}

function getSMSStats() {
    require_once '../includes/database.php';

    try {
        $database = new Database();
        $db = $database->getConnection();

        $period = $_GET['period'] ?? '30'; // days

        // Get overall statistics
        $summaryStmt = $db->prepare("
            SELECT
                COUNT(*) as total_sent,
                SUM(CASE WHEN sv.verified = 1 THEN 1 ELSE 0 END) as total_delivered,
                SUM(CASE WHEN sv.verified = 0 THEN 1 ELSE 0 END) as total_failed,
                COUNT(*) * 0.15 as total_cost,
                ROUND((SUM(CASE WHEN sv.verified = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as delivery_rate,
                SUM(CASE WHEN c.title IS NULL THEN 1 ELSE 0 END) as customer_sms,
                SUM(CASE WHEN c.title IS NOT NULL THEN 1 ELSE 0 END) as contractor_sms,
                SUM(CASE WHEN sv.type = 'quote' THEN 1 ELSE 0 END) as verification_sms,
                SUM(CASE WHEN sv.type != 'quote' THEN 1 ELSE 0 END) as notification_sms
            FROM sms_verifications sv
            LEFT JOIN contractors c ON sv.phone = c.phone
            WHERE sv.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ");
        $summaryStmt->execute([$period]);
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        // Get today's statistics
        $todayStmt = $db->prepare("
            SELECT
                COUNT(*) as today_sent,
                COUNT(*) * 0.15 as today_cost
            FROM sms_verifications
            WHERE DATE(created_at) = CURDATE()
        ");
        $todayStmt->execute();
        $today = $todayStmt->fetch(PDO::FETCH_ASSOC);

        // Get daily statistics for the last 7 days
        $dailyStmt = $db->prepare("
            SELECT
                DATE(created_at) as stat_date,
                COUNT(*) as total_sent,
                SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as total_delivered,
                SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as total_failed
            FROM sms_verifications
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY stat_date DESC
        ");
        $dailyStmt->execute();
        $dailyStats = $dailyStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'summary' => $summary,
            'today' => $today,
            'daily_stats' => $dailyStats
        ]);

    } catch (Exception $e) {
        error_log("SMS Stats Error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בטעינת סטטיסטיקות SMS: ' . $e->getMessage()
        ]);
    }
}
?>
