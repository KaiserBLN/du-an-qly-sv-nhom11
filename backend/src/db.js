import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../database/instances');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let SQL = null;
let currentDbName = 'QLSV_System_Nhom11.db';
let db = null;

// Audit log in-memory + persisted in table
export const auditLogs = [];

export function addAuditLog(actor, role, action, target, detail) {
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    actor,
    role,
    action,
    target,
    detail
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 200) auditLogs.pop();
}

export function getDbPath(dbFileName = currentDbName) {
  const safeName = path.basename(dbFileName.endsWith('.db') ? dbFileName : `${dbFileName}.db`);
  return path.join(DATA_DIR, safeName);
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(currentDbName), buffer);
}

export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function executeSql(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

export function seedSchemaAndData(databaseInstance, withSampleData = true) {
  databaseInstance.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tbl_Khoa (
      MaKhoa      TEXT NOT NULL PRIMARY KEY,
      TenKhoa     TEXT NOT NULL,
      DienThoai   TEXT,
      Email       TEXT
    );

    CREATE TABLE IF NOT EXISTS tbl_Lop (
      MaLop        TEXT NOT NULL PRIMARY KEY,
      TenLop       TEXT NOT NULL,
      KhoaHoc      TEXT NOT NULL,
      CoVanHocTap  TEXT,
      MaKhoa       TEXT NOT NULL,
      FOREIGN KEY (MaKhoa) REFERENCES tbl_Khoa(MaKhoa) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS tbl_SinhVien (
      MaSV         TEXT NOT NULL PRIMARY KEY,
      HoTen        TEXT NOT NULL,
      NgaySinh     TEXT NOT NULL,
      GioiTinh     TEXT NOT NULL,
      QueQuan      TEXT,
      SoDienThoai  TEXT,
      Email        TEXT,
      TrangThai    TEXT NOT NULL DEFAULT 'Đang học',
      MaLop        TEXT NOT NULL,
      FOREIGN KEY (MaLop) REFERENCES tbl_Lop(MaLop) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS tbl_TaiKhoan (
      TenDangNhap  TEXT NOT NULL PRIMARY KEY,
      MatKhau      TEXT NOT NULL,
      VaiTro       TEXT NOT NULL,
      TrangThai    INTEGER NOT NULL DEFAULT 1,
      MaSV         TEXT,
      FOREIGN KEY (MaSV) REFERENCES tbl_SinhVien(MaSV) ON UPDATE CASCADE ON DELETE SET NULL
    );
  `);

  const existingCount = (() => {
    const stmt = databaseInstance.prepare('SELECT COUNT(*) as total FROM tbl_Khoa');
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return Number(row.total || 0);
  })();

  if (existingCount > 0 || !withSampleData) {
    return;
  }

  const faculties = [
    ['CNTT', 'Khoa Công nghệ Thông tin', '02437655121', 'cntt@edu.vn'],
    ['CK', 'Khoa Cơ khí Động lực', '02437655122', 'cokhi@edu.vn'],
    ['DTVT', 'Khoa Điện tử Viễn thông', '02437655123', 'dtvt@edu.vn'],
    ['KT', 'Khoa Kinh tế & Quản trị', '02437655124', 'kinhte@edu.vn']
  ];
  for (const f of faculties) {
    databaseInstance.run('INSERT INTO tbl_Khoa (MaKhoa, TenKhoa, DienThoai, Email) VALUES (?, ?, ?, ?)', f);
  }

  const classes = [
    ['KTPM-03K17', 'Kỹ thuật Phần mềm 03 - K17', 'Khóa 17 (2022 - 2026)', 'TS. Nguyễn Thái Cường', 'CNTT'],
    ['HTTT-01K17', 'Hệ thống Thông tin 01 - K17', 'Khóa 17 (2022 - 2026)', 'TS. Nguyễn Thái Cường', 'CNTT'],
    ['KHMT-02K17', 'Khoa học Máy tính 02 - K17', 'Khóa 17 (2022 - 2026)', 'PGS.TS. Trần Quang Huy', 'CNTT'],
    ['CNTT-04K17', 'Công nghệ Thông tin 04 - K17', 'Khóa 17 (2022 - 2026)', 'ThS. Lê Minh Tuấn', 'CNTT'],
    ['CKCT-01K17', 'Cơ khí Chế tạo máy 01 - K17', 'Khóa 17 (2022 - 2026)', 'TS. Phạm Văn Đông', 'CK'],
    ['DTVT-02K17', 'Điện tử Viễn thông 02 - K17', 'Khóa 17 (2022 - 2026)', 'TS. Vũ Hoàng Nam', 'DTVT'],
    ['KTDN-01K17', 'Kế toán Doanh nghiệp 01 - K17', 'Khóa 17 (2022 - 2026)', 'TS. Nguyễn Thu Hương', 'KT']
  ];
  for (const c of classes) {
    databaseInstance.run('INSERT INTO tbl_Lop (MaLop, TenLop, KhoaHoc, CoVanHocTap, MaKhoa) VALUES (?, ?, ?, ?, ?)', c);
  }

  const students = [
    ['2026601001', 'Đỗ Đức Cảnh', '2006-08-11', 'Nam', 'Bắc Từ Liêm, TP. Hà Nội', '0987654321', 'doduccanh@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601002', 'Nguyễn Đức Thái', '2006-04-15', 'Nam', 'Nam Trực, Nam Định', '0912345678', 'nguyenducthai@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601003', 'Nguyễn Tuấn Linh', '2006-09-20', 'Nam', 'Đông Hưng, Thái Bình', '0934567890', 'nguyentuanlinh@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601004', 'Hoàng Duy Đức', '2006-12-05', 'Nam', 'Yên Phong, Bắc Ninh', '0978123456', 'hoangduyduc@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601005', 'Trần Thị Lan', '2006-02-18', 'Nữ', 'Hoài Đức, TP. Hà Nội', '0965432109', 'tranthilan@edu.vn', 'Đang học', 'HTTT-01K17'],
    ['2026601006', 'Lê Văn Hùng', '2006-10-22', 'Nam', 'TP. Hải Dương, Hải Dương', '0943210987', 'levanhung@edu.vn', 'Đang học', 'KHMT-02K17'],
    ['2026601007', 'Phạm Quỳnh Chi', '2006-07-30', 'Nữ', 'TP. Vinh, Nghệ An', '0921098765', 'phamquynhchi@edu.vn', 'Đang học', 'CNTT-04K17'],
    ['2026601008', 'Vũ Minh Quân', '2006-01-12', 'Nam', 'Cầu Giấy, TP. Hà Nội', '0981112233', 'vuminhquan@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601009', 'Đặng Thu Hà', '2006-03-25', 'Nữ', 'TP. Hạ Long, Quảng Ninh', '0972223344', 'dangthuha@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601010', 'Bùi Quốc Khánh', '2006-09-02', 'Nam', 'Kiến An, TP. Hải Phòng', '0963334455', 'buiquockhanh@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601011', 'Ngô Phương Anh', '2006-11-19', 'Nữ', 'Từ Sơn, Bắc Ninh', '0914445566', 'ngophuonganh@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601012', 'Dương Hoàng Nam', '2006-05-08', 'Nam', 'TP. Thái Nguyên', '0935556677', 'duonghoangnam@edu.vn', 'Bảo lưu', 'KTPM-03K17'],
    ['2026601013', 'Lý Thanh Tâm', '2006-06-14', 'Nữ', 'Phủ Lý, Hà Nam', '0946667788', 'lythanhtam@edu.vn', 'Đang học', 'HTTT-01K17'],
    ['2026601014', 'Trịnh Đình Trọng', '2006-08-27', 'Nam', 'Gia Lâm, TP. Hà Nội', '0987778899', 'trinhdinhtrong@edu.vn', 'Đang học', 'KHMT-02K17'],
    ['2026601015', 'Mai Tuyết Nhung', '2006-12-31', 'Nữ', 'TP. Ninh Bình', '0978889900', 'maituyetnhung@edu.vn', 'Đang học', 'CNTT-04K17'],
    ['2026601016', 'Phan Văn Đức', '2005-04-10', 'Nam', 'Yên Thành, Nghệ An', '0969990011', 'phanvanduc@edu.vn', 'Tốt nghiệp', 'CKCT-01K17'],
    ['2026601017', 'Hồ Ngọc Hà', '2006-07-07', 'Nữ', 'Đông Anh, TP. Hà Nội', '0910001122', 'hongocha@edu.vn', 'Đang học', 'DTVT-02K17'],
    ['2026601018', 'Nguyễn Quang Hải', '2006-04-12', 'Nam', 'Đông Anh, TP. Hà Nội', '0982223344', 'nguyenquanghai@edu.vn', 'Đang học', 'KTPM-03K17'],
    ['2026601019', 'Phạm Tuấn Hải', '2006-05-19', 'Nam', 'Phủ Lý, Hà Nam', '0973334455', 'phamtuanhai@edu.vn', 'Đang học', 'HTTT-01K17'],
    ['2026601020', 'Đoàn Văn Hậu', '2006-04-19', 'Nam', 'Hưng Hà, Thái Bình', '0964445566', 'doanvanhau@edu.vn', 'Đang học', 'KHMT-02K17'],
    ['2026601021', 'Hoàng Thị Loan', '2006-02-06', 'Nữ', 'Thanh Oai, TP. Hà Nội', '0915556677', 'hoangthiloan@edu.vn', 'Đang học', 'CNTT-04K17'],
    ['2026601022', 'Lương Xuân Trường', '2005-04-28', 'Nam', 'TP. Tuyên Quang', '0936667788', 'luongxuantruong@edu.vn', 'Thôi học', 'CKCT-01K17'],
    ['2026601023', 'Nguyễn Tiến Linh', '2006-10-20', 'Nam', 'Cẩm Giàng, Hải Dương', '0947778899', 'nguyentienlinh@edu.vn', 'Đang học', 'DTVT-02K17'],
    ['2026601024', 'Trần Minh Vương', '2006-03-28', 'Nam', 'Thái Thụy, Thái Bình', '0988889900', 'tranminhvuong@edu.vn', 'Đang học', 'KTDN-01K17'],
    ['2026601025', 'Lê Thị Thanh Nhã', '2006-09-25', 'Nữ', 'Thường Tín, TP. Hà Nội', '0979990011', 'lethithanhnha@edu.vn', 'Đang học', 'KTPM-03K17']
  ];

  for (const s of students) {
    databaseInstance.run(
      'INSERT INTO tbl_SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, SoDienThoai, Email, TrangThai, MaLop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      s
    );
  }

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const staffHash = bcrypt.hashSync('Staff@123', 10);
  const studentHash = bcrypt.hashSync('Sv@123456', 10);

  const accounts = [
    ['admin', adminHash, 'ROLE_ADMIN', 1, '2026601001'],
    ['giaovu_cuong', staffHash, 'ROLE_STAFF', 1, null],
    ['giaovu_thai', staffHash, 'ROLE_STAFF', 1, '2026601002'],
    ['2026601001', studentHash, 'ROLE_STUDENT', 1, '2026601001'],
    ['2026601002', studentHash, 'ROLE_STUDENT', 1, '2026601002'],
    ['2026601003', studentHash, 'ROLE_STUDENT', 1, '2026601003'],
    ['2026601004', studentHash, 'ROLE_STUDENT', 0, '2026601004'],
    ['2026601005', studentHash, 'ROLE_STUDENT', 1, '2026601005']
  ];

  for (const acc of accounts) {
    databaseInstance.run(
      'INSERT INTO tbl_TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai, MaSV) VALUES (?, ?, ?, ?, ?)',
      acc
    );
  }
}

export async function initializeDatabase(dbFileName = 'QLSV_System_Nhom11.db') {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  currentDbName = dbFileName.endsWith('.db') ? dbFileName : `${dbFileName}.db`;
  const targetPath = getDbPath(currentDbName);

  if (fs.existsSync(targetPath)) {
    const filebuffer = fs.readFileSync(targetPath);
    db = new SQL.Database(filebuffer);
    seedSchemaAndData(db, false);
  } else {
    db = new SQL.Database();
    seedSchemaAndData(db, true);
    saveDatabase();
  }

  // Đảm bảo dữ liệu hiện hành sạch hoàn toàn tên trường cũ và cập nhật giảng viên
  db.run("UPDATE tbl_Lop SET CoVanHocTap = 'TS. Nguyễn Thái Cường' WHERE CoVanHocTap LIKE '%Nguyễn Thị Mỹ Bình%'");
  db.run("UPDATE tbl_Khoa SET TenKhoa = 'Khoa Công nghệ Thông tin', Email = 'cntt@edu.vn' WHERE MaKhoa = 'CNTT'");
  db.run("UPDATE tbl_Khoa SET TenKhoa = 'Khoa Cơ khí Động lực', Email = 'cokhi@edu.vn' WHERE MaKhoa = 'CK'");
  db.run("UPDATE tbl_Khoa SET Email = 'dtvt@edu.vn' WHERE MaKhoa = 'DTVT'");
  db.run("UPDATE tbl_Khoa SET Email = 'kinhte@edu.vn' WHERE MaKhoa = 'KT'");
  db.run("UPDATE tbl_SinhVien SET Email = REPLACE(Email, '@haui.edu.vn', '@edu.vn')");
  db.run("UPDATE tbl_SinhVien SET Email = REPLACE(Email, '@sv.haui.edu.vn', '@sv.edu.vn')");
  db.run("UPDATE tbl_TaiKhoan SET TenDangNhap = 'admin' WHERE TenDangNhap = 'admin_haui'");
  db.run("UPDATE tbl_TaiKhoan SET TenDangNhap = 'giaovu_cuong' WHERE TenDangNhap = 'giaovu_binh'");
  saveDatabase();

  addAuditLog('SYSTEM', 'ROLE_ADMIN', 'INIT_DB', currentDbName, `Khởi tạo kết nối CSDL ${currentDbName} thành công`);
  return { dbName: currentDbName, path: targetPath };
}

export async function createOrSwitchDatabase(newDbName, includeSampleData = true) {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  const cleanName = path.basename(newDbName.replace(/[^a-zA-Z0-9_-]/g, '_')) + '.db';
  const targetPath = getDbPath(cleanName);

  if (fs.existsSync(targetPath)) {
    const filebuffer = fs.readFileSync(targetPath);
    db = new SQL.Database(filebuffer);
    seedSchemaAndData(db, false);
  } else {
    db = new SQL.Database();
    seedSchemaAndData(db, includeSampleData);
  }

  currentDbName = cleanName;
  saveDatabase();
  addAuditLog('ADMIN', 'ROLE_ADMIN', 'SWITCH_DB', currentDbName, `Chuyển đổi / Tạo mới CSDL: ${currentDbName}`);
  return { dbName: currentDbName, path: targetPath };
}

export function listDatabases() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.db'));
  return files.map(f => {
    const stat = fs.statSync(path.join(DATA_DIR, f));
    return {
      name: f,
      active: f === currentDbName,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      fullPath: path.join(DATA_DIR, f)
    };
  });
}

export function getCurrentDbInfo() {
  return {
    activeDb: currentDbName,
    fullPath: getDbPath(currentDbName),
    engine: 'SQLite 3 (Multi-DB Adapter Ready for SQL Server & MySQL)',
    tables: ['tbl_Khoa', 'tbl_Lop', 'tbl_SinhVien', 'tbl_TaiKhoan']
  };
}
