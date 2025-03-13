// กำหนดค่า ID ของกล้องแต่ละตัว
const cameras = [
  { id: 'camera1' },
  { id: 'camera2' }
];

// ฟังก์ชันสำหรับดึงข้อมูล API ของกล้องผ่าน PHP Proxy
async function fetchCameraSummary(camera) {
  const url = `camera_proxy.php?camera=${camera.id}&action=getSummary`;

  fetch(url)
    .then(response => response.json())
    .then(result => {
      const lines = result.response.split('\n');
      const data = {};
      lines.forEach(line => {
        let [key, value] = line.split('=');
        data[key] = value;
      });

      document.getElementById(`${camera.id}In`).innerText = data['summary.EnteredSubtotal.Today'] || 0;
      document.getElementById(`${camera.id}Out`).innerText = data['summary.ExitedSubtotal.Today'] || 0;
    })
    .catch(error => console.error('Error fetching summary:', error));
}

// เรียกดึงข้อมูลกล้องทุกตัว
function fetchDataFromCameras() {
  cameras.forEach(camera => fetchCameraSummary(camera));
}

// ดึงข้อมูลครั้งแรกเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchDataFromCameras);

// ตั้งเวลาการดึงข้อมูลทุก 30 วินาที
setInterval(fetchDataFromCameras, 30000);

// ฟังก์ชันอัพเดทกราฟ
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

// ฟังก์ชันดึงข้อมูลรายชั่วโมงจากกล้องผ่าน PHP Proxy
async function fetchHourlyData(camera) {
  const today = new Date().toISOString().split('T')[0];
  const url = `camera_proxy.php?camera=${camera.id}&action=startFind&startTime=${today} 08:00:00&endTime=${today} 21:00:00`;

  fetch(url)
    .then(response => response.json())
    .then(result => {
      const tokenMatch = result.response.match(/token=(\d+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        const urlData = `camera_proxy.php?camera=${camera.id}&action=doFind&token=${token}`;
        fetch(urlData)
          .then(response => response.json())
          .then(resultData => {
            const hourlyData = Array.from(resultData.response.matchAll(/EnteredSubtotal=(\d+)/g), match => parseInt(match[1]));
            updateChart(camera.id, hourlyData);
          });
      }
    })
    .catch(error => console.error('Error fetching hourly data:', error));
}

// ดึงข้อมูลรายชั่วโมงทุกกล้อง
function fetchHourlyDataFromCameras() {
  cameras.forEach(camera => fetchHourlyData(camera));
}

// ดึงข้อมูลรายชั่วโมงเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchHourlyDataFromCameras);

// ตั้งเวลาดึงข้อมูลรายชั่วโมงทุก 30 วินาที
setInterval(fetchHourlyDataFromCameras, 30000);
