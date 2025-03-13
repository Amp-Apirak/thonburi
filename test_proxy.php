<?php
$cameraIP = "192.168.1.11"; // ทดสอบกับกล้องตัวแรกก่อน
$user = "admin";
$pass = "P4ssw0rd";
$url = "http://$cameraIP/cgi-bin/videoStatServer.cgi?action=getSummary";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_USERPWD, "$user:$pass");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
curl_close($ch);

echo "<pre>";
var_dump($response);
echo "</pre>";
