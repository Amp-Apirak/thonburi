// กำหนดค่า Username, Password และ IP ของกล้องแต่ละตัว
const cameras = [
  { ip: '192.168.1.11', user: 'admin', pass: 'P4ssw0rd', id: 'camera1' },
  { ip: '192.168.1.14', user: 'admin', pass: 'P4ssw0rd', id: 'camera2' }
];

// ฟังก์ชันสำหรับดึงข้อมูล API ของกล้อง Dahua
async function fetchCameraSummary(camera) {
  return new Promise((resolve, reject) => {
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

        // อัพเดทข้อมูลในหน้าเว็บ
        document.getElementById(`${camera.id}-in`).innerText = data['summary.EnteredSubtotal.Today'] || 0;
        document.getElementById(`${camera.id}-out`).innerText = data['summary.ExitedSubtotal.Today'] || 0;
      } else {
        console.error(`ไม่สามารถดึงข้อมูลจากกล้อง ${camera.id}`);
      }
    };

    xhr.onerror = function () {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจากกล้อง', camera.id);
    };

    xhr.send();
  });
}

// ดึงข้อมูลครั้งแรกเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchDataFromCameras);

// ตั้งเวลาการดึงข้อมูลทุก 30 วินาที
setInterval(fetchDataFromCameras, 30000);
