
<?php
$postData = [
    'key' => 'iHXHOETxM',
    'user' => '0544995151',
    'pass' => '59505289',
    'sender' => '0532062346',
    'recipient' => '972584995151', // שנה למספר תקני
    'msg' => 'בדיקה - מערכת עובדת'
];

$ch = curl_init('https://api.sms4free.co.il/ApiSMS/v2/SendSMS');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP CODE: $httpCode\n";
echo "ERROR: $error\n";
echo "RESPONSE: $response\n";
?>