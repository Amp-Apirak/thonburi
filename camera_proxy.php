<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ตั้งค่า IP, username, password ของกล้อง
$cameras = [
    'camera1' => ['ip' => '192.168.1.11', 'user' => 'admin', 'pass' => 'P4ssw0rd'],
    'camera2' => ['ip' => '192.168.1.14', 'user' => 'admin', 'pass' => 'P4ssw0rd']
];

// รับพารามิเตอร์จาก JavaScript
$cameraId = $_GET['camera'] ?? 'camera1';
$action = $_GET['action'] ?? 'getSummary';

// ตรวจสอบกล้องที่ขอข้อมูล
if (!isset($cameras[$cameraId])) {
    die(json_encode(['error' => 'Invalid camera ID']));
}

$camera = $cameras[$cameraId];

// สร้าง URL เรียกข้อมูลกล้อง
$url = \"http://{$camera['ip']}/cgi-bin/videoStatServer.cgi?action={$action}\";

if ($action === 'startFind') {
    $startTime = urlencode($_GET['startTime']);
    $endTime = urlencode($_GET['endTime']);
    $granularity = $_GET['granularity'] ?? 'Hour';
    $url .= \"&condition.StartTime={$startTime}&condition.EndTime={$endTime}&condition.Granularity={$granularity}&condition.RuleType=NumberStat\";
} elseif ($action === 'doFind') {
    $token = $_GET['token'];
    $url .= \"&token={$token}&beginNumber=0&count=14\";
}

// เรียกกล้อง Dahua ด้วย cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_USERPWD, \"{$camera['user']}:{$camera['pass']}\");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo json_encode(['response' => $response]);
