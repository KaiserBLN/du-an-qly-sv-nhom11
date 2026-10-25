-- =============================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU HỆ THỐNG QUẢN LÝ SINH VIÊN
-- Hệ quản trị CSDL: Microsoft SQL Server (T-SQL)
-- Học phần: Thực tập cơ sở ngành (IT6040003) - Nhóm 11 (KTPM-03K17)
-- =============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QLSV_System_Nhom11')
BEGIN
    CREATE DATABASE QLSV_System_Nhom11;
END
GO

USE QLSV_System_Nhom11;
GO

IF OBJECT_ID('dbo.tbl_TaiKhoan', 'U') IS NOT NULL DROP TABLE dbo.tbl_TaiKhoan;
IF OBJECT_ID('dbo.tbl_SinhVien', 'U') IS NOT NULL DROP TABLE dbo.tbl_SinhVien;
IF OBJECT_ID('dbo.tbl_Lop', 'U') IS NOT NULL DROP TABLE dbo.tbl_Lop;
IF OBJECT_ID('dbo.tbl_Khoa', 'U') IS NOT NULL DROP TABLE dbo.tbl_Khoa;
GO

-- 1. Bảng tbl_Khoa
CREATE TABLE dbo.tbl_Khoa (
    MaKhoa      VARCHAR(20)   NOT NULL PRIMARY KEY,
    TenKhoa     NVARCHAR(100) NOT NULL,
    DienThoai   VARCHAR(15)   NULL,
    Email       VARCHAR(100)  NULL
);
GO

-- 2. Bảng tbl_Lop
CREATE TABLE dbo.tbl_Lop (
    MaLop        VARCHAR(20)   NOT NULL PRIMARY KEY,
    TenLop       NVARCHAR(100) NOT NULL,
    KhoaHoc      VARCHAR(20)   NOT NULL,
    CoVanHocTap  NVARCHAR(100) NULL,
    MaKhoa       VARCHAR(20)   NOT NULL,
    CONSTRAINT FK_Lop_Khoa FOREIGN KEY (MaKhoa) REFERENCES dbo.tbl_Khoa(MaKhoa)
        ON UPDATE CASCADE ON DELETE NO ACTION
);
GO

-- 3. Bảng tbl_SinhVien
CREATE TABLE dbo.tbl_SinhVien (
    MaSV         VARCHAR(20)   NOT NULL PRIMARY KEY,
    HoTen        NVARCHAR(100) NOT NULL,
    NgaySinh     DATE          NOT NULL,
    GioiTinh     NVARCHAR(10)  NOT NULL CHECK (GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    QueQuan      NVARCHAR(200) NULL,
    SoDienThoai  VARCHAR(15)   NULL,
    Email        VARCHAR(100)  NULL,
    TrangThai    NVARCHAR(50)  NOT NULL DEFAULT N'Đang học',
    MaLop        VARCHAR(20)   NOT NULL,
    CONSTRAINT FK_SinhVien_Lop FOREIGN KEY (MaLop) REFERENCES dbo.tbl_Lop(MaLop)
        ON UPDATE CASCADE ON DELETE NO ACTION
);
GO

-- 4. Bảng tbl_TaiKhoan
CREATE TABLE dbo.tbl_TaiKhoan (
    TenDangNhap  VARCHAR(50)   NOT NULL PRIMARY KEY,
    MatKhau      VARCHAR(255)  NOT NULL,
    VaiTro       NVARCHAR(50)  NOT NULL CHECK (VaiTro IN ('ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_STUDENT')),
    TrangThai    INT           NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    MaSV         VARCHAR(20)   NULL,
    CONSTRAINT FK_TaiKhoan_SinhVien FOREIGN KEY (MaSV) REFERENCES dbo.tbl_SinhVien(MaSV)
        ON UPDATE CASCADE ON DELETE SET NULL
);
GO

-- =============================================================================
-- DỮ LIỆU MẪU KHỞI TẠO (SEED DATA) - NHÓM 11
-- =============================================================================

INSERT INTO dbo.tbl_Khoa (MaKhoa, TenKhoa, DienThoai, Email) VALUES
('CNTT', N'Khoa Công nghệ Thông tin', '02437655121', 'cntt@edu.vn'),
('CK',   N'Khoa Cơ khí Động lực', '02437655122', 'cokhi@edu.vn'),
('DTVT', N'Khoa Điện tử Viễn thông', '02437655123', 'dtvt@edu.vn'),
('KT',   N'Khoa Kinh tế & Quản trị', '02437655124', 'kinhte@edu.vn');

INSERT INTO dbo.tbl_Lop (MaLop, TenLop, KhoaHoc, CoVanHocTap, MaKhoa) VALUES
('KTPM-03K17', N'Kỹ thuật Phần mềm 03 - K17', 'Khóa 17', N'TS. Nguyễn Thái Cường', 'CNTT'),
('HTTT-01K17', N'Hệ thống Thông tin 01 - K17', 'Khóa 17', N'TS. Nguyễn Thái Cường', 'CNTT'),
('KHMT-02K17', N'Khoa học Máy tính 02 - K17', 'Khóa 17', N'PGS.TS. Trần Quang Huy', 'CNTT'),
('CNTT-04K17', N'Công nghệ Thông tin 04 - K17', 'Khóa 17', N'ThS. Lê Minh Tuấn', 'CNTT'),
('CKCT-01K17', N'Cơ khí Chế tạo máy 01 - K17', 'Khóa 17', N'TS. Phạm Văn Đông', 'CK'),
('DTVT-02K17', N'Điện tử Viễn thông 02 - K17', 'Khóa 17', N'TS. Vũ Hoàng Nam', 'DTVT');

INSERT INTO dbo.tbl_SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, SoDienThoai, Email, TrangThai, MaLop) VALUES
('2026601001', N'Đỗ Đức Cảnh',      '2006-08-11', N'Nam', N'Bắc Từ Liêm, TP. Hà Nội', '0987654321', 'doduccanh@edu.vn',     N'Đang học', 'KTPM-03K17'),
('2026601002', N'Nguyễn Đức Thái',  '2006-04-15', N'Nam', N'Nam Trực, Nam Định',      '0912345678', 'nguyenducthai@edu.vn', N'Đang học', 'KTPM-03K17'),
('2026601003', N'Nguyễn Tuấn Linh', '2006-09-20', N'Nam', N'Đông Hưng, Thái Bình',    '0934567890', 'nguyentuanlinh@edu.vn',N'Đang học', 'KTPM-03K17'),
('2026601004', N'Hoàng Duy Đức',    '2006-12-05', N'Nam', N'Yên Phong, Bắc Ninh',     '0978123456', 'hoangduyduc@edu.vn',   N'Đang học', 'KTPM-03K17'),
('2026601005', N'Trần Thị Lan',     '2006-02-18', N'Nữ',  N'Hoài Đức, TP. Hà Nội',    '0965432109', 'tranthilan@edu.vn',    N'Đang học', 'HTTT-01K17'),
('2026601006', N'Lê Văn Hùng',      '2006-10-22', N'Nam', N'TP. Hải Dương, Hải Dương','0943210987', 'levanhung@edu.vn',     N'Đang học', 'KHMT-02K17'),
('2026601007', N'Phạm Quỳnh Chi',   '2006-07-30', N'Nữ',  N'TP. Vinh, Nghệ An',       '0921098765', 'phamquynhchi@edu.vn',  N'Đang học', 'CNTT-04K17'),
('2026601008', N'Vũ Minh Quân',     '2006-01-12', N'Nam', N'Cầu Giấy, TP. Hà Nội',    '0981112233', 'vuminhquan@edu.vn',    N'Đang học', 'KTPM-03K17'),
('2026601009', N'Đặng Thu Hà',      '2006-03-25', N'Nữ',  N'TP. Hạ Long, Quảng Ninh', '0972223344', 'dangthuha@edu.vn',     N'Đang học', 'KTPM-03K17'),
('2026601010', N'Bùi Quốc Khánh',   '2006-09-02', N'Nam', N'Kiến An, TP. Hải Phòng',  '0963334455', 'buiquockhanh@edu.vn',  N'Đang học', 'KTPM-03K17'),
('2026601011', N'Ngô Phương Anh',   '2006-11-19', N'Nữ',  N'Từ Sơn, Bắc Ninh',        '0914445566', 'ngophuonganh@edu.vn',  N'Đang học', 'KTPM-03K17'),
('2026601012', N'Dương Hoàng Nam',  '2006-05-08', N'Nam', N'TP. Thái Nguyên',         '0935556677', 'duonghoangnam@edu.vn', N'Bảo lưu',  'KTPM-03K17'),
('2026601013', N'Lý Thanh Tâm',     '2006-06-14', N'Nữ',  N'Phủ Lý, Hà Nam',          '0946667788', 'lythanhtam@edu.vn',    N'Đang học', 'HTTT-01K17'),
('2026601014', N'Trịnh Đình Trọng', '2006-08-27', N'Nam', N'Gia Lâm, TP. Hà Nội',     '0987778899', 'trinhdinhtrong@edu.vn',N'Đang học', 'KHMT-02K17'),
('2026601015', N'Mai Tuyết Nhung',  '2006-12-31', N'Nữ',  N'TP. Ninh Bình',           '0978889900', 'maituyetnhung@edu.vn', N'Đang học', 'CNTT-04K17'),
('2026601016', N'Phan Văn Đức',     '2005-04-10', N'Nam', N'Yên Thành, Nghệ An',      '0969990011', 'phanvanduc@edu.vn',    N'Tốt nghiệp','CKCT-01K17'),
('2026601017', N'Hồ Ngọc Hà',       '2006-07-07', N'Nữ',  N'Đông Anh, TP. Hà Nội',    '0910001122', 'hongocha@edu.vn',      N'Đang học', 'DTVT-02K17');

INSERT INTO dbo.tbl_TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai, MaSV) VALUES
('admin',        '$2a$10$AdminHashPlaceholder1234567890', 'ROLE_ADMIN',   1, '2026601001'),
('giaovu_cuong', '$2a$10$StaffHashPlaceholder1234567890', 'ROLE_STAFF',   1, NULL),
('giaovu_thai',  '$2a$10$StaffHashPlaceholder1234567890', 'ROLE_STAFF',   1, '2026601002'),
('2026601001',   '$2a$10$StudHashPlaceholder12345678900', 'ROLE_STUDENT', 1, '2026601001'),
('2026601002',   '$2a$10$StudHashPlaceholder12345678900', 'ROLE_STUDENT', 1, '2026601002'),
('2026601003',   '$2a$10$StudHashPlaceholder12345678900', 'ROLE_STUDENT', 1, '2026601003'),
('2026601004',   '$2a$10$StudHashPlaceholder12345678900', 'ROLE_STUDENT', 0, '2026601004');
GO
