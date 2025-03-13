// ============================
// Index.js
// ============================
document.addEventListener("DOMContentLoaded", function() {
  // โหลดข้อมูล CSV ทันทีที่หน้าเว็บพร้อม
  loadCSVData();

  // ผูก Event กับปุ่ม Refresh
  const refreshBtn = document.getElementById("refreshData");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function() {
      loadCSVData();
    });
  }

  // ตั้งเวลาให้โหลดข้อมูลใหม่ทุก 5 นาที
  setInterval(loadCSVData, 300000); // 5 * 60 * 1000 ms
});

/**
 * ฟังก์ชันหลัก: ดึงข้อมูล CSV ล่าสุดจาก get_latest_csv.php
 */
function loadCSVData() {
  showLoadingOverlay(true);

  fetch("get_latest_csv.php")
    .then(response => response.json())
    .then(data => {
      // parse CSV
      const rowsCamera1 = parseCSV(data.camera1);
      const rowsCamera2 = parseCSV(data.camera2);

      // ประมวลผล
      const resultsCam1 = processCSV(rowsCamera1);
      const resultsCam2 = processCSV(rowsCamera2);

      // อัปเดตตัวเลขบน Dashboard
      updateDashboardNumbers({
        camera1In: resultsCam1.totalIn,
        camera1Out: resultsCam1.totalOut,
        camera2In: resultsCam2.totalIn,
        camera2Out: resultsCam2.totalOut
      });

      // วาดหรืออัปเดตกราฟ
      renderChart("chartCamera1", resultsCam1.chartData, "กล้อง 1: จำนวนคนเข้ารายชั่วโมง");
      renderChart("chartCamera2", resultsCam2.chartData, "กล้อง 2: จำนวนคนเข้ารายชั่วโมง");

      // อัพเดตเวลาล่าสุด
      // ถ้ามีข้อมูล timestamp จาก server
      if (data.timestamps && (data.timestamps.camera1 || data.timestamps.camera2)) {
        // ใช้เวลาล่าสุดระหว่างทั้งสองกล้อง
        const latestTimestamp = Math.max(
          data.timestamps.camera1 || 0,
          data.timestamps.camera2 || 0
        );
        updateLastUpdatedTime(latestTimestamp * 1000); // แปลงเป็น JS timestamp
      } else {
        // ถ้าไม่มี timestamp จาก server ใช้เวลาปัจจุบัน
        updateLastUpdatedTime();
      }

      // ปิด Loading Overlay
      showLoadingOverlay(false);
    })
    .catch(error => {
      console.error("เกิดข้อผิดพลาดในการโหลดไฟล์ CSV:", error);
      showLoadingOverlay(false);
    });
}

/**
 * parseCSV: แปลงข้อความ CSV เป็น Array 2 มิติ
 */
function parseCSV(csvString) {
  if (!csvString) return [];

  // ลบ BOM (Byte Order Mark) ถ้ามี
  csvString = csvString.replace(/^\uFEFF/, '');

  // แยกเป็นบรรทัดด้วย \r\n หรือ \n แล้วกรองบรรทัดว่าง
  const lines = csvString
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== "");

  // แยกแต่ละบรรทัดด้วยเครื่องหมายจุลภาค (',')
  const rows = lines.map(line => line.split(","));
  return rows;
}

/**
 * processCSV: ประมวลผล CSV เพื่อหาจำนวนคนเข้า/ออก และเตรียม data สำหรับกราฟ
 */
function processCSV(rows) {
  // ถ้าไม่มีข้อมูลเลย
  if (!rows || rows.length === 0) {
    return {
      totalIn: 0,
      totalOut: 0,
      chartData: { categories: [], seriesData: [] }
    };
  }

  // แถวแรกอาจเป็น header
  const header = rows[0];
  if (!Array.isArray(header)) {
    return {
      totalIn: 0,
      totalOut: 0,
      chartData: { categories: [], seriesData: [] }
    };
  }

  // ตรวจว่าบรรทัดแรกเป็น header จริงไหม
  const firstRowIsHeader = header.some(h => /start\s*time/i.test(h) || /enter/i.test(h) || /exit/i.test(h));

  // ถ้าใช่ header ให้ตัดออก
  let dataRows = rows;
  if (firstRowIsHeader) {
    dataRows = rows.slice(1);
  }

  if (dataRows.length === 0) {
    return {
      totalIn: 0,
      totalOut: 0,
      chartData: { categories: [], seriesData: [] }
    };
  }

  let totalIn = 0;
  let totalOut = 0;

  const categories = [];
  const seriesData = [];

  dataRows.forEach(row => {
    const startTime = row[0] || "";
    const enter = parseInt(row[1] || "0", 10);
    const exit = parseInt(row[2] || "0", 10);

    totalIn += enter;
    totalOut += exit;

    // สำหรับกราฟ "จำนวนคนเข้า"
    categories.push(startTime);
    seriesData.push(enter);
  });

  return {
    totalIn: totalIn,
    totalOut: totalOut,
    chartData: {
      categories,
      seriesData
    }
  };
}

/**
 * updateDashboardNumbers: อัปเดตตัวเลขคนเข้า/ออกของกล้อง 1 และ 2 และรวมทั้งหมด
 */
function updateDashboardNumbers({ camera1In, camera1Out, camera2In, camera2Out }) {
  // กล้อง 1
  document.getElementById("camera1In").textContent = camera1In || 0;
  document.getElementById("camera1Out").textContent = camera1Out || 0;

  // กล้อง 2
  document.getElementById("camera2In").textContent = camera2In || 0;
  document.getElementById("camera2Out").textContent = camera2Out || 0;

  // รวมทั้งหมด
  const totalIn = (camera1In || 0) + (camera2In || 0);
  const totalOut = (camera1Out || 0) + (camera2Out || 0);

  document.getElementById("totalIn").textContent = totalIn;
  document.getElementById("totalOut").textContent = totalOut;
}

/**
 * renderChart: วาด/อัปเดตกราฟ ApexCharts
 */
function renderChart(elementId, chartData, chartTitle) {
  const options = {
    chart: {
      type: 'bar',
      height: 300,
      fontFamily: 'Prompt, sans-serif',
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
      },
      dropShadow: {
        enabled: true,
        top: 5,
        left: 0,
        blur: 8,
        opacity: 0.2
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true
        }
      }
    },
    title: {
      text: chartTitle,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333'
      }
    },
    xaxis: {
      categories: chartData.categories || [],
      labels: {
        style: {
          colors: '#666',
          fontSize: '12px'
        },
        rotateAlways: true,
        rotate: -45
      }
    },
    yaxis: {
      title: {
        text: 'จำนวนคน',
        style: {
          fontSize: '13px',
          fontWeight: 'normal'
        }
      }
    },
    series: [
      {
        name: 'จำนวนคนเข้า',
        data: chartData.seriesData || []
      }
    ],
    colors: elementId.includes('Camera1') ? ['#0ea5e9'] : ['#8b5cf6'],
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val > 0 ? val : '';
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      row: {
        colors: ['#f8f8f8', 'transparent'],
        opacity: 0.5
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      y: {
        formatter: function(val) {
          return val + " คน";
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            columnWidth: '70%'
          }
        }
      }
    }]
  };

  // ถ้ามี chart สร้างไว้แล้ว ให้ update
  if (window[elementId + "_chart"]) {
    window[elementId + "_chart"].updateOptions(options);
  } else {
    // ยังไม่มี chart -> สร้างใหม่
    window[elementId + "_chart"] = new ApexCharts(document.querySelector(`#${elementId}`), options);
    window[elementId + "_chart"].render();
  }
}

/**
 * showLoadingOverlay: ควบคุมการแสดง/ซ่อนหน้าจอ Loading
 */
function showLoadingOverlay(show) {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.style.display = show ? "flex" : "none";
}

/**
 * getCurrentDateTimeString: คืนข้อความวันที่-เวลา (YYYY-MM-DD HH:mm:ss)
 */
function getCurrentDateTimeString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/**
 * อัพเดตแสดงวันเวลาของไฟล์ล่าสุด
 */
function updateLastUpdatedTime(fileTimestamp) {
  // ถ้ามี fileTimestamp จากไฟล์ CSV ให้ใช้ค่านั้น
  // แต่ถ้าไม่มีให้ใช้เวลาปัจจุบัน
  const timestamp = fileTimestamp ? new Date(fileTimestamp) : new Date();
  
  // สร้างรูปแบบวันที่: YYYY-MM-DD HH:mm:ss
  const yyyy = timestamp.getFullYear();
  const mm = String(timestamp.getMonth() + 1).padStart(2, '0');
  const dd = String(timestamp.getDate()).padStart(2, '0');
  const hh = String(timestamp.getHours()).padStart(2, '0');
  const min = String(timestamp.getMinutes()).padStart(2, '0');
  const ss = String(timestamp.getSeconds()).padStart(2, '0');
  
  const formattedDateTime = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  
  // อัพเดตที่ element
  document.getElementById("last-updated-time").textContent = formattedDateTime;
}