<?php
require 'includes/config.php';
require 'includes/database.php';
require 'includes/SMSService.php';

$db = new Database();
$db->getConnection(); // Initialize database connection
$sms = new SMSService($db);

// Use a test phone number (replace with a valid number for testing)
$testPhone = '0544995151'; // This is the number from the credentials
$result = $sms->sendVerificationCode($testPhone, 'test');

echo "Test SMS Result:\n";
print_r($result);
?>
