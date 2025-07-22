<?php
// Pool Israel - SMS Debug Tool
// Tests different SMS4Free API endpoints

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? 'test_all';

$apiKey = 'iHXHOETxM';
$user = '0544995151';
$password = '59505289';

switch($action) {
    case 'test_all':
        testAllEndpoints();
        break;
    case 'test_v1':
        testV1API();
        break;
    case 'test_v2':
        testV2API();
        break;
    case 'test_send':
        testSendSMS();
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}

function testAllEndpoints() {
    global $apiKey, $user, $password;
    
    $endpoints = [
        'v1_balance' => 'https://api.sms4free.co.il/ApiSMS/GetBalance',
        'v2_balance' => 'https://api.sms4free.co.il/ApiSMS/v2/GetBalance',
        'v1_send' => 'https://api.sms4free.co.il/ApiSMS/SendSMS',
        'v2_send' => 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS'
    ];
    
    $results = [];
    
    foreach ($endpoints as $name => $url) {
        $postData = [
            'key' => $apiKey,
            'user' => $user,
            'pass' => $password
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
                'User-Agent: Pool-Israel/1.0'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        $results[$name] = [
            'url' => $url,
            'http_code' => $httpCode,
            'curl_error' => $error,
            'response' => $response,
            'response_length' => strlen($response),
            'json_decoded' => json_decode($response, true),
            'json_error' => json_last_error_msg()
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Tested all endpoints',
        'results' => $results
    ], JSON_PRETTY_PRINT);
}

function testV1API() {
    global $apiKey, $user, $password;
    
    $url = 'https://api.sms4free.co.il/ApiSMS/GetBalance';
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_VERBOSE => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo json_encode([
        'api_version' => 'v1',
        'url' => $url,
        'http_code' => $httpCode,
        'curl_error' => $error,
        'raw_response' => $response,
        'response_length' => strlen($response),
        'json_decoded' => json_decode($response, true),
        'json_error' => json_last_error_msg(),
        'post_data' => $postData
    ], JSON_PRETTY_PRINT);
}

function testV2API() {
    global $apiKey, $user, $password;
    
    $url = 'https://api.sms4free.co.il/ApiSMS/v2/GetBalance';
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
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
    
    echo json_encode([
        'api_version' => 'v2',
        'url' => $url,
        'http_code' => $httpCode,
        'curl_error' => $error,
        'raw_response' => $response,
        'response_length' => strlen($response),
        'json_decoded' => json_decode($response, true),
        'json_error' => json_last_error_msg(),
        'post_data' => $postData
    ], JSON_PRETTY_PRINT);
}

function testSendSMS() {
    global $apiKey, $user, $password;
    
    $phone = $_GET['phone'] ?? '972544995151'; // Default to your number
    $message = $_GET['message'] ?? 'Test from Pool Israel';
    
    $url = 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS';
    
    $postData = [
        'key' => $apiKey,
        'user' => $user,
        'pass' => $password,
        'sender' => 'poolisrael',
        'recipient' => $phone,
        'msg' => $message
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo json_encode([
        'action' => 'send_sms',
        'url' => $url,
        'http_code' => $httpCode,
        'curl_error' => $error,
        'raw_response' => $response,
        'response_length' => strlen($response),
        'json_decoded' => json_decode($response, true),
        'json_error' => json_last_error_msg(),
        'post_data' => $postData
    ], JSON_PRETTY_PRINT);
}
?>
