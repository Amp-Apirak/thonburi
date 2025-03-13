// กำหนดค่า Username, Password และ IP ของกล้องแต่ละตัว
const cameras = [
  { ip: '192.168.1.11', user: 'admin', pass: 'P4ssw0rd', id: 'camera1' },
  { ip: '192.168.1.14', user: 'admin', pass: 'P4ssw0rd', id: 'camera2' }
];

// ฟังก์ชันสำหรับดึงข้อมูล API ของกล้อง Dahua
async function fetchCameraSummary(camera) {
  const url = `http://${camera.ip}/cgi-bin/videoStatServer.cgi?action=getSummary`;
  const xhr = new XMLHttpRequest();

  xhr.open('GET', url, true);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(camera.user + ':' + camera.pass));

  xhr.onload = function () {
    if (xhr.status === 200) {
      // แปลง response จาก plain text เป็น object
      const lines = xhr.responseText.split('\n');
      const data = {};
      lines.forEach(line => {
        let [key, value] = line.split('=');
        data[key] = value;
      });

      // อัพเดทข้อมูลใน Cards บนหน้า Dashboard
      document.getElementById(`${camera.id}In`).innerText = data['summary.EnteredSubtotal.Today'] || 0;
      document.getElementById(`${camera.id}Out`).innerText = data['summary.ExitedSubtotal.Today'] || 0;
    } else {
      console.error(`ไม่สามารถดึงข้อมูลจากกล้อง ${camera.id}`);
    }
  };

  xhr.onerror = function () {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจากกล้อง', camera.id);
  };

  xhr.send();
}

// ฟังก์ชันเรียกดึงข้อมูลกล้องทุกตัว
function fetchDataFromCameras() {
  cameras.forEach(camera => fetchCameraSummary(camera));
}

// ดึงข้อมูลครั้งแรกเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchDataFromCameras);

// ตั้งเวลาการดึงข้อมูลทุก 30 วินาที
setInterval(fetchDataFromCameras, 30000);

// ฟังก์ชันสำหรับอัพเดทกราฟ ApexCharts
function updateChart(cameraId, data) {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  const options = {
    chart: { type: 'bar', height: 350 },
    series: [{ name: 'จำนวนคนเข้า', data }],
    xaxis: { categories: hours, title: { text: 'ชั่วโมง' } },
    yaxis: { title: { text: 'จำนวนคน' } },
    colors: cameraId === 'camera1' ? ['#007bff'] : ['#28a745'],
  };

  const chartContainer = document.querySelector(`#chart${cameraId}`);
  chartContainer.innerHTML = '';
  const chart = new ApexCharts(chartContainer, options);
  chart.render();
}

// ฟังก์ชันสำหรับดึงข้อมูลรายชั่วโมงจากกล้อง (ข้อมูลจริงจาก Dahua API)
async function fetchHourlyData(camera) {
  const today = new Date().toISOString().split('T')[0];
  const url = `http://${camera.ip}/cgi-bin/videoStatServer.cgi?action=startFind&condition.StartTime=${today}%2008:00:00&condition.EndTime=${today}%2021:00:00&condition.Granularity=Hour&condition.RuleType=NumberStat`;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(camera.user + ':' + camera.pass));

  xhr.onload = function () {
    if (xhr.status === 200) {
      const tokenMatch = xhr.responseText.match(/token=(\d+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        const urlData = `http://${camera.ip}/cgi-bin/videoStatServer.cgi?action=doFind&token=${token}&beginNumber=0&count=14`;
        const xhrData = new XMLHttpRequest();
        xhrData.open('GET', urlData, true);
        xhrData.setRequestHeader('Authorization', 'Basic ' + btoa(camera.user + ':' + camera.pass));

        xhrData.onload = function () {
          if (xhrData.status === 200) {
            const hourlyData = Array.from(xhrData.responseText.matchAll(/EnteredSubtotal=(\d+)/g), match => parseInt(match[1]));
            updateChart(camera.id, hourlyData);
          }
        };

        xhrData.send();
      }
    }
  };

  xhr.send();
}

// ดึงข้อมูลรายชั่วโมงของทุกกล้อง
function fetchHourlyDataFromCameras() {
  cameras.forEach(camera => fetchHourlyData(camera));
}

// ดึงข้อมูลรายชั่วโมงเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchHourlyDataFromCameras);

// ตั้งเวลาการดึงข้อมูลรายชั่วโมงทุก 30 วินาที
setInterval(fetchHourlyDataFromCameras, 30000);
