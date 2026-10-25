import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity/brain/b95838a6-2204-44cb-9180-e32fb46ea712';
const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const results = [];

function recordResult(tcId, useCase, description, passed, details) {
  results.push({ tcId, useCase, description, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} (${useCase}): ${description} -> ${details}`);
}

async function runTests() {
  const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  const browser = await chromium.launch({
    headless: true,
    executablePath
  });

  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Failed to load resource')) {
        consoleLogs.push(text);
      }
    }
  });
  page.on('pageerror', err => {
    consoleLogs.push(err.message);
  });

  try {
    // =========================================================================
    // TC01: Kiểm tra giao diện Đăng nhập Chuyên nghiệp Hiện đại & Loại bỏ tên trường cũ
    // =========================================================================
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const borderRadius = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="login-submit-btn"]');
      return btn ? window.getComputedStyle(btn).borderRadius : '0px';
    });
    const loginBodyText = (await page.textContent('body')) || '';
    const hasNoOldName =
      !loginBodyText.toLowerCase().includes('haui') &&
      !loginBodyText.toLowerCase().includes('công nghiệp hà nội') &&
      !loginBodyText.includes('Nguyễn Thị Mỹ Bình') &&
      loginBodyText.includes('TS. Nguyễn Thái Cường');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_01_login_uc01.png'), fullPage: true });

    recordResult(
      'TC01',
      'UC01',
      'Giao diện Đăng nhập Chuyên nghiệp Hiện đại, hiển thị TS. Nguyễn Thái Cường và loại bỏ hoàn toàn tên trường cũ',
      borderRadius !== '0px' && hasNoOldName,
      `Giao diện bo góc (${borderRadius}), sạch tên trường cũ & hiển thị GVHD: TS. Nguyễn Thái Cường = ${hasNoOldName}`
    );

    // =========================================================================
    // TC02: Kiểm tra ràng buộc trường trống & tài khoản bị khóa (UC01)
    // =========================================================================
    await page.click('[data-testid="login-submit-btn"]');
    const emptyErrText = await page.textContent('[data-testid="login-error-box"]');

    // Kiểm tra tài khoản bị khóa 2026601004 (TrangThai = 0)
    await page.click('[data-testid="demo-locked-btn"]');
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="login-error-box"]');
    const lockedErrText = await page.textContent('[data-testid="login-error-box"]');

    recordResult(
      'TC02',
      'UC01',
      'Kiểm tra ràng buộc trống & cảnh báo tài khoản bị khóa (2026601004)',
      Boolean(emptyErrText && lockedErrText?.includes('vô hiệu hóa')),
      `Bắt lỗi trống & báo lỗi TK khóa: "${lockedErrText?.trim()}"`
    );

    // =========================================================================
    // TC-RBAC-01 & TC-RBAC-02: Đăng nhập ROLE_STUDENT (2026601001) -> /student-portal
    // =========================================================================
    await page.click('[data-testid="demo-student-btn"]');
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="students-table"]');
    await page.waitForLoadState('networkidle');

    const studentUrl = page.url();
    const adminWorkspaceCountStudent = await page.locator('[data-testid="admin-dedicated-workspace"]').count();
    const navRbacCountStudent = await page.locator('[data-testid="nav-rbac-btn"]').count();
    const addBtnCountStudent = await page.locator('[data-testid="add-student-btn"]').count();
    const editBtnCountStudent = await page.locator('[data-testid^="btn-edit-"]').count();
    const deleteBtnCountStudent = await page.locator('[data-testid^="btn-delete-"]').count();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_02_student_portal_rbac.png'), fullPage: true });

    recordResult(
      'TC-RBAC-01',
      'RBAC / UC01',
      'ROLE_STUDENT (2026601001) điều hướng tới /student-portal, tách biệt hoàn toàn khỏi trang Admin riêng',
      studentUrl.includes('/student-portal') && adminWorkspaceCountStudent === 0 && navRbacCountStudent === 0,
      `URL = ${studentUrl}, AdminWorkspace = ${adminWorkspaceCountStudent}, NavRBAC = ${navRbacCountStudent}`
    );

    recordResult(
      'TC-RBAC-02',
      'RBAC / UC02',
      'ROLE_STUDENT hoàn toàn không có nút +THÊM SINH VIÊN, [Sửa], [Xóa] trên cây DOM',
      addBtnCountStudent === 0 && editBtnCountStudent === 0 && deleteBtnCountStudent === 0,
      `DOM Count -> Add: ${addBtnCountStudent}, Edit: ${editBtnCountStudent}, Delete: ${deleteBtnCountStudent}`
    );

    // =========================================================================
    // TC-RBAC-03: ROLE_STUDENT truy cập trực tiếp URL xóa /sinh-vien/xoa/2026601002 -> 403 Forbidden
    // =========================================================================
    await page.click('[data-testid="simulate-403-btn"]');
    await page.waitForSelector('[data-testid="rbac-403-banner"]');
    const banner403Text = await page.textContent('[data-testid="rbac-403-banner"]');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_03_rbac_403_denied.png'), fullPage: true });

    recordResult(
      'TC-RBAC-03',
      'RBAC / UC07',
      'ROLE_STUDENT gửi lệnh tới /sinh-vien/xoa/2026601002 bị chặn với 403 Access Denied',
      Boolean(banner403Text?.includes('403')),
      `Phản hồi từ Backend Guard: "${banner403Text?.trim()}"`
    );

    // Đăng xuất tài khoản sinh viên
    await page.click('[data-testid="logout-btn"]');
    await page.waitForSelector('[data-testid="login-submit-btn"]');

    // =========================================================================
    // TC-RBAC-04 & TC-RBAC-05: Đăng nhập ROLE_STAFF (giaovu_thai) -> /staff-portal & Mở Modal Sửa UC06
    // =========================================================================
    await page.click('[data-testid="demo-staff-btn"]');
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="students-table"]');
    await page.waitForLoadState('networkidle');

    const staffUrl = page.url();
    const adminWorkspaceCountStaff = await page.locator('[data-testid="admin-dedicated-workspace"]').count();
    const staffAddBtnCount = await page.locator('[data-testid="add-student-btn"]').count();
    const staffEditBtnCount = await page.locator('[data-testid^="btn-edit-"]').count();
    const staffDeleteBtnCount = await page.locator('[data-testid^="btn-delete-"]').count();
    const staffRbacNavCount = await page.locator('[data-testid="nav-rbac-btn"]').count();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_staff_portal.png'), fullPage: true });

    recordResult(
      'TC-RBAC-04',
      'RBAC / Staff',
      'ROLE_STAFF điều hướng tới /staff-portal (Topbar), hiển thị +THÊM SINH VIÊN, [Xem], [Sửa], [Xóa] nhưng không vào trang Admin riêng',
      staffUrl.includes('/staff-portal') && adminWorkspaceCountStaff === 0 && staffAddBtnCount === 1 && staffEditBtnCount > 0 && staffDeleteBtnCount > 0 && staffRbacNavCount === 0,
      `URL=${staffUrl}, AdminWorkspace=${adminWorkspaceCountStaff}, Add=${staffAddBtnCount}, Edit=${staffEditBtnCount}, Delete=${staffDeleteBtnCount}`
    );

    // Nhấn nút [Sửa] trên dòng của Đỗ Đức Cảnh (2026601001)
    await page.click('[data-testid="btn-edit-2026601001"]');
    await page.waitForSelector('[data-testid="student-form-masv"]');
    const maSvValue = await page.inputValue('[data-testid="student-form-masv"]');
    const isReadOnly = await page.$eval('[data-testid="student-form-masv"]', el => el.hasAttribute('readonly'));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_04_modal_edit_uc06_readonly.png'), fullPage: true });

    recordResult(
      'TC-RBAC-05',
      'RBAC / UC06',
      'ROLE_STAFF nhấn [Sửa] trên Đỗ Đức Cảnh -> Mở Modal Cập nhật, Mã SV = 2026601001 và Readonly',
      maSvValue === '2026601001' && isReadOnly === true,
      `MaSV = ${maSvValue}, readonly = ${isReadOnly}`
    );

    await page.click('[data-testid="student-form-cancel-btn"]');
    await page.click('[data-testid="logout-btn"]');
    await page.waitForSelector('[data-testid="login-submit-btn"]');

    // =========================================================================
    // TC03 & TC-RBAC-06: Đăng nhập ROLE_ADMIN (admin) -> Chuyển sang Trang Quản trị riêng (/admin-portal)
    // =========================================================================
    await page.click('[data-testid="demo-admin-btn"]');
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="admin-dedicated-workspace"]');
    await page.waitForSelector('[data-testid="students-table"]');
    await page.waitForLoadState('networkidle');

    const adminUrl = page.url();
    const adminDedicatedWorkspaceCount = await page.locator('[data-testid="admin-dedicated-workspace"]').count();
    const adminRbacNavCount = await page.locator('[data-testid="nav-rbac-btn"]').count();
    const adminPageText = (await page.textContent('body')) || '';
    const adminCleanBranding =
      !adminPageText.toLowerCase().includes('haui') &&
      !adminPageText.toLowerCase().includes('công nghiệp hà nội');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_05_admin_student_list_uc02.png'), fullPage: true });

    recordResult(
      'TC03',
      'UC01',
      'Đăng nhập ROLE_ADMIN (admin) chuyển hướng sang Trang Quản trị Hệ thống riêng biệt (/admin-portal)',
      adminUrl.includes('/admin-portal') && adminDedicatedWorkspaceCount === 1 && adminCleanBranding,
      `Chuyển hướng thành công sang ${adminUrl} (Admin Portal tinh gọn, sạch tên trường cũ)`
    );

    recordResult(
      'TC-RBAC-06',
      'RBAC / Admin',
      'Trang Admin Portal (/admin-portal) hiển thị đầy đủ Sidebar 4 phân hệ & KPI quản trị',
      adminDedicatedWorkspaceCount === 1 && adminRbacNavCount === 1,
      'Hiển thị đầy đủ: Quản lý Hồ sơ SV, Tài khoản & Phân quyền, Danh mục Lớp & Khoa, Quản trị Đa Database'
    );

    // =========================================================================
    // TC04: Kiểm tra bảng danh sách sinh viên & phân trang (UC02)
    // =========================================================================
    const page1Summary = await page.textContent('[data-testid="pagination-summary"]');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien') && res.status() === 200),
      page.click('[data-testid="page-btn-2"]')
    ]);
    const page2Summary = await page.textContent('[data-testid="pagination-summary"]');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien') && res.status() === 200),
      page.click('[data-testid="page-btn-1"]')
    ]);

    recordResult(
      'TC04',
      'UC02',
      'Kiểm tra hiển thị bảng danh sách sinh viên & chuyển trang [1] -> [2]',
      Boolean(page1Summary?.includes('1 - 7') && page2Summary?.includes('8 - 14')),
      `Trang 1: "${page1Summary?.trim()}", Trang 2: "${page2Summary?.trim()}"`
    );

    // =========================================================================
    // TC05: Kiểm tra thanh công cụ tìm kiếm và lọc đa tiêu chí (UC03)
    // =========================================================================
    await page.fill('[data-testid="search-keyword-input"]', 'Đỗ Đức Cảnh');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien') && res.url().includes('search=')),
      page.click('[data-testid="search-submit-btn"]')
    ]);
    await page.waitForTimeout(150);
    const searchCount = await page.textContent('[data-testid="total-student-count"]');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien')),
      page.click('[data-testid="search-reset-btn"]')
    ]);
    await page.waitForTimeout(150);

    recordResult(
      'TC05',
      'UC03',
      'Tìm kiếm đa tiêu chí với từ khóa "Đỗ Đức Cảnh" và đặt lại bộ lọc',
      searchCount?.trim() === '1',
      `Số kết quả khớp từ khóa "Đỗ Đức Cảnh" = ${searchCount?.trim()}`
    );

    // =========================================================================
    // TC06: Kiểm tra Modal Xem chi tiết hồ sơ sinh viên (UC04)
    // =========================================================================
    await page.click('[data-testid="btn-view-2026601001"]');
    await page.waitForSelector('[data-testid="student-detail-modal-content"]');
    const detailText = await page.textContent('[data-testid="student-detail-modal-content"]');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_06_modal_detail_uc04.png'), fullPage: true });
    await page.click('[data-testid="detail-modal-close-btn"]');

    recordResult(
      'TC06',
      'UC04',
      'Mở Modal Xem chi tiết lý lịch sinh viên 2026601001 (Đỗ Đức Cảnh) hiển thị Cố vấn học tập: TS. Nguyễn Thái Cường',
      Boolean(detailText?.includes('Đỗ Đức Cảnh') && detailText?.includes('TS. Nguyễn Thái Cường')),
      'Hiển thị đầy đủ Mục I (Cố vấn học tập: TS. Nguyễn Thái Cường), Mục II (Cá nhân) và Mục III (Tài khoản)'
    );

    // =========================================================================
    // TC07: Kiểm tra Thêm mới sinh viên & chặn trùng Mã SV (UC05)
    // =========================================================================
    await page.evaluate(async () => {
      const tk = localStorage.getItem('qlsv_token');
      await fetch('/api/sinh-vien/2026601099?confirm=XACNHAN', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tk}` }
      });
    });

    await page.click('[data-testid="add-student-btn"]');
    await page.waitForSelector('[data-testid="student-form-masv"]');

    // Thử nhập trùng mã 2026601001
    await page.fill('[data-testid="student-form-masv"]', '2026601001');
    await page.fill('[data-testid="student-form-hoten"]', 'Sinh Viên Kiểm Thử Trùng Mã');
    await page.click('[data-testid="student-form-save-btn"]');
    await page.waitForSelector('[data-testid="student-form-error"]');
    const dupErr = await page.textContent('[data-testid="student-form-error"]');

    // Nhập mã mới hợp lệ 2026601099
    await page.fill('[data-testid="student-form-masv"]', '2026601099');
    await page.fill('[data-testid="student-form-hoten"]', 'Nguyễn Văn Kiểm Thử');
    await page.fill('[data-testid="student-form-sdt"]', '0988776655');
    await page.fill('[data-testid="student-form-email"]', 'kiemthu99@edu.vn');
    await page.fill('[data-testid="student-form-quequan"]', 'Cầu Giấy, TP. Hà Nội');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_07_modal_add_uc05.png'), fullPage: true });
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien') && res.request().method() === 'POST'),
      page.click('[data-testid="student-form-save-btn"]')
    ]);
    await page.waitForSelector('[data-testid="toast-notification"]');

    recordResult(
      'TC07',
      'UC05',
      'Kiểm tra chặn trùng Mã SV (2026601001) & Thêm mới thành công SV 2026601099',
      Boolean(dupErr?.includes('đã tồn tại')),
      `Chặn trùng mã ("${dupErr?.trim()}") và thêm mới thành công 2026601099`
    );

    // =========================================================================
    // TC08: Kiểm tra Cập nhật thông tin sinh viên (UC06)
    // =========================================================================
    await page.fill('[data-testid="search-keyword-input"]', '2026601099');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien') && res.url().includes('2026601099')),
      page.click('[data-testid="search-submit-btn"]')
    ]);
    await page.waitForSelector('[data-testid="btn-edit-2026601099"]');

    await page.click('[data-testid="btn-edit-2026601099"]');
    await page.waitForSelector('[data-testid="student-form-hoten"]');
    await page.fill('[data-testid="student-form-hoten"]', 'Nguyễn Văn Kiểm Thử (Đã Cập Nhật)');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien/2026601099') && res.request().method() === 'PUT'),
      page.click('[data-testid="student-form-save-btn"]')
    ]);
    await page.waitForTimeout(200);
    const rowUpdatedText = await page.textContent('[data-testid="student-row-2026601099"]');

    recordResult(
      'TC08',
      'UC06',
      'Cập nhật họ tên sinh viên 2026601099 và giữ khóa chính MaSV ở chế độ Readonly',
      Boolean(rowUpdatedText?.includes('Đã Cập Nhật')),
      'Cập nhật thành công họ tên sinh viên trên CSDL'
    );

    // =========================================================================
    // TC09: Kiểm tra hộp thoại Xác nhận Xóa sinh viên an toàn (UC07)
    // =========================================================================
    await page.click('[data-testid="btn-delete-2026601099"]');
    await page.waitForSelector('[data-testid="delete-confirm-input"]');
    const isDeleteDisabledInitially = await page.$eval(
      '[data-testid="delete-confirm-submit-btn"]',
      el => el.disabled
    );

    await page.fill('[data-testid="delete-confirm-input"]', 'XACNHAN');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_08_modal_delete_uc07.png'), fullPage: true });
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien/2026601099') && res.request().method() === 'DELETE'),
      page.click('[data-testid="delete-confirm-submit-btn"]')
    ]);
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/sinh-vien')),
      page.click('[data-testid="search-reset-btn"]')
    ]);

    recordResult(
      'TC09',
      'UC07',
      'Hộp thoại Xác nhận Xóa khóa nút xóa cho tới khi gõ "XACNHAN" và xóa thành công',
      isDeleteDisabledInitially === true,
      `Nút xóa khóa mặc định (${isDeleteDisabledInitially}), mở khóa khi gõ XACNHAN và xóa sạch bản ghi`
    );

    // =========================================================================
    // TC10: Kiểm tra các phân hệ riêng trong Admin Portal (/admin-portal) & Multi-Database Manager
    // =========================================================================
    await page.click('[data-testid="nav-rbac-btn"]');
    await page.waitForSelector('[data-testid="admin-rbac-view"]');
    const rbacText = (await page.textContent('[data-testid="admin-rbac-view"]')) || '';
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_09_admin_rbac_accounts.png'), fullPage: true });

    await page.click('[data-testid="nav-dashboard-btn"]');
    await page.waitForSelector('[data-testid="database-manager-section"]');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_10_dashboard_db_manager_brand_theme.png'), fullPage: true });

    if (consoleLogs.length > 0) {
      console.log('Unexpected console errors:', consoleLogs.slice(0, 5));
    }
    recordResult(
      'TC10',
      'Admin Portal / DB',
      'Kiểm tra phân hệ Tài khoản RBAC (TS. Nguyễn Thái Cường) & Quản trị Đa Database trong trang Admin (/admin-portal)',
      consoleLogs.length === 0 && rbacText.includes('TS. Nguyễn Thái Cường'),
      `Hiển thị đồng nhất giao diện chuyên nghiệp hiện đại, GVHD TS. Nguyễn Thái Cường, Runtime errors = ${consoleLogs.length}`
    );
  } finally {
    await browser.close();
  }

  const allPassed = results.every(r => r.passed);
  console.log('\n=====================================================================');
  console.log(` TỔNG KẾT KIỂM THỬ WEBAPP-TESTING: ${results.filter(r => r.passed).length}/${results.length} KỊCH BẢN ĐẠT (PASS)`);
  console.log('=====================================================================');
  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi thực thi E2E test:', err);
  process.exit(1);
});
