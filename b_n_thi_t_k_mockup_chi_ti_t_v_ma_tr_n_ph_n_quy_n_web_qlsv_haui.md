# BÁO CÁO PHÂN TÍCH THIẾT KẾ GIAO DIỆN & PHÂN QUYỀN HỆ THỐNG (RBAC)
**Đề tài:** Xây dựng chương trình quản lý danh sách sinh viên – Trường Đại học Công nghiệp Hà Nội  
**Học phần:** Thực tập cơ sở ngành (Mã HP: IT6040003)  
**Đơn vị:** Trường Công nghệ Thông tin và Truyền thông (SICT) – HaUI  
**Giảng viên hướng dẫn:** TS. Nguyễn Thị Mỹ Bình  
**Nhóm thực hiện:** Nhóm 11 (KTPM-03K17)  
*Thành viên:* Đỗ Đức Cảnh (Nhóm trưởng), Nguyễn Đức Thái, Nguyễn Tuấn Linh, Hoàng Duy Đức.

---

## MỤC LỤC
1. [Phần 1: Kiến trúc phân quyền người dùng (Role-Based Access Control - RBAC)](#phan-1-kien-truc-phan-quyen-nguoi-dung-rbac)
   - 1.1. Danh mục các vai trò người dùng (Roles)
   - 1.2. Ma trận phân quyền chi tiết (RBAC Matrix)
   - 1.3. Luồng kiểm soát và điều hướng truy cập
2. [Phần 2: Thiết kế Mockup chi tiết các màn hình (Wireframe học thuật)](#phan-2-thiet-ke-mockup-chi-tiet-cac-man-hinh)
   - 2.1. UC01: Màn hình Đăng nhập hệ thống (Authentication)
   - 2.2. UC02 & UC03: Màn hình Quản lý & Tìm kiếm sinh viên (Admin / Staff View)
   - 2.3. UC02 & UC03: Màn hình Tra cứu danh bạ lớp (Student View)
   - 2.4. UC05 & UC06: Modal Biểu mẫu Thêm mới / Cập nhật hồ sơ sinh viên
   - 2.5. UC04: Modal Xem chi tiết lý lịch sinh viên (Phân cấp dữ liệu)
   - 2.6. UC07: Hộp thoại xác nhận cảnh báo xóa hồ sơ an toàn
   - 2.7. Màn hình mở rộng: Quản lý tài khoản & phân quyền (Admin Only)
3. [Phần 3: Quy chuẩn kỹ thuật và nguyên tắc lập trình giao diện](#phan-3-quy-chuan-ky-thuat-va-nguyen-tac-lap-trinh-giao-dien)
   - 3.1. Cơ chế phòng thủ đa tầng (Frontend DOM Guard vs Backend API Guard)
   - 3.2. Tiêu chuẩn thiết kế Wireframe học thuật (Square Layout Guidelines)
   - 3.3. Ánh xạ trường dữ liệu biểu mẫu tới CSDL

---

<a name="phan-1-kien-truc-phan-quyen-nguoi-dung-rbac"></a>
# PHẦN 1: KIẾN TRÚC PHÂN QUYỀN NGƯỜI DÙNG (RBAC)

Căn cứ theo thiết kế cơ sở dữ liệu bảng `tbl_TaiKhoan` và đặc tả 7 Use Case trong báo cáo, hệ thống quản lý danh sách sinh viên thiết lập cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC).

### 1.1. Danh mục các vai trò người dùng (Roles)
1. **Quản trị viên hệ thống (`ROLE_ADMIN`):**
   - Tài khoản kỹ thuật cấp cao nhất (thuộc Ban Quản trị hệ thống/Phòng CNTT).
   - Toàn quyền cấu hình hệ thống, tạo tài khoản người dùng, phân quyền truy cập, sao lưu dữ liệu và can thiệp toàn bộ dữ liệu sinh viên.
2. **Cán bộ Giáo vụ / Giảng viên (`ROLE_STAFF`):**
   - Cán bộ phụ trách công tác sinh viên tại văn phòng Khoa Công nghệ Thông tin (SICT) hoặc giảng viên cố vấn học tập.
   - Toàn quyền tác nghiệp chuyên môn: Tra cứu danh sách, xem chi tiết, thêm mới sinh viên, sửa đổi lý lịch, xóa sinh viên (theo danh mục lớp/khoa quản lý).
3. **Sinh viên (`ROLE_STUDENT`):**
   - Người học thuộc Trường Đại học Công nghiệp Hà Nội được cấp tài khoản theo Mã sinh viên.
   - Quyền hạn bị giới hạn (Read-only): Chỉ được phép tra cứu danh bạ sinh viên trong cùng lớp/khoa, xem chi tiết hồ sơ cá nhân và cập nhật một số thông tin liên lạc được cho phép (SĐT, Email phụ).

---

### 1.2. Ma trận phân quyền chi tiết (RBAC Matrix)

| Ký hiệu | Tên Use Case / Chức năng | Admin (`ROLE_ADMIN`) | Giáo vụ (`ROLE_STAFF`) | Sinh viên (`ROLE_STUDENT`) | Ràng buộc nghiệp vụ & Hiển thị UI |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **UC01** | Đăng nhập hệ thống (Login) | Toàn quyền | Toàn quyền | Toàn quyền | Tự động phân luồng giao diện sau khi xác thực Session/JWT |
| **--** | Đăng xuất hệ thống (Logout) | Toàn quyền | Toàn quyền | Toàn quyền | Hủy session và xóa cookie bảo mật |
| **UC02** | Quản lý danh sách sinh viên phân trang | Xem toàn trường | Xem theo Khoa | Xem trong Lớp | SV chỉ thấy các cột công khai, ẩn cột thao tác quản trị |
| **UC03** | Tìm kiếm sinh viên đa tiêu chí | Toàn diện | Toàn diện | Giới hạn | SV chỉ tìm theo Mã SV, Họ tên trong phạm vi lớp sinh hoạt |
| **UC04** | Xem chi tiết lý lịch sinh viên | Đầy đủ 100% | Đầy đủ 100% | Xem hồ sơ bản thân | SV xem người khác bị ẩn trường: Quê quán, SĐT, Tài khoản |
| **UC05** | Thêm mới sinh viên | Toàn quyền | Toàn quyền | **BỊ CẤM (Deny)** | Sinh viên bị ẩn hoàn toàn nút `+ THÊM MỚI` trên DOM |
| **UC06** | Sửa thông tin hồ sơ sinh viên | Toàn quyền | Toàn quyền | **BỊ CẤM / Giới hạn** | Ẩn nút `[Sửa]` với SV (hoặc chỉ mở sửa SĐT cá nhân) |
| **UC07** | Xóa hồ sơ sinh viên | Toàn quyền | Xác nhận phân cấp | **BỊ CẤM (Deny)** | Ẩn nút `[Xóa]` trên DOM; Chặn truy cập API mức Controller |
| **Mở rộng**| Quản lý tài khoản & Cấp quyền | Toàn quyền | **BỊ CẤM (Deny)** | **BỊ CẤM (Deny)** | Module ẩn hoàn toàn khỏi Navbar của Giáo vụ và Sinh viên |

---

### 1.3. Luồng kiểm soát và điều hướng truy cập

```
[ Người dùng truy cập hệ thống ]
               │
               ▼
   [ Màn hình Đăng nhập UC01 ]
               │ (Nhập User/Pass -> AuthController -> tbl_TaiKhoan)
               ▼
       { Xác thực thành công? }
        ├── KHÔNG ──> [ Báo lỗi đỏ: Sai thông tin / Tài khoản bị khóa ]
        │
        └── CÓ ─────> Đọc giá trị trường `VaiTro`
                         ├── `ROLE_ADMIN`   ──> Điều hướng sang Dashboard Quản trị (Toàn quyền)
                         ├── `ROLE_STAFF`   ──> Điều hướng sang Giao diện Giáo vụ (Quản lý hồ sơ)
                         └── `ROLE_STUDENT` ──> Điều hướng sang Cổng Portal Tra cứu (Chỉ đọc)
```

---

<a name="phan-2-thiet-ke-mockup-chi-tiet-cac-man-hinh"></a>
# PHẦN 2: THIẾT KẾ MOCKUP CHI TIẾT (WIREFRAME HỌC THUẬT)

*Ghi chú quy chuẩn giao diện:* Tuân thủ triệt để tinh thần báo cáo BTL của Nhóm 11:
- Khung lưới hình chữ nhật dứt khoát, **loại bỏ hoàn toàn bo góc** (`border-radius: 0px`).
- Đường nét đơn sắc trắng - đen - xám chuẩn technical blueprint.
- Bố cục phân tầng rõ ràng: Logo góc trên bên trái, Trạng thái người dùng góc trên bên phải, Navbar ngang, Khung nội dung trung tâm sắc nét.

---

### 2.1. UC01: Màn hình Đăng nhập hệ thống (Authentication)

*Áp dụng chung cho tất cả các đối tượng, cơ chế tự động phân giải vai trò sau khi xác thực.*

```text
+--------------------------------------------------------------------------------------------------+
|  [LOGO HaUI]  TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI                             [ Trợ giúp kỹ thuật ]|
+--------------------------------------------------------------------------------------------------+
|  Trang chủ      |  Giới thiệu      |  Thông báo đào tạo      |  Liên hệ công tác                 |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                         +-----------------------------------------------+                        |
|                         |              ĐĂNG NHẬP HỆ THỐNG               |                        |
|                         |    (Cổng Quản lý & Tra cứu Hồ sơ Sinh viên)   |                        |
|                         +-----------------------------------------------+                        |
|                         |                                               |                        |
|                         |  Phân hệ truy cập:                            |                        |
|                         |  (o) Cán bộ Quản trị / Giáo vụ    ( ) Sinh viên|                        |
|                         |                                               |                        |
|                         |  Tên đăng nhập / Mã sinh viên: (*)            |                        |
|                         |  +-----------------------------------------+  |                        |
|                         |  | admin_haui / 2026601001                 |  |                        |
|                         |  +-----------------------------------------+  |                        |
|                         |                                               |                        |
|                         |  Mật khẩu bảo mật: (*)                        |                        |
|                         |  +-----------------------------------------+  |                        |
|                         |  | ******************                      |  |                        |
|                         |  +-----------------------------------------+  |                        |
|                         |                                               |                        |
|                         |  [X] Ghi nhớ phiên làm việc trên máy trạm     |                        |
|                         |                                               |                        |
|                         |  [ ! ] Thông báo (Mặc định ẩn, hiện khi lỗi): |                        |
|                         |  "Tên đăng nhập hoặc mật khẩu không chính xác"|                        |
|                         |                                               |                        |
|                         |             +-------------------+             |                        |
|                         |             |    ĐĂNG NHẬP      |             |                        |
|                         |             +-------------------+             |                        |
|                         |                                               |                        |
|                         |  [ Quên mật khẩu? ]      [ Hướng dẫn lần đầu ]|                        |
|                         +-----------------------------------------------+                        |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|  (C) 2026 Trường ĐH Công nghiệp Hà Nội - SICT | Thực tập cơ sở ngành - Nhóm 11                  |
+--------------------------------------------------------------------------------------------------+
```

---

### 2.2. UC02 & UC03: Màn hình Quản trị & Tìm kiếm sinh viên (Admin & Staff View)

*Dành cho `ROLE_ADMIN` và `ROLE_STAFF`: Đầy đủ công cụ tìm kiếm lọc nâng cao, nút thêm mới, cột hành động chứa đầy đủ các quyền thao tác.*

```text
+--------------------------------------------------------------------------------------------------+
|  [LOGO HaUI]  HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN          Xin chào: TS. Bình (Staff) [Đăng xuất]|
+--------------------------------------------------------------------------------------------------+
| [Tổng quan] | [Quản lý Sinh viên (Active)] | [Quản lý Lớp] | [Quản lý Khoa] | [Báo cáo / Thống kê]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   QUẢN LÝ DANH SÁCH SINH VIÊN KHOA CÔNG NGHỆ THÔNG TIN                                           |
|                                                                                                  |
|   +-- BỘ LỌC VÀ TÌM KIẾM ĐA TIÊU CHÍ (UC03) -------------------------------------------------+   |
|   | Từ khóa tra cứu:                 Khoa chuyên môn:         Lớp sinh hoạt:      Trạng thái:|   |
|   | +------------------------------+ +----------------------+ +-----------------+ +--------+ |   |
|   | | Mã SV, Họ tên sinh viên...   | | [Tất cả các Khoa  v] | | [KTPM-03K17  v] | | [Tất cả] | |   |
|   | +------------------------------+ +----------------------+ +-----------------+ +--------+ |   |
|   |                                                                                          |   |
|   |         +-------------------+    +-------------------+    +--------------------------+   |   |
|   |         |     TÌM KIẾM      |    |     ĐẶT LẠI LỌC   |    |    + THÊM MỚI SINH VIÊN  |   |   |
|   |         +-------------------+    +-------------------+    +--------------------------+   |   |
|   +------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|   +-- BẢNG DỮ LIỆU SINH VIÊN (UC02) ---------------------------------------------------------+   |
|   | [X] Chọn tất cả | Thao tác hàng loạt: [ Xóa mục chọn v ] [ Áp dụng ]    | Tổng số: 125 SV|   |
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|   | STT | Mã SV      | Họ và tên            | Ngày sinh  | Giới  | Lớp        | Thao tác     |   |
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|   |  1  | 2026601001 | Đỗ Đức Cảnh          | 11/08/2006 | Nam   | KTPM-03K17 | [Xem][Sửa][X]|   |
|   |  2  | 2026601002 | Nguyễn Đức Thái      | 15/04/2006 | Nam   | KTPM-03K17 | [Xem][Sửa][X]|   |
|   |  3  | 2026601003 | Nguyễn Tuấn Linh     | 20/09/2006 | Nam   | KTPM-03K17 | [Xem][Sửa][X]|   |
|   |  4  | 2026601004 | Hoàng Duy Đức        | 05/12/2006 | Nam   | KTPM-03K17 | [Xem][Sửa][X]|   |
|   |  5  | 2026601005 | Trần Thị Lan         | 18/02/2006 | Nữ    | HTTT-01K17 | [Xem][Sửa][X]|   |
|   |  6  | 2026601006 | Lê Văn Hùng          | 22/10/2006 | Nam   | KHMT-02K17 | [Xem][Sửa][X]|   |
|   |  7  | 2026601007 | Phạm Quỳnh Chi       | 30/07/2006 | Nữ    | CNTT-04K17 | [Xem][Sửa][X]|   |
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|                                                                                                  |
|   Hiển thị bản ghi: 1 - 7 / 125                      Phân trang: [|<] [<] [1] [2] [3] [>] [>|]   |
+--------------------------------------------------------------------------------------------------+
```

---

### 2.3. UC02 & UC03: Màn hình Tra cứu danh bạ lớp (Student View)

*Dành cho `ROLE_STUDENT`: Thanh điều hướng rút gọn, ẩn nút `+ THÊM MỚI`, ẩn thao tác `[Sửa]` và `[Xóa]`, bảo vệ dữ liệu cá nhân theo chính sách riêng tư.*

```text
+--------------------------------------------------------------------------------------------------+
|  [LOGO HaUI]  CỔNG THÔNG TIN SINH VIÊN - HaUI          SV: Đỗ Đức Cảnh (2026601001) [ Đăng xuất ]|
+--------------------------------------------------------------------------------------------------+
| [ Trang chủ ] | [ Hồ sơ cá nhân ] | [ Tra cứu sinh viên lớp KTPM-03K17 (Active) ] | [ Đơn từ ]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   DANH BẠ SINH VIÊN LỚP KTPM-03K17 (CHẾ ĐỘ XEM: CHỈ ĐỌC)                                         |
|                                                                                                  |
|   +-- TÌM KIẾM NHANH TRONG LỚP HỌC ----------------------------------------------------------+   |
|   | Nhập tên hoặc mã sinh viên cần tra cứu:                                                  |   |
|   | +---------------------------------------------------------------+ +--------------------+ |   |
|   | | Đỗ Đức...                                                     | |    TÌM KIẾM        | |   |
|   | +---------------------------------------------------------------+ +--------------------+ |   |
|   +------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|   +-- DANH SÁCH THÀNH VIÊN TRONG LỚP --------------------------------------------------------+   |
|   | (*) Dữ liệu bảo mật: Không hiển thị số điện thoại và địa chỉ nhà riêng của sinh viên khác|   |
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|   | STT | Mã SV      | Họ và tên            | Ngày sinh  | Giới  | Lớp        | Chi tiết     |   |
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|   |  1  | 2026601001 | Đỗ Đức Cảnh (Tôi)    | 11/08/2006 | Nam   | KTPM-03K17 | [ Xem hồ sơ ]|   |
|   |  2  | 2026601002 | Nguyễn Đức Thái      | 15/04/2006 | Nam   | KTPM-03K17 | [ Xem thông tin]|
|   |  3  | 2026601003 | Nguyễn Tuấn Linh     | 20/09/2006 | Nam   | KTPM-03K17 | [ Xem thông tin]|
|   |  4  | 2026601004 | Hoàng Duy Đức        | 05/12/2006 | Nam   | KTPM-03K17 | [ Xem thông tin]|
|   +-----+------------+----------------------+------------+-------+------------+--------------+   |
|                                                                                                  |
|   Hiển thị 1 - 4 trong tổng số 40 sinh viên                            Phân trang: [ 1 ] [ 2 ]   |
+--------------------------------------------------------------------------------------------------+
```

---

### 2.4. UC05 & UC06: Modal Biểu mẫu Thêm mới / Cập nhật hồ sơ sinh viên

*Chỉ mở cho `ROLE_ADMIN` và `ROLE_STAFF`. Tại chế độ Sửa (UC06), khóa trường `Mã sinh viên` ở chế độ `readonly` để bảo vệ toàn vẹn khóa chính (PK).*

```text
+--------------------------------------------------------------------------------------------------+
|                                    FORM HỒ SƠ SINH VIÊN                                    [ X ] |
|            [ Chế độ: THÊM MỚI (UC05) ]   /   [ Chế độ: CẬP NHẬT (UC06) - 2026601001 ]            |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   Mã sinh viên (*):                                  Họ và tên sinh viên (*):                    |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   | 2026601001 (Khóa Readonly nếu là UC06)        |  | Đỗ Đức Cảnh                             | |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   (Bắt buộc 10 chữ số, không được trùng)             (Họ và tên đầy đủ theo khai sinh)           |
|                                                                                                  |
|   Ngày sinh (*):                                     Giới tính (*):                              |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   | 11/08/2006                         [ Lịch v ] |  | [X] Nam     [ ] Nữ      [ ] Khác        | |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|                                                                                                  |
|   Lớp sinh hoạt (*):                                 Khoa chuyên môn trực thuộc:                 |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   | [ Chọn lớp: KTPM-03K17                      v]|  | Khoa CNTT - SICT (Tự động điền)         | |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|                                                                                                  |
|   Số điện thoại liên lạc:                            Email sinh viên:                            |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   | 0987654321                                    |  | doduccanh@haui.edu.vn                   | |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|                                                                                                  |
|   Trạng thái học tập (*):                            Tỉnh / Thành phố quê quán:                  |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|   | [ Đang học                                  v]|  | Bắc Từ Liêm, TP. Hà Nội                 | |
|   +-----------------------------------------------+  +-----------------------------------------+ |
|                                                                                                  |
|   --------------------------------------------------------------------------------------------   |
|   [ ! ] Ghi chú kỹ thuật: Các trường đánh dấu (*) bắt buộc nhập; kiểm tra trùng mã trước khi lưu.|
|                                                                                                  |
|                       +---------------------+       +---------------------+                      |
|                       |   LƯU HỒ SƠ (SAVE)  |       |     HỦY BỎ (CANCEL) |                      |
|                       +---------------------+       +---------------------+                      |
+--------------------------------------------------------------------------------------------------+
```

---

### 2.5. UC04: Modal Xem chi tiết lý lịch sinh viên (Phân cấp dữ liệu)

*Phân cấp hiển thị theo thẩm quyền: Giáo vụ/Admin nhìn thấy toàn bộ trường dữ liệu và tài khoản; Sinh viên khác chỉ xem được thông tin học tập.*

```text
+--------------------------------------------------------------------------------------------------+
|                           CHI TIẾT HỒ SƠ SINH VIÊN - HaUI                                  [ X ] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +-- [ẢNH 3x4] --+   MÃ SINH VIÊN: 2026601001                                                   |
|   |               |   HỌ VÀ TÊN:    ĐỖ ĐỨC CẢNH                                                  |
|   |   NO IMAGE    |   TRẠNG THÁI:   [ ĐANG HỌC - TÍCH CỰC ]                                      |
|   +---------------+   VAI TRÒ HT:   SINH VIÊN (ROLE_STUDENT)                                     |
|                                                                                                  |
|   ===================== I. THÔNG TIN QUẢN LÝ ĐÀO TẠO =====================                       |
|   • Lớp sinh hoạt:       KTPM-03K17           • Khóa đào tạo:     Khóa 17 (2022 - 2026)          |
|   • Khoa đào tạo:        Khoa CNTT - SICT     • Ngành đào tạo:    Kỹ thuật Phần mềm              |
|   • Cố vấn học tập:      TS. Nguyễn Thị Mỹ Bình                                                  |
|                                                                                                  |
|   ===================== II. THÔNG TIN CÁ NHÂN & LIÊN LẠC =================                        |
|   • Ngày sinh:           11/08/2006           • Giới tính:        Nam                            |
|   • Quê quán:            Bắc Từ Liêm, TP. Hà Nội                                                 |
|   • Số điện thoại:       0987654321           • Email HaUI:       doduccanh@haui.edu.vn          |
|                                                                                                  |
|   ===================== III. TÀI KHOẢN HỆ THỐNG (STAFF ONLY) =============                       |
|   • Tên đăng nhập:       2026601001           • Trạng thái TK:    Hoạt động (TrangThai = 1)      |
|   *(Mục III tự động ẩn đối với người dùng là Sinh viên khác)*                                    |
|                                                                                                  |
|   --------------------------------------------------------------------------------------------   |
|   Thao tác chức năng:                                                                            |
|   +-----------------------+     +------------------------+     +-------------------------+       |
|   |  CHỈNH SỬA HỒ SƠ (UC06)|     |  IN PHIẾU LÝ LỊCH (PDF)|     |   ĐÓNG CỬA SỔ (CLOSE)   |       |
|   +-----------------------+     +------------------------+     +-------------------------+       |
|   *(Nút Chỉnh sửa chỉ sáng với Giáo vụ/Admin)*                                                   |
+--------------------------------------------------------------------------------------------------+
```

---

### 2.6. UC07: Hộp thoại xác nhận cảnh báo xóa hồ sơ an toàn

*Cơ chế xác thực hành động nguy hiểm: Bắt buộc xác nhận kép nhằm triệt tiêu rủi ro click nhầm.*

```text
+-----------------------------------------------------------------------------------+
|  [ CẢNH BÁO NGUY HIỂM: XÁC NHẬN XÓA SINH VIÊN ]                             [ X ] |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|      /!\  BẠN CÓ CHẮC CHẮN MUỐN XÓA SINH VIÊN SAU KHỎI CƠ SỞ DỮ LIỆU?             |
|                                                                                   |
|           • Mã sinh viên :  2026601004                                            |
|           • Họ và tên    :  Hoàng Duy Đức                                         |
|           • Lớp          :  KTPM-03K17                                            |
|                                                                                   |
|      LƯU Ý CỰC KỲ QUAN TRỌNG:                                                     |
|      - Hồ sơ sinh viên, thông tin lớp và tài khoản liên kết sẽ bị xóa vĩnh viễn.  |
|      - Hành động này KHÔNG THỂ HOÀN TÁC sau khi đã nhấn xác nhận!                 |
|                                                                                   |
|      Vui lòng gõ chữ "XACNHAN" vào ô dưới đây để tiếp tục:                        |
|      +-------------------------------------------------------------------------+  |
|      | XACNHAN                                                                 |  |
|      +-------------------------------------------------------------------------+  |
|                                                                                   |
|                 +-----------------------+       +-------------------+             |
|                 |    ĐỒNG Ý XÓA BỎ      |       |      HỦY BỎ       |             |
|                 |     (DANGER ZONE)     |       |    (GIỮ LẠI)      |             |
|                 +-----------------------+       +-------------------+             |
+-----------------------------------------------------------------------------------+
```

---

### 2.7. Màn hình mở rộng: Quản lý tài khoản & phân quyền (ROLE_ADMIN Only)

*Module độc quyền dành cho Quản trị viên hệ thống để kiểm soát dữ liệu bảng `tbl_TaiKhoan`.*

```text
+--------------------------------------------------------------------------------------------------+
|  [LOGO HaUI]  BẢNG ĐIỀU KHIỂN HỆ THỐNG QUẢN TRỊ VIÊN                   Admin: do_duc_canh [Thoát]|
+--------------------------------------------------------------------------------------------------+
| [ Dashboard ] | [ Quản lý Sinh viên ] | [ Phân quyền & Tài khoản (Active) ] | [ Nhật ký Audit ]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   QUẢN TRỊ TÀI KHOẢN VÀ PHÂN QUYỀN TRUY CẬP HỆ THỐNG (tbl_TaiKhoan)                              |
|                                                                                                  |
|   +------------------------------------+   +---------------------+   +-----------------------+   |
|   | Nhập username hoặc Mã SV cần tìm...|   | [ Lọc vai trò: Tất cả v] |   | + CẤP MỚI TÀI KHOẢN   |   |
|   +------------------------------------+   +---------------------+   +-----------------------+   |
|                                                                                                  |
|   +-----+----------------+----------------------+---------------+------------+---------------+   |
|   | STT | Tên đăng nhập  | Sinh viên liên kết   | Quyền vai trò | Trạng thái | Thao tác      |   |
|   +-----+----------------+----------------------+---------------+------------+---------------+   |
|   |  1  | admin_haui     | Đỗ Đức Cảnh          | ROLE_ADMIN    | Hoạt động  | [Khóa] [Đổi MK|   |
|   |  2  | giaovu_thai    | Nguyễn Đức Thái      | ROLE_STAFF    | Hoạt động  | [Khóa] [Sửa]  |   |
|   |  3  | 2026601003     | Nguyễn Tuấn Linh     | ROLE_STUDENT  | Hoạt động  | [Khóa] [Reset]|   |
|   |  4  | 2026601004     | Hoàng Duy Đức        | ROLE_STUDENT  | Bị khóa    | [Mở] [Xóa TK] |   |
|   +-----+----------------+----------------------+---------------+------------+---------------+   |
|                                                                                                  |
|   Quy định bảo mật phân quyền:                                                                   |
|   - `ROLE_ADMIN`  : Kiểm soát hạ tầng, cấp/thu hồi tài khoản cán bộ và sinh viên.              |
|   - `ROLE_STAFF`  : Thao tác dữ liệu nghiệp vụ danh sách sinh viên các khoa phụ trách.          |
|   - `ROLE_STUDENT`: Chỉ đọc dữ liệu lớp học, không can thiệp cấu trúc dữ liệu người khác.       |
+--------------------------------------------------------------------------------------------------+
```

---

<a name="phan-3-quy-chuan-ky-thuat-va-nguyen-tac-lap-trinh-giao-dien"></a>
# PHẦN 3: QUY CHUẨN KỸ THUẬT & KIẾN TRÚC HIỆN THỰC

### 3.1. Cơ chế phòng thủ đa tầng (Defense in Depth)

Hệ thống bắt buộc triển khai phân quyền đồng bộ trên cả 2 tầng:

1. **Kiểm soát tầng giao diện (Frontend Guard):**
   - Không chỉ sử dụng CSS `display: none` hay thuộc tính `disabled` (vì người dùng có thể dùng F12 DevTools để can thiệp DOM).
   - Với `ROLE_STUDENT`: Mã nguồn template engine (JSP/Thymeleaf/React) **hoàn toàn không kết xuất (render)** mã HTML của các nút `+ THÊM MỚI`, nút `[Sửa]`, nút `[Xóa]` ra cây DOM client.

2. **Kiểm soát tầng điều khiển máy chủ (Backend Controller Guard):**
   - Tại `StudentController`, mọi yêu cầu nghiệp vụ thay đổi dữ liệu đều được chặn và kiểm tra quyền thông qua Middleware hoặc Annotation:
     ```java
     // Minh họa kiểm soát bảo mật Backend Controller
     @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
     @PostMapping("/sinh-vien/them-moi")
     public ResponseEntity<?> themSinhVien(@RequestBody StudentDTO dto) { ... }

     @PreAuthorize("hasRole('ADMIN')")
     @DeleteMapping("/sinh-vien/xoa/{maSV}")
     public ResponseEntity<?> xoaSinhVien(@PathVariable String maSV) { ... }
     ```
   - Nếu `ROLE_STUDENT` cố tình giả lập request gửi lệnh HTTP DELETE hoặc POST, Controller ngay lập tức ngắt phiên và phản hồi mã lỗi `403 Forbidden`.

---

### 3.2. Tiêu chuẩn thiết kế Wireframe học thuật (Square Layout Guidelines)

Tuân thủ quy chuẩn mã hóa CSS nghiêm ngặt đã được Nhóm 11 thống nhất tại biên bản họp số 05:

```css
/* ==========================================================================
   BỘ QUY TẮC CSS WIREFRAME ĐỒ ÁN PHÂN TÍCH THIẾT KẾ HỆ THỐNG - NHÓM 11
   ========================================================================== */

/* 1. Triệt tiêu bo góc toàn hệ thống */
*, *::before, *::after {
    box-sizing: border-box;
    border-radius: 0px !important; /* Loại bỏ toàn bộ bo tròn */
}

/* 2. Đường nét viền sắc nét, tương phản rõ rệt */
body {
    font-family: "Segoe UI", Arial, sans-serif;
    background-color: #ffffff;
    color: #000000;
    margin: 0;
    padding: 0;
}

.wireframe-container {
    width: 1200px;
    margin: 20px auto;
    border: 2px solid #000000;
    padding: 20px;
    background-color: #ffffff;
}

/* 3. Bảng dữ liệu chuẩn công nghiệp */
.table-grid {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.table-grid th, .table-grid td {
    border: 1px solid #000000;
    padding: 8px 12px;
    text-align: left;
}

.table-grid th {
    background-color: #f0f0f0;
    font-weight: bold;
}

/* 4. Trạng thái ô nhập liệu và phân quyền */
.input-control {
    width: 100%;
    height: 36px;
    border: 1px solid #000000;
    padding: 6px 10px;
    outline: none;
}

.input-readonly {
    background-color: #e9ecef;
    cursor: not-allowed;
    border: 1px dashed #666666;
}

/* 5. Nút bấm thao tác vuông vắn */
.btn-action {
    display: inline-block;
    padding: 8px 16px;
    border: 1px solid #000000;
    background-color: #ffffff;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    color: #000000;
}

.btn-action:hover {
    background-color: #e0e0e0;
}

.btn-danger {
    background-color: #000000;
    color: #ffffff;
}

.btn-danger:hover {
    background-color: #333333;
}
```

---

### 3.3. Ánh xạ trường dữ liệu biểu mẫu tới CSDL

Bảng đối chiếu đảm bảo tính toàn vẹn giữa các trường trên Form nhập liệu và lược đồ CSDL vật lý của đề tài:

| Tên trường Form (UI) | Kiểu hiển thị trên Form | Ánh xạ bảng & cột CSDL | Ràng buộc kiểm tra (Validation Rule) |
| :--- | :--- | :--- | :--- |
| **Mã sinh viên (*)** | `input[type=text]` | `tbl_SinhVien(MaSV)` | Bắt buộc; Định dạng 10 chữ số; Khóa PK duy nhất; Khóa `readonly` khi sửa (UC06) |
| **Họ và tên (*)** | `input[type=text]` | `tbl_SinhVien(HoTen)` | Bắt buộc; Không chứa ký tự số hoặc ký tự đặc biệt vô nghĩa |
| **Ngày sinh (*)** | `input[type=date]` | `tbl_SinhVien(NgaySinh)`| Bắt buộc; Định dạng ngày hợp lệ; Tuổi từ 17 đến 35 |
| **Giới tính (*)** | `radio` / `select` | `tbl_SinhVien(GioiTinh)`| Bắt buộc chọn: 'Nam' hoặc 'Nữ' |
| **Lớp sinh hoạt (*)**| `select[options]` | `tbl_SinhVien(MaLop)` | Khóa ngoại tham chiếu `tbl_Lop(MaLop)`; Bắt buộc chọn trong danh mục |
| **Khoa chuyên ngành**| `input[readonly]` | `tbl_Khoa(TenKhoa)` | Tự động lấy tên Khoa tương ứng với Lớp thông qua FK `tbl_Lop(MaKhoa)` |
| **Số điện thoại** | `input[type=tel]` | `tbl_SinhVien(SoDienThoai)`| Tùy chọn; 10 chữ số; Bắt đầu bằng 03, 05, 07, 08, 09 |
| **Email sinh viên** | `input[type=email]`| `tbl_SinhVien(Email)` | Tùy chọn; Định dạng chuẩn RFC (Khuyến nghị đuôi `@haui.edu.vn`) |
| **Quê quán** | `input[type=text]` | `tbl_SinhVien(QueQuan)` | Tùy chọn; Nhập tỉnh/thành phố thường trú |
| **Trạng thái học tập**| `select[options]` | `tbl_SinhVien(TrangThai)`| Bắt buộc chọn: 'Đang học', 'Bảo lưu', 'Thôi học', 'Tốt nghiệp' |

---

### 3.4. Kịch bản kiểm thử giao diện phân quyền (RBAC Test Scenarios)

| Mã TC | Vai trò thử nghiệm | Hành động thực hiện | Kết quả mong đợi |
| :---: | :---: | :--- | :--- |
| **TC-RBAC-01** | `ROLE_STUDENT` | Đăng nhập tài khoản sinh viên `2026601001` | Điều hướng thành công tới màn hình tra cứu; Thanh điều hướng không có mục 'Quản lý tài khoản' |
| **TC-RBAC-02** | `ROLE_STUDENT` | Kiểm tra giao diện bảng danh sách sinh viên | Nút `+ THÊM MỚI`, nút `[Sửa]`, nút `[Xóa]` hoàn toàn không xuất hiện trên giao diện |
| **TC-RBAC-03** | `ROLE_STUDENT` | Nhập trực tiếp URL xóa: `/sinh-vien/xoa/2026601002` | Hệ thống chặn yêu cầu, trả về màn hình lỗi `403 Access Denied` |
| **TC-RBAC-04** | `ROLE_STAFF` | Đăng nhập tài khoản giáo vụ khoa | Hiển thị đầy đủ thanh công cụ tìm kiếm, nút `+ THÊM MỚI`, các nút `[Xem]`, `[Sửa]`, `[Xóa]` trên bảng |
| **TC-RBAC-05** | `ROLE_STAFF` | Nhấn nút `[Sửa]` trên dòng của sinh viên Đỗ Đức Cảnh | Mở Modal Cập nhật (UC06); Ô Mã sinh viên tự động hiển thị giá trị `2026601001` và ở trạng thái không thể chỉnh sửa |
| **TC-RBAC-06** | `ROLE_ADMIN` | Đăng nhập tài khoản quản trị hệ thống | Thanh menu hiển thị đầy đủ phân hệ: Quản lý sinh viên, Quản lý lớp, Quản lý khoa và Quản lý phân quyền tài khoản |
