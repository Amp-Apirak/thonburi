<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$cameraIP = "192.168.1.11";
$user = "admin";
$pass = "P4ssw0rd";
$url = "http://$cameraIP/cgi-bin/videoStatServer.cgi?action=getSummary";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_USERPWD, "$user:$pass");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// เพิ่มส่วนนี้สำคัญมาก
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
} else {
    echo "<pre>";
    var_dump($response);
    echo "</pre>";
}
curl_close($ch);
