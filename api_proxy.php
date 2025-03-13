<?php
// อนุญาต CORS จาก localhost
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// บันทึกข้อมูลการร้องขอเพื่อการแก้ไขปัญหา
$logFile = 'api_proxy_log.txt';
$logMessage = date('Y-m-d H:i:s') . " - Request: " . $_SERVER['REQUEST_URI'] . "\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ตรวจสอบพารามิเตอร์
$action = isset($_GET['action']) ? $_GET['action'] : '';
$camera = isset($_GET['camera']) ? $_GET['camera'] : '';
$channel = isset($_GET['channel']) ? $_GET['channel'] : '1';

// ตรวจสอบว่าจำเป็นต้องมีพารามิเตอร์
if (empty($action) || empty($camera)) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// กำหนด IP ของกล้อง
$camera_ips = [
    '1' => '192.168.1.14',
    '2' => '192.168.1.11'
];

if (!isset($camera_ips[$camera])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid camera ID']);
    exit;
}

$camera_ip = $camera_ips[$camera];

// กำหนดข้อมูลการยืนยันตัวตน
$username = 'admin';
$password = 'P4ssw0rd';

// สร้าง URL ตามการกระทำ
$url = '';
$startTime = isset($_GET['startTime']) ? $_GET['startTime'] : '';
$endTime = isset($_GET['endTime']) ? $_GET['endTime'] : '';
$token = isset($_GET['token']) ? $_GET['token'] : '';
$beginNumber = isset($_GET['beginNumber']) ? $_GET['beginNumber'] : '';
$count = isset($_GET['count']) ? $_GET['count'] : '';

switch ($action) {
    case 'getSummary':
        $url = "http://$camera_ip/cgi-bin/videoStatServer.cgi?action=getSummary&channel=$channel";
        break;
    case 'startFind':
        $url = "http://$camera_ip/cgi-bin/videoStatServer.cgi?action=startFind&channel=$channel&condition.StartTime=$startTime&condition.EndTime=$endTime&condition.Granularity=Hour";
        break;
    case 'doFind':
        $url = "http://$camera_ip/cgi-bin/videoStatServer.cgi?action=doFind&channel=$channel&token=$token&beginNumber=$beginNumber&count=$count";
        break;
    case 'stopFind':
        $url = "http://$camera_ip/cgi-bin/videoStatServer.cgi?action=stopFind&token=$token&channel=$channel";
        break;
    default:
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid action']);
        exit;
}

// บันทึก URL ที่จะเรียกใช้
$logMessage = date('Y-m-d H:i:s') . " - Calling URL: $url\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ตั้งค่า HTTP context ด้วยข้อมูลการยืนยันตัวตน
$context = stream_context_create([
    'http' => [
        'header' => "Authorization: Basic " . base64_encode("$username:$password")
    ]
]);

// ทำการร้องขอไปยังกล้อง
$response = @file_get_contents($url, false, $context);

// ตรวจสอบข้อผิดพลาด
if ($response === FALSE) {
    $error = error_get_last();
    $errorMessage = date('Y-m-d H:i:s') . " - Error: " . (isset($error['message']) ? $error['message'] : 'Unknown error') . "\n";
    file_put_contents($logFile, $errorMessage, FILE_APPEND);
    
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to connect to camera', 'details' => $error]);
} else {
    // บันทึกการตอบสนอง
    $responseLog = date('Y-m-d H:i:s') . " - Response received. Length: " . strlen($response) . "\n";
    file_put_contents($logFile, $responseLog, FILE_APPEND);
    
    // ส่งคืนการตอบสนองโดยตรง
    header('Content-Type: text/plain');
    echo $response;
}
?>