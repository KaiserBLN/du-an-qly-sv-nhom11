export type RoleType = 'ROLE_ADMIN' | 'ROLE_STAFF' | 'ROLE_STUDENT';

export interface UserSession {
  tenDangNhap: string;
  vaiTro: RoleType;
  trangThai: number;
  maSV: string | null;
  hoTen: string;
  maLop: string;
  tenLop: string;
  maKhoa: string;
  tenKhoa: string;
}

export interface Khoa {
  MaKhoa: string;
  TenKhoa: string;
  DienThoai?: string;
  Email?: string;
  SoLop?: number;
  SoSinhVien?: number;
}

export interface Lop {
  MaLop: string;
  TenLop: string;
  KhoaHoc: string;
  CoVanHocTap?: string;
  MaKhoa: string;
  TenKhoa?: string;
  SiSo?: number;
}

export interface SinhVien {
  MaSV: string;
  HoTen: string;
  NgaySinh: string;
  GioiTinh: 'Nam' | 'Nữ' | 'Khác';
  QueQuan: string;
  SoDienThoai: string;
  Email: string;
  TrangThai: 'Đang học' | 'Bảo lưu' | 'Thôi học' | 'Tốt nghiệp';
  MaLop: string;
  TenLop?: string;
  KhoaHoc?: string;
  CoVanHocTap?: string;
  MaKhoa?: string;
  TenKhoa?: string;
  TenDangNhap?: string | null;
  TaiKhoanVaiTro?: RoleType | null;
  TaiKhoanTrangThai?: number | null;
  isSelf?: boolean;
  isRestrictedView?: boolean;
}

export interface TaiKhoan {
  TenDangNhap: string;
  VaiTro: RoleType;
  TrangThai: number;
  MaSV: string | null;
  TenSinhVien?: string | null;
  MaLop?: string | null;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
}

export interface DatabaseFileInfo {
  name: string;
  active: boolean;
  sizeBytes: number;
  updatedAt: string;
  fullPath: string;
}
