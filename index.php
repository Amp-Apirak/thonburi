<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>Thonburi | Dashboard</title>
  <!-- Meta -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="title" content="Thonburi | Dashboard" />
  <meta name="author" content="Thonburi" />
  <meta name="description" content="Thonburi | Dashboard" />
  <meta name="keywords" content="Thonburi | Dashboard" />

  <!-- CSS: Bootstrap, Bootstrap Icons, AdminLTE, custom -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link rel="stylesheet" href="css/adminlte.css" />
  <link rel="stylesheet" href="css/custom.css" />

  <!-- ApexCharts -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/apexcharts@3.37.1/dist/apexcharts.css" />

  <!-- Google Fonts - Prompt -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap">
</head>

<body class="layout-fixed sidebar-expand-lg bg-body-tertiary">
  <div class="app-wrapper">
    <!-- Header -->
    <?php include 'layout/header.php'; ?>
    <!-- Sidebar -->
    <?php include 'layout/sidebar.php'; ?>

    <!-- Main Content -->
    <main class="app-main">
      <!-- Content Header -->
      <div class="app-content-header">
        <div class="container-fluid">
          <div class="row">
            <div class="col-sm-6">
              <h3 class="mb-0 dash-title">
                <i class="bi bi-speedometer2 me-2"></i>Dashboard
              </h3>
            </div>
            <div class="col-sm-6">
              <ol class="breadcrumb float-sm-end">
                <li class="breadcrumb-item">
                  <a href="#"><i class="bi bi-house-door"></i> Home</a>
                </li>
                <li class="breadcrumb-item active" aria-current="page">
                  Dashboard
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="app-content">
        <div class="container-fluid">
          <!-- ส่วนของตัวกรองวันที่และเวลา -->
          <div class="row mb-4">

            <!-- สรุปยอดรวม -->
            <div class="col-md-5">
              <div class="card summary-card">
                <div class="card-header">
                  <h3 class="card-title">
                    <i class="bi bi-people-fill me-2"></i>ยอดรวมทั้งหมด
                  </h3>
                  &nbsp;
                  <span class="last-updated" id="last-updated-display">
                    อัพเดตล่าสุด: &nbsp; <span id="last-updated-time">-</span>
                  </span>
                </div>
                <div class="card-body p-0">
                  <div class="summary-counters">
                    <div class="counter-item in-counter">
                      <div class="counter-icon">
                        <i class="fas fa-sign-in-alt"></i>
                      </div>
                      <div class="counter-info">
                        <p class="counter-label">คนเข้า</p>
                        <h3 class="counter-value" id="totalIn">0</h3>
                      </div>
                    </div>
                    <div class="counter-item out-counter">
                      <div class="counter-icon">
                        <i class="fas fa-sign-out-alt"></i>
                      </div>
                      <div class="counter-info">
                        <p class="counter-label">คนออก</p>
                        <h3 class="counter-value" id="totalOut">0</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 1: Cards สำหรับนับจำนวนคนเข้า-ออก -->
          <div class="row mb-4">
            <!-- Card 1: จำนวนคนเข้า กล้องตัวที่ 1 -->
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
              <div class="stat-card camera1-in">
                <div class="stat-icon">
                  <i class="fas fa-video"></i>
                </div>
                <div class="stat-info">
                  <p class="stat-title">กล้อง 1: คนเข้า</p>
                  <h3 class="stat-value" id="camera1In">0</h3>
                  <div class="stat-badge">
                    <span class="status-indicator active"></span>ออนไลน์
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: จำนวนคนออก กล้องตัวที่ 1 -->
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
              <div class="stat-card camera1-out">
                <div class="stat-icon">
                  <i class="fas fa-video"></i>
                </div>
                <div class="stat-info">
                  <p class="stat-title">กล้อง 1: คนออก</p>
                  <h3 class="stat-value" id="camera1Out">0</h3>
                  <div class="stat-badge">
                    <span class="status-indicator active"></span>ออนไลน์
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 3: จำนวนคนเข้า กล้องตัวที่ 2 -->
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
              <div class="stat-card camera2-in">
                <div class="stat-icon">
                  <i class="fas fa-video"></i>
                </div>
                <div class="stat-info">
                  <p class="stat-title">กล้อง 2: คนเข้า</p>
                  <h3 class="stat-value" id="camera2In">0</h3>
                  <div class="stat-badge">
                    <span class="status-indicator active"></span>ออนไลน์
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 4: จำนวนคนออก กล้องตัวที่ 2 -->
            <div class="col-md-3 col-sm-6">
              <div class="stat-card camera2-out">
                <div class="stat-icon">
                  <i class="fas fa-video"></i>
                </div>
                <div class="stat-info">
                  <p class="stat-title">กล้อง 2: คนออก</p>
                  <h3 class="stat-value" id="camera2Out">0</h3>
                  <div class="stat-badge">
                    <span class="status-indicator active"></span>ออนไลน์
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: กราฟแท่งแนวตั้ง -->
          <div class="row">
            <!-- กราฟ 1: จำนวนคนเข้า กล้องตัวที่ 1 รายชั่วโมง -->
            <div class="col-md-6 mb-4">
              <div class="card chart-card">
                <div class="card-header d-flex align-items-center">
                  <div class="card-icon-bg me-2 chart1-icon">
                    <i class="bi bi-bar-chart-fill"></i>
                  </div>
                  <h3 class="card-title">กล้อง 1: จำนวนคนเข้ารายชั่วโมง</h3>
                  <!-- <div class="ms-auto">
                    <div class="chart-period">
                      <span class="period-label">08:00 - 21:00</span>
                    </div>
                  </div> -->
                </div>
                <div class="card-body">
                  <div id="chartCamera1" class="chart-container"></div>
                </div>
              </div>
            </div>

            <!-- กราฟ 2: จำนวนคนเข้า กล้องตัวที่ 2 รายชั่วโมง -->
            <div class="col-md-6 mb-4">
              <div class="card chart-card">
                <div class="card-header d-flex align-items-center">
                  <div class="card-icon-bg me-2 chart2-icon">
                    <i class="bi bi-bar-chart-fill"></i>
                  </div>
                  <h3 class="card-title">กล้อง 2: จำนวนคนเข้ารายชั่วโมง</h3>
                  <!-- <div class="ms-auto">
                    <div class="chart-period">
                      <span class="period-label">08:00 - 21:00</span>
                    </div>
                  </div> -->
                </div>
                <div class="card-body">
                  <div id="chartCamera2" class="chart-container"></div>
                </div>
              </div>
            </div>
          </div>
        </div> <!-- container-fluid -->
      </div> <!-- app-content -->
    </main>

    <?php
    // โหลดส่วน Footer
    include 'layout/footer.php';
    ?>

    <!-- Loading Overlay -->
    <div id="loading-overlay" style="display: none;">
      <div class="spinner-wrapper">
        <div class="spinner-grow text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">กำลังโหลด...</span>
        </div>
        <div class="loading-text">กำลังโหลดข้อมูล...</div>
      </div>
    </div>
  </div> <!-- /app-wrapper -->

  <!-- JS: Bootstrap, ApexCharts, AdminLTE, index.js -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.37.1/dist/apexcharts.min.js"></script>
  <script src="js/adminlte.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
  <script src="js/index.js"></script>
</body>
</html>
