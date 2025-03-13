// กำหนดตัวแปรสำหรับเก็บอินสแตนซ์ของกราฟและการตั้งค่า
let chartCamera1, chartCamera2;
let fetchInterval;
const CAMERA1_IP = "192.168.1.14";
const CAMERA2_IP = "192.168.1.11";
const CREDENTIALS = "admin:P4ssw0rd"; // ข้อมูลการยืนยันตัวตนสำหรับกล้อง

// ฟังก์ชันแสดง/ซ่อน Loading Overlay พร้อม Animation
function showLoading() {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = "flex";
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.opacity = "1";
  }, 10);
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

// ฟังก์ชันเพิ่ม Animation เมื่อมีการอัพเดทข้อมูล
function animateValue(element, value) {
  if (element) {
    // เพิ่มคลาสเพื่อให้เกิด Animation
    element.classList.add('number-updated');
    // กำหนดค่าใหม่
    element.textContent = value;
    // หลังจาก Animation เสร็จสิ้น ลบคลาสออก
    setTimeout(() => {
      element.classList.remove('number-updated');
    }, 500);
  }
}

// ฟังก์ชันอัพเดทเวลาล่าสุดใน Header
function updateLastUpdatedTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  };
  const formattedTime = now.toLocaleString("th-TH", options);
  
  // อัพเดททั้งสองจุดที่แสดงเวลา
  const elements = document.querySelectorAll("#last-updated-time");
  elements.forEach(element => {
    if (element) {
      element.innerText = formattedTime;
    }
  });
}

// คำนวณยอดรวมของคนเข้า-ออก
function calculateTotals(camera1In, camera1Out, camera2In, camera2Out) {
  const totalIn = camera1In + camera2In;
  const totalOut = camera1Out + camera2Out;
  
  animateValue(document.getElementById("totalIn"), totalIn.toLocaleString('th-TH'));
  animateValue(document.getElementById("totalOut"), totalOut.toLocaleString('th-TH'));
  
  return { totalIn, totalOut };
}

// ฟังก์ชันแปลงข้อความตอบกลับจาก API เป็น object
function parseResponse(text) {
  const result = {};
  
  text.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      result[key] = value;
    }
  });
  
  return result;
}

// ฟังก์ชันดึงข้อมูลสรุปจากกล้อง
async function getSummaryData(cameraIP, channel) {
  try {
    const response = await fetch(`http://${CREDENTIALS}@${cameraIP}/cgi-bin/videoStatServer.cgi?action=getSummary&channel=${channel}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    return parseResponse(text);
  } catch (error) {
    console.error(`Error fetching summary data from camera ${cameraIP}:`, error);
    // คืนค่าข้อมูลเริ่มต้นในกรณีที่เกิดข้อผิดพลาด
    return {
      'summary.EnteredSubtotal.Today': '0',
      'summary.EnteredSubtotal.Total': '0',
      'summary.ExitedSubtotal.Today': '0',
      'summary.ExitedSubtotal.Total': '0'
    };
  }
}

// ฟังก์ชันดึงข้อมูลรายชั่วโมงสำหรับกราฟ
async function getHourlyData(cameraIP, channel, startDate, endDate) {
  try {
    // เริ่มการค้นหา
    const encodedStartTime = encodeURIComponent(`${startDate} 00:00:00`);
    const encodedEndTime = encodeURIComponent(`${endDate} 23:59:59`);
    
    const startFindResponse = await fetch(
      `http://${CREDENTIALS}@${cameraIP}/cgi-bin/videoStatServer.cgi?action=startFind&channel=${channel}&condition.StartTime=${encodedStartTime}&condition.EndTime=${encodedEndTime}&condition.Granularity=Hour`
    );
    
    if (!startFindResponse.ok) {
      throw new Error(`HTTP error! status: ${startFindResponse.status}`);
    }
    
    const startFindText = await startFindResponse.text();
    const startFindData = parseResponse(startFindText);
    
    // แยกค่า token และ totalCount
    const token = startFindData.token;
    const totalCount = parseInt(startFindData.totalCount || '0');
    
    if (!token || totalCount === 0) {
      console.warn(`No data found or invalid token for camera ${cameraIP}`);
      return Array(14).fill(0); // คืนค่าเป็นอาร์เรย์ว่าง 14 ชั่วโมง (08:00 - 21:00)
    }
    
    // ดึงข้อมูลตามจำนวนที่มี
    const doFindResponse = await fetch(
      `http://${CREDENTIALS}@${cameraIP}/cgi-bin/videoStatServer.cgi?action=doFind&channel=${channel}&token=${token}&beginNumber=0&count=${totalCount}`
    );
    
    if (!doFindResponse.ok) {
      throw new Error(`HTTP error! status: ${doFindResponse.status}`);
    }
    
    const doFindText = await doFindResponse.text();
    const lines = doFindText.split('\n');
    
    // สร้างอาร์เรย์ว่างสำหรับ 14 ชั่วโมง (08:00 - 21:00)
    const hourlyData = Array(14).fill(0);
    
    // กรองเฉพาะข้อมูลชั่วโมงที่เราสนใจ (08:00 - 21:00)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('.StartTime=') && lines[i+1] && lines[i+1].includes('.EnteredSubtotal=')) {
        const timePart = lines[i].split('=')[1];
        if (timePart) {
          const timeMatch = timePart.match(/\d{2}:\d{2}:\d{2}$/);
          if (timeMatch) {
            const hour = parseInt(timeMatch[0].split(':')[0]);
            // เรากำลังดูเฉพาะชั่วโมง 8-21 (index 0-13)
            if (hour >= 8 && hour <= 21) {
              const enteredValue = parseInt(lines[i+1].split('=')[1] || '0');
              hourlyData[hour - 8] = enteredValue; // ปรับ index ให้เริ่มจาก 0
            }
          }
        }
      }
    }
    
    // หยุดการค้นหา
    await fetch(`http://${CREDENTIALS}@${cameraIP}/cgi-bin/videoStatServer.cgi?action=stopFind&token=${token}&channel=${channel}`);
    
    return hourlyData;
  } catch (error) {
    console.error(`Error fetching hourly data from camera ${cameraIP}:`, error);
    return Array(14).fill(0); // คืนค่าเป็นอาร์เรย์ว่างในกรณีที่เกิดข้อผิดพลาด
  }
}

// ฟังก์ชันอัพเดทกราฟ
function updateCharts(camera1Data, camera2Data) {
  const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  // ตัวเลือกสำหรับกราฟกล้อง 1
  const optionsCamera1 = {
    chart: { 
      type: "bar", 
      height: 350,
      fontFamily: 'Prompt, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [{ 
      name: "จำนวนคนเข้า", 
      data: camera1Data 
    }],
    xaxis: { 
      categories: hours, 
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'Prompt, sans-serif'
        }
      }
    },
    yaxis: { 
      title: { 
        text: "จำนวนคน",
        style: {
          fontSize: '13px',
          fontFamily: 'Prompt, sans-serif'
        }
      },
      labels: {
        formatter: function(val) {
          return val.toFixed(0);
        }
      }
    },
    colors: ["#0ea5e9"],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 100]
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " คน";
        }
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      row: {
        colors: ['#f9f9f9', 'transparent'],
        opacity: 0.5
      }
    }
  };

  // ตัวเลือกสำหรับกราฟกล้อง 2 (คล้ายกับกล้อง 1 แต่เปลี่ยนสี)
  const optionsCamera2 = {
    ...JSON.parse(JSON.stringify(optionsCamera1)), // Clone options
    series: [{ 
      name: "จำนวนคนเข้า", 
      data: camera2Data 
    }],
    colors: ["#8b5cf6"], // สีม่วงสำหรับกล้อง 2
  };

  // อัพเดทหรือสร้างกราฟใหม่
  if (chartCamera1) {
    chartCamera1.updateOptions({
      series: [{ name: "จำนวนคนเข้า", data: camera1Data }]
    });
  } else {
    chartCamera1 = new ApexCharts(
      document.querySelector("#chartCamera1"),
      optionsCamera1
    );
    chartCamera1.render();
  }

  if (chartCamera2) {
    chartCamera2.updateOptions({
      series: [{ name: "จำนวนคนเข้า", data: camera2Data }]
    });
  } else {
    chartCamera2 = new ApexCharts(
      document.querySelector("#chartCamera2"),
      optionsCamera2
    );
    chartCamera2.render();
  }
  
  // สร้าง Animation สำหรับการอัพเดทข้อมูลในกราฟ
  if (chartCamera1) {
    chartCamera1.el.style.animation = "none";
    void chartCamera1.el.offsetWidth; // Trigger a reflow
    chartCamera1.el.style.animation = "fadeIn 0.5s ease";
  }
  
  if (chartCamera2) {
    chartCamera2.el.style.animation = "none";
    void chartCamera2.el.offsetWidth; // Trigger a reflow
    chartCamera2.el.style.animation = "fadeIn 0.5s ease";
  }
}

// ฟังก์ชันหลักสำหรับดึงข้อมูลจาก API
async function fetchData(startDate = null, endDate = null) {
  showLoading(); // แสดง Loading Overlay

  try {
    // ถ้าไม่มีการระบุวันที่ ให้ใช้ข้อมูลของวันนี้
    if (!startDate || !endDate) {
      const today = new Date();
      startDate = today.toISOString().split("T")[0];
      endDate = startDate;
    }

    // ดึงข้อมูลสรุปจากกล้องทั้ง 2 ตัว
    const camera1Summary = await getSummaryData(CAMERA1_IP, 1);
    const camera2Summary = await getSummaryData(CAMERA2_IP, 1);
    
    // แปลงข้อมูลเป็นตัวเลข
    const camera1In = parseInt(camera1Summary['summary.EnteredSubtotal.Total'] || '0');
    const camera1Out = parseInt(camera1Summary['summary.ExitedSubtotal.Total'] || '0');
    const camera2In = parseInt(camera2Summary['summary.EnteredSubtotal.Total'] || '0');
    const camera2Out = parseInt(camera2Summary['summary.ExitedSubtotal.Total'] || '0');

    // อัพเดทข้อมูลบน Cards
    animateValue(document.getElementById("camera1In"), camera1In.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera1Out"), camera1Out.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera2In"), camera2In.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera2Out"), camera2Out.toLocaleString('th-TH'));
    
    // คำนวณยอดรวม
    calculateTotals(camera1In, camera1Out, camera2In, camera2Out);

    // ดึงข้อมูลรายชั่วโมงสำหรับกราฟ
    const camera1HourlyData = await getHourlyData(CAMERA1_IP, 1, startDate, endDate);
    const camera2HourlyData = await getHourlyData(CAMERA2_IP, 1, startDate, endDate);
    
    // อัพเดทกราฟ
    updateCharts(camera1HourlyData, camera2HourlyData);

    // อัพเดทเวลาล่าสุด
    updateLastUpdatedTime();
    
    console.log("Data fetched successfully");
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    hideLoading(); // ซ่อน Loading Overlay
  }
}

// เรียกข้อมูลครั้งแรกเมื่อโหลดหน้า
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initialized");
  
  // เพิ่ม CSS animation สำหรับการอัพเดทตัวเลข
  const style = document.createElement('style');
  style.textContent = `
    @keyframes numberChanged {
      0% { transform: translateY(-5px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    .number-updated {
      animation: numberChanged 0.5s ease;
    }
  `;
  document.head.appendChild(style);

  // กำหนดสถานะออนไลน์ของกล้อง
  const setStatusIndicators = () => {
    const indicators = document.querySelectorAll('.status-indicator');
    indicators.forEach(indicator => {
      indicator.classList.add('active');
    });
  };
  
  setStatusIndicators();
  
  // โหลดข้อมูลครั้งแรก
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
    
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    } else {
      alert("กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด");
    }
  });
  
  // เพิ่มฟังก์ชั่นสำหรับปุ่มรีเฟรช
  document.getElementById("refreshData").addEventListener("click", () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    fetchData(startDate, endDate);
  });
});

// ฟังก์ชันหยุดการอัพเดทเมื่อออกจากหน้า
window.addEventListener("unload", () => {
  clearInterval(fetchInterval);
});