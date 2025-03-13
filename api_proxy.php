<?php
// อนุญาต CORS จาก localhost
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// ตรวจสอบพารามิเตอร์
$action = isset($_GET['action']) ? $_GET['action'] : '';
$camera = isset($_GET['camera']) ? $_GET['camera'] : '';
$channel = isset($_GET['channel']) ? $_GET['channel'] : '1';

// ตรวจสอบว่าจำเป็นต้องมีพารามิเตอร์
if (empty($action) || empty($camera)) {
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// กำหนด IP ของกล้อง
$camera_ips = [
    '1' => '192.168.1.14',
    '2' => '192.168.1.11'
];

if (!isset($camera_ips[$camera])) {
    echo json_encode(['error' => 'Invalid camera ID']);
    exit;
}

$camera_ip = $camera_ips[$camera];

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
        echo json_encode(['error' => 'Invalid action']);
        exit;
}

// ทำการร้องขอไปยังกล้อง
$context = stream_context_create([
    'http' => [
        'header' => "Authorization: Basic " . base64_encode("admin:P4ssw0rd")
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === FALSE) {
    echo json_encode(['error' => 'Failed to connect to camera']);
} else {
    // ส่งคืนการตอบสนองโดยตรง
    header('Content-Type: text/plain');
    echo $response;
}
?>