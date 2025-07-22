<?php
require 'includes/config.php';
require 'includes/database.php';
require 'includes/SMSService.php';

$db = new Database();
$sms = new SMSService($db);
$balance = $sms->checkBalance();

echo "SMS Balance Check:\n";
print_r($balance);
?>
