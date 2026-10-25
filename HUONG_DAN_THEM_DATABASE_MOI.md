# HƯỚNG DẪN THÊM DATABASE MỚI & CHUYỂN ĐỔI HỆ QUẢN TRỊ CSDL
**Đề tài:** Xây dựng hệ thống quản lý danh sách sinh viên  
**Học phần:** Thực tập cơ sở ngành (Mã HP: IT6040003) – Nhóm 11 (KTPM-03K17) – GVHD: TS. Nguyễn Thái Cường

---

Hệ thống được thiết kế với **Lớp Trừu tượng Cơ sở dữ liệu (Multi-Database Manager)**, cho phép bạn thêm mới hoặc chuyển đổi giữa các Database cực kỳ linh hoạt theo **4 cách** dưới đây:

---

## CÁCH 1: Thêm & Chuyển đổi Database Mới Trực Tiếp Trên Giao Diện Web (Nhanh nhất - Khuyên dùng)

Bạn không cần viết bất kỳ dòng lệnh nào mà có thể tạo ngay một Database mới trực tiếp trên trình duyệt:

1. Đăng nhập vào hệ thống bằng tài khoản **Quản trị viên (`ROLE_ADMIN`)**:
   - **Tên đăng nhập:** `admin`
   - **Mật khẩu:** `Admin@123`
2. Trên thanh điều hướng dọc bên trái (Sidebar), nhấn vào mục **`Quản trị Đa Database`** (hoặc bấm vào thẻ KPI **`Quản trị Đa Database`** trên đầu trang).
3. Trong khung **`QUẢN LÝ ĐA CƠ SỞ DỮ LIỆU`**:
   - **Nhập tên Database mới** vào ô nhập liệu (ví dụ: `QLSV_HocKy2_2026` hoặc `QLSV_Khoa_CoKhi`).
   - Tích chọn (hoặc bỏ tích) ô **`Khởi tạo kèm dữ liệu mẫu`**:
     - *Nếu tích chọn*: Database mới sẽ được tạo sẵn 4 bảng chuẩn 3NF kèm dữ liệu mẫu.
     - *Nếu bỏ tích*: Database mới sẽ chỉ tạo 4 bảng trống (`tbl_Khoa`, `tbl_Lop`, `tbl_SinhVien`, `tbl_TaiKhoan`) để bạn tự nhập liệu mới từ đầu.
4. Nhấn nút **`+ Tạo & Kết nối DB`**.
5. Hệ thống sẽ lập tức tạo file `.db` mới trong thư mục `database/instances/` và chuyển toàn bộ phiên làm việc sang Database mới vừa tạo. Bạn có thể chuyển đổi qua lại giữa các Database cũ và mới bất kỳ lúc nào bằng nút **`Kết nối`**.

---

## CÁCH 2: Tạo Database Mới Bằng Dòng Lệnh CLI (`npm run init-db`)

Nếu bạn muốn tạo nhanh một file Database SQLite mới từ cửa sổ Terminal / PowerShell:

```powershell
cd C:\Users\ADMIN\Downloads\quanlydanhsach\backend

# 1. Tạo Database mới CÓ sẵn dữ liệu mẫu:
node src/initNewDb.js QLSV_K18_Moi

# 2. Hoặc tạo Database mới RỖNG (chỉ tạo cấu trúc 4 bảng 3NF):
node src/initNewDb.js QLSV_Empty --empty
```

File database mới sẽ xuất hiện tại: `C:\Users\ADMIN\Downloads\quanlydanhsach\database\instances\QLSV_K18_Moi.db`.

Để đổi Database mặc định khi khởi động máy chủ Backend, mở file [db.js](file:///C:/Users/ADMIN/Downloads/quanlydanhsach/backend/src/db.js#L16) và sửa biến `currentDbName`:
```javascript
let currentDbName = 'QLSV_K18_Moi.db';
```

---

## CÁCH 3: Thêm Database Mới Trên Microsoft SQL Server (SSMS / `sqlcmd`)

Trên máy tính của bạn đã cài đặt sẵn công cụ `SQLCMD.EXE` của Microsoft SQL Server (`C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\180\Tools\Binn\SQLCMD.EXE`).

### Bước 3.1: Khởi tạo Database vào SQL Server
Mở **SQL Server Management Studio (SSMS)**, mở tệp [schema_sqlserver.sql](file:///C:/Users/ADMIN/Downloads/quanlydanhsach/database/schema_sqlserver.sql) và nhấn **Execute (F5)**, hoặc chạy lệnh sau trong PowerShell:

```powershell
sqlcmd -S localhost -E -i "C:\Users\ADMIN\Downloads\quanlydanhsach\database\schema_sqlserver.sql"
```
*(Nếu dùng SQL Server Express thì thay `localhost` bằng `localhost\SQLEXPRESS`)*.

Lệnh trên sẽ tự động:
1. Tạo Database mới tên là **`QLSV_System_Nhom11`** (bạn có thể đổi tên ở dòng 7 & 13 của file `schema_sqlserver.sql` thành bất kỳ tên Database nào bạn muốn).
2. Tạo 4 bảng vật lý chuẩn 3NF: `dbo.tbl_Khoa`, `dbo.tbl_Lop`, `dbo.tbl_SinhVien`, `dbo.tbl_TaiKhoan` kèm đầy đủ khóa chính (`PK`), khóa ngoại (`FK`) và ràng buộc `CHECK`.
3. Chèn toàn bộ dữ liệu mẫu.

### Bước 3.2: Kết nối Backend Node.js vào SQL Server (Tùy chọn)
Nếu muốn chuyển Backend từ SQLite sang chạy trực tiếp với SQL Server:
1. Cài gói driver `mssql`:
   ```powershell
   cd C:\Users\ADMIN\Downloads\quanlydanhsach\backend
   npm install mssql
   ```
2. Khai báo chuỗi kết nối (Connection String) tới Database mới:
   ```javascript
   import sql from 'mssql';
   const sqlConfig = {
     user: 'sa',
     password: 'YourStrongPassword123',
     database: 'QLSV_System_Nhom11', // Đổi tên Database mới tại đây
     server: 'localhost',
     options: { encrypt: false, trustServerCertificate: true }
   };
   const pool = await sql.connect(sqlConfig);
   ```

---

## CÁCH 4: Thêm Database Mới Trên MySQL / MariaDB (XAMPP / MySQL Workbench)

1. Mở **phpMyAdmin** (XAMPP) hoặc **MySQL Workbench**.
2. Chọn thẻ **Import** (hoặc mở tab Query mới) và chọn file [schema_mysql.sql](file:///C:/Users/ADMIN/Downloads/quanlydanhsach/database/schema_mysql.sql).
3. Nhấn **Execute / Go** để tạo Database `QLSV_System_Nhom11` với bảng mã Tiếng Việt `utf8mb4_unicode_ci`.

---

## PHỤ LỤC: CÁCH MỞ RỘNG THÊM BẢNG MỚI VÀO DATABASE HIỆN TẠI (VD: Bảng Điểm `tbl_Diem`)

Nếu cần thêm bảng mới (ví dụ bảng `tbl_MonHoc` hoặc `tbl_Diem`):

1. **Bước 1 (Thêm bảng vào CSDL)**: Mở [db.js](file:///C:/Users/ADMIN/Downloads/quanlydanhsach/backend/src/db.js#L69) trong hàm `seedSchemaAndData` và thêm lệnh `CREATE TABLE`:
   ```sql
   CREATE TABLE IF NOT EXISTS tbl_Diem (
     MaDiem      INTEGER PRIMARY KEY AUTOINCREMENT,
     MaSV        TEXT NOT NULL,
     TenMonHoc   TEXT NOT NULL,
     SoTinChi    INTEGER NOT NULL DEFAULT 3,
     DiemQT      REAL NOT NULL,
     DiemThi     REAL NOT NULL,
     DiemTongKet REAL NOT NULL,
     FOREIGN KEY (MaSV) REFERENCES tbl_SinhVien(MaSV) ON DELETE CASCADE
   );
   ```
2. **Bước 2 (Tạo API trong `backend/src/server.js`)**:
   ```javascript
   app.get('/api/diem/:maSV', authenticateToken, (req, res) => {
     const rows = queryAll('SELECT * FROM tbl_Diem WHERE MaSV = ?', [req.params.maSV]);
     res.json({ success: true, data: rows });
   });
   ```
3. **Bước 3 (Khởi tạo lại DB mới)**: Vào giao diện Admin -> mục **Quản trị Đa Database** -> Gõ tên DB mới và bấm **Tạo & Kết nối DB** để áp dụng cấu trúc bảng mới ngay lập tức!
