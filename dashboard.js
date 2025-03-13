// dashboard.js
document.addEventListener("DOMContentLoaded", function() {
    // เมื่อหน้าเว็บโหลดเสร็จ ให้เรียกฟังก์ชัน loadCSVData() ทันที
    loadCSVData();
  
    // ตัวอย่าง: ถ้าต้องการรีเฟรชข้อมูลอัตโนมัติทุก 30 วินาที
    // setInterval(loadCSVData, 30000);
  
    // หรือถ้าต้องการให้กดปุ่มรีเฟรชเอง ก็สามารถผูก event ให้ปุ่มได้ เช่น:
    // document.getElementById("refreshBtn").addEventListener("click", loadCSVData);
  });
  
  /**
   * ฟังก์ชันโหลดข้อมูล CSV ล่าสุดจาก get_latest_csv.php
   */
  function loadCSVData() {
    fetch("get_latest_csv.php")
      .then(response => response.json())
      .then(data => {
        // data.camera1 และ data.camera2 จะเป็นข้อความ CSV
        const csvCamera1 = data.camera1;
        const csvCamera2 = data.camera2;
  
        // เรียกฟังก์ชัน parseCSV เพื่อแปลงข้อมูล CSV ให้เป็น Array
        const camera1Rows = parseCSV(csvCamera1);
        const camera2Rows = parseCSV(csvCamera2);
  
        // แสดงผลลงในตาราง หรือกราฟ หรือส่วนอื่น ๆ ตามต้องการ
        displayDataInTable(camera1Rows, 'camera1-table-body');
        displayDataInTable(camera2Rows, 'camera2-table-body');
      })
      .catch(error => {
        console.error("เกิดข้อผิดพลาดในการโหลดไฟล์ CSV:", error);
      });
  }
  
  /**
   * ฟังก์ชันสำหรับแปลงข้อความ CSV เป็น Array 2 มิติ
   * (สามารถปรับใช้ library อื่นอย่าง PapaParse ได้ถ้าต้องการความยืดหยุ่น)
   */
  function parseCSV(csvString) {
    if (!csvString) return [];
  
    // แยกแต่ละบรรทัดด้วยการ split('\n')
    const lines = csvString.split('\n');
  
    // แต่ละบรรทัดให้แยกค่าด้วยเครื่องหมายจุลภาค ( , )
    const result = lines.map(line => line.trim().split(','));
  
    return result;
  }
  
  /**
   * ฟังก์ชันตัวอย่างสำหรับแสดงข้อมูลลงในตาราง (table) 
   * โดยอ้างอิงผ่าน id ของ <tbody> เช่น 'camera1-table-body' หรือ 'camera2-table-body'
   */
  function displayDataInTable(rows, tableBodyId) {
    // ดึง <tbody> จาก id
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
  
    // เคลียร์ข้อมูลเก่า
    tableBody.innerHTML = "";
  
    // สร้าง <tr> และ <td> สำหรับแต่ละ row ใน CSV
    rows.forEach((row) => {
      // สร้าง element <tr>
      const tr = document.createElement('tr');
  
      row.forEach((cell) => {
        // สร้าง <td> และกำหนดข้อความเป็นค่าที่อ่านได้จาก CSV
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
  
      // เพิ่ม <tr> ลงใน <tbody>
      tableBody.appendChild(tr);
    });
  }
  