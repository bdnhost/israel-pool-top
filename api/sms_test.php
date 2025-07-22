<?php
// Pool Israel - SMS Test API
// Simple SMS testing without complex dependencies

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = 'localhost';
$dbname = 'shlomion_israelpool';
$username = 'shlomion_israelpool';
$password = 'f^NUl$!VKKid';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    case 'test_connection':
        testSMSConnection();
        break;
    case 'send_test':
        sendTestSMS();
        break;
    case 'get_balance':
        getSMSBalance();
        break;
    case 'send_verification':
        sendVerificationSMS();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function testSMSConnection() {
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
        'api_response' => $apiResponse
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
        echo json_encode(['success' => false, 'message' => 'מספר טלפון לא תקין']);
        return;
    }
    
    $apiKey = 'iHXHOETxM';
    $user = '0544995151';
    $password = '59505289';
    $sender = '0532062346';
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
    
    if (isset($apiResponse['status']) && $apiResponse['status'] === 'success') {
        echo json_encode([
            'success' => true,
            'message' => 'SMS נשלח בהצלחה',
            'sms_id' => $apiResponse['sms_id'] ?? null,
            'api_response' => $apiResponse
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בשליחת SMS: ' . ($apiResponse['message'] ?? 'שגיאה לא ידועה'),
            'api_response' => $apiResponse
        ]);
    }
}

function sendVerificationSMS() {
    global $db;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $phone = $input['phone'] ?? '';
    $name = $input['name'] ?? '';
    $userType = $input['user_type'] ?? 'customer';
    
    if (empty($phone)) {
        echo json_encode(['success' => false, 'message' => 'מספר טלפון נדרש']);
        return;
    }
    
    // Generate verification code
    $code = sprintf('%06d', mt_rand(100000, 999999));
    $message = "קוד האימות שלך ב Pool Israel הוא: {$code}";
    
    // Clean phone number
    $cleanPhone = cleanPhoneNumber($phone);
    
    if (!isValidPhone($cleanPhone)) {
        echo json_encode(['success' => false, 'message' => 'מספר טלפון לא תקין']);
        return;
    }
    
    // Send SMS
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
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo json_encode(['success' => false, 'message' => 'שגיאה בחיבור: ' . $error]);
        return;
    }
    
    $apiResponse = json_decode($response, true);
    
    if (isset($apiResponse['status']) && $apiResponse['status'] === 'success') {
        // Store verification code in database
        try {
            $stmt = $db->prepare("
                INSERT INTO sms_verifications (phone, code, type, expires_at, ip_address)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)
            ");
            $stmt->execute([
                $cleanPhone,
                $code,
                $userType === 'contractor' ? 'contractor_registration' : 'quote',
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'קוד אימות נשלח בהצלחה',
                'verification_id' => $db->lastInsertId()
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'SMS נשלח אך לא ניתן לשמור בבסיס הנתונים: ' . $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'שגיאה בשליחת SMS: ' . ($apiResponse['message'] ?? 'שגיאה לא ידועה'),
            'api_response' => $apiResponse
        ]);
    }
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
    // Israeli mobile numbers: 972-5X-XXXXXXX
    return preg_match('/^972[5-9]\d{8}$/', $phone);
}
?>
