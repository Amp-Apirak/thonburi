<?php
/**
 * mock_data.php
 * 
 * ไฟล์จำลองข้อมูลสำหรับใช้เมื่อไม่สามารถเชื่อมต่อกับกล้อง Dahua
 * สร้างการตอบสนองในรูปแบบเดียวกับที่ได้จาก API ของกล้อง
 */

// กำหนดประเภทเนื้อหาเป็นข้อความธรรมดา (ยกเว้นกรณี ping ที่ต้องเป็น JSON)
$action = isset($_GET['action']) ? $_GET['action'] : '';
if ($action === 'ping') {
    header('Content-Type: application/json');
} else {
    header('Content-Type: text/plain');
}

// ดึงพารามิเตอร์
$camera = isset($_GET['camera']) ? $_GET['camera'] : '1';
$channel = isset($_GET['channel']) ? $_GET['channel'] : '1';
$startTime = isset($_GET['startTime']) ? $_GET['startTime'] : date('Y-m-d').' 00:00:00';
$endTime = isset($_GET['endTime']) ? $_GET['endTime'] : date('Y-m-d').' 23:59:59';
$token = isset($_GET['token']) ? $_GET['token'] : 'mock_token_'.time();
$beginNumber = isset($_GET['beginNumber']) ? (int)$_GET['beginNumber'] : 0;
$count = isset($_GET['count']) ? (int)$_GET['count'] : 100;

// บันทึกล็อกการใช้งานข้อมูลจำลอง
$logFile = 'mock_data_log.txt';
$logMessage = date('Y-m-d H:i:s') . " - Mock data used: action=$action, camera=$camera\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// เตรียมค่าพื้นฐานตามไอดีกล้อง
$baseEnteredValue = ($camera == '1') ? 142 : 213;
$baseExitedValue = ($camera == '1') ? 78 : 105;

// เพิ่มค่าตามเวลาที่ผ่านไปในวัน
$hoursElapsed = (int)((time() - strtotime("today")) / 3600);
$baseEnteredValue += min($hoursElapsed * 2, 50); // เพิ่มสูงสุด 50 ต่อวัน
$baseExitedValue += min($hoursElapsed, 30); // เพิ่มสูงสุด 30 ต่อวัน

// สร้างการตอบสนองตามการกระทำที่ขอ
switch ($action) {
    case 'ping':
        // จำลองการตรวจสอบการเชื่อมต่อ - สามารถสุ่มสถานะเพื่อทดสอบการแสดงสถานะออนไลน์/ออฟไลน์
        $isOnline = (rand(1, 10) > 2); // 80% โอกาสที่จะออนไลน์
        echo json_encode(['status' => $isOnline ? 'online' : 'offline']);
        break;
        
    case 'getSummary':
        // จำลองข้อมูลสรุป
        $todayEntered = rand(10, 30);
        $todayExited = rand(5, 20);
        
        echo "summary.Channel=0\n";
        echo "summary.RuleName=NumberStat\n";
        echo "summary.EnteredSubtotal.Today={$todayEntered}\n";
        echo "summary.EnteredSubtotal.Total={$baseEnteredValue}\n";
        echo "summary.EnteredSubtotal.TotalInTimeSection=".($baseEnteredValue - rand(5, 15))."\n";
        echo "summary.ExitedSubtotal.Today={$todayExited}\n";
        echo "summary.ExitedSubtotal.Total={$baseExitedValue}\n";
        echo "summary.ExitedSubtotal.TotalInTimeSection=".($baseExitedValue - rand(3, 10))."\n";
        break;
        
    case 'startFind':
        // จำลองการเริ่มค้นหา
        echo "token=mock_token_".time()."\n";
        echo "totalCount=14\n"; // 14 ชั่วโมง (8:00 - 21:00)
        break;
        
    case 'doFind':
        // จำลองผลลัพธ์รายชั่วโมง
        $hourlyData = generateHourlyData($camera);
        
        echo "found=14\n"; // 14 ชั่วโมง
        
        // สร้างข้อมูลสำหรับแต่ละชั่วโมง (8:00 - 21:00)
        for ($i = 0; $i < 14; $i++) {
            $hour = 8 + $i;
            $hourFormatted = str_pad($hour, 2, "0", STR_PAD_LEFT);
            
            // แยกวันที่จากช่วงเวลาที่ต้องการค้นหา
            $date = date('Y-m-d', strtotime($startTime));
            
            // ถ้าวันที่เริ่มต้นและสิ้นสุดต่างกัน ให้เลือกวันที่กลางๆ
            if ($startTime != $endTime) {
                $startDate = date('Y-m-d', strtotime($startTime));
                $endDate = date('Y-m-d', strtotime($endTime));
                $daysDiff = (strtotime($endDate) - strtotime($startDate)) / (60 * 60 * 24);
                
                if ($daysDiff > 0) {
                    // เลือกวันที่กลางๆ ระหว่างช่วงเวลา
                    $middleDay = floor($daysDiff / 2);
                    $date = date('Y-m-d', strtotime($startDate . " + {$middleDay} days"));
                }
            }
            
            echo "info[$i].Channel=0\n";
            echo "info[$i].StartTime={$date} {$hourFormatted}:00:00\n";
            echo "info[$i].EndTime={$date} {$hourFormatted}:59:59\n";
            echo "info[$i].EnteredSubtotal=".$hourlyData[$i]."\n";
            echo "info[$i].ExitedSubtotal=".floor($hourlyData[$i] * 0.6)."\n";
            echo "info[$i].RuleName=NumberStat\n";
        }
        break;
    
    case 'stopFind':
        // จำลองการหยุดค้นหา - ไม่มีข้อมูลที่ต้องส่งคืน
        echo "OK\n";
        break;
        
    case 'getCurrentTime':
        // จำลองการดึงเวลาปัจจุบัน - สำหรับการ ping
        echo "result = ".date('Y-m-d H:i:s')."\n";
        break;
        
    case 'getDeviceType':
        // จำลองประเภทอุปกรณ์ - สำหรับการ ping
        echo "type=IPC\n";
        break;

    case 'getHardwareVersion':
        // จำลองเวอร์ชันฮาร์ดแวร์
        echo "version=1.00\n";
        break;

    case 'getSerialNo':
        // จำลองหมายเลขซีเรียล
        echo "sn=1234567890ABC\n";
        break;
        
    default:
        echo "Error: Unknown action\n";
        break;
}

/**
 * สร้างข้อมูลรายชั่วโมงจำลองที่สมจริง
 * 
 * @param string $camera รหัสกล้อง
 * @return array ข้อมูลรายชั่วโมง
 */
function generateHourlyData($camera) {
    $baseValue = ($camera == '1') ? 8 : 12; // กล้อง 2 มีคนเข้ามากกว่าเล็กน้อย
    $hourlyData = [];
    
    // วันในสัปดาห์มีผลต่อจำนวนคน
    $dayOfWeek = date('N'); // 1 (จันทร์) ถึง 7 (อาทิตย์)
    $weekdayFactor = ($dayOfWeek <= 5) ? 1.0 : 0.7; // วันธรรมดามีคนมากกว่าวันหยุด
    
    // ช่วงเวลาของวันมีผลต่อรูปแบบ
    $currentHour = (int)date('G');
    
    // ช่วงเช้า (08:00 - 10:00)
    $morning1 = max(1, $baseValue + rand(0, 5));
    $morning2 = max(1, $baseValue + 3 + rand(0, 6));
    $morning3 = max(1, $baseValue + 6 + rand(0, 7));
    
    // ปรับตามเวลาจริง - ถ้าตอนนี้เป็นช่วงเช้า ให้เพิ่มค่าสำหรับชั่วโมงที่ผ่านไปแล้ว
    if ($currentHour >= 8 && $currentHour <= 10) {
        $pastHours = $currentHour - 8;
        for ($i = 0; $i <= $pastHours; $i++) {
            if ($i == 0) $morning1 *= 1.5;
            if ($i == 1) $morning2 *= 1.5;
            if ($i == 2) $morning3 *= 1.5;
        }
    }
    
    $hourlyData[] = round($morning1 * $weekdayFactor);
    $hourlyData[] = round($morning2 * $weekdayFactor);
    $hourlyData[] = round($morning3 * $weekdayFactor);
    
    // ช่วงกลางวัน (11:00 - 13:00) - พีคช่วงเที่ยง
    $noon1 = max(2, $baseValue + 10 + rand(0, 8));
    $noon2 = max(3, $baseValue + 15 + rand(0, 10)); // พีคตอนเที่ยง
    $noon3 = max(2, $baseValue + 12 + rand(0, 8));
    
    // ปรับตามเวลาจริง
    if ($currentHour >= 11 && $currentHour <= 13) {
        $pastHours = $currentHour - 11;
        for ($i = 0; $i <= $pastHours; $i++) {
            if ($i == 0) $noon1 *= 1.5;
            if ($i == 1) $noon2 *= 1.5;
            if ($i == 2) $noon3 *= 1.5;
        }
    }
    
    $hourlyData[] = round($noon1 * $weekdayFactor);
    $hourlyData[] = round($noon2 * $weekdayFactor);
    $hourlyData[] = round($noon3 * $weekdayFactor);
    
    // ช่วงบ่าย (14:00 - 16:00)
    $afternoon1 = max(2, $baseValue + 8 + rand(0, 6));
    $afternoon2 = max(1, $baseValue + 7 + rand(0, 5));
    $afternoon3 = max(1, $baseValue + 6 + rand(0, 5));
    
    // ปรับตามเวลาจริง
    if ($currentHour >= 14 && $currentHour <= 16) {
        $pastHours = $currentHour - 14;
        for ($i = 0; $i <= $pastHours; $i++) {
            if ($i == 0) $afternoon1 *= 1.5;
            if ($i == 1) $afternoon2 *= 1.5;
            if ($i == 2) $afternoon3 *= 1.5;
        }
    }
    
    $hourlyData[] = round($afternoon1 * $weekdayFactor);
    $hourlyData[] = round($afternoon2 * $weekdayFactor);
    $hourlyData[] = round($afternoon3 * $weekdayFactor);
    
    // ช่วงเย็น (17:00 - 19:00) - พีคอีกครั้ง
    $evening1 = max(2, $baseValue + 9 + rand(0, 7));
    $evening2 = max(3, $baseValue + 14 + rand(0, 9)); // พีคตอนเย็น
    $evening3 = max(2, $baseValue + 10 + rand(0, 7));
    
    // ปรับตามเวลาจริง
    if ($currentHour >= 17 && $currentHour <= 19) {
        $pastHours = $currentHour - 17;
        for ($i = 0; $i <= $pastHours; $i++) {
            if ($i == 0) $evening1 *= 1.5;
            if ($i == 1) $evening2 *= 1.5;
            if ($i == 2) $evening3 *= 1.5;
        }
    }
    
    $hourlyData[] = round($evening1 * $weekdayFactor);
    $hourlyData[] = round($evening2 * $weekdayFactor);
    $hourlyData[] = round($evening3 * $weekdayFactor);
    
    // ช่วงกลางคืน (20:00 - 21:00)
    $night1 = max(1, $baseValue + 5 + rand(0, 4));
    $night2 = max(1, $baseValue + 3 + rand(0, 3));
    
    // ปรับตามเวลาจริง
    if ($currentHour >= 20 && $currentHour <= 21) {
        $pastHours = $currentHour - 20;
        for ($i = 0; $i <= $pastHours; $i++) {
            if ($i == 0) $night1 *= 1.5;
            if ($i == 1) $night2 *= 1.5;
        }
    }
    
    $hourlyData[] = round($night1 * $weekdayFactor);
    $hourlyData[] = round($night2 * $weekdayFactor);
    
    return $hourlyData;
}