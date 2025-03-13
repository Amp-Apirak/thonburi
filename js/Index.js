// กำหนดตัวแปรสำหรับเก็บอินสแตนซ์ของกราฟและการตั้งค่า
let chartCamera1, chartCamera2;
let fetchInterval;
let lastDataTimestamp = new Date(); // เพิ่มการติดตามเวลาที่อัปเดตข้อมูลล่าสุด

// ตัวแปรควบคุมสถานะการเชื่อมต่อ
const cameraStatus = {
  '1': false,
  '2': false
};

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
    element.classList.add("number-updated");
    // กำหนดค่าใหม่
    element.textContent = value;
    // หลังจาก Animation เสร็จสิ้น ลบคลาสออก
    setTimeout(() => {
      element.classList.remove("number-updated");
    }, 500);
  }
}

// ฟังก์ชันอัพเดทเวลาล่าสุดใน Header
function updateLastUpdatedTime() {
  const now = new Date();
  lastDataTimestamp = now; // บันทึกเวลาการอัปเดตล่าสุด
  
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const formattedTime = now.toLocaleString("th-TH", options);

  // อัพเดททั้งสองจุดที่แสดงเวลา
  const elements = document.querySelectorAll("#last-updated-time");
  elements.forEach((element) => {
    if (element) {
      element.innerText = formattedTime;
    }
  });
}

// คำนวณยอดรวมของคนเข้า-ออก
function calculateTotals(camera1In, camera1Out, camera2In, camera2Out) {
  // แปลงค่าให้เป็นตัวเลขและป้องกันค่า NaN
  camera1In = parseInt(camera1In) || 0;
  camera1Out = parseInt(camera1Out) || 0;
  camera2In = parseInt(camera2In) || 0;
  camera2Out = parseInt(camera2Out) || 0;
  
  const totalIn = camera1In + camera2In;
  const totalOut = camera1Out + camera2Out;

  animateValue(
    document.getElementById("totalIn"),
    totalIn.toLocaleString("th-TH")
  );
  animateValue(
    document.getElementById("totalOut"),
    totalOut.toLocaleString("th-TH")
  );

  return { totalIn, totalOut };
}

// ฟังก์ชันตรวจสอบการเชื่อมต่อกับกล้อง
async function checkCameraStatus(cameraId) {
  try {
    console.log(`Checking connection to camera ${cameraId}...`);
    const response = await fetch(`api_proxy.php?action=ping&camera=${cameraId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const isOnline = data.status === 'online';
    
    // อัปเดตสถานะการเชื่อมต่อ
    cameraStatus[cameraId] = isOnline;
    updateCameraStatus(cameraId, isOnline);
    
    console.log(`Camera ${cameraId} is ${isOnline ? 'online' : 'offline'}`);
    return isOnline;
  } catch (error) {
    console.error(`Error checking camera ${cameraId} status:`, error);
    cameraStatus[cameraId] = false;
    updateCameraStatus(cameraId, false);
    return false;
  }
}

// ฟังก์ชันแปลงข้อความตอบกลับจาก API เป็น object
function parseResponse(text) {
  const result = {};

  if (!text) {
    console.warn("Empty response received");
    return result;
  }

  try {
    // แยกโดยบรรทัด
    const lines = text.split("\n");
    lines.forEach((line) => {
      // แยกโดยเครื่องหมาย =
      const parts = line.split("=");
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        result[key] = value;
      }
    });

    return result;
  } catch (error) {
    console.error("Error parsing response:", error);
    console.log("Raw response:", text);
    return {};
  }
}

// ฟังก์ชันดึงข้อมูลสรุปจากกล้อง
async function getSummaryData(cameraId, channel) {
  try {
    // ถ้ากล้องออฟไลน์ ให้ใช้ข้อมูลจำลอง
    if (!cameraStatus[cameraId]) {
      console.log(`Camera ${cameraId} is offline, using mock data`);
      return {
        'summary.EnteredSubtotal.Today': '0',
        'summary.EnteredSubtotal.Total': getMockValue(cameraId, 'in'),
        'summary.ExitedSubtotal.Today': '0',
        'summary.ExitedSubtotal.Total': getMockValue(cameraId, 'out')
      };
    }
    
    console.log(`Fetching summary data for camera ${cameraId}`);
    const response = await fetch(`api_proxy.php?action=getSummary&camera=${cameraId}&channel=${channel}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // มีข้อมูลหรือไม่
    if (!text || text.trim() === '') {
      throw new Error(`Empty response from camera ${cameraId}`);
    }
    
    const result = parseResponse(text);
    console.log(`Parsed response from camera ${cameraId}:`, result);
    
    return result;
  } catch (error) {
    console.error(`Error fetching summary data from camera ${cameraId}:`, error);
    // อัปเดตสถานะกล้องเป็นออฟไลน์
    cameraStatus[cameraId] = false;
    updateCameraStatus(cameraId, false);
    
    // ส่งคืนข้อมูลจำลอง
    return {
      'summary.EnteredSubtotal.Today': '0',
      'summary.EnteredSubtotal.Total': getMockValue(cameraId, 'in'),
      'summary.ExitedSubtotal.Today': '0',
      'summary.ExitedSubtotal.Total': getMockValue(cameraId, 'out')
    };
  }
}

// ฟังก์ชันสร้างข้อมูลจำลองในกรณีที่กล้องออฟไลน์
function getMockValue(cameraId, type) {
  // ค่าคงที่ที่เพิ่มขึ้นเล็กน้อยในแต่ละครั้ง
  const baseValue = cameraId === '1' ? 
    (type === 'in' ? 142 : 78) : 
    (type === 'in' ? 213 : 105);
  
  // ใช้เวลาปัจจุบันเพื่อสร้างค่าที่จะเพิ่มขึ้นเล็กน้อยในแต่ละชั่วโมง
  const hoursPassed = Math.floor((new Date() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60));
  
  // เพิ่มค่าตามเวลาที่ผ่านไป
  return (baseValue + hoursPassed).toString();
}

// ฟังก์ชันดึงข้อมูลรายชั่วโมงสำหรับกราฟ
async function getHourlyData(cameraId, channel, startDate, endDate) {
  try {
    // ถ้ากล้องออฟไลน์ ให้ใช้ข้อมูลจำลอง
    if (!cameraStatus[cameraId]) {
      console.log(`Camera ${cameraId} is offline, using mock hourly data`);
      return generateMockHourlyData(cameraId);
    }
    
    console.log(
      `Fetching hourly data for camera ${cameraId} from ${startDate} to ${endDate}`
    );

    // เริ่มการค้นหา
    const encodedStartTime = encodeURIComponent(`${startDate} 00:00:00`);
    const encodedEndTime = encodeURIComponent(`${endDate} 23:59:59`);

    console.log(`Starting find operation for camera ${cameraId}`);
    const startFindResponse = await fetch(
      `api_proxy.php?action=startFind&camera=${cameraId}&channel=${channel}&startTime=${encodedStartTime}&endTime=${encodedEndTime}`
    );

    if (!startFindResponse.ok) {
      throw new Error(`HTTP error! status: ${startFindResponse.status}`);
    }

    const startFindText = await startFindResponse.text();
    console.log(`startFind response for camera ${cameraId}:`, startFindText);

    const startFindData = parseResponse(startFindText);

    // แยกค่า token และ totalCount
    const token = startFindData.token;
    const totalCount = parseInt(startFindData.totalCount || "0");

    console.log(
      `Got token ${token} and totalCount ${totalCount} for camera ${cameraId}`
    );

    if (!token || totalCount === 0) {
      console.warn(`No data found or invalid token for camera ${cameraId}`);
      return generateMockHourlyData(cameraId); // คืนค่าเป็นข้อมูลจำลอง
    }

    // ดึงข้อมูลตามจำนวนที่มี
    console.log(`Doing find operation for camera ${cameraId}`);
    const doFindResponse = await fetch(
      `api_proxy.php?action=doFind&camera=${cameraId}&channel=${channel}&token=${token}&beginNumber=0&count=${totalCount}`
    );

    if (!doFindResponse.ok) {
      throw new Error(`HTTP error! status: ${doFindResponse.status}`);
    }

    const doFindText = await doFindResponse.text();
    console.log(`Raw doFind response for camera ${cameraId}:`, doFindText);

    // สร้างอาร์เรย์ว่างสำหรับ 14 ชั่วโมง (08:00 - 21:00)
    const hourlyData = Array(14).fill(0);

    // กรองเฉพาะข้อมูลชั่วโมงที่เราสนใจ (08:00 - 21:00)
    const lines = doFindText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].includes(".StartTime=") &&
        i + 1 < lines.length &&
        lines[i + 1].includes(".EnteredSubtotal=")
      ) {
        const timePart = lines[i].split("=")[1];
        if (timePart) {
          const timeMatch = timePart.match(/\d{2}:\d{2}:\d{2}$/);
          if (timeMatch) {
            const hour = parseInt(timeMatch[0].split(":")[0]);
            // เรากำลังดูเฉพาะชั่วโมง 8-21 (index 0-13)
            if (hour >= 8 && hour <= 21) {
              let enteredValueStr = lines[i + 1].split("=")[1] || "0";
              let enteredValue = parseInt(enteredValueStr);

              // ตรวจสอบว่าค่าเป็นตัวเลขที่ถูกต้อง
              if (!isNaN(enteredValue)) {
                hourlyData[hour - 8] = enteredValue; // ปรับ index ให้เริ่มจาก 0
              } else {
                console.warn(
                  `Invalid value for hour ${hour}: ${enteredValueStr}`
                );
              }
            }
          }
        }
      }
    }

    console.log(`Processed hourly data for camera ${cameraId}:`, hourlyData);

    // หยุดการค้นหา
    console.log(`Stopping find operation for camera ${cameraId}`);
    await fetch(
      `api_proxy.php?action=stopFind&camera=${cameraId}&channel=${channel}&token=${token}`
    );

    return hourlyData;
  } catch (error) {
    console.error(`Error fetching hourly data from camera ${cameraId}:`, error);
    // อัปเดตสถานะกล้องเป็นออฟไลน์
    cameraStatus[cameraId] = false;
    updateCameraStatus(cameraId, false);
    
    // คืนค่าเป็นข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
    return generateMockHourlyData(cameraId);
  }
}

// สร้างข้อมูลรายชั่วโมงจำลอง
function generateMockHourlyData(cameraId) {
  // สร้างรูปแบบข้อมูลที่สมจริงโดยขึ้นอยู่กับช่วงเวลาของวัน
  const hourlyData = Array(14).fill(0);
  const baseValue = cameraId === '1' ? 8 : 12; // กล้อง 2 มีคนเข้ามากกว่าเล็กน้อย
  
  // ช่วงเช้า (08:00 - 10:00)
  hourlyData[0] = baseValue + Math.floor(Math.random() * 5);
  hourlyData[1] = baseValue + 3 + Math.floor(Math.random() * 6);
  hourlyData[2] = baseValue + 6 + Math.floor(Math.random() * 7);
  
  // ช่วงกลางวัน (11:00 - 13:00) - พีคช่วงเที่ยง
  hourlyData[3] = baseValue + 10 + Math.floor(Math.random() * 8);
  hourlyData[4] = baseValue + 15 + Math.floor(Math.random() * 10); // พีคตอนเที่ยง
  hourlyData[5] = baseValue + 12 + Math.floor(Math.random() * 8);
  
  // ช่วงบ่าย (14:00 - 16:00)
  hourlyData[6] = baseValue + 8 + Math.floor(Math.random() * 6);
  hourlyData[7] = baseValue + 7 + Math.floor(Math.random() * 5);
  hourlyData[8] = baseValue + 6 + Math.floor(Math.random() * 5);
  
  // ช่วงเย็น (17:00 - 19:00) - พีคอีกครั้ง
  hourlyData[9] = baseValue + 9 + Math.floor(Math.random() * 7);
  hourlyData[10] = baseValue + 14 + Math.floor(Math.random() * 9); // พีคตอนเย็น
  hourlyData[11] = baseValue + 10 + Math.floor(Math.random() * 7);
  
  // ช่วงกลางคืน (20:00 - 21:00)
  hourlyData[12] = baseValue + 5 + Math.floor(Math.random() * 4);
  hourlyData[13] = baseValue + 3 + Math.floor(Math.random() * 3);
  
  return hourlyData;
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

  // ตรวจสอบข้อมูลก่อนใช้งาน
  camera1Data = camera1Data.map((val) => (isNaN(val) ? 0 : val));
  camera2Data = camera2Data.map((val) => (isNaN(val) ? 0 : val));

  console.log("Chart data - Camera 1:", camera1Data);
  console.log("Chart data - Camera 2:", camera2Data);

  // ตัวเลือกสำหรับกราฟกล้อง 1
  const optionsCamera1 = {
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "Prompt, sans-serif",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "55%",
        distributed: false,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    series: [
      {
        name: "จำนวนคนเข้า",
        data: camera1Data,
      },
    ],
    xaxis: {
      categories: hours,
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "Prompt, sans-serif",
        },
      },
    },
    yaxis: {
      title: {
        text: "จำนวนคน",
        style: {
          fontSize: "13px",
          fontFamily: "Prompt, sans-serif",
        },
      },
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
    colors: ["#0ea5e9"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 100],
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " คน";
        },
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      row: {
        colors: ["#f9f9f9", "transparent"],
        opacity: 0.5,
      },
    },
  };

  // ตัวเลือกสำหรับกราฟกล้อง 2 (คล้ายกับกล้อง 1 แต่เปลี่ยนสี)
  const optionsCamera2 = {
    ...JSON.parse(JSON.stringify(optionsCamera1)), // Clone options
    series: [
      {
        name: "จำนวนคนเข้า",
        data: camera2Data,
      },
    ],
    colors: ["#8b5cf6"], // สีม่วงสำหรับกล้อง 2
  };

  // อัพเดทหรือสร้างกราฟใหม่
  if (chartCamera1) {
    chartCamera1.updateOptions({
      series: [{ name: "จำนวนคนเข้า", data: camera1Data }],
    });
  } else {
    try {
      chartCamera1 = new ApexCharts(
        document.querySelector("#chartCamera1"),
        optionsCamera1
      );
      chartCamera1.render();
    } catch (error) {
      console.error("Error creating chart for camera 1:", error);
    }
  }

  if (chartCamera2) {
    chartCamera2.updateOptions({
      series: [{ name: "จำนวนคนเข้า", data: camera2Data }],
    });
  } else {
    try {
      chartCamera2 = new ApexCharts(
        document.querySelector("#chartCamera2"),
        optionsCamera2
      );
      chartCamera2.render();
    } catch (error) {
      console.error("Error creating chart for camera 2:", error);
    }
  }

  // สร้าง Animation สำหรับการอัพเดทข้อมูลในกราฟ
  if (chartCamera1 && chartCamera1.el) {
    chartCamera1.el.style.animation = "none";
    void chartCamera1.el.offsetWidth; // Trigger a reflow
    chartCamera1.el.style.animation = "fadeIn 0.5s ease";
  }

  if (chartCamera2 && chartCamera2.el) {
    chartCamera2.el.style.animation = "none";
    void chartCamera2.el.offsetWidth; // Trigger a reflow
    chartCamera2.el.style.animation = "fadeIn 0.5s ease";
  }
}