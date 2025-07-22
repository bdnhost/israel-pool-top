<?php
/**
 * Debug Time Sync
 * Check server time vs database time
 */

require_once 'includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "<h2>🕐 Time Sync Debug</h2>";
    
    // PHP time
    date_default_timezone_set('Asia/Jerusalem');
    $php_time = date('Y-m-d H:i:s');
    $php_timestamp = time();
    
    // Database time
    $stmt = $db->query("SELECT NOW() as db_time, UNIX_TIMESTAMP() as db_timestamp");
    $db_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h3>⏰ Time Comparison:</h3>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Source</th><th>Time</th><th>Timestamp</th></tr>";
    echo "<tr><td><strong>PHP Server</strong></td><td>$php_time</td><td>$php_timestamp</td></tr>";
    echo "<tr><td><strong>MySQL Database</strong></td><td>{$db_result['db_time']}</td><td>{$db_result['db_timestamp']}</td></tr>";
    echo "</table>";
    
    $time_diff = abs($php_timestamp - $db_result['db_timestamp']);
    echo "<p><strong>Time Difference:</strong> $time_diff seconds</p>";
    
    if ($time_diff > 60) {
        echo "<p style='color: red;'>⚠️ WARNING: Time difference is more than 1 minute!</p>";
    } else {
        echo "<p style='color: green;'>✅ Time sync looks good!</p>";
    }
    
    // Test expiration calculation
    echo "<h3>🔍 Expiration Test:</h3>";
    $expires_at = date('Y-m-d H:i:s', time() + 300);
    echo "<p><strong>Current time:</strong> $php_time</p>";
    echo "<p><strong>Expires at (+5 min):</strong> $expires_at</p>";
    
    // Check latest SMS verification
    echo "<h3>📱 Latest SMS Verification:</h3>";
    $stmt = $db->query("
        SELECT phone, code, expires_at, created_at,
               CASE WHEN expires_at > NOW() THEN 'VALID' ELSE 'EXPIRED' END as status
        FROM sms_verifications 
        ORDER BY created_at DESC 
        LIMIT 1
    ");
    $latest = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($latest) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Phone</th><th>Code</th><th>Created</th><th>Expires</th><th>Status</th></tr>";
        $status_color = $latest['status'] === 'VALID' ? 'green' : 'red';
        echo "<tr>";
        echo "<td>{$latest['phone']}</td>";
        echo "<td><strong>{$latest['code']}</strong></td>";
        echo "<td>{$latest['created_at']}</td>";
        echo "<td>{$latest['expires_at']}</td>";
        echo "<td style='color: $status_color;'><strong>{$latest['status']}</strong></td>";
        echo "</tr>";
        echo "</table>";
    } else {
        echo "<p>No SMS verifications found.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
