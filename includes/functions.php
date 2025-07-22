<?php
/**
 * Pool Israel - Helper Functions
 */

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email address
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (Israeli format)
 */
function isValidPhone($phone) {
    // Remove all non-digit characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Check Israeli phone number patterns
    $patterns = [
        '/^05[0-9]{8}$/',     // Mobile: 05X-XXXXXXX
        '/^0[2-4,8-9][0-9]{7}$/', // Landline: 0X-XXXXXXX
        '/^1[5-9][0-9]{2}$/'   // Short numbers: 1XXX
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $phone)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Format phone number for display
 */
function formatPhone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    if (strlen($phone) === 10 && substr($phone, 0, 2) === '05') {
        // Mobile: 050-123-4567
        return substr($phone, 0, 3) . '-' . substr($phone, 3, 3) . '-' . substr($phone, 6);
    } elseif (strlen($phone) === 9 && substr($phone, 0, 1) === '0') {
        // Landline: 03-123-4567
        return substr($phone, 0, 2) . '-' . substr($phone, 2, 3) . '-' . substr($phone, 5);
    }
    
    return $phone;
}

/**
 * Generate slug from Hebrew text
 */
function generateSlug($text) {
    // Hebrew to Latin transliteration map
    $hebrew_to_latin = [
        'א' => 'a', 'ב' => 'b', 'ג' => 'g', 'ד' => 'd', 'ה' => 'h', 'ו' => 'v',
        'ז' => 'z', 'ח' => 'ch', 'ט' => 't', 'י' => 'y', 'כ' => 'k', 'ל' => 'l',
        'מ' => 'm', 'ן' => 'n', 'נ' => 'n', 'ס' => 's', 'ע' => 'a', 'פ' => 'p',
        'ץ' => 'tz', 'צ' => 'tz', 'ק' => 'k', 'ר' => 'r', 'ש' => 'sh', 'ת' => 't',
        'ך' => 'ch', 'ם' => 'm', 'ף' => 'f'
    ];
    
    // Convert Hebrew to Latin
    $slug = strtr($text, $hebrew_to_latin);
    
    // Convert to lowercase and replace spaces with hyphens
    $slug = strtolower($slug);
    $slug = preg_replace('/[^a-z0-9\-]/', '', $slug);
    $slug = preg_replace('/\-+/', '-', $slug);
    $slug = trim($slug, '-');
    
    return $slug;
}

/**
 * Calculate reading time for content
 */
function calculateReadingTime($content) {
    $word_count = str_word_count(strip_tags($content));
    $reading_speed = 200; // words per minute (Hebrew average)
    return max(1, ceil($word_count / $reading_speed));
}

/**
 * Format date for Hebrew display
 */
function formatHebrewDate($date) {
    $timestamp = is_string($date) ? strtotime($date) : $date;
    
    $hebrew_months = [
        1 => 'ינואר', 2 => 'פברואר', 3 => 'מרץ', 4 => 'אפריל',
        5 => 'מאי', 6 => 'יוני', 7 => 'יולי', 8 => 'אוגוסט',
        9 => 'ספטמבר', 10 => 'אוקטובר', 11 => 'נובמבר', 12 => 'דצמבר'
    ];
    
    $day = date('j', $timestamp);
    $month = $hebrew_months[(int)date('n', $timestamp)];
    $year = date('Y', $timestamp);
    
    return "{$day} ב{$month} {$year}";
}

/**
 * Generate excerpt from content
 */
function generateExcerpt($content, $length = 150) {
    $content = strip_tags($content);
    if (mb_strlen($content) <= $length) {
        return $content;
    }
    
    $excerpt = mb_substr($content, 0, $length);
    $last_space = mb_strrpos($excerpt, ' ');
    
    if ($last_space !== false) {
        $excerpt = mb_substr($excerpt, 0, $last_space);
    }
    
    return $excerpt . '...';
}

/**
 * Validate and resize image
 */
function processUploadedImage($file, $max_width = 800, $max_height = 600, $quality = 85) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!in_array($file['type'], $allowed_types)) {
        throw new Exception('סוג קובץ לא נתמך');
    }
    
    if ($file['size'] > 5 * 1024 * 1024) { // 5MB
        throw new Exception('הקובץ גדול מדי');
    }
    
    $image_info = getimagesize($file['tmp_name']);
    if (!$image_info) {
        throw new Exception('קובץ תמונה לא תקין');
    }
    
    // Create image resource
    switch ($file['type']) {
        case 'image/jpeg':
            $source = imagecreatefromjpeg($file['tmp_name']);
            break;
        case 'image/png':
            $source = imagecreatefrompng($file['tmp_name']);
            break;
        case 'image/gif':
            $source = imagecreatefromgif($file['tmp_name']);
            break;
    }
    
    $original_width = imagesx($source);
    $original_height = imagesy($source);
    
    // Calculate new dimensions
    $ratio = min($max_width / $original_width, $max_height / $original_height);
    $new_width = round($original_width * $ratio);
    $new_height = round($original_height * $ratio);
    
    // Create new image
    $destination = imagecreatetruecolor($new_width, $new_height);
    
    // Preserve transparency for PNG and GIF
    if ($file['type'] === 'image/png' || $file['type'] === 'image/gif') {
        imagealphablending($destination, false);
        imagesavealpha($destination, true);
        $transparent = imagecolorallocatealpha($destination, 255, 255, 255, 127);
        imagefill($destination, 0, 0, $transparent);
    }
    
    // Resize image
    imagecopyresampled($destination, $source, 0, 0, 0, 0, $new_width, $new_height, $original_width, $original_height);
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $filepath = 'uploads/' . $filename;
    
    // Save image
    switch ($file['type']) {
        case 'image/jpeg':
            imagejpeg($destination, $filepath, $quality);
            break;
        case 'image/png':
            imagepng($destination, $filepath);
            break;
        case 'image/gif':
            imagegif($destination, $filepath);
            break;
    }
    
    // Clean up memory
    imagedestroy($source);
    imagedestroy($destination);
    
    return $filename;
}

/**
 * Send email using PHPMailer or basic mail()
 */
function sendEmail($to, $subject, $message, $from_name = 'Pool Israel') {
    $config = require __DIR__ . '/config.php';
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $from_name . ' <' . $config['contact_info']['email'] . '>',
        'Reply-To: ' . $config['contact_info']['email'],
        'X-Mailer: PHP/' . phpversion()
    ];
    
    return mail($to, $subject, $message, implode("\r\n", $headers));
}

/**
 * Log activity or errors
 */
function logActivity($message, $level = 'info', $context = []) {
    $config = require __DIR__ . '/config.php';
    
    if (!$config['debug_mode'] && $level === 'debug') {
        return;
    }
    
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'level' => $level,
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    $log_file = __DIR__ . '/../logs/' . date('Y-m-d') . '.log';
    
    // Create logs directory if it doesn't exist
    $log_dir = dirname($log_file);
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    file_put_contents($log_file, json_encode($log_entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Check if user is admin (simple implementation)
 */
function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

/**
 * Redirect with message
 */
function redirect($url, $message = null, $type = 'info') {
    if ($message) {
        $_SESSION['flash_message'] = $message;
        $_SESSION['flash_type'] = $type;
    }
    
    header('Location: ' . $url);
    exit();
}

/**
 * Get and clear flash message
 */
function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = $_SESSION['flash_message'];
        $type = $_SESSION['flash_type'] ?? 'info';
        
        unset($_SESSION['flash_message']);
        unset($_SESSION['flash_type']);
        
        return ['message' => $message, 'type' => $type];
    }
    
    return null;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
?>
