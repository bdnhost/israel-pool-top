<?php
/**
 * SMS Service for Pool Israel
 * Handles SMS verification and notifications using SMS4Free API
 */

class SMSService {
    private $api_url = 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS';
    private $balance_url = 'https://api.sms4free.co.il/ApiSMS/AvailableSMS';
    private $api_key;
    private $user;
    private $pass;
    private $sender;
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
        
        // Load SMS credentials from config or environment
        $this->api_key = 'iHXHOETxM';
        $this->user = '0544995151'; // Fixed phone number
        $this->pass = '59505289'; // Direct password
        $this->sender = '0532062346'; // Fixed sender
    }
    
    /**
     * Send verification code to customer
     */
    public function sendVerificationCode($phone, $type = 'quote') {
        try {
            // Clean phone number
            $phone = $this->cleanPhoneNumber($phone);
            if (!$this->isValidIsraeliPhone($phone)) {
                throw new Exception('מספר טלפון לא תקין');
            }
            
            // Rate limiting disabled for development/testing
            
            // Generate verification code
            $code = $this->generateVerificationCode();

            // Debug log
    

            // Save to database
            $this->saveVerificationCode($phone, $code, $type);

            // Send SMS
            $message = $this->formatVerificationMessage($code);

            $result = $this->sendSMS($phone, $message);
            
            if ($result['success']) {
                $this->logActivity('sms', null, 'verification_sent', [
                    'phone' => $phone,
                    'type' => $type
                ]);
                return ['success' => true, 'message' => 'קוד אימות נשלח בהצלחה'];
            } else {
                throw new Exception($result['message']);
            }
            
        } catch (Exception $e) {
            $this->logActivity('sms', null, 'verification_failed', [
                'phone' => $phone,
                'error' => $e->getMessage()
            ]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Verify SMS code
     */
    public function verifyCode($phone, $code) {
        try {
            $phone = $this->cleanPhoneNumber($phone);





            $stmt = $this->db->prepare("
                SELECT * FROM sms_verifications
                WHERE phone = ? AND code = ? AND verified = FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$phone, $code]);
            $verification = $stmt->fetch(PDO::FETCH_ASSOC);

            
            if (!$verification) {
                // Increment attempts
                $this->incrementVerificationAttempts($phone);
                return ['success' => false, 'message' => 'קוד אימות שגוי או פג תוקף'];
            }

            // Additional expiration check
            if (strtotime($verification['expires_at']) <= time()) {
                return ['success' => false, 'message' => 'קוד אימות פג תוקף. בקש קוד חדש'];
            }
            
            // Mark as verified
            $stmt = $this->db->prepare("
                UPDATE sms_verifications
                SET verified = TRUE
                WHERE id = ?
            ");
            $stmt->execute([$verification['id']]);


            
            $this->logActivity('sms', $verification['id'], 'verification_success', [
                'phone' => $phone
            ]);
            
            return ['success' => true, 'message' => 'אימות בוצע בהצלחה'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'שגיאה באימות הקוד'];
        }
    }
    
    /**
     * Send quote notification to contractor
     */
    public function sendQuoteNotification($contractor_phone, $quote_data) {
        try {
            $phone = $this->cleanPhoneNumber($contractor_phone);
            $message = $this->formatQuoteMessage($quote_data);
            
            $result = $this->sendSMS($phone, $message);
            
            if ($result['success']) {
                $this->logActivity('sms', $quote_data['quote_id'], 'quote_notification_sent', [
                    'contractor_phone' => $phone,
                    'quote_number' => $quote_data['quote_number']
                ]);
            }
            
            return $result;
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Send SMS using SMS4Free API
     */
    private function sendSMS($recipient, $message) {
        try {
            $postdata = [
                'key' => $this->api_key,
                'user' => $this->user,
                'pass' => $this->pass,
                'sender' => $this->sender,
                'recipient' => $recipient,
                'msg' => $message
            ];
            
            $data_string = json_encode($postdata);
            
            $ch = curl_init($this->api_url);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $curl_errno = curl_errno($ch);
            $curl_error = curl_error($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            // Log for debugging
            error_log("SMS API Request: " . $data_string);
            error_log("SMS API Response: " . $response);
            error_log("HTTP Code: " . $http_code);

            if ($curl_errno > 0) {
                throw new Exception("CURL Error: $curl_error");
            }

            $result = json_decode($response, true);

            if ($result && isset($result['status']) && $result['status'] > 0) {
                return ['success' => true, 'message' => 'SMS נשלח בהצלחה'];
            } else {
                $status = $result['status'] ?? 'unknown';
                $error_message = $this->getSMSErrorMessage($status);
                error_log("SMS Error: Status $status - $error_message");
                throw new Exception($error_message);
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Check SMS balance
     */
    public function checkBalance() {
        try {
            $postdata = [
                'key' => $this->api_key,
                'user' => $this->user,
                'pass' => $this->pass
            ];
            
            $data_string = json_encode($postdata);
            
            $ch = curl_init($this->balance_url);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            return json_decode($response, true);
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Generate 4-digit verification code
     */
    private function generateVerificationCode() {
        return str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * Save verification code to database
     */
    private function saveVerificationCode($phone, $code, $type) {
        // Set timezone to match database
        date_default_timezone_set('Asia/Jerusalem');
        $expires_at = date('Y-m-d H:i:s', time() + 300); // 5 minutes



        // First, delete any existing unverified codes for this phone
        $delete_stmt = $this->db->prepare("
            DELETE FROM sms_verifications
            WHERE phone = ? AND verified = FALSE
        ");
        $delete_stmt->execute([$phone]);

        // Then insert the new code
        $stmt = $this->db->prepare("
            INSERT INTO sms_verifications (phone, code, type, expires_at, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$phone, $code, $type, $expires_at, $_SERVER['REMOTE_ADDR'] ?? null]);


    }
    
    /**
     * Check rate limiting for SMS sending
     */
    private function checkRateLimit($phone) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count 
            FROM sms_verifications 
            WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        $stmt->execute([$phone]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] < 3; // Max 3 SMS per 10 minutes
    }
    
    /**
     * Clean and format Israeli phone number
     */
    private function cleanPhoneNumber($phone) {
        // Remove all non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Handle international format
        if (str_starts_with($phone, '972')) {
            $phone = '0' . substr($phone, 3);
        } elseif (str_starts_with($phone, '+972')) {
            $phone = '0' . substr($phone, 4);
        }
        
        return $phone;
    }
    
    /**
     * Validate Israeli phone number
     */
    private function isValidIsraeliPhone($phone) {
        $patterns = [
            '/^05[0-9]{8}$/',     // Mobile
            '/^0[2-4,8-9][0-9]{7}$/' // Landline
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $phone)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Format verification message
     */
    private function formatVerificationMessage($code) {
        return "קוד האימות שלך באתר Pool Israel: {$code}\nהקוד תקף ל-5 דקות";
    }
    
    /**
     * Format quote notification message
     */
    private function formatQuoteMessage($quote_data) {
        $pool_types = [
            'concrete' => 'בריכת בטון',
            'fiberglass' => 'בריכת פיברגלס',
            'modular' => 'בריכה מתועשת',
            'renovation' => 'שיפוץ בריכה'
        ];
        
        $pool_sizes = [
            'small' => 'קטנה',
            'medium' => 'בינונית',
            'large' => 'גדולה',
            'xl' => 'גדולה מאוד'
        ];
        
        $pool_type = $pool_types[$quote_data['pool_type']] ?? $quote_data['pool_type'];
        $pool_size = $pool_sizes[$quote_data['pool_size']] ?? $quote_data['pool_size'];
        
        return "🏊 בקשת הצעת מחיר חדשה!\n" .
               "לקוח: {$quote_data['customer_name']}\n" .
               "פרויקט: {$pool_type} {$pool_size}\n" .
               "מיקום: {$quote_data['project_location']}\n" .
               "לפרטים: https://israel-pool.top/contractor/quote/{$quote_data['quote_number']}";
    }
    
    /**
     * Get SMS error message by code
     */
    private function getSMSErrorMessage($status_code) {
        $errors = [
            0 => 'שגיאה כללית',
            -1 => 'מפתח, שם משתמש או סיסמה שגויים',
            -2 => 'שם או מספר שולח ההודעה שגוי',
            -3 => 'לא נמצאו נמענים',
            -4 => 'לא ניתן לשלוח הודעה, יתרת הודעות פנויות נמוכה',
            -5 => 'הודעה לא מתאימה',
            -6 => 'צריך לאמת מספר שולח'
        ];
        
        return $errors[$status_code] ?? 'שגיאה לא ידועה';
    }
    
    /**
     * Increment verification attempts
     */
    private function incrementVerificationAttempts($phone) {
        $stmt = $this->db->prepare("
            UPDATE sms_verifications 
            SET attempts = attempts + 1 
            WHERE phone = ? AND verified = FALSE AND expires_at > NOW()
        ");
        $stmt->execute([$phone]);
    }
    


    /**
     * Log activity
     */
    private function logActivity($entity_type, $entity_id, $action, $details) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO activity_logs (entity_type, entity_id, action, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $entity_type,
                $entity_id,
                $action,
                json_encode($details),
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            // Log error but don't throw - logging shouldn't break main functionality
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
}
?>
