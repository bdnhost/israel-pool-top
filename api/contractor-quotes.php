<?php
/**
 * Contractor Quotes API
 * Handles contractor quote management and responses
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

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            handleGetRequest($db, $action);
            break;
            
        case 'POST':
            handlePostRequest($db, $action);
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

function handleGetRequest($db, $action) {
    switch ($action) {
        case 'get_quote':
            getQuoteDetails($db);
            break;
            
        default:
            getContractorQuotes($db);
            break;
    }
}

function handlePostRequest($db, $action) {
    switch ($action) {
        case 'submit_response':
            submitResponse($db);
            break;
            
        case 'mark_viewed':
            markAsViewed($db);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

/**
 * Get quotes for a specific contractor
 */
function getContractorQuotes($db) {
    try {
        $contractor_id = $_GET['contractor_id'] ?? '';
        
        if (empty($contractor_id)) {
            throw new Exception('Contractor ID is required');
        }
        
        $sql = "
            SELECT 
                qr.*,
                qca.sent_at,
                qca.viewed_at,
                qca.responded_at,
                qca.response_type,
                qca.estimated_price,
                qca.estimated_duration,
                qca.contractor_notes,
                CASE 
                    WHEN qca.responded_at IS NOT NULL THEN 'responded'
                    WHEN qca.viewed_at IS NOT NULL THEN 'viewed'
                    ELSE 'new'
                END as status
            FROM quote_requests qr
            INNER JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id
            WHERE qca.contractor_id = ?
            ORDER BY qr.created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$contractor_id]);
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($quotes as &$quote) {
            $quote['special_requirements'] = json_decode($quote['special_requirements'] ?? '[]', true);
            $quote['images'] = json_decode($quote['images'] ?? '[]', true);
        }
        
        echo json_encode([
            'success' => true,
            'quotes' => $quotes
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Get detailed quote information
 */
function getQuoteDetails($db) {
    try {
        $quote_id = $_GET['quote_id'] ?? '';
        $contractor_id = $_GET['contractor_id'] ?? '';
        
        if (empty($quote_id) || empty($contractor_id)) {
            throw new Exception('Quote ID and Contractor ID are required');
        }
        
        $sql = "
            SELECT 
                qr.*,
                qca.sent_at,
                qca.viewed_at,
                qca.responded_at,
                qca.response_type,
                qca.estimated_price,
                qca.estimated_duration,
                qca.contractor_notes
            FROM quote_requests qr
            INNER JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id
            WHERE qr.id = ? AND qca.contractor_id = ?
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$quote_id, $contractor_id]);
        $quote = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$quote) {
            throw new Exception('Quote not found or access denied');
        }
        
        // Parse JSON fields
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
 * Submit contractor response to quote
 */
function submitResponse($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $quote_id = $input['quote_id'] ?? '';
        $contractor_id = $input['contractor_id'] ?? '';
        $response_type = $input['response_type'] ?? '';
        $estimated_price = $input['estimated_price'] ?? null;
        $estimated_duration = $input['estimated_duration'] ?? null;
        $contractor_notes = $input['contractor_notes'] ?? '';
        
        if (empty($quote_id) || empty($contractor_id) || empty($response_type) || empty($contractor_notes)) {
            throw new Exception('Missing required fields');
        }
        
        // Validate response type
        $valid_types = ['interested', 'need_more_info', 'not_interested'];
        if (!in_array($response_type, $valid_types)) {
            throw new Exception('Invalid response type');
        }
        
        // Check if contractor is assigned to this quote
        $stmt = $db->prepare("
            SELECT id FROM quote_contractor_assignments 
            WHERE quote_request_id = ? AND contractor_id = ?
        ");
        $stmt->execute([$quote_id, $contractor_id]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            throw new Exception('Contractor not assigned to this quote');
        }
        
        // Check if already responded
        $stmt = $db->prepare("
            SELECT responded_at FROM quote_contractor_assignments 
            WHERE quote_request_id = ? AND contractor_id = ? AND responded_at IS NOT NULL
        ");
        $stmt->execute([$quote_id, $contractor_id]);
        $existing_response = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing_response) {
            throw new Exception('You have already responded to this quote');
        }
        
        $db->beginTransaction();
        
        // Update assignment with response
        $stmt = $db->prepare("
            UPDATE quote_contractor_assignments 
            SET 
                responded_at = NOW(),
                response_type = ?,
                estimated_price = ?,
                estimated_duration = ?,
                contractor_notes = ?
            WHERE quote_request_id = ? AND contractor_id = ?
        ");
        
        $stmt->execute([
            $response_type,
            $estimated_price ? floatval($estimated_price) : null,
            $estimated_duration,
            $contractor_notes,
            $quote_id,
            $contractor_id
        ]);
        
        // Update quote status if this is the first response
        $stmt = $db->prepare("
            SELECT COUNT(*) as response_count 
            FROM quote_contractor_assignments 
            WHERE quote_request_id = ? AND responded_at IS NOT NULL
        ");
        $stmt->execute([$quote_id]);
        $response_count = $stmt->fetch(PDO::FETCH_ASSOC)['response_count'];
        
        if ($response_count == 1) {
            $stmt = $db->prepare("
                UPDATE quote_requests 
                SET status = 'contractors_responded' 
                WHERE id = ?
            ");
            $stmt->execute([$quote_id]);
        }
        
        // Log the activity
        $stmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, entity_id, action, details) 
            VALUES ('quote_request', ?, 'contractor_responded', ?)
        ");
        $stmt->execute([
            $quote_id, 
            json_encode([
                'contractor_id' => $contractor_id,
                'response_type' => $response_type,
                'estimated_price' => $estimated_price
            ])
        ]);
        
        // Send notification to customer (optional - implement if needed)
        // $this->notifyCustomerOfResponse($quote_id, $contractor_id, $response_type);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Response submitted successfully'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Mark quote as viewed by contractor
 */
function markAsViewed($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $quote_id = $input['quote_id'] ?? '';
        $contractor_id = $input['contractor_id'] ?? '';
        
        if (empty($quote_id) || empty($contractor_id)) {
            throw new Exception('Quote ID and Contractor ID are required');
        }
        
        // Update viewed timestamp if not already viewed
        $stmt = $db->prepare("
            UPDATE quote_contractor_assignments 
            SET viewed_at = NOW() 
            WHERE quote_request_id = ? AND contractor_id = ? AND viewed_at IS NULL
        ");
        $stmt->execute([$quote_id, $contractor_id]);
        
        // Log the activity
        $stmt = $db->prepare("
            INSERT INTO activity_logs (entity_type, entity_id, action, details) 
            VALUES ('quote_request', ?, 'quote_viewed', ?)
        ");
        $stmt->execute([
            $quote_id, 
            json_encode(['contractor_id' => $contractor_id])
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Quote marked as viewed'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

/**
 * Send notification to customer about contractor response (optional)
 */
function notifyCustomerOfResponse($db, $quote_id, $contractor_id, $response_type) {
    try {
        // Get customer and contractor details
        $stmt = $db->prepare("
            SELECT 
                qr.customer_name,
                qr.customer_phone,
                qr.customer_email,
                qr.request_number,
                c.title as contractor_name,
                c.phone as contractor_phone
            FROM quote_requests qr
            INNER JOIN quote_contractor_assignments qca ON qr.id = qca.quote_request_id
            INNER JOIN contractors c ON qca.contractor_id = c.id
            WHERE qr.id = ? AND c.id = ?
        ");
        $stmt->execute([$quote_id, $contractor_id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$data) return;
        
        // Prepare notification message based on response type
        $messages = [
            'interested' => "קיבלת תגובה חיובית מהקבלן {$data['contractor_name']} לבקשה #{$data['request_number']}. הקבלן יצור איתך קשר בקרוב.",
            'need_more_info' => "הקבלן {$data['contractor_name']} מעוניין בפרויקט שלך אך זקוק לפרטים נוספים. הוא יצור איתך קשר בקרוב.",
            'not_interested' => "הקבלן {$data['contractor_name']} לא זמין כרגע לפרויקט שלך. נמשיך לחפש קבלנים נוספים."
        ];
        
        $message = $messages[$response_type] ?? "קיבלת תגובה מהקבלן {$data['contractor_name']} לבקשה #{$data['request_number']}.";
        
        // Send SMS notification (implement based on your SMS service)
        // $smsService = new SMSService($db);
        // $smsService->sendSMS($data['customer_phone'], $message);
        
        // Send email notification (implement if needed)
        // $this->sendEmailNotification($data['customer_email'], $message);
        
    } catch (Exception $e) {
        error_log("Error sending customer notification: " . $e->getMessage());
    }
}
?>
