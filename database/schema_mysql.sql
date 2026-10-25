-- =============================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU HỆ THỐNG QUẢN LÝ SINH VIÊN
-- Hệ quản trị CSDL: MySQL / MariaDB (XAMPP, MySQL Workbench)
-- Học phần: Thực tập cơ sở ngành (IT6040003) - Nhóm 11 (KTPM-03K17)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS QLSV_System_Nhom11
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE QLSV_System_Nhom11;

DROP TABLE IF EXISTS tbl_TaiKhoan;
DROP TABLE IF EXISTS tbl_SinhVien;
DROP TABLE IF EXISTS tbl_Lop;
DROP TABLE IF EXISTS tbl_Khoa;

-- 1. Bảng tbl_Khoa
CREATE TABLE tbl_Khoa (
    MaKhoa      VARCHAR(20)  NOT NULL PRIMARY KEY,
    TenKhoa     VARCHAR(100) NOT NULL,
    DienThoai   VARCHAR(15)  NULL,
    Email       VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng tbl_Lop
CREATE TABLE tbl_Lop (
    MaLop        VARCHAR(20)  NOT NULL PRIMARY KEY,
    TenLop       VARCHAR(100) NOT NULL,
    KhoaHoc      VARCHAR(20)  NOT NULL,
    CoVanHocTap  VARCHAR(100) NULL,
    MaKhoa       VARCHAR(20)  NOT NULL,
    CONSTRAINT FK_Lop_Khoa FOREIGN KEY (MaKhoa) REFERENCES tbl_Khoa(MaKhoa)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng tbl_SinhVien
CREATE TABLE tbl_SinhVien (
    MaSV         VARCHAR(20)  NOT NULL PRIMARY KEY,
    HoTen        VARCHAR(100) NOT NULL,
    NgaySinh     DATE         NOT NULL,
    GioiTinh     VARCHAR(10)  NOT NULL,
    QueQuan      VARCHAR(200) NULL,
    SoDienThoai  VARCHAR(15)  NULL,
    Email        VARCHAR(100) NULL,
    TrangThai    VARCHAR(50)  NOT NULL DEFAULT 'Đang học',
    MaLop        VARCHAR(20)  NOT NULL,
    CONSTRAINT FK_SinhVien_Lop FOREIGN KEY (MaLop) REFERENCES tbl_Lop(MaLop)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng tbl_TaiKhoan
CREATE TABLE tbl_TaiKhoan (
    TenDangNhap  VARCHAR(50)  NOT NULL PRIMARY KEY,
    MatKhau      VARCHAR(255) NOT NULL,
    VaiTro       VARCHAR(50)  NOT NULL,
    TrangThai    INT          NOT NULL DEFAULT 1,
    MaSV         VARCHAR(20)  NULL,
    CONSTRAINT FK_TaiKhoan_SinhVien FOREIGN KEY (MaSV) REFERENCES tbl_SinhVien(MaSV)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_Khoa (MaKhoa, TenKhoa, DienThoai, Email) VALUES
('CNTT', 'Khoa Công nghệ Thông tin', '02437655121', 'cntt@edu.vn'),
('CK',   'Khoa Cơ khí Động lực', '02437655122', 'cokhi@edu.vn'),
('DTVT', 'Khoa Điện tử Viễn thông', '02437655123', 'dtvt@edu.vn'),
('KT',   'Khoa Kinh tế & Quản trị', '02437655124', 'kinhte@edu.vn');

INSERT INTO tbl_Lop (MaLop, TenLop, KhoaHoc, CoVanHocTap, MaKhoa) VALUES
('KTPM-03K17', 'Kỹ thuật Phần mềm 03 - K17', 'Khóa 17', 'TS. Nguyễn Thái Cường', 'CNTT'),
('HTTT-01K17', 'Hệ thống Thông tin 01 - K17', 'Khóa 17', 'TS. Nguyễn Thái Cường', 'CNTT'),
('KHMT-02K17', 'Khoa học Máy tính 02 - K17', 'Khóa 17', 'PGS.TS. Trần Quang Huy', 'CNTT'),
('CNTT-04K17', 'Công nghệ Thông tin 04 - K17', 'Khóa 17', 'ThS. Lê Minh Tuấn', 'CNTT'),
('CKCT-01K17', 'Cơ khí Chế tạo máy 01 - K17', 'Khóa 17', 'TS. Phạm Văn Đông', 'CK'),
('DTVT-02K17', 'Điện tử Viễn thông 02 - K17', 'Khóa 17', 'TS. Vũ Hoàng Nam', 'DTVT');

INSERT INTO tbl_SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, SoDienThoai, Email, TrangThai, MaLop) VALUES
('2026601001', 'Đỗ Đức Cảnh',      '2006-08-11', 'Nam', 'Bắc Từ Liêm, TP. Hà Nội', '0987654321', 'doduccanh@edu.vn',     'Đang học', 'KTPM-03K17'),
('2026601002', 'Nguyễn Đức Thái',  '2006-04-15', 'Nam', 'Nam Trực, Nam Định',      '0912345678', 'nguyenducthai@edu.vn', 'Đang học', 'KTPM-03K17'),
('2026601003', 'Nguyễn Tuấn Linh', '2006-09-20', 'Nam', 'Đông Hưng, Thái Bình',    '0934567890', 'nguyentuanlinh@edu.vn','Đang học', 'KTPM-03K17'),
('2026601004', 'Hoàng Duy Đức',    '2006-12-05', 'Nam', 'Yên Phong, Bắc Ninh',     '0978123456', 'hoangduyduc@edu.vn',   'Đang học', 'KTPM-03K17'),
('2026601005', 'Trần Thị Lan',     '2006-02-18', 'Nữ',  'Hoài Đức, TP. Hà Nội',    '0965432109', 'tranthilan@edu.vn',    'Đang học', 'HTTT-01K17'),
('2026601006', 'Lê Văn Hùng',      '2006-10-22', 'Nam', 'TP. Hải Dương, Hải Dương','0943210987', 'levanhung@edu.vn',     'Đang học', 'KHMT-02K17'),
('2026601007', 'Phạm Quỳnh Chi',   '2006-07-30', 'Nữ',  'TP. Vinh, Nghệ An',       '0921098765', 'phamquynhchi@edu.vn',  'Đang học', 'CNTT-04K17');
