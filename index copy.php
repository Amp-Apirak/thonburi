<!doctype html>
<html lang="th">

<head>
  <meta charset="utf-8" />
  <title>Thonburi | Dashboard</title>
  <!-- Meta -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="title" content="Thonburi | Dashboard " />
  <meta name="author" content="Thonburi" />
  <meta name="description" content="Thonburi | Dashboard" />
  <meta name="keywords" content="Thonburi | Dashboard " />

  <!-- CSS: Bootstrap, Bootstrap Icons, AdminLTE, custom -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <!-- เพิ่ม Font Awesome สำหรับไอคอนเพิ่มเติม -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link rel="stylesheet" href="css/adminlte.css" />

  <!-- สำหรับปรับแต่งกราฟ -->
  <link rel="stylesheet" href="css/custom.css" />

  <!-- สำหรับปรับแต่งหน้าจอ -->
  <link rel="stylesheet" href="css/dashboard-styles.css" />

  <!-- ApexCharts -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/apexcharts@3.37.1/dist/apexcharts.css" />

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
              <h3 class="mb-0">Dashboard</h3>
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
         
        </div> <!-- container-fluid -->
      </div> <!-- app-content -->
    </main>

    <?php
    // โหลดส่วน Footer
    include 'layout/footer.php';
    ?>

    <!-- Loading Overlay - ปรับปรุงใหม่ให้สวยงามขึ้น -->
    <div id="loading-overlay" style="display: none;">
      <div class="spinner-wrapper">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">กำลังโหลด...</span>
        </div>
        <div class="loading-text">กำลังโหลดข้อมูล...</div>
      </div>
    </div>

    <!-- JS: Bootstrap, ApexCharts, AdminLTE, index.js -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.37.1/dist/apexcharts.min.js"></script>
    <script src="js/adminlte.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>

</body>

</html>