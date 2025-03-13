<?php
header('Content-Type: application/json; charset=utf-8');

/**
 * ฟังก์ชันค้นหาไฟล์ CSV ล่าสุดในโฟลเดอร์
 * @param string $directory path ของโฟลเดอร์
 * @return string|null path ของไฟล์ CSV ล่าสุด หรือ null ถ้าไม่พบไฟล์
 */
function getNewestCSVFile($directory) {
    // ค้นหาไฟล์ .csv ทั้งหมดในโฟลเดอร์
    $files = glob($directory . '/*.csv');
    if (!$files) {
        // ถ้าไม่มีไฟล์ .csv เลย คืนค่า null
        return null;
    }
    // เรียงลำดับตามเวลาที่แก้ไขล่าสุด (ใหม่ -> เก่า)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    // ไฟล์ตัวแรกคือไฟล์ใหม่ที่สุด
    return $files[0];
}

// ระบุโฟลเดอร์ของกล้อง 1 และกล้อง 2
$camera1Dir = __DIR__ . '/data_export_camera1';
$camera2Dir = __DIR__ . '/data_export_camera2';

// เรียกใช้ฟังก์ชันค้นหาไฟล์ล่าสุด
$camera1File = getNewestCSVFile($camera1Dir);
$camera2File = getNewestCSVFile($camera2Dir);

// สร้างอาร์เรย์สำหรับส่งกลับ
$data = [
    'camera1' => null,
    'camera2' => null,
    'timestamps' => [
        'camera1' => null,
        'camera2' => null
    ]
];

// ถ้าเจอไฟล์ในกล้อง 1 ให้อ่านข้อมูลเก็บใน data['camera1']
if ($camera1File) {
    $data['camera1'] = file_get_contents($camera1File);
    $data['timestamps']['camera1'] = filemtime($camera1File);
}

// ถ้าเจอไฟล์ในกล้อง 2 ให้อ่านข้อมูลเก็บใน data['camera2']
if ($camera2File) {
    $data['camera2'] = file_get_contents($camera2File);
    $data['timestamps']['camera2'] = filemtime($camera2File);
}

// ส่งข้อมูลเป็น JSON กลับไปให้ JavaScript
echo json_encode($data);