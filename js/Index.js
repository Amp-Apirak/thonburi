// กำหนดตัวแปรสำหรับเก็บอินสแตนซ์ของกราฟ
let chartCamera1, chartCamera2;
let fetchInterval;

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
  const lastUpdatedElement = document.getElementById("last-updated-time");
  if (lastUpdatedElement) {
    lastUpdatedElement.innerText = formattedTime;
  }
}

// คำนวณยอดรวมของคนเข้า-ออก
function calculateTotals(camera1In, camera1Out, camera2In, camera2Out) {
  const totalIn = camera1In + camera2In;
  const totalOut = camera1Out + camera2Out;
  
  animateValue(document.getElementById("totalIn"), totalIn.toLocaleString('th-TH'));
  animateValue(document.getElementById("totalOut"), totalOut.toLocaleString('th-TH'));
  
  return { totalIn, totalOut };
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
    // จำลองการหน่วงเวลาเพื่อให้เห็น Loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockData = {
      camera1: {
        inCount: Math.floor(Math.random() * 1000) + 500, // จำนวนคนเข้าแบบสุ่ม
        outCount: Math.floor(Math.random() * 800) + 400, // จำนวนคนออกแบบสุ่ม
        hourlyIn: Array(14)
          .fill()
          .map(() => Math.floor(Math.random() * 100) + 10), // ข้อมูลรายชั่วโมง 08:00-21:00
      },
      camera2: {
        inCount: Math.floor(Math.random() * 800) + 300,
        outCount: Math.floor(Math.random() * 700) + 200,
        hourlyIn: Array(14)
          .fill()
          .map(() => Math.floor(Math.random() * 80) + 5),
      },
    };

    // อัพเดทข้อมูลใน Cards พร้อม Animation
    animateValue(document.getElementById("camera1In"), mockData.camera1.inCount.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera1Out"), mockData.camera1.outCount.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera2In"), mockData.camera2.inCount.toLocaleString('th-TH'));
    animateValue(document.getElementById("camera2Out"), mockData.camera2.outCount.toLocaleString('th-TH'));
    
    // คำนวณยอดรวม
    calculateTotals(
      mockData.camera1.inCount, 
      mockData.camera1.outCount, 
      mockData.camera2.inCount, 
      mockData.camera2.outCount
    );

    // อัพเดทกราฟ
    updateCharts(mockData.camera1.hourlyIn, mockData.camera2.hourlyIn);

    // อัพเดทเวลาล่าสุด
    updateLastUpdatedTime();
    
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
    
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    hideLoading(); // ซ่อน Loading Overlay
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
}

// เรียกข้อมูลครั้งแรกเมื่อโหลดหน้า
document.addEventListener("DOMContentLoaded", () => {
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
    fetchData(startDate, endDate);
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