<?php
// อนุญาต CORS จาก localhost
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// จัดการคำขอ OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// บันทึกข้อมูลการร้องขอ
$logFile = 'api_proxy_log.txt';
$logMessage = date('Y-m-d H:i:s') . " - Request: " . $_SERVER['REQUEST_URI'] . "\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ตรวจสอบพารามิเตอร์
$action = isset($_GET['action']) ? $_GET['action'] : '';
$camera = isset($_GET['camera']) ? $_GET['camera'] : '';
$channel = isset($_GET['channel']) ? $_GET['channel'] : '1';

// เลือกใช้ข้อมูลจำลองเมื่อมีการเรียกใช้งาน API
$useMockData = true; // ตั้งค่าเป็น true เพื่อใช้ข้อมูลจำลอง

// หากใช้ข้อมูลจำลอง ให้เรียกใช้ไฟล์ mock_data.php
if ($useMockData) {
    // ตรวจสอบว่าไฟล์ mock_data.php มีอยู่หรือไม่
    if (file_exists('mock_data.php')) {
        $logMessage = date('Y-m-d H:i:s') . " - Using mock data for: " . $_SERVER['REQUEST_URI'] . "\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        // ส่งพารามิเตอร์ไปยัง mock_data.php
        $_GET['mockSourceFile'] = 'api_proxy';
        include_once 'mock_data.php';
        exit;
    }
}

// ตรวจสอบว่าการกระทำ 'ping' ไม่จำเป็นต้องมีพารามิเตอร์กล้อง
if ($action === 'ping') {
    if (empty($camera)) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Missing camera parameter']);
        exit;
    }
} else if (empty($action) || empty($camera)) {
    // สำหรับการกระทำอื่นๆ ทั้งการกระทำและกล้องเป็นสิ่งจำเป็น
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// กำหนด IP และพอร์ตของกล้อง
$camera_ips = [
    '1' => '192.168.1.14',
    '2' => '192.168.1.11'
];

$camera_ports = [
    '1' => '80',
    '2' => '80'
];

if (!isset($camera_ips[$camera])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid camera ID']);
    exit;
}

$camera_ip = $camera_ips[$camera];
$port = $camera_ports[$camera];

// กำหนดข้อมูลการยืนยันตัวตน (ใช้ข้อมูลจริงของกล้อง)
$username = 'admin';
$password = 'P4ssw0rd'; // รหัสผ่านที่ถูกต้อง

// สร้าง URL ตามการกระทำ
$url = '';
$startTime = isset($_GET['startTime']) ? $_GET['startTime'] : '';
$endTime = isset($_GET['endTime']) ? $_GET['endTime'] : '';
$token = isset($_GET['token']) ? $_GET['token'] : '';
$beginNumber = isset($_GET['beginNumber']) ? $_GET['beginNumber'] : '';
$count = isset($_GET['count']) ? $_GET['count'] : '';

switch ($action) {
    case 'ping':
        // ทดลองใช้ API เรียบง่ายเพื่อตรวจสอบการเชื่อมต่อ
        $url = "http://$camera_ip:$port/cgi-bin/magicBox.cgi?action=getDeviceType";
        break;
    case 'getSummary':
        $url = "http://$camera_ip:$port/cgi-bin/videoStatServer.cgi?action=getSummary&channel=$channel";
        break;
    case 'startFind':
        $url = "http://$camera_ip:$port/cgi-bin/videoStatServer.cgi?action=startFind&channel=$channel&condition.StartTime=$startTime&condition.EndTime=$endTime&condition.Granularity=Hour";
        break;
    case 'doFind':
        $url = "http://$camera_ip:$port/cgi-bin/videoStatServer.cgi?action=doFind&channel=$channel&token=$token&beginNumber=$beginNumber&count=$count";
        break;
    case 'stopFind':
        $url = "http://$camera_ip:$port/cgi-bin/videoStatServer.cgi?action=stopFind&token=$token&channel=$channel";
        break;
    default:
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid action']);
        exit;
}

// บันทึก URL ที่จะเรียกใช้
$logMessage = date('Y-m-d H:i:s') . " - Calling URL: $url\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ใช้ cURL เพื่อการควบคุมที่ดีกว่า
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// ทดลองวิธีการยืนยันตัวตนแบบต่างๆ
curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_DIGEST); // ลองใช้ Digest Authentication
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Expect:')); // สำหรับ Digest Authentication

// ตั้งค่าการทำงานละเอียด เพื่อตรวจสอบข้อผิดพลาด
curl_setopt($ch, CURLOPT_VERBOSE, true);
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

// ตั้งค่าอื่นๆ ของ cURL
curl_setopt($ch, CURLOPT_FAILONERROR, false); // ไม่ล้มเหลวในข้อผิดพลาด HTTP
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1); // ใช้ HTTP 1.1
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // เวลาหมดในการเชื่อมต่อ (วินาที)
curl_setopt($ch, CURLOPT_TIMEOUT, 10); // เวลาหมดสำหรับการดำเนินการทั้งหมด (วินาที)
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // ติดตามการเปลี่ยนเส้นทาง
curl_setopt($ch, CURLOPT_MAXREDIRS, 5); // จำนวนการเปลี่ยนเส้นทางสูงสุด
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // ไม่ตรวจสอบ SSL
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // ไม่ตรวจสอบ SSL
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

// ดำเนินการส่งคำขอ
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
$error = curl_error($ch);
$info = curl_getinfo($ch);

// บันทึกข้อมูลการตอบกลับ
$logMessage = date('Y-m-d H:i:s') . " - Response received. HTTP Code: $httpCode, Length: " . strlen($response) . "\n";
$logMessage .= "Effective URL: $effectiveUrl\n";
if ($error) {
    $logMessage .= "Error: $error\n";
    
    // บันทึกข้อมูลละเอียดเพิ่มเติม
    rewind($verbose);
    $verboseLog = stream_get_contents($verbose);
    $logMessage .= "Verbose info:\n" . $verboseLog . "\n";
}
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ปิด cURL
curl_close($ch);

// ถ้าเป็นการ ping และไม่มีการตอบสนอง ให้ส่งสถานะ offline
if ($action === 'ping') {
    header('Content-Type: application/json');
    if ($httpCode === 200 && $response) {
        echo json_encode(['status' => 'online']);
    } else {
        echo json_encode(['status' => 'offline']);
    }
    exit;
}

// ถ้ามีข้อผิดพลาดในการเชื่อมต่อ ให้แสดงข้อมูลจำลอง
if ($httpCode !== 200 || $error) {
    if ($action === 'getSummary') {
        // สร้างข้อมูลสรุปจำลอง
        header('Content-Type: text/plain');
        echo "summary.Channel=0\n";
        echo "summary.RuleName=NumberStat\n";
        echo "summary.EnteredSubtotal.Today=0\n";
        echo "summary.EnteredSubtotal.Total=0\n";
        echo "summary.EnteredSubtotal.TotalInTimeSection=0\n";
        echo "summary.ExitedSubtotal.Today=0\n";
        echo "summary.ExitedSubtotal.Total=0\n";
        echo "summary.ExitedSubtotal.TotalInTimeSection=0\n";
        exit;
    } else if ($action === 'startFind') {
        // สร้างโทเค็นจำลองและการนับทั้งหมด = 0
        header('Content-Type: text/plain');
        echo "token=mock_token\ntotalCount=0\n";
        exit;
    } else {
        // ส่งค่าข้อผิดพลาดสำหรับการกระทำอื่นๆ
        header('Content-Type: application/json');
        echo json_encode([
            'error' => $error ? $error : "HTTP Error: $httpCode", 
            'details' => "Connection to camera $camera ($camera_ip) failed",
            'url' => $url,
            'effective_url' => $effectiveUrl
        ]);
        exit;
    }
}

// ตรวจสอบการเปลี่ยนเส้นทางไปยังหน้าล็อกอิน
if (strpos($effectiveUrl, 'login') !== false) {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Authentication failed - redirected to login page',
        'effective_url' => $effectiveUrl
    ]);
    exit;
}

// บันทึกเนื้อหาการตอบสนอง (จำกัดความยาว)
$logContent = $response;
if (strlen($logContent) > 500) {
    $logContent = substr($logContent, 0, 500) . "... [truncated]";
}
$logMessage = date('Y-m-d H:i:s') . " - Response content: " . $logContent . "\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// ส่งคืนการตอบสนอง
header('Content-Type: text/plain');
echo $response;
?>