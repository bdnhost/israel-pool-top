<?php
/**
 * Quote Requests API
 * Handles quote request creation, SMS verification, and management
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

try {
    $database = new Database();
    $db = $database->getConnection();
    $smsService = new SMSService($db);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    $path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    
    // Get action from URL or POST data
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch ($method) {
        case 'POST':
            handlePostRequest($db, $smsService, $action);
            break;
            
        case 'GET':
            handleGetRequest($db, $action);
            break;
            
        case 'PUT':
            handlePutRequest($db, $action);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function handlePostRequest($db, $smsService, $action) {
    switch ($action) {
        case 'create':
        case 'submit_quote':
            submitQuoteRequest($db, $smsService);
            break;

        case 'send_verification':
            sendVerificationCode($smsService);
            break;

        case 'verify_phone':
        case 'verify_code':
            verifyCode($db, $smsService);
            break;

        case 'upload_image':
            uploadQuoteImage();
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action]);
    }
}

function handleGetRequest($db, $action) {
    switch ($action) {
        case 'get_quote':
            getQuoteRequest($db);
            break;
            
        case 'get_quotes':
            getQuoteRequests($db);
            break;
            
        case 'get_stats':
            getQuoteStats($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Send SMS verification code
 */
function sendVerificationCode($smsService) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $phone = $input['phone'] ?? $_POST['phone'] ?? '';

        if (empty($phone)) {
            echo json_encode(['success' => false, 'message' => 'מספר טלפון נדרש']);
            return;
        }

        // Clean phone number
        $phone = preg_replace('/[^\d]/', '', $phone);
        if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
            $phone = '972' . substr($phone, 1);
        }

        // Send SMS using SMS4Free service (this will also save to database)
        try {
            $result = $smsService->sendVerificationCode($phone, 'quote');

            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'קוד אימות נשלח בהצלחה',
                    'phone' => $phone
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'שגיאה בשליחת SMS: ' . ($result['message'] ?? 'שגיאה לא ידועה')
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'שגיאה בשליחת SMS: ' . $e->getMessage()
            ]);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה: ' . $e->getMessage()]);
    }
}

/**
 * Verify SMS code
 */
function verifyCode($db, $smsService) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $phone = $input['phone'] ?? $_POST['phone'] ?? '';
        $code = $input['code'] ?? $_POST['code'] ?? '';

        if (empty($phone) || empty($code)) {
            echo json_encode(['success' => false, 'message' => 'טלפון וקוד נדרשים']);
            return;
        }

        // Use SMSService to verify code
        $result = $smsService->verifyCode($phone, $code);

        if ($result['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'אימות הצליח',
                'phone' => $phone
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => $result['message'] ?? 'קוד אימות שגוי'
            ]);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה: ' . $e->getMessage()]);
    }
}

/**
 * Submit quote request
 */
function submitQuoteRequest($db, $smsService) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required_fields = ['customer_name', 'customer_phone', 'pool_type', 'pool_size', 'budget_range', 'preferred_timing', 'project_location'];
        foreach ($required_fields as $field) {
            if (empty($input[$field])) {
                echo json_encode(['success' => false, 'message' => "שדה {$field} נדרש"]);
                return;
            }
        }
        
        // Verify phone was verified
        if (!isPhoneVerified($db, $input['customer_phone'])) {
            echo json_encode(['success' => false, 'message' => 'מספר הטלפון לא אומת']);
            return;
        }
        
        // Create quote request
        $quote_id = createQuoteRequest($db, $input);
        
        if ($quote_id) {
            // Find suitable contractors
            $contractors = findSuitableContractors($db, $input);
            
            // Send notifications to contractors
            $sent_count = 0;
            foreach ($contractors as $contractor) {
                if (sendQuoteToContractor($db, $smsService, $quote_id, $contractor, $input)) {
                    $sent_count++;
                }
            }
            
            // Update quote status
            updateQuoteStatus($db, $quote_id, 'sent_to_contractors');
            
            // Get quote number for response
            $quote_number = getQuoteNumber($db, $quote_id);
            
            echo json_encode([
                'success' => true,
                'message' => 'בקשתך נשלחה בהצלחה',
                'quote_id' => $quote_id,
                'quote_number' => $quote_number,
                'contractors_notified' => $sent_count
            ]);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'שגיאה ביצירת הבקשה']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה: ' . $e->getMessage()]);
    }
}

/**
 * Check if phone number was verified
 */
function isPhoneVerified($db, $phone) {
    // Clean phone number (same format as in SMSService)
    $phone = preg_replace('/[^0-9]/', '', $phone);

    // Convert to local format (same as SMSService cleanPhoneNumber)
    if (str_starts_with($phone, '972')) {
        $phone = '0' . substr($phone, 3);
    } elseif (str_starts_with($phone, '+972')) {
        $phone = '0' . substr($phone, 4);
    }

    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM sms_verifications
        WHERE phone = ? AND verified = TRUE AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute([$phone]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    return $result['count'] > 0;
}

/**
 * Create quote request in database
 */
function createQuoteRequest($db, $data) {
    try {
        // Generate unique request number
        $request_number = 'QR' . date('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("
            INSERT INTO quote_requests (
                request_number, customer_name, customer_phone, customer_email, customer_city, customer_address,
                pool_type, pool_size, budget_range, project_location, preferred_timing,
                description, special_requirements, images, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $special_requirements = json_encode($data['special_requirements'] ?? []);
        $images = json_encode($data['images'] ?? []);

        $stmt->execute([
            $request_number,
            $data['customer_name'],
            $data['customer_phone'],
            $data['customer_email'] ?? null,
            $data['customer_city'] ?? null,
            $data['customer_address'] ?? null,
            $data['pool_type'],
            $data['pool_size'],
            $data['budget_range'],
            $data['project_location'],
            $data['preferred_timing'],
            $data['description'] ?? null,
            $special_requirements,
            $images,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        return $db->lastInsertId();
        
    } catch (Exception $e) {
        error_log("Error creating quote request: " . $e->getMessage());
        return false;
    }
}

/**
 * Find suitable contractors for the quote
 */
function findSuitableContractors($db, $quote_data) {
    try {
        // Get system setting for max contractors
        $max_contractors = getSystemSetting($db, 'max_contractors_per_quote', 3);

        // First try with strict filters
        $sql = "
            SELECT c.*,
                   (CASE WHEN c.is_featured = 1 THEN 1 ELSE 0 END) as priority_score
            FROM contractors c
            WHERE (c.status = 'active' OR c.status IS NULL)
        ";

        $params = [];

        // Filter by location if specified (more flexible)
        $location = $quote_data['customer_city'] ?? $quote_data['project_location'] ?? '';
        if (!empty($location)) {
            // More flexible location matching - include contractors without city or with similar city
            $sql .= " AND (c.city LIKE ? OR c.city IS NULL OR c.city = '' OR c.city LIKE '%ישראל%')";
            $params[] = '%' . $location . '%';
        }

        // Filter by categories if pool type is specific (more flexible)
        if (!empty($quote_data['pool_type']) && $quote_data['pool_type'] !== 'unknown') {
            $category_map = [
                'concrete' => 'בטון',
                'fiberglass' => 'פיברגלס',
                'modular' => 'מתועש',
                'renovation' => 'שיפוץ'
            ];

            if (isset($category_map[$quote_data['pool_type']])) {
                $sql .= " AND (JSON_SEARCH(c.categories, 'one', ?) IS NOT NULL OR c.categories IS NULL OR c.categories = '' OR c.categories = '[]')";
                $params[] = $category_map[$quote_data['pool_type']];
            }
        }

        // Only include contractors with valid phone numbers
        $sql .= " AND c.phone IS NOT NULL AND c.phone != '' AND c.phone REGEXP '^05[0-9]{8}$|^0[2-4,8-9][0-9]{7}$'";

        $sql .= " ORDER BY priority_score DESC, c.rating DESC, RAND() LIMIT ?";
        $params[] = $max_contractors;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $contractors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // If no contractors found with filters, try without filters (fallback)
        if (empty($contractors)) {
            error_log("No contractors found with filters, trying fallback query");
            $fallback_sql = "
                SELECT c.*,
                       (CASE WHEN c.is_featured = 1 THEN 1 ELSE 0 END) as priority_score
                FROM contractors c
                WHERE (c.status = 'active' OR c.status IS NULL)
                ORDER BY priority_score DESC, c.rating DESC, RAND()
                LIMIT ?
            ";
            $fallback_stmt = $db->prepare($fallback_sql);
            $fallback_stmt->execute([$max_contractors]);
            $contractors = $fallback_stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        error_log("Found " . count($contractors) . " contractors for quote");
        error_log("Quote data: " . json_encode($quote_data));
        error_log("SQL query: " . $sql);
        error_log("SQL params: " . json_encode($params));

        // Log contractor details for debugging
        foreach ($contractors as $contractor) {
            error_log("Contractor found: ID={$contractor['id']}, Name={$contractor['title']}, City={$contractor['city']}, Phone={$contractor['phone']}, Status={$contractor['status']}");
        }

        return $contractors;

    } catch (Exception $e) {
        error_log("Error finding contractors: " . $e->getMessage());
        return [];
    }
}

/**
 * Send quote to contractor
 */
function sendQuoteToContractor($db, $smsService, $quote_id, $contractor, $quote_data) {
    try {
        // Create assignment record
        $stmt = $db->prepare("
            INSERT INTO quote_contractor_assignments (quote_request_id, contractor_id, sent_at) 
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$quote_id, $contractor['id']]);
        
        // Get quote number
        $quote_number = getQuoteNumber($db, $quote_id);
        
        // Prepare SMS data
        $sms_data = [
            'quote_id' => $quote_id,
            'quote_number' => $quote_number,
            'customer_name' => $quote_data['customer_name'],
            'pool_type' => $quote_data['pool_type'],
            'pool_size' => $quote_data['pool_size'],
            'project_location' => $quote_data['project_location']
        ];
        
        // Send SMS
        error_log("Sending SMS to contractor: {$contractor['title']} ({$contractor['phone']})");
        $sms_result = $smsService->sendQuoteNotification($contractor['phone'], $sms_data);
        error_log("SMS result: " . json_encode($sms_result));

        // Update assignment with SMS status
        $stmt = $db->prepare("
            UPDATE quote_contractor_assignments
            SET sms_sent = ?
            WHERE quote_request_id = ? AND contractor_id = ?
        ");
        $stmt->execute([$sms_result['success'] ? 1 : 0, $quote_id, $contractor['id']]);

        return $sms_result['success'];
        
    } catch (Exception $e) {
        error_log("Error sending quote to contractor: " . $e->getMessage());
        return false;
    }
}

/**
 * Get quote number by ID
 */
function getQuoteNumber($db, $quote_id) {
    $stmt = $db->prepare("SELECT request_number FROM quote_requests WHERE id = ?");
    $stmt->execute([$quote_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['request_number'] ?? null;
}

/**
 * Update quote status
 */
function updateQuoteStatus($db, $quote_id, $status) {
    $stmt = $db->prepare("UPDATE quote_requests SET status = ? WHERE id = ?");
    $stmt->execute([$status, $quote_id]);
}

/**
 * Get system setting
 */
function getSystemSetting($db, $key, $default = null) {
    $stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result ? $result['setting_value'] : $default;
}

/**
 * Upload quote image
 */
function uploadQuoteImage() {
    try {
        if (!isset($_FILES['image'])) {
            echo json_encode(['success' => false, 'message' => 'לא נבחרה תמונה']);
            return;
        }
        
        $file = $_FILES['image'];
        
        // Validate file
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'סוג קובץ לא נתמך']);
            return;
        }
        
        if ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
            echo json_encode(['success' => false, 'message' => 'הקובץ גדול מדי']);
            return;
        }
        
        // Create upload directory
        $upload_dir = '../uploads/quotes/' . date('Y/m/');
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $extension;
        $filepath = $upload_dir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $relative_path = 'uploads/quotes/' . date('Y/m/') . $filename;
            echo json_encode([
                'success' => true,
                'message' => 'תמונה הועלתה בהצלחה',
                'file_path' => $relative_path
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'שגיאה בהעלאת התמונה']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'שגיאה: ' . $e->getMessage()]);
    }
}
?>
