// กำหนดตัวแปรสำหรับเก็บอินสแตนซ์ของกราฟ
let chartCamera1, chartCamera2;
let fetchInterval;

// ฟังก์ชันแสดง/ซ่อน Loading Overlay
function showLoading() {
  document.getElementById("loading-overlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading-overlay").style.display = "none";
}

// ฟังก์ชันอัพเดทเวลาล่าสุดใน Header (ถ้ามีใน header.php)
function updateLastUpdatedTime() {
  const now = new Date();
  const lastUpdatedElement = document.getElementById("last-updated-time"); // ต้องเพิ่ม ID นี้ใน header.php
  if (lastUpdatedElement) {
    lastUpdatedElement.innerText = now.toLocaleString("th-TH");
  }
}

// ฟังก์ชันดึงข้อมูลจาก API (ใช้ข้อมูลจำลองในตอนนี้)
async function fetchData(startDate = null, endDate = null) {
  showLoading(); // แสดง Loading Overlay

  try {
    // ถ้าไม่มีการระบุวันที่ ให้ใช้ข้อมูลของวันนี้
    if (!startDate || !endDate) {
      const today = new Date();
      startDate = today.toISOString().split("T")[0];
      endDate = startDate;
    }

    // จำลองการดึงข้อมูลจาก API (แทนที่ด้วย API จริงเมื่อได้)
    const mockData = {
      camera1: {
        inCount: Math.floor(Math.random() * 100), // จำนวนคนเข้าแบบสุ่ม
        outCount: Math.floor(Math.random() * 100), // จำนวนคนออกแบบสุ่ม
        hourlyIn: Array(14)
          .fill()
          .map(() => Math.floor(Math.random() * 20)), // ข้อมูลรายชั่วโมง 08:00-21:00
      },
      camera2: {
        inCount: Math.floor(Math.random() * 100),
        outCount: Math.floor(Math.random() * 100),
        hourlyIn: Array(14)
          .fill()
          .map(() => Math.floor(Math.random() * 20)),
      },
    };

    // อัพเดทข้อมูลใน Cards
    document.getElementById("camera1In").innerText = mockData.camera1.inCount;
    document.getElementById("camera1Out").innerText = mockData.camera1.outCount;
    document.getElementById("camera2In").innerText = mockData.camera2.inCount;
    document.getElementById("camera2Out").innerText = mockData.camera2.outCount;

    // อัพเดทกราฟ
    updateCharts(mockData.camera1.hourlyIn, mockData.camera2.hourlyIn);

    // อัพเดทเวลาล่าสุด
    updateLastUpdatedTime();
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    hideLoading(); // ซ่อน Loading Overlay
  }
}

// ฟังก์ชันอัพเดทกราฟ
function updateCharts(camera1Data, camera2Data) {
  const hours = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  // ตัวเลือกสำหรับกราฟกล้อง 1
  const optionsCamera1 = {
    chart: { type: "bar", height: 350 },
    series: [{ name: "จำนวนคนเข้า", data: camera1Data }],
    xaxis: { categories: hours, title: { text: "ชั่วโมง" } },
    yaxis: { title: { text: "จำนวนคน" } },
    colors: ["#007bff"],
  };

  // ตัวเลือกสำหรับกราฟกล้อง 2
  const optionsCamera2 = {
    chart: { type: "bar", height: 350 },
    series: [{ name: "จำนวนคนเข้า", data: camera2Data }],
    xaxis: { categories: hours, title: { text: "ชั่วโมง" } },
    yaxis: { title: { text: "จำนวนคน" } },
    colors: ["#28a745"],
  };

  // อัพเดทหรือสร้างกราฟใหม่
  if (chartCamera1) {
    chartCamera1.updateOptions(optionsCamera1);
  } else {
    chartCamera1 = new ApexCharts(
      document.querySelector("#chartCamera1"),
      optionsCamera1
    );
    chartCamera1.render();
  }

  if (chartCamera2) {
    chartCamera2.updateOptions(optionsCamera2);
  } else {
    chartCamera2 = new ApexCharts(
      document.querySelector("#chartCamera2"),
      optionsCamera2
    );
    chartCamera2.render();
  }
}

// เรียกข้อมูลครั้งแรกเมื่อโหลดหน้า
document.addEventListener("DOMContentLoaded", () => {
  fetchData();

  // ตั้งค่าให้ดึงข้อมูลทุก 30 วินาที
  fetchInterval = setInterval(() => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    fetchData(startDate, endDate);
  }, 30000);

  // การจัดการฟอร์มค้นหา
  document.getElementById("dateFilterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    fetchData(startDate, endDate);
  });
});

// ฟังก์ชันหยุดการอัพเดทเมื่อออกจากหน้า
window.addEventListener("unload", () => {
  clearInterval(fetchInterval);
});
