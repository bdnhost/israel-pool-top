<?php
require 'includes/config.php';
require 'includes/database.php';

$config = require 'includes/config.php';

echo "Trying to connect to database:\n";
echo "Host: " . $config['db_host'] . "\n";
echo "Database: " . $config['db_name'] . "\n";
echo "Username: " . $config['db_username'] . "\n";

try {
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $config['db_username'], $config['db_password'], $options);
    echo "Database connection successful!\n";
    
    // Check if sms_verifications table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'sms_verifications'");
    if ($stmt->rowCount() > 0) {
        echo "sms_verifications table exists.\n";
    } else {
        echo "sms_verifications table does NOT exist.\n";
    }
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
?>
