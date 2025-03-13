<?php
// อนุญาต CORS จาก localhost
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// จัดการคำขอ OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // ส่งส่วนหัวที่จำเป็นและจบการทำงาน
    http_response_code(200);
    exit;
}

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

// ใช้ cURL แทน file_get_contents
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// ไม่ตรวจสอบใบรับรองความปลอดภัย SSL (อาจไม่จำเป็นสำหรับกล้อง IP ภายในเครือข่าย)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// เพิ่ม Basic Auth header โดยตรง
$auth_header = "Authorization: Basic " . base64_encode("$username:$password");
curl_setopt($ch, CURLOPT_HTTPHEADER, array($auth_header));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$info = curl_getinfo($ch);
curl_close($ch);

// บันทึกข้อมูลการตอบกลับ
$responseLog = date('Y-m-d H:i:s') . " - Response received. HTTP Code: $httpCode, Length: " . strlen($response) . "\n";
if ($error) {
    $responseLog .= "Error: $error\n";
}
$responseLog .= "Info: " . json_encode($info) . "\n";
file_put_contents($logFile, $responseLog, FILE_APPEND);

if ($httpCode !== 200) {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => "HTTP Error: $httpCode", 
        'details' => $error,
        'url' => $url,
        'info' => $info
    ]);
} else {
    // ส่งคืนการตอบสนองโดยตรง
    header('Content-Type: text/plain');
    echo $response;
}
?>