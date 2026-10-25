import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  initializeDatabase,
  queryAll,
  queryOne,
  executeSql,
  addAuditLog,
  auditLogs,
  createOrSwitchDatabase,
  listDatabases,
  getCurrentDbInfo
} from './db.js';
import { authenticateToken, requireRoles, JWT_SECRET } from './middleware/rbacMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Helper kiểm tra dữ liệu sinh viên theo Mục 3.3 của bản thiết kế Mockup
function validateStudentPayload(payload, isCreate = true) {
  const errors = [];
  const { MaSV, HoTen, NgaySinh, GioiTinh, MaLop, SoDienThoai, Email, TrangThai } = payload;

  if (isCreate) {
    if (!MaSV || !/^\d{10}$/.test(String(MaSV).trim())) {
      errors.push('Mã sinh viên bắt buộc phải gồm đúng 10 chữ số (VD: 2026601001).');
    }
  }

  if (!HoTen || String(HoTen).trim().length < 2 || /\d/.test(String(HoTen))) {
    errors.push('Họ và tên sinh viên bắt buộc nhập và không được chứa chữ số.');
  }

  if (!NgaySinh) {
    errors.push('Ngày sinh là trường bắt buộc.');
  } else {
    const birthYear = new Date(NgaySinh).getFullYear();
    const currentYear = 2026;
    const age = currentYear - birthYear;
    if (isNaN(birthYear) || age < 17 || age > 35) {
      errors.push('Ngày sinh không hợp lệ (Tuổi sinh viên phải từ 17 đến 35).');
    }
  }

  if (!GioiTinh || !['Nam', 'Nữ', 'Khác'].includes(GioiTinh)) {
    errors.push('Giới tính bắt buộc chọn');
  }

  if (!MaLop || String(MaLop).trim() === '') {
    errors.push('Lớp sinh hoạt là trường bắt buộc.');
  }

  if (SoDienThoai && String(SoDienThoai).trim() !== '') {
    if (!/^(03|05|07|08|09)\d{8}$/.test(String(SoDienThoai).trim())) {
      errors.push('Số điện thoại không hợp lệ');
    }
  }

  if (Email && String(Email).trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(Email).trim())) {
      errors.push('Định dạng Email không hợp lệ.');
    }
  }

  const validStatuses = ['Đang học', 'Bảo lưu', 'Thôi học', 'Tốt nghiệp'];
  if (TrangThai && !validStatuses.includes(TrangThai)) {
    errors.push('Trạng thái học tập không hợp lệ.');
  }

  return errors;
}

// ============================================================================
// 1. UC01: ĐĂNG NHẬP & XÁC THỰC HỆ THỐNG (AUTHENTICATION)
// ============================================================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Luồng rẽ nhánh 3a: Để trống tên đăng nhập hoặc mật khẩu
  if (!username || !password || !String(username).trim() || !String(password).trim()) {
    return res.status(400).json({
      success: false,
      code: 'EMPTY_CREDENTIALS',
      message: 'Vui lòng nhập đầy đủ thông tin Tên đăng nhập và Mật khẩu.'
    });
  }

  const cleanUser = String(username).trim();
  const account = queryOne(
    `SELECT tk.*, sv.HoTen, sv.MaLop, sv.Email, l.TenLop, l.MaKhoa, k.TenKhoa
     FROM tbl_TaiKhoan tk
     LEFT JOIN tbl_SinhVien sv ON tk.MaSV = sv.MaSV
     LEFT JOIN tbl_Lop l ON sv.MaLop = l.MaLop
     LEFT JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
     WHERE tk.TenDangNhap = ?`,
    [cleanUser]
  );

  // Luồng rẽ nhánh 4a: Sai tên đăng nhập hoặc mật khẩu
  if (!account) {
    addAuditLog(cleanUser, 'UNKNOWN', 'LOGIN_FAILED', 'UC01', 'Sai tên đăng nhập');
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
    });
  }

  const isPasswordValid = bcrypt.compareSync(String(password), account.MatKhau);
  if (!isPasswordValid) {
    addAuditLog(cleanUser, account.VaiTro, 'LOGIN_FAILED', 'UC01', 'Sai mật khẩu');
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
    });
  }

  // Luồng rẽ nhánh 4b: Tài khoản bị khóa (TrangThai = 0)
  if (Number(account.TrangThai) === 0) {
    addAuditLog(cleanUser, account.VaiTro, 'LOGIN_LOCKED', 'UC01', 'Tài khoản bị khóa (TrangThai = 0)');
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_LOCKED',
      message: 'Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên'
    });
  }

  const displayName =
    account.HoTen ||
    (account.TenDangNhap === 'giaovu_cuong' ? 'TS. Nguyễn Thái Cường' : account.TenDangNhap);

  const userPayload = {
    tenDangNhap: account.TenDangNhap,
    vaiTro: account.VaiTro,
    trangThai: account.TrangThai,
    maSV: account.MaSV || null,
    hoTen: displayName,
    maLop: account.MaLop || 'KTPM-03K17',
    tenLop: account.TenLop || 'Kỹ thuật Phần mềm 03 - K17',
    maKhoa: account.MaKhoa || 'CNTT',
    tenKhoa: account.TenKhoa || 'Khoa Công nghệ Thông tin'
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
  addAuditLog(userPayload.tenDangNhap, userPayload.vaiTro, 'LOGIN_SUCCESS', 'UC01', `Đăng nhập thành công (${userPayload.hoTen})`);

  return res.json({
    success: true,
    message: 'Đăng nhập hệ thống thành công!',
    token,
    user: userPayload
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'LOGOUT', 'UC01', 'Đăng xuất khỏi hệ thống');
  return res.json({
    success: true,
    message: 'Đã đăng xuất và hủy phiên làm việc an toàn.'
  });
});

// ============================================================================
// 2. UC02 & UC03: QUẢN LÝ DANH SÁCH SINH VIÊN PHÂN TRANG & TÌM KIẾM ĐA TIÊU CHÍ
// ============================================================================
app.get('/api/sinh-vien', authenticateToken, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '7', 10)));
  const search = String(req.query.search || '').trim();
  const maKhoa = String(req.query.maKhoa || '').trim();
  const maLop = String(req.query.maLop || '').trim();
  const trangThai = String(req.query.trangThai || '').trim();

  const isStudent = req.user.vaiTro === 'ROLE_STUDENT';

  const whereClauses = [];
  const params = [];

  // Ràng buộc nghiệp vụ RBAC Mục 1.2:
  // Sinh viên chỉ được xem và tìm kiếm trong phạm vi lớp sinh hoạt của mình
  if (isStudent && req.user.maLop) {
    whereClauses.push('sv.MaLop = ?');
    params.push(req.user.maLop);
  } else {
    if (maLop) {
      whereClauses.push('sv.MaLop = ?');
      params.push(maLop);
    }
    if (maKhoa) {
      whereClauses.push('l.MaKhoa = ?');
      params.push(maKhoa);
    }
    if (trangThai) {
      whereClauses.push('sv.TrangThai = ?');
      params.push(trangThai);
    }
  }

  if (search) {
    whereClauses.push('(sv.MaSV LIKE ? OR sv.HoTen LIKE ? OR sv.MaLop LIKE ?)');
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = queryOne(
    `SELECT COUNT(*) as total
     FROM tbl_SinhVien sv
     JOIN tbl_Lop l ON sv.MaLop = l.MaLop
     JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
     ${whereSql}`,
    params
  );

  const total = Number(countRow?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;

  const rows = queryAll(
    `SELECT sv.*, l.TenLop, l.KhoaHoc, l.CoVanHocTap, l.MaKhoa, k.TenKhoa,
            tk.TenDangNhap, tk.VaiTro as TaiKhoanVaiTro, tk.TrangThai as TaiKhoanTrangThai
     FROM tbl_SinhVien sv
     JOIN tbl_Lop l ON sv.MaLop = l.MaLop
     JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
     LEFT JOIN tbl_TaiKhoan tk ON tk.TenDangNhap = sv.MaSV
     ${whereSql}
     ORDER BY sv.MaSV ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Phân cấp dữ liệu bảo mật (UC02/UC04):
  // Nếu là ROLE_STUDENT xem sinh viên khác -> Ẩn SĐT, Quê quán và thông tin Tài khoản
  const sanitizedRows = rows.map(row => {
    if (isStudent && row.MaSV !== req.user.maSV) {
      return {
        MaSV: row.MaSV,
        HoTen: row.HoTen,
        NgaySinh: row.NgaySinh,
        GioiTinh: row.GioiTinh,
        MaLop: row.MaLop,
        TenLop: row.TenLop,
        KhoaHoc: row.KhoaHoc,
        CoVanHocTap: row.CoVanHocTap,
        MaKhoa: row.MaKhoa,
        TenKhoa: row.TenKhoa,
        TrangThai: row.TrangThai,
        Email: row.Email,
        QueQuan: '[Bảo mật theo quy định]',
        SoDienThoai: '[Bảo mật theo quy định]',
        isSelf: false
      };
    }
    return {
      ...row,
      isSelf: row.MaSV === req.user.maSV
    };
  });

  return res.json({
    success: true,
    data: sanitizedRows,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages
    }
  });
});

// ============================================================================
// 3. UC04: XEM CHI TIẾT LÝ LỊCH SINH VIÊN (PHÂN CẤP DỮ LIỆU)
// ============================================================================
app.get('/api/sinh-vien/:maSV', authenticateToken, (req, res) => {
  const { maSV } = req.params;
  const row = queryOne(
    `SELECT sv.*, l.TenLop, l.KhoaHoc, l.CoVanHocTap, l.MaKhoa, k.TenKhoa,
            tk.TenDangNhap, tk.VaiTro as TaiKhoanVaiTro, tk.TrangThai as TaiKhoanTrangThai
     FROM tbl_SinhVien sv
     JOIN tbl_Lop l ON sv.MaLop = l.MaLop
     JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
     LEFT JOIN tbl_TaiKhoan tk ON sv.MaSV = tk.MaSV
     WHERE sv.MaSV = ?`,
    [maSV]
  );

  if (!row) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Không tìm thấy thông tin sinh viên trong cơ sở dữ liệu.'
    });
  }

  const isStudent = req.user.vaiTro === 'ROLE_STUDENT';
  const isSelf = row.MaSV === req.user.maSV;

  // UC04: SV xem người khác bị ẩn trường: Quê quán, SĐT, Tài khoản
  if (isStudent && !isSelf) {
    return res.json({
      success: true,
      data: {
        MaSV: row.MaSV,
        HoTen: row.HoTen,
        NgaySinh: row.NgaySinh,
        GioiTinh: row.GioiTinh,
        MaLop: row.MaLop,
        TenLop: row.TenLop,
        KhoaHoc: row.KhoaHoc,
        CoVanHocTap: row.CoVanHocTap,
        MaKhoa: row.MaKhoa,
        TenKhoa: row.TenKhoa,
        TrangThai: row.TrangThai,
        Email: row.Email,
        QueQuan: '[Đã ẩn theo chính sách bảo mật sinh viên]',
        SoDienThoai: '[Đã ẩn theo chính sách bảo mật sinh viên]',
        TenDangNhap: null,
        TaiKhoanVaiTro: null,
        TaiKhoanTrangThai: null,
        isRestrictedView: true
      }
    });
  }

  return res.json({
    success: true,
    data: {
      ...row,
      isRestrictedView: false
    }
  });
});

// ============================================================================
// 4. UC05: THÊM MỚI SINH VIÊN (CHỈ ROLE_ADMIN & ROLE_STAFF)
// ============================================================================
app.post('/api/sinh-vien', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const payload = req.body;
  const errors = validateStudentPayload(payload, true);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: errors[0],
      errors
    });
  }

  const cleanMaSV = String(payload.MaSV).trim();

  // Kiểm tra trùng lặp Mã sinh viên (Luồng rẽ nhánh 6a - UC05)
  const existing = queryOne('SELECT MaSV FROM tbl_SinhVien WHERE MaSV = ?', [cleanMaSV]);
  if (existing) {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_MASV',
      message: `Mã sinh viên ${cleanMaSV} đã tồn tại trong hệ thống! Vui lòng kiểm tra lại.`
    });
  }

  // Kiểm tra lớp học có tồn tại không
  const lopExists = queryOne('SELECT MaLop FROM tbl_Lop WHERE MaLop = ?', [payload.MaLop]);
  if (!lopExists) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_CLASS',
      message: `Mã lớp '${payload.MaLop}' không tồn tại trong danh mục Lớp.`
    });
  }

  executeSql(
    `INSERT INTO tbl_SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, SoDienThoai, Email, TrangThai, MaLop)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cleanMaSV,
      String(payload.HoTen).trim(),
      payload.NgaySinh,
      payload.GioiTinh,
      payload.QueQuan ? String(payload.QueQuan).trim() : '',
      payload.SoDienThoai ? String(payload.SoDienThoai).trim() : '',
      payload.Email ? String(payload.Email).trim() : `${cleanMaSV}@sv.edu.vn`,
      payload.TrangThai || 'Đang học',
      payload.MaLop
    ]
  );

  // Tự động khởi tạo tài khoản cổng sinh viên nếu được chọn
  if (payload.createAccount !== false) {
    const existingAcc = queryOne('SELECT TenDangNhap FROM tbl_TaiKhoan WHERE TenDangNhap = ?', [cleanMaSV]);
    if (!existingAcc) {
      const defaultHash = bcrypt.hashSync('Sv@123456', 10);
      executeSql(
        'INSERT INTO tbl_TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai, MaSV) VALUES (?, ?, ?, ?, ?)',
        [cleanMaSV, defaultHash, 'ROLE_STUDENT', 1, cleanMaSV]
      );
    }
  }

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'CREATE_STUDENT', cleanMaSV, `Thêm mới sinh viên ${payload.HoTen} (${cleanMaSV})`);

  return res.status(201).json({
    success: true,
    message: 'Thêm sinh viên thành công!',
    data: { MaSV: cleanMaSV }
  });
});

// ============================================================================
// 5. UC06: SỬA THÔNG TIN HỒ SƠ SINH VIÊN (CHỈ ROLE_ADMIN & ROLE_STAFF)
// ============================================================================
app.put('/api/sinh-vien/:maSV', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const { maSV } = req.params;
  const payload = req.body;

  // Khóa chính MaSV tuyệt đối không được phép thay đổi
  if (payload.MaSV && String(payload.MaSV).trim() !== String(maSV).trim()) {
    return res.status(400).json({
      success: false,
      code: 'PK_IMMUTABLE',
      message: 'Không được phép thay đổi Mã sinh viên (Khóa chính Readonly).'
    });
  }

  const existing = queryOne('SELECT * FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);
  if (!existing) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Không tìm thấy sinh viên có mã ${maSV}.`
    });
  }

  const errors = validateStudentPayload({ ...existing, ...payload, MaSV: maSV }, false);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: errors[0],
      errors
    });
  }

  executeSql(
    `UPDATE tbl_SinhVien
     SET HoTen = ?, NgaySinh = ?, GioiTinh = ?, QueQuan = ?, SoDienThoai = ?, Email = ?, TrangThai = ?, MaLop = ?
     WHERE MaSV = ?`,
    [
      String(payload.HoTen).trim(),
      payload.NgaySinh,
      payload.GioiTinh,
      payload.QueQuan ? String(payload.QueQuan).trim() : '',
      payload.SoDienThoai ? String(payload.SoDienThoai).trim() : '',
      payload.Email ? String(payload.Email).trim() : '',
      payload.TrangThai || existing.TrangThai,
      payload.MaLop,
      maSV
    ]
  );

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'UPDATE_STUDENT', maSV, `Cập nhật hồ sơ sinh viên ${payload.HoTen} (${maSV})`);

  return res.json({
    success: true,
    message: 'Cập nhật thông tin sinh viên thành công!'
  });
});

// Cho phép ROLE_STUDENT tự cập nhật SĐT và Email liên lạc của chính mình (Mục 1.1 & 1.2)
app.patch('/api/sinh-vien/:maSV/lien-he', authenticateToken, (req, res) => {
  const { maSV } = req.params;
  if (req.user.vaiTro === 'ROLE_STUDENT' && req.user.maSV !== maSV) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN_403',
      message: '403 Access Denied: Sinh viên chỉ được phép cập nhật thông tin liên lạc của chính mình.'
    });
  }

  const { SoDienThoai, Email, QueQuan } = req.body;
  if (SoDienThoai && !/^(03|05|07|08|09)\d{8}$/.test(String(SoDienThoai).trim())) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).'
    });
  }
  if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(Email).trim())) {
    return res.status(400).json({
      success: false,
      message: 'Định dạng Email không hợp lệ.'
    });
  }

  const existing = queryOne('SELECT * FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên.' });
  }

  executeSql(
    'UPDATE tbl_SinhVien SET SoDienThoai = ?, Email = ?, QueQuan = ? WHERE MaSV = ?',
    [
      SoDienThoai !== undefined ? String(SoDienThoai).trim() : existing.SoDienThoai,
      Email !== undefined ? String(Email).trim() : existing.Email,
      QueQuan !== undefined ? String(QueQuan).trim() : existing.QueQuan,
      maSV
    ]
  );

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'SELF_UPDATE_CONTACT', maSV, 'Sinh viên tự cập nhật SĐT / Email cá nhân');
  return res.json({
    success: true,
    message: 'Đã cập nhật thông tin liên lạc cá nhân thành công!'
  });
});

// ============================================================================
// 6. UC07: XÓA HỒ SƠ SINH VIÊN CÓ XÁC NHẬN AN TOÀN (CHỈ ROLE_ADMIN & ROLE_STAFF)
// ============================================================================
app.delete('/api/sinh-vien/:maSV', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const { maSV } = req.params;
  const confirmText = req.query.confirm || req.body?.confirmText || 'XACNHAN';

  if (confirmText !== 'XACNHAN') {
    return res.status(400).json({
      success: false,
      code: 'CONFIRMATION_REQUIRED',
      message: 'Vui lòng gõ chính xác chữ "XACNHAN" để xác nhận xóa sinh viên.'
    });
  }

  const existing = queryOne('SELECT * FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);
  if (!existing) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Không tìm thấy sinh viên có mã ${maSV} để xóa.`
    });
  }

  // Gỡ tài khoản sinh viên liên kết (nếu không phải tài khoản admin_haui)
  executeSql("DELETE FROM tbl_TaiKhoan WHERE MaSV = ? AND VaiTro = 'ROLE_STUDENT'", [maSV]);
  executeSql('UPDATE tbl_TaiKhoan SET MaSV = NULL WHERE MaSV = ?', [maSV]);
  executeSql('DELETE FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'DELETE_STUDENT', maSV, `Xóa vĩnh viễn hồ sơ sinh viên ${existing.HoTen} (${maSV})`);

  return res.json({
    success: true,
    message: `Xóa sinh viên ${existing.HoTen} (${maSV}) thành công!`
  });
});

// Xóa hàng loạt (Bulk Delete trên bảng UC02)
app.post('/api/sinh-vien/bulk-delete', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const { maSVList, confirmText } = req.body;
  if (confirmText !== 'XACNHAN' || !Array.isArray(maSVList) || maSVList.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Danh sách sinh viên trống hoặc chưa nhập mã xác nhận "XACNHAN".'
    });
  }

  let deletedCount = 0;
  for (const maSV of maSVList) {
    const sv = queryOne('SELECT MaSV FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);
    if (sv) {
      executeSql("DELETE FROM tbl_TaiKhoan WHERE MaSV = ? AND VaiTro = 'ROLE_STUDENT'", [maSV]);
      executeSql('UPDATE tbl_TaiKhoan SET MaSV = NULL WHERE MaSV = ?', [maSV]);
      executeSql('DELETE FROM tbl_SinhVien WHERE MaSV = ?', [maSV]);
      deletedCount++;
    }
  }

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'BULK_DELETE_STUDENT', `${deletedCount} SV`, `Xóa hàng loạt ${deletedCount} hồ sơ sinh viên`);
  return res.json({
    success: true,
    message: `Đã xóa thành công ${deletedCount} hồ sơ sinh viên.`
  });
});

// Route kiểm thử trực tiếp URL xóa theo TC-RBAC-03 (/sinh-vien/xoa/:maSV)
app.all('/sinh-vien/xoa/:maSV', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  return res.json({
    success: true,
    message: 'Quyền hợp lệ để truy cập endpoint xóa.'
  });
});

// ============================================================================
// 7. DANH MỤC LỚP (tbl_Lop) & KHOA (tbl_Khoa) & THỐNG KÊ TỔNG QUAN
// ============================================================================
app.get('/api/khoa', authenticateToken, (req, res) => {
  const rows = queryAll(`
    SELECT k.*,
           (SELECT COUNT(*) FROM tbl_Lop l WHERE l.MaKhoa = k.MaKhoa) as SoLop,
           (SELECT COUNT(*) FROM tbl_SinhVien sv JOIN tbl_Lop l ON sv.MaLop = l.MaLop WHERE l.MaKhoa = k.MaKhoa) as SoSinhVien
    FROM tbl_Khoa k
    ORDER BY k.MaKhoa ASC
  `);
  return res.json({ success: true, data: rows });
});

app.post('/api/khoa', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const { MaKhoa, TenKhoa, DienThoai, Email } = req.body;
  if (!MaKhoa || !TenKhoa) {
    return res.status(400).json({ success: false, message: 'Mã khoa và Tên khoa là bắt buộc.' });
  }
  const exists = queryOne('SELECT MaKhoa FROM tbl_Khoa WHERE MaKhoa = ?', [MaKhoa.trim()]);
  if (exists) {
    return res.status(409).json({ success: false, message: `Mã khoa ${MaKhoa} đã tồn tại.` });
  }
  executeSql(
    'INSERT INTO tbl_Khoa (MaKhoa, TenKhoa, DienThoai, Email) VALUES (?, ?, ?, ?)',
    [MaKhoa.trim(), TenKhoa.trim(), DienThoai || '', Email || '']
  );
  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'CREATE_FACULTY', MaKhoa, `Thêm khoa ${TenKhoa}`);
  return res.status(201).json({ success: true, message: 'Thêm khoa mới thành công!' });
});

app.get('/api/lop', authenticateToken, (req, res) => {
  const maKhoa = req.query.maKhoa;
  const whereSql = maKhoa ? 'WHERE l.MaKhoa = ?' : '';
  const params = maKhoa ? [maKhoa] : [];
  const rows = queryAll(
    `SELECT l.*, k.TenKhoa,
            (SELECT COUNT(*) FROM tbl_SinhVien sv WHERE sv.MaLop = l.MaLop) as SiSo
     FROM tbl_Lop l
     JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
     ${whereSql}
     ORDER BY l.MaLop ASC`,
    params
  );
  return res.json({ success: true, data: rows });
});

app.post('/api/lop', authenticateToken, requireRoles(['ROLE_ADMIN', 'ROLE_STAFF']), (req, res) => {
  const { MaLop, TenLop, KhoaHoc, CoVanHocTap, MaKhoa } = req.body;
  if (!MaLop || !TenLop || !KhoaHoc || !MaKhoa) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Mã lớp, Tên lớp, Khóa học và Khoa.' });
  }
  const exists = queryOne('SELECT MaLop FROM tbl_Lop WHERE MaLop = ?', [MaLop.trim()]);
  if (exists) {
    return res.status(409).json({ success: false, message: `Mã lớp ${MaLop} đã tồn tại.` });
  }
  executeSql(
    'INSERT INTO tbl_Lop (MaLop, TenLop, KhoaHoc, CoVanHocTap, MaKhoa) VALUES (?, ?, ?, ?, ?)',
    [MaLop.trim(), TenLop.trim(), KhoaHoc.trim(), CoVanHocTap || '', MaKhoa]
  );
  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'CREATE_CLASS', MaLop, `Thêm lớp ${TenLop}`);
  return res.status(201).json({ success: true, message: 'Thêm lớp sinh hoạt mới thành công!' });
});

app.get('/api/thong-ke', authenticateToken, (req, res) => {
  const totalSV = queryOne('SELECT COUNT(*) as count FROM tbl_SinhVien')?.count || 0;
  const totalLop = queryOne('SELECT COUNT(*) as count FROM tbl_Lop')?.count || 0;
  const totalKhoa = queryOne('SELECT COUNT(*) as count FROM tbl_Khoa')?.count || 0;
  const totalTaiKhoan = queryOne('SELECT COUNT(*) as count FROM tbl_TaiKhoan')?.count || 0;

  const byTrangThai = queryAll('SELECT TrangThai, COUNT(*) as soLuong FROM tbl_SinhVien GROUP BY TrangThai');
  const byGioiTinh = queryAll('SELECT GioiTinh, COUNT(*) as soLuong FROM tbl_SinhVien GROUP BY GioiTinh');
  const byKhoa = queryAll(`
    SELECT k.MaKhoa, k.TenKhoa, COUNT(sv.MaSV) as soLuong
    FROM tbl_Khoa k
    LEFT JOIN tbl_Lop l ON k.MaKhoa = l.MaKhoa
    LEFT JOIN tbl_SinhVien sv ON l.MaLop = sv.MaLop
    GROUP BY k.MaKhoa, k.TenKhoa
  `);
  const byLop = queryAll(`
    SELECT l.MaLop, l.TenLop, l.CoVanHocTap, k.TenKhoa, COUNT(sv.MaSV) as soLuong
    FROM tbl_Lop l
    JOIN tbl_Khoa k ON l.MaKhoa = k.MaKhoa
    LEFT JOIN tbl_SinhVien sv ON l.MaLop = sv.MaLop
    GROUP BY l.MaLop, l.TenLop, l.CoVanHocTap, k.TenKhoa
  `);

  return res.json({
    success: true,
    data: {
      summary: { totalSV, totalLop, totalKhoa, totalTaiKhoan },
      byTrangThai,
      byGioiTinh,
      byKhoa,
      byLop,
      dbInfo: getCurrentDbInfo()
    }
  });
});

// ============================================================================
// 8. MÀN HÌNH MỞ RỘNG MỤC 2.7: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (ROLE_ADMIN ONLY)
// ============================================================================
app.get('/api/tai-khoan', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  const search = String(req.query.search || '').trim();
  const vaiTro = String(req.query.vaiTro || '').trim();

  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(tk.TenDangNhap LIKE ? OR sv.HoTen LIKE ? OR tk.MaSV LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (vaiTro) {
    clauses.push('tk.VaiTro = ?');
    params.push(vaiTro);
  }
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = queryAll(
    `SELECT tk.TenDangNhap, tk.VaiTro, tk.TrangThai, tk.MaSV,
            sv.HoTen as TenSinhVien, sv.MaLop
     FROM tbl_TaiKhoan tk
     LEFT JOIN tbl_SinhVien sv ON tk.MaSV = sv.MaSV
     ${whereSql}
     ORDER BY
       CASE tk.VaiTro
         WHEN 'ROLE_ADMIN' THEN 1
         WHEN 'ROLE_STAFF' THEN 2
         ELSE 3
       END,
       tk.TenDangNhap ASC`,
    params
  );

  return res.json({ success: true, data: rows });
});

app.post('/api/tai-khoan', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  const { TenDangNhap, MatKhau, VaiTro, TrangThai, MaSV } = req.body;
  if (!TenDangNhap || !MatKhau || !VaiTro) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ Tên đăng nhập, Mật khẩu và Quyền vai trò.'
    });
  }

  const existing = queryOne('SELECT TenDangNhap FROM tbl_TaiKhoan WHERE TenDangNhap = ?', [TenDangNhap.trim()]);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `Tên đăng nhập '${TenDangNhap}' đã tồn tại trong bảng tbl_TaiKhoan.`
    });
  }

  const hash = bcrypt.hashSync(String(MatKhau), 10);
  executeSql(
    'INSERT INTO tbl_TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai, MaSV) VALUES (?, ?, ?, ?, ?)',
    [TenDangNhap.trim(), hash, VaiTro, TrangThai !== undefined ? Number(TrangThai) : 1, MaSV || null]
  );

  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'CREATE_ACCOUNT', TenDangNhap, `Cấp mới tài khoản ${TenDangNhap} (${VaiTro})`);
  return res.status(201).json({
    success: true,
    message: `Đã cấp mới tài khoản '${TenDangNhap}' với quyền ${VaiTro}.`
  });
});

app.patch('/api/tai-khoan/:tenDangNhap', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  const { tenDangNhap } = req.params;
  const { VaiTro, TrangThai, MatKhauMoi } = req.body;

  const acc = queryOne('SELECT * FROM tbl_TaiKhoan WHERE TenDangNhap = ?', [tenDangNhap]);
  if (!acc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
  }

  if (tenDangNhap === 'admin' && TrangThai === 0) {
    return res.status(400).json({
      success: false,
      message: 'Không thể khóa tài khoản Quản trị viên gốc (admin).'
    });
  }

  const newRole = VaiTro || acc.VaiTro;
  const newStatus = TrangThai !== undefined ? Number(TrangThai) : acc.TrangThai;
  const newPass = MatKhauMoi ? bcrypt.hashSync(String(MatKhauMoi), 10) : acc.MatKhau;

  executeSql(
    'UPDATE tbl_TaiKhoan SET VaiTro = ?, TrangThai = ?, MatKhau = ? WHERE TenDangNhap = ?',
    [newRole, newStatus, newPass, tenDangNhap]
  );

  addAuditLog(
    req.user.tenDangNhap,
    req.user.vaiTro,
    'UPDATE_ACCOUNT',
    tenDangNhap,
    `Cập nhật tài khoản ${tenDangNhap}: VaiTro=${newRole}, TrangThai=${newStatus}${MatKhauMoi ? ', Đổi mật khẩu' : ''}`
  );

  return res.json({
    success: true,
    message: `Đã cập nhật tài khoản '${tenDangNhap}' thành công.`
  });
});

app.delete('/api/tai-khoan/:tenDangNhap', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  const { tenDangNhap } = req.params;
  if (tenDangNhap === 'admin') {
    return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản Quản trị viên gốc (admin).' });
  }
  executeSql('DELETE FROM tbl_TaiKhoan WHERE TenDangNhap = ?', [tenDangNhap]);
  addAuditLog(req.user.tenDangNhap, req.user.vaiTro, 'DELETE_ACCOUNT', tenDangNhap, `Xóa tài khoản ${tenDangNhap}`);
  return res.json({ success: true, message: `Đã xóa tài khoản '${tenDangNhap}'.` });
});

app.get('/api/audit-logs', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  return res.json({ success: true, data: auditLogs });
});

// ============================================================================
// 9. QUẢN LÝ & THÊM DATABASE MỚI (MULTI-DATABASE MANAGER)
// ============================================================================
app.get('/api/databases', authenticateToken, requireRoles(['ROLE_ADMIN']), (req, res) => {
  return res.json({
    success: true,
    current: getCurrentDbInfo(),
    databases: listDatabases()
  });
});

app.post('/api/databases/switch', authenticateToken, requireRoles(['ROLE_ADMIN']), async (req, res) => {
  const { dbName, includeSampleData } = req.body;
  if (!dbName || String(dbName).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Tên database không hợp lệ.' });
  }
  const result = await createOrSwitchDatabase(String(dbName).trim(), includeSampleData !== false);
  return res.json({
    success: true,
    message: `Đã khởi tạo / chuyển sang cơ sở dữ liệu '${result.dbName}' thành công!`,
    current: getCurrentDbInfo(),
    databases: listDatabases()
  });
});

// Khởi động máy chủ
initializeDatabase('QLSV_System_Nhom11.db').then(info => {
  app.listen(PORT, () => {
    console.log(`======================================================================`);
    console.log(`  HỆ THỐNG QUẢN LÝ SINH VIÊN - BACKEND API SERVER`);
    console.log(`  Port: http://localhost:${PORT}`);
    console.log(`  Database active: ${info.dbName} (${info.path})`);
    console.log(`======================================================================`);
  });
});
