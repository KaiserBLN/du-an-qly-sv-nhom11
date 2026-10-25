-- =============================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU HỆ THỐNG QUẢN LÝ SINH VIÊN
-- Hệ quản trị CSDL: SQLite 3 (Chạy trực tiếp trên Localhost)
-- Học phần: Thực tập cơ sở ngành (IT6040003) - Nhóm 11 (KTPM-03K17)
-- =============================================================================

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
    GioiTinh     TEXT NOT NULL CHECK (GioiTinh IN ('Nam', 'Nữ', 'Khác')),
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
    VaiTro       TEXT NOT NULL CHECK (VaiTro IN ('ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_STUDENT')),
    TrangThai    INTEGER NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    MaSV         TEXT,
    FOREIGN KEY (MaSV) REFERENCES tbl_SinhVien(MaSV) ON UPDATE CASCADE ON DELETE SET NULL
);
