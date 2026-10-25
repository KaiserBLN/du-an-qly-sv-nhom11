import React, { useState, useEffect } from 'react';
import { Khoa, Lop, SinhVien, UserSession } from '../types';
import { SquareDialog } from './SquareDialog';

// ============================================================================
// 1. MODAL XEM CHI TIẾT HỒ SƠ SINH VIÊN
// ============================================================================
interface StudentDetailModalProps {
  open: boolean;
  onClose: () => void;
  student: SinhVien | null;
  currentUser: UserSession;
  onEditRequest: (sv: SinhVien) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  open,
  onClose,
  student,
  currentUser,
  onEditRequest
}) => {
  if (!student) return null;

  const canManage = currentUser.vaiTro === 'ROLE_ADMIN' || currentUser.vaiTro === 'ROLE_STAFF';
  const showAccountSection = canManage || student.MaSV === currentUser.maSV;

  const formatDateVN = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  };

  return (
    <SquareDialog
      open={open}
      onClose={onClose}
      title="Hồ sơ chi tiết sinh viên"
      subtitle={`Mã sinh viên: ${student.MaSV} • ${student.HoTen}`}
      titleId="modal-title-uc04"
      maxWidth="740px"
    >
      <div data-testid="student-detail-modal-content" className="space-y-4 text-sm">
        {/* Khối Ảnh thẻ & Thông tin định danh */}
        <div className="flex flex-wrap gap-5 items-center pb-4 border-b border-[var(--border)]">
          <div className="w-24 h-32 rounded-lg border border-[var(--border)] bg-[var(--raised)] flex flex-col items-center justify-center text-xs font-semibold text-center p-2">
            <span className="text-[var(--text)]">Ảnh thẻ</span>
            <span className="mt-1 text-[11px] font-normal text-[var(--muted)]">3x4</span>
            <span className="mt-1 font-mono text-[var(--text)]">{student.MaSV}</span>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="text-base">
              <span className="text-[var(--muted)]">Mã sinh viên:</span>{' '}
              <span className="font-mono font-semibold text-[var(--text)]">{student.MaSV}</span>
            </div>
            <div className="text-base">
              <span className="text-[var(--muted)]">Họ và tên:</span>{' '}
              <span className="font-semibold text-[var(--text)]">{student.HoTen}</span>
            </div>
            <div>
              <span className="text-[var(--muted)]">Trạng thái học tập:</span>{' '}
              <span className="pill pill-warn">
                {student.TrangThai}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted)]">Phân quyền hệ thống:</span>{' '}
              <span className="font-mono text-xs">{student.TaiKhoanVaiTro || 'ROLE_STUDENT'}</span>
            </div>
          </div>
        </div>

        {/* Mục I. Thông tin đào tạo */}
        <div>
          <div className="text-xs font-semibold text-[var(--muted)] pb-1.5 border-b border-[var(--border)] mb-2.5">
            Thông tin quản lý đào tạo
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 px-1">
            <div>
              <span className="text-[var(--muted)]">Lớp sinh hoạt:</span>{' '}
              <strong className="text-[var(--text)]">
                {student.MaLop} ({student.TenLop || 'KTPM'})
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Khóa đào tạo:</span>{' '}
              <strong className="text-[var(--text)]">{student.KhoaHoc || 'Khóa 17 (2022 - 2026)'}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Khoa đào tạo:</span>{' '}
              <strong className="text-[var(--text)]">{student.TenKhoa || 'Khoa Công nghệ Thông tin'}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Cố vấn học tập:</span>{' '}
              <strong className="text-[var(--text)]">{student.CoVanHocTap || 'TS. Nguyễn Thái Cường'}</strong>
            </div>
          </div>
        </div>

        {/* Mục II. Thông tin cá nhân & liên lạc */}
        <div>
          <div className="text-xs font-semibold text-[var(--muted)] pb-1.5 border-b border-[var(--border)] mb-2.5">
            Thông tin cá nhân &amp; liên lạc
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 px-1">
            <div>
              <span className="text-[var(--muted)]">Ngày sinh:</span>{' '}
              <strong className="text-[var(--text)]">{formatDateVN(student.NgaySinh)}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Giới tính:</span>{' '}
              <strong className="text-[var(--text)]">{student.GioiTinh}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Quê quán:</span>{' '}
              <strong className="text-[var(--text)]">{student.QueQuan || 'Chưa cập nhật'}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Số điện thoại:</span>{' '}
              <strong className="text-[var(--text)]">{student.SoDienThoai || 'Chưa cập nhật'}</strong>
            </div>
            <div className="md:col-span-2">
              <span className="text-[var(--muted)]">Email:</span>{' '}
              <strong className="text-[var(--text)]">{student.Email || 'Chưa cập nhật'}</strong>
            </div>
          </div>
        </div>

        {/* Mục III. Tài khoản hệ thống */}
        {showAccountSection && (
          <div>
            <div className="text-xs font-semibold text-[var(--muted)] pb-1.5 border-b border-[var(--border)] mb-2.5">
              Tài khoản truy cập hệ thống
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 px-1">
              <div>
                <span className="text-[var(--muted)]">Tên đăng nhập:</span>{' '}
                <strong className="font-mono text-[var(--text)]">{student.TenDangNhap || student.MaSV}</strong>
              </div>
              <div>
                <span className="text-[var(--muted)]">Trạng thái tài khoản:</span>{' '}
                <strong className="text-[var(--text)]">
                  {student.TaiKhoanTrangThai === 0 ? 'Bị khóa' : 'Đang hoạt động'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Thanh nút thao tác chức năng */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap justify-end gap-2.5 no-print">
          {canManage && (
            <button
              type="button"
              data-testid="detail-modal-edit-btn"
              onClick={() => {
                onClose();
                onEditRequest(student);
              }}
              className="btn-action btn-primary-wf"
            >
              Chỉnh sửa hồ sơ
            </button>
          )}
          <button type="button" onClick={() => window.print()} className="btn-action">
            In hồ sơ
          </button>
          <button
            type="button"
            data-testid="detail-modal-close-btn"
            onClick={onClose}
            className="btn-action"
          >
            Đóng
          </button>
        </div>
      </div>
    </SquareDialog>
  );
};

// ============================================================================
// 2. MODAL THÊM MỚI / CẬP NHẬT HỒ SƠ SINH VIÊN
// ============================================================================
interface StudentFormModalProps {
  open: boolean;
  mode: 'CREATE' | 'EDIT';
  initialData: SinhVien | null;
  classes: Lop[];
  faculties: Khoa[];
  token: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  open,
  mode,
  initialData,
  classes,
  faculties,
  token,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    MaSV: '',
    HoTen: '',
    NgaySinh: '2006-08-11',
    GioiTinh: 'Nam' as 'Nam' | 'Nữ' | 'Khác',
    MaLop: 'KTPM-03K17',
    SoDienThoai: '',
    Email: '',
    TrangThai: 'Đang học' as 'Đang học' | 'Bảo lưu' | 'Thôi học' | 'Tốt nghiệp',
    QueQuan: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFieldErrors({});
    setServerError(null);
    if (mode === 'EDIT' && initialData) {
      setFormData({
        MaSV: initialData.MaSV,
        HoTen: initialData.HoTen,
        NgaySinh: initialData.NgaySinh,
        GioiTinh: initialData.GioiTinh || 'Nam',
        MaLop: initialData.MaLop || 'KTPM-03K17',
        SoDienThoai: initialData.SoDienThoai || '',
        Email: initialData.Email || '',
        TrangThai: initialData.TrangThai || 'Đang học',
        QueQuan: initialData.QueQuan || ''
      });
    } else {
      setFormData({
        MaSV: '',
        HoTen: '',
        NgaySinh: '2006-05-15',
        GioiTinh: 'Nam',
        MaLop: classes[0]?.MaLop || 'KTPM-03K17',
        SoDienThoai: '',
        Email: '',
        TrangThai: 'Đang học',
        QueQuan: ''
      });
    }
  }, [open, mode, initialData, classes]);

  const selectedClass = classes.find(c => c.MaLop === formData.MaLop);
  const selectedFacultyName =
    selectedClass?.TenKhoa ||
    faculties.find(f => f.MaKhoa === selectedClass?.MaKhoa)?.TenKhoa ||
    'Khoa Công nghệ Thông tin';

  const validateField = (name: string, value: string) => {
    let err = '';
    if (name === 'MaSV' && mode === 'CREATE') {
      if (!/^\d{10}$/.test(value.trim())) {
        err = 'Mã sinh viên gồm đúng 10 chữ số.';
      }
    }
    if (name === 'HoTen') {
      if (!value.trim() || /\d/.test(value)) {
        err = 'Họ và tên bắt buộc nhập và không chứa chữ số.';
      }
    }
    if (name === 'SoDienThoai' && value.trim()) {
      if (!/^(03|05|07|08|09)\d{8}$/.test(value.trim())) {
        err = 'Số điện thoại gồm 10 chữ số hợp lệ.';
      }
    }
    if (name === 'Email' && value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        err = 'Định dạng Email không hợp lệ.';
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: err }));
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const e1 = validateField('MaSV', formData.MaSV);
    const e2 = validateField('HoTen', formData.HoTen);
    const e3 = validateField('SoDienThoai', formData.SoDienThoai);
    const e4 = validateField('Email', formData.Email);

    if (e1 || e2 || e3 || e4) {
      setServerError(e1 || e2 || e3 || e4);
      return;
    }

    setSubmitting(true);
    try {
      const url = mode === 'CREATE' ? '/api/sinh-vien' : `/api/sinh-vien/${formData.MaSV}`;
      const method = mode === 'CREATE' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setServerError(data.message || 'Có lỗi xảy ra khi lưu hồ sơ sinh viên.');
      } else {
        onSuccess(data.message);
        onClose();
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ khi lưu dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SquareDialog
      open={open}
      onClose={onClose}
      title={mode === 'CREATE' ? 'Thêm mới hồ sơ sinh viên' : 'Cập nhật hồ sơ sinh viên'}
      subtitle={
        mode === 'CREATE'
          ? 'Nhập đầy đủ thông tin học vụ và cá nhân của sinh viên'
          : `Mã sinh viên: ${formData.MaSV}`
      }
      titleId="modal-title-uc05-uc06"
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mã sinh viên */}
          <div>
            <label htmlFor="form-masv" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Mã sinh viên (*)
            </label>
            <input
              id="form-masv"
              name="MaSV"
              type="text"
              inputMode="numeric"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={mode === 'EDIT'}
              data-testid="student-form-masv"
              value={formData.MaSV}
              onChange={e => {
                setFormData({ ...formData, MaSV: e.target.value });
                if (fieldErrors.MaSV) setFieldErrors({ ...fieldErrors, MaSV: '' });
              }}
              onBlur={e => validateField('MaSV', e.target.value)}
              placeholder="Nhập 10 chữ số (VD: 2026601099)"
              className={`input-control ${mode === 'EDIT' ? 'input-readonly' : ''}`}
              required
            />
            {fieldErrors.MaSV && (
              <div className="text-xs text-[var(--negative)] mt-1">{fieldErrors.MaSV}</div>
            )}
          </div>

          {/* Họ và tên */}
          <div>
            <label htmlFor="form-hoten" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Họ và tên (*)
            </label>
            <input
              id="form-hoten"
              name="HoTen"
              type="text"
              data-testid="student-form-hoten"
              value={formData.HoTen}
              onChange={e => {
                setFormData({ ...formData, HoTen: e.target.value });
                if (fieldErrors.HoTen) setFieldErrors({ ...fieldErrors, HoTen: '' });
              }}
              onBlur={e => validateField('HoTen', e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className="input-control"
              required
            />
            {fieldErrors.HoTen && (
              <div className="text-xs text-[var(--negative)] mt-1">{fieldErrors.HoTen}</div>
            )}
          </div>

          {/* Ngày sinh */}
          <div>
            <label htmlFor="form-ngaysinh" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Ngày sinh (*)
            </label>
            <input
              id="form-ngaysinh"
              name="NgaySinh"
              type="date"
              data-testid="student-form-ngaysinh"
              value={formData.NgaySinh}
              onChange={e => setFormData({ ...formData, NgaySinh: e.target.value })}
              className="input-control"
              required
            />
          </div>

          {/* Giới tính */}
          <div>
            <span className="block font-medium text-xs text-[var(--muted)] mb-1">Giới tính (*)</span>
            <div className="flex items-center gap-6 h-[36px] px-3 rounded-md border border-[var(--control)] bg-[var(--surface)]">
              {(['Nam', 'Nữ', 'Khác'] as const).map(gt => (
                <label key={gt} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="GioiTinh"
                    value={gt}
                    checked={formData.GioiTinh === gt}
                    onChange={() => setFormData({ ...formData, GioiTinh: gt })}
                  />
                  <span>{gt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lớp sinh hoạt */}
          <div>
            <label htmlFor="form-malop" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Lớp sinh hoạt (*)
            </label>
            <select
              id="form-malop"
              name="MaLop"
              data-testid="student-form-malop"
              value={formData.MaLop}
              onChange={e => setFormData({ ...formData, MaLop: e.target.value })}
              className="input-control"
              required
            >
              {classes.map(c => (
                <option key={c.MaLop} value={c.MaLop}>
                  {c.MaLop} - {c.TenLop}
                </option>
              ))}
            </select>
          </div>

          {/* Khoa đào tạo */}
          <div>
            <label htmlFor="form-khoa" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Khoa đào tạo
            </label>
            <input
              id="form-khoa"
              type="text"
              readOnly
              value={selectedFacultyName}
              className="input-control input-readonly"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="form-sdt" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Số điện thoại
            </label>
            <input
              id="form-sdt"
              name="SoDienThoai"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              data-testid="student-form-sdt"
              value={formData.SoDienThoai}
              onChange={e => {
                setFormData({ ...formData, SoDienThoai: e.target.value });
                if (fieldErrors.SoDienThoai) setFieldErrors({ ...fieldErrors, SoDienThoai: '' });
              }}
              onBlur={e => validateField('SoDienThoai', e.target.value)}
              placeholder="0987654321"
              className="input-control"
            />
            {fieldErrors.SoDienThoai && (
              <div className="text-xs text-[var(--negative)] mt-1">
                {fieldErrors.SoDienThoai}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="form-email" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Email
            </label>
            <input
              id="form-email"
              name="Email"
              type="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-testid="student-form-email"
              value={formData.Email}
              onChange={e => {
                setFormData({ ...formData, Email: e.target.value });
                if (fieldErrors.Email) setFieldErrors({ ...fieldErrors, Email: '' });
              }}
              onBlur={e => validateField('Email', e.target.value)}
              placeholder="sinhvien@edu.vn"
              className="input-control"
            />
            {fieldErrors.Email && (
              <div className="text-xs text-[var(--negative)] mt-1">{fieldErrors.Email}</div>
            )}
          </div>

          {/* Trạng thái học tập */}
          <div>
            <label htmlFor="form-trangthai" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Trạng thái học tập (*)
            </label>
            <select
              id="form-trangthai"
              name="TrangThai"
              value={formData.TrangThai}
              onChange={e =>
                setFormData({
                  ...formData,
                  TrangThai: e.target.value as SinhVien['TrangThai']
                })
              }
              className="input-control"
            >
              <option value="Đang học">Đang học</option>
              <option value="Bảo lưu">Bảo lưu</option>
              <option value="Thôi học">Thôi học</option>
              <option value="Tốt nghiệp">Tốt nghiệp</option>
            </select>
          </div>

          {/* Quê quán */}
          <div>
            <label htmlFor="form-quequan" className="block font-medium text-xs text-[var(--muted)] mb-1">
              Quê quán
            </label>
            <input
              id="form-quequan"
              name="QueQuan"
              type="text"
              data-testid="student-form-quequan"
              value={formData.QueQuan}
              onChange={e => setFormData({ ...formData, QueQuan: e.target.value })}
              placeholder="Tỉnh / Thành phố"
              className="input-control"
            />
          </div>
        </div>

        <div aria-live="polite">
          {serverError && (
            <div
              data-testid="student-form-error"
              className="p-3 rounded-md border border-[var(--negative)]/30 bg-[var(--pill-negative-bg)] text-[var(--negative)] text-xs"
            >
              {serverError}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            type="button"
            data-testid="student-form-cancel-btn"
            onClick={onClose}
            className="btn-action px-5 py-1.5"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid="student-form-save-btn"
            className="btn-action btn-primary-wf px-5 py-1.5"
          >
            {submitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </SquareDialog>
  );
};

// ============================================================================
// 3. MODAL XÁC NHẬN XÓA HỒ SƠ AN TOÀN
// ============================================================================
interface DeleteConfirmModalProps {
  open: boolean;
  student: SinhVien | null;
  token: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  student,
  token,
  onClose,
  onSuccess
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfirmText('');
    setErrorMsg(null);
  }, [open, student]);

  if (!student) return null;

  const isConfirmed = confirmText.trim() === 'XACNHAN';

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setErrorMsg('Vui lòng gõ chính xác chữ "XACNHAN" vào ô xác thực.');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/sinh-vien/${student.MaSV}?confirm=XACNHAN`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Không thể xóa hồ sơ sinh viên.');
      } else {
        onSuccess(data.message);
        onClose();
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi thực hiện xóa.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SquareDialog
      open={open}
      onClose={onClose}
      title="Xác nhận xóa hồ sơ sinh viên"
      titleId="modal-title-uc07"
      maxWidth="560px"
    >
      <form onSubmit={handleConfirmDelete} className="space-y-4 text-sm">
        <div className="font-medium text-[var(--text)]">
          Bạn có chắc chắn muốn xóa hồ sơ sinh viên sau khỏi hệ thống?
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--raised)] space-y-1">
          <div>
            <span className="text-[var(--muted)]">Mã sinh viên:</span>{' '}
            <span className="font-mono font-medium text-[var(--text)]">{student.MaSV}</span>
          </div>
          <div>
            <span className="text-[var(--muted)]">Họ và tên:</span> <strong className="text-[var(--text)]">{student.HoTen}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Lớp sinh hoạt:</span>{' '}
            <strong className="text-[var(--text)]">{student.MaLop}</strong>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-[var(--negative)]/30 bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)] space-y-1 text-xs">
          <div className="font-semibold">Lưu ý quan trọng:</div>
          <div>• Hồ sơ sinh viên và tài khoản liên kết sẽ bị xóa vĩnh viễn.</div>
          <div>• Thao tác này không thể hoàn tác sau khi xác nhận.</div>
        </div>

        <div>
          <label htmlFor="delete-confirm-input" className="block font-medium text-xs text-[var(--muted)] mb-1">
            Nhập &ldquo;XACNHAN&rdquo; để xác thực thao tác xóa:
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            data-testid="delete-confirm-input"
            value={confirmText}
            onChange={e => {
              setConfirmText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="XACNHAN"
            className="input-control font-mono"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-md border border-[var(--negative)]/30 bg-[var(--pill-negative-bg)] text-[var(--negative)] text-xs">
            {errorMsg}
          </div>
        )}

        <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            type="button"
            data-testid="delete-confirm-cancel-btn"
            onClick={onClose}
            className="btn-action px-5 py-1.5"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={!isConfirmed || deleting}
            data-testid="delete-confirm-submit-btn"
            className="btn-action btn-danger-wf px-5 py-1.5"
          >
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </form>
    </SquareDialog>
  );
};
