import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  UserCircle,
  Building2,
  ShieldCheck,
  BarChart3,
  Search,
  RotateCcw,
  UserPlus,
  Download,
  Eye,
  Pencil,
  Trash2,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  Database,
  Activity,
  LayoutDashboard,
  KeyRound
} from 'lucide-react';
import { Khoa, Lop, SinhVien, UserSession } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './components/LoginView';
import {
  DeleteConfirmModal,
  StudentDetailModal,
  StudentFormModal
} from './components/StudentModals';
import {
  AccountRBACView,
  ClassFacultyView,
  DashboardAndDbView,
  StudentSelfProfileView
} from './components/AdminModulesView';

type ActiveTab = 'STUDENTS' | 'CLASSES_FACULTIES' | 'RBAC_ACCOUNTS' | 'DASHBOARD_DB' | 'MY_PROFILE';

const MainPortal: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qlsv_token'));
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('qlsv_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('STUDENTS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [rbac403Banner, setRbac403Banner] = useState<string | null>(null);

  // Dữ liệu danh mục & bảng sinh viên
  const [students, setStudents] = useState<SinhVien[]>([]);
  const [classes, setClasses] = useState<Lop[]>([]);
  const [faculties, setFaculties] = useState<Khoa[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(7);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bộ lọc tìm kiếm đa tiêu chí
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [filterLop, setFilterLop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Chọn hàng loạt
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Trạng thái các Modal
  const [detailStudent, setDetailStudent] = useState<SinhVien | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingStudent, setEditingStudent] = useState<SinhVien | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<SinhVien | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // Đồng bộ đường dẫn URL riêng biệt cho từng phân hệ sau khi đăng nhập
  useEffect(() => {
    if (!token || !currentUser) {
      window.history.replaceState(null, '', '/login');
    } else if (currentUser.vaiTro === 'ROLE_ADMIN') {
      window.history.replaceState(null, '', '/admin-portal');
    } else if (currentUser.vaiTro === 'ROLE_STAFF') {
      window.history.replaceState(null, '', '/staff-portal');
    } else {
      window.history.replaceState(null, '', '/student-portal');
    }
  }, [token, currentUser]);

  const handleLoginSuccess = (newToken: string, user: UserSession) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem('qlsv_token', newToken);
    localStorage.setItem('qlsv_user', JSON.stringify(user));
    setActiveTab('STUDENTS');
    setPage(1);
    setRbac403Banner(null);
    showToast(
      user.vaiTro === 'ROLE_ADMIN'
        ? `Chào mừng Quản trị viên ${user.hoTen}! Đã chuyển hướng vào Trang Quản trị Hệ thống.`
        : `Xin chào ${user.hoTen}! Đã đăng nhập hệ thống thành công.`
    );
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore
      }
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('qlsv_token');
    localStorage.removeItem('qlsv_user');
  };

  const loadMetadata = useCallback(async () => {
    if (!token) return;
    try {
      const [resK, resL] = await Promise.all([
        fetch('/api/khoa', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/lop', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const dK = await resK.json();
      const dL = await resL.json();
      if (dK.success) setFaculties(dK.data);
      if (dL.success) setClasses(dL.data);
    } catch {
      // ignore
    }
  }, [token]);

  const loadStudents = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (appliedSearch) params.set('search', appliedSearch);
      if (filterKhoa) params.set('maKhoa', filterKhoa);
      if (filterLop) params.set('maLop', filterLop);
      if (filterStatus) params.set('trangThai', filterStatus);

      const res = await fetch(`/api/sinh-vien?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setSelectedIds([]);
      }
    } catch {
      // ignore
    }
  }, [token, page, limit, appliedSearch, filterKhoa, filterLop, filterStatus]);

  useEffect(() => {
    if (token && currentUser) {
      loadMetadata();
      loadStudents();
    }
  }, [token, currentUser, loadMetadata, loadStudents]);

  if (!token || !currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.vaiTro === 'ROLE_ADMIN';
  const isStaff = currentUser.vaiTro === 'ROLE_STAFF';
  const isStudent = currentUser.vaiTro === 'ROLE_STUDENT';
  const canManageStudents = isAdmin || isStaff;

  const formatDateVN = (iso: string) => {
    if (!iso) return '';
    const p = iso.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return 'SV';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setFilterKhoa('');
    setFilterLop('');
    setFilterStatus('');
    setPage(1);
  };

  const handleOpenDetail = async (sv: SinhVien) => {
    try {
      const res = await fetch(`/api/sinh-vien/${sv.MaSV}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDetailStudent(data.data);
      } else {
        setDetailStudent(sv);
      }
    } catch {
      setDetailStudent(sv);
    }
  };

  const handleSimulateUnauthorizedDelete = async () => {
    const res = await fetch('/sinh-vien/xoa/2026601002', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.status === 403) {
      setRbac403Banner(`HTTP 403 Forbidden: ${data.message}`);
    } else {
      setRbac403Banner(`HTTP ${res.status}: ${data.message}`);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'MaSV',
      'HoTen',
      'NgaySinh',
      'GioiTinh',
      'MaLop',
      'TenKhoa',
      'SoDienThoai',
      'Email',
      'QueQuan',
      'TrangThai'
    ];
    const csvRows = [
      headers.join(','),
      ...students.map(s =>
        [
          s.MaSV,
          `"${s.HoTen}"`,
          s.NgaySinh,
          s.GioiTinh,
          s.MaLop,
          `"${s.TenKhoa || ''}"`,
          s.SoDienThoai || '',
          s.Email || '',
          `"${s.QueQuan || ''}"`,
          `"${s.TrangThai}"`
        ].join(',')
      )
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_Sach_Sinh_Vien_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp CSV danh sách sinh viên thành công!');
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map(s => s.MaSV));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (maSV: string) => {
    setSelectedIds(prev =>
      prev.includes(maSV) ? prev.filter(id => id !== maSV) : [...prev, maSV]
    );
  };

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  const renderStudentSection = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h1 className="text-lg font-semibold m-0 text-[var(--text)]">
            {isStudent
              ? `Danh sách sinh viên lớp ${currentUser.maLop}`
              : 'Quản lý hồ sơ sinh viên'}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5 m-0">
            Tra cứu, lọc đa tiêu chí và quản trị thông tin học vụ
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {canManageStudents && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-action"
            >
              <Download className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Xuất CSV</span>
            </button>
          )}

          {isStudent && (
            <button
              type="button"
              data-testid="simulate-403-btn"
              onClick={handleSimulateUnauthorizedDelete}
              className="btn-action text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--negative)]" />
              <span>Thử nghiệm RBAC</span>
            </button>
          )}
        </div>
      </div>

      {/* Form bộ lọc đa tiêu chí */}
      {canManageStudents ? (
        <section className="wf-card p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label htmlFor="search-keyword" className="block font-medium text-[var(--muted)] mb-1">
                  Từ khóa tra cứu
                </label>
                <input
                  id="search-keyword"
                  data-testid="search-keyword-input"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Mã SV, Họ tên sinh viên..."
                  className="input-control"
                />
              </div>

              <div>
                <label htmlFor="filter-khoa" className="block font-medium text-[var(--muted)] mb-1">
                  Khoa đào tạo
                </label>
                <select
                  id="filter-khoa"
                  data-testid="filter-khoa-select"
                  value={filterKhoa}
                  onChange={e => {
                    setFilterKhoa(e.target.value);
                    setFilterLop('');
                    setPage(1);
                  }}
                  className="input-control"
                >
                  <option value="">Tất cả các Khoa</option>
                  {faculties.map(k => (
                    <option key={k.MaKhoa} value={k.MaKhoa}>
                      {k.TenKhoa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-lop" className="block font-medium text-[var(--muted)] mb-1">
                  Lớp sinh hoạt
                </label>
                <select
                  id="filter-lop"
                  data-testid="filter-lop-select"
                  value={filterLop}
                  onChange={e => {
                    setFilterLop(e.target.value);
                    setPage(1);
                  }}
                  className="input-control"
                >
                  <option value="">Tất cả các Lớp</option>
                  {classes
                    .filter(c => !filterKhoa || c.MaKhoa === filterKhoa)
                    .map(c => (
                      <option key={c.MaLop} value={c.MaLop}>
                        {c.MaLop} - {c.TenLop}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-status" className="block font-medium text-[var(--muted)] mb-1">
                  Trạng thái
                </label>
                <select
                  id="filter-status"
                  data-testid="filter-status-select"
                  value={filterStatus}
                  onChange={e => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className="input-control"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Đang học">Đang học</option>
                  <option value="Bảo lưu">Bảo lưu</option>
                  <option value="Thôi học">Thôi học</option>
                  <option value="Tốt nghiệp">Tốt nghiệp</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <button
                type="submit"
                data-testid="search-submit-btn"
                className="btn-action btn-primary-wf"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tìm kiếm</span>
              </button>
              <button
                type="button"
                data-testid="search-reset-btn"
                onClick={handleResetFilters}
                className="btn-action"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
              <button
                type="button"
                data-testid="add-student-btn"
                onClick={() => {
                  setFormMode('CREATE');
                  setEditingStudent(null);
                  setFormModalOpen(true);
                }}
                className="btn-action btn-gold-modern ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Thêm sinh viên</span>
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="wf-card p-4">
          <div className="font-semibold text-xs pb-2 mb-3 border-b border-[var(--border)] text-[var(--text)]">
            Tìm kiếm sinh viên trong lớp ({currentUser.maLop})
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 text-xs">
            <input
              type="text"
              data-testid="search-keyword-input"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Nhập tên hoặc mã sinh viên..."
              className="input-control flex-1"
            />
            <button
              type="submit"
              data-testid="search-submit-btn"
              className="btn-action btn-primary-wf px-5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
            <button type="button" onClick={handleResetFilters} className="btn-action">
              Làm mới
            </button>
          </form>
        </section>
      )}

      {/* Bảng dữ liệu sinh viên */}
      <section className="wf-card p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 pb-3 mb-3 border-b border-[var(--border)] text-xs text-[var(--muted)]">
          {canManageStudents ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--text)] font-medium">
                <input
                  type="checkbox"
                  checked={students.length > 0 && selectedIds.length === students.length}
                  onChange={e => toggleSelectAll(e.target.checked)}
                />
                <span>Đã chọn ({selectedIds.length})</span>
              </label>
              <span>|</span>
              <span>Danh sách hồ sơ sinh viên</span>
            </div>
          ) : (
            <div>Danh sách sinh viên cùng lớp sinh hoạt</div>
          )}

          <div className="pill pill-neutral font-medium">
            Tổng số: <span data-testid="total-student-count">{total}</span> SV
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-grid" data-testid="students-table">
            <thead>
              <tr>
                {canManageStudents && <th style={{ width: '36px' }}>#</th>}
                <th style={{ width: '56px' }}>STT</th>
                <th>Mã SV</th>
                <th>Họ và tên</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Lớp</th>
                <th>{canManageStudents ? 'Thao tác' : 'Chi tiết'}</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageStudents ? 8 : 7}
                    className="text-center py-8 text-[var(--muted)]"
                  >
                    Không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((sv, index) => {
                  const stt = (page - 1) * limit + index + 1;
                  return (
                    <tr key={sv.MaSV} data-testid={`student-row-${sv.MaSV}`}>
                      {canManageStudents && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sv.MaSV)}
                            onChange={() => toggleSelectOne(sv.MaSV)}
                            aria-label={`Chọn sinh viên ${sv.HoTen}`}
                          />
                        </td>
                      )}
                      <td className="text-[var(--muted)] font-mono">{stt}</td>
                      <td className="font-mono">
                        <span className="px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--text)]">
                          {sv.MaSV}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--text)] shrink-0">
                            {getInitials(sv.HoTen)}
                          </span>
                          <div>
                            <div className="font-medium text-[var(--text)]">
                              {sv.HoTen}
                              {sv.isSelf && isStudent ? ' (Tôi)' : ''}
                            </div>
                            <div className="text-xs text-[var(--muted)]">
                              {sv.Email || `${sv.MaSV}@sv.edu.vn`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDateVN(sv.NgaySinh)}</td>
                      <td>
                        <span className="pill pill-neutral text-xs">
                          {sv.GioiTinh}
                        </span>
                      </td>
                      <td className="font-mono">
                        <span className="px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] text-xs">
                          {sv.MaLop}
                        </span>
                      </td>
                      <td>
                        {canManageStudents ? (
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              data-testid={`btn-view-${sv.MaSV}`}
                              onClick={() => handleOpenDetail(sv)}
                              className="btn-action text-xs py-1 px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
                              <span>Xem</span>
                            </button>
                            <button
                              type="button"
                              data-testid={`btn-edit-${sv.MaSV}`}
                              onClick={() => {
                                setFormMode('EDIT');
                                setEditingStudent(sv);
                                setFormModalOpen(true);
                              }}
                              className="btn-action text-xs py-1 px-2.5"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[var(--muted)]" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              data-testid={`btn-delete-${sv.MaSV}`}
                              onClick={() => setDeletingStudent(sv)}
                              className="btn-action text-xs py-1 px-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[var(--negative)]" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-testid={`btn-view-${sv.MaSV}`}
                            onClick={() => handleOpenDetail(sv)}
                            className="btn-action text-xs py-1 px-2.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
                            <span>Xem chi tiết</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang */}
        <div className="flex flex-wrap justify-between items-center gap-3 mt-4 text-xs font-medium">
          <div data-testid="pagination-summary" className="text-[var(--muted)]">
            Hiển thị bản ghi: {startIdx} - {endIdx} / {total}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" data-testid="pagination-controls">
            <span className="text-[var(--muted)]">Trang:</span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="btn-action text-xs py-1 px-2"
            >
              |&lt;
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-action text-xs py-1 px-2"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
              <button
                key={pNum}
                type="button"
                data-testid={`page-btn-${pNum}`}
                onClick={() => setPage(pNum)}
                className={`btn-action text-xs py-1 px-2.5 ${
                  page === pNum ? 'btn-primary-wf' : ''
                }`}
              >
                {pNum}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn-action text-xs py-1 px-2"
            >
              &gt;
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="btn-action text-xs py-1 px-2"
            >
              &gt;|
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // ==========================================================================
  // TRANG RIÊNG BIỆT DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG (ROLE_ADMIN WORKSPACE)
  // Framed-Sheet style: Tinted L-frame (#f9fbfc), white sheet inset 8px
  // ==========================================================================
  if (isAdmin) {
    return (
      <div
        data-testid="admin-dedicated-workspace"
        className="min-h-screen flex flex-col lg:flex-row bg-[var(--ground)]"
      >
        {/* LEFT SIDEBAR CHUYÊN BIỆT CỦA ADMIN: 228px, background #f9fbfc */}
        <aside className="w-full lg:w-[228px] shrink-0 bg-[var(--ground)] flex flex-col justify-between p-3.5 no-print">
          <div>
            {/* Brand Header trong Sidebar */}
            <div className="px-2 py-3 mb-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[var(--text)] truncate">
                  Admin Portal
                </div>
                <div className="text-[11px] text-[var(--muted)] truncate">
                  Quản trị hệ thống
                </div>
              </div>
            </div>

            {/* Thông tin Quản trị viên */}
            <div className="p-2.5 mb-3 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--text)] shrink-0">
                {getInitials(currentUser.hoTen)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-[var(--text)] truncate">{currentUser.hoTen}</div>
                <div className="text-[11px] text-[var(--muted)] font-mono truncate">
                  {currentUser.tenDangNhap}
                </div>
              </div>
            </div>

            {/* Menu điều hướng dọc dành riêng cho Admin */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-medium text-[var(--faint)]">
                Danh mục quản trị
              </div>

              <button
                type="button"
                data-testid="nav-students-btn"
                onClick={() => setActiveTab('STUDENTS')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer border-0 text-left ${
                  activeTab === 'STUDENTS'
                    ? 'bg-[var(--active)] text-[var(--text)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)] bg-transparent'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Hồ sơ sinh viên</span>
              </button>

              <button
                type="button"
                data-testid="nav-rbac-btn"
                onClick={() => setActiveTab('RBAC_ACCOUNTS')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer border-0 text-left ${
                  activeTab === 'RBAC_ACCOUNTS'
                    ? 'bg-[var(--active)] text-[var(--text)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)] bg-transparent'
                }`}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Tài khoản &amp; phân quyền</span>
              </button>

              <button
                type="button"
                data-testid="nav-classes-btn"
                onClick={() => setActiveTab('CLASSES_FACULTIES')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer border-0 text-left ${
                  activeTab === 'CLASSES_FACULTIES'
                    ? 'bg-[var(--active)] text-[var(--text)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)] bg-transparent'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Danh mục lớp &amp; khoa</span>
              </button>

              <button
                type="button"
                data-testid="nav-dashboard-btn"
                onClick={() => setActiveTab('DASHBOARD_DB')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer border-0 text-left ${
                  activeTab === 'DASHBOARD_DB'
                    ? 'bg-[var(--active)] text-[var(--text)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)] bg-transparent'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Quản trị cơ sở dữ liệu</span>
              </button>
            </div>
          </div>

          {/* Khu vực trạng thái & Đăng xuất ở đáy Sidebar */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <div className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)]">
              <div className="flex items-center gap-2 text-[var(--positive)] font-medium">
                <Activity className="w-3.5 h-3.5" />
                <span>Trực tuyến</span>
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Phiên quản trị viên
              </div>
            </div>

            <button
              type="button"
              data-testid="logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium text-[var(--negative)] hover:bg-[var(--pill-negative-bg)] border border-[var(--border)] hover:border-[var(--negative)]/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* VÙNG KHÔNG GIAN LÀM VIỆC CHÍNH CỦA ADMIN: 48px top bar on ground + inset white sheet */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--ground)]">
          {/* Topbar của Trang Quản trị: 48px height on ground */}
          <header className="h-12 px-6 flex justify-between items-center text-xs no-print">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-[var(--muted)]" />
              <span className="font-medium text-[var(--text)]">
                Trung tâm Quản trị Hệ thống Đào tạo
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                data-testid="header-user-badge"
                className="pill pill-neutral font-medium"
              >
                Quản trị viên: {currentUser.hoTen}
              </span>
            </div>
          </header>

          {/* Inset White Sheet: 16px radius, 1px border */}
          <div className="framed-sheet-canvas p-6 flex-1">
            {/* Dải 4 Thẻ KPI: Single divided container */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--border)] rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)] bg-[var(--surface)] mb-5 no-print">
              <div className="p-4">
                <div className="text-xs font-normal text-[var(--muted)]">Tổng sinh viên</div>
                <div className="text-2xl font-normal text-[var(--text)] mt-1">{total}</div>
              </div>

              <div className="p-4">
                <div className="text-xs font-normal text-[var(--muted)]">Lớp sinh hoạt</div>
                <div className="text-2xl font-normal text-[var(--text)] mt-1">{classes.length}</div>
              </div>

              <div className="p-4">
                <div className="text-xs font-normal text-[var(--muted)]">Khoa đào tạo</div>
                <div className="text-2xl font-normal text-[var(--text)] mt-1">{faculties.length}</div>
              </div>

              <div
                onClick={() => setActiveTab('DASHBOARD_DB')}
                className="p-4 cursor-pointer hover:bg-[var(--raised)]"
              >
                <div className="text-xs font-normal text-[var(--muted)]">Cơ sở dữ liệu</div>
                <div className="text-sm font-medium text-[var(--accent)] mt-1.5">
                  Quản lý &amp; chuyển đổi →
                </div>
              </div>
            </div>

            {/* Thông báo Toast */}
            <div className="space-y-2 mb-4 no-print" aria-live="polite">
              {toastMsg && (
                <div
                  data-testid="toast-notification"
                  className="p-3 rounded-md border border-[var(--positive)]/30 bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)] text-xs font-medium flex justify-between items-center"
                >
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--positive)] shrink-0" />
                    <span>{toastMsg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setToastMsg(null)}
                    className="btn-action text-xs py-0.5 px-2"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>

            {/* Nội dung phân hệ đang chọn của Admin */}
            <main className="flex-1">
              {activeTab === 'STUDENTS' && renderStudentSection()}

              {activeTab === 'RBAC_ACCOUNTS' && (
                <AccountRBACView token={token} onNotify={showToast} />
              )}

              {activeTab === 'CLASSES_FACULTIES' && (
                <ClassFacultyView
                  classes={classes}
                  faculties={faculties}
                  token={token}
                  onRefresh={() => {
                    loadMetadata();
                    loadStudents();
                  }}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'DASHBOARD_DB' && (
                <DashboardAndDbView
                  token={token}
                  currentUser={currentUser}
                  onDatabaseSwitched={() => {
                    loadMetadata();
                    loadStudents();
                  }}
                  onNotify={showToast}
                />
              )}
            </main>

            <footer className="mt-8 pt-4 border-t border-[var(--border)] text-[var(--muted)] text-xs flex flex-wrap justify-between items-center no-print">
              <span>© 2026 Hệ thống Quản lý Sinh viên • GVHD: TS. Nguyễn Thái Cường</span>
              <span>Nhóm 11: Đỗ Đức Cảnh, Nguyễn Đức Thái, Nguyễn Tuấn Linh, Hoàng Duy Đức</span>
            </footer>
          </div>
        </div>

        {/* Các cửa sổ Modal */}
        <StudentDetailModal
          open={Boolean(detailStudent)}
          onClose={() => setDetailStudent(null)}
          student={detailStudent}
          currentUser={currentUser}
          onEditRequest={sv => {
            setFormMode('EDIT');
            setEditingStudent(sv);
            setFormModalOpen(true);
          }}
        />
        <StudentFormModal
          open={formModalOpen}
          mode={formMode}
          initialData={editingStudent}
          classes={classes}
          faculties={faculties}
          token={token}
          onClose={() => setFormModalOpen(false)}
          onSuccess={msg => {
            showToast(msg);
            loadStudents();
            loadMetadata();
          }}
        />
        <DeleteConfirmModal
          open={Boolean(deletingStudent)}
          student={deletingStudent}
          token={token}
          onClose={() => setDeletingStudent(null)}
          onSuccess={msg => {
            showToast(msg);
            loadStudents();
            loadMetadata();
          }}
        />
      </div>
    );
  }

  // ==========================================================================
  // TRANG CỔNG GIÁO VỤ (ROLE_STAFF) & CỔNG SINH VIÊN (ROLE_STUDENT)
  // Framed-Sheet style: Inset sheet container, 1px border, no shadow
  // ==========================================================================
  return (
    <div className="wireframe-container">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)] no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text)]">
              {isStudent ? 'Cổng Thông tin Sinh viên' : 'Cổng Nghiệp vụ Đào tạo'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              Hệ thống Quản lý Hồ sơ Sinh viên • Nhóm 11
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div
            data-testid="header-user-badge"
            className="pill pill-neutral font-medium"
          >
            <span>
              {currentUser.hoTen} ({currentUser.tenDangNhap})
            </span>
          </div>

          <button
            type="button"
            data-testid="logout-btn"
            onClick={handleLogout}
            className="btn-action text-xs text-[var(--negative)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Thanh điều hướng ngang cho Staff / Student: Tabs with clean neutral indicator */}
      <nav
        aria-label="Thanh điều hướng phân hệ"
        className="flex flex-wrap gap-1.5 px-6 py-2.5 border-b border-[var(--border)] bg-[var(--ground)] text-xs font-medium text-[var(--muted)] no-print"
      >
        <button
          type="button"
          data-testid="nav-students-btn"
          onClick={() => setActiveTab('STUDENTS')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer border ${
            activeTab === 'STUDENTS'
              ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] font-semibold'
              : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--raised)] hover:text-[var(--text)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isStudent ? `Danh sách lớp ${currentUser.maLop}` : 'Hồ sơ Sinh viên'}</span>
        </button>

        {isStudent && (
          <button
            type="button"
            data-testid="nav-my-profile-btn"
            onClick={() => setActiveTab('MY_PROFILE')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer border ${
              activeTab === 'MY_PROFILE'
                ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] font-semibold'
                : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--raised)] hover:text-[var(--text)]'
            }`}
          >
            <UserCircle className="w-4 h-4" />
            <span>Hồ sơ cá nhân</span>
          </button>
        )}

        {canManageStudents && (
          <button
            type="button"
            data-testid="nav-classes-btn"
            onClick={() => setActiveTab('CLASSES_FACULTIES')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer border ${
              activeTab === 'CLASSES_FACULTIES'
                ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] font-semibold'
                : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--raised)] hover:text-[var(--text)]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Lớp &amp; Khoa</span>
          </button>
        )}

        <button
          type="button"
          data-testid="nav-dashboard-btn"
          onClick={() => setActiveTab('DASHBOARD_DB')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer border ${
            activeTab === 'DASHBOARD_DB'
              ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] font-semibold'
              : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--raised)] hover:text-[var(--text)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Thống kê</span>
        </button>
      </nav>

      {/* Thông báo Toast và Cảnh báo 403 Forbidden */}
      <div className="px-6 pt-4 space-y-2 no-print" aria-live="polite">
        {toastMsg && (
          <div
            data-testid="toast-notification"
            className="p-3 rounded-md border border-[var(--positive)]/30 bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)] text-xs font-medium flex justify-between items-center"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--positive)] shrink-0" />
              <span>{toastMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="btn-action text-xs py-0.5 px-2"
            >
              Đóng
            </button>
          </div>
        )}

        {rbac403Banner && (
          <div
            data-testid="rbac-403-banner"
            className="p-3 rounded-md border border-[var(--negative)]/40 bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)] font-semibold text-xs flex justify-between items-center"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--negative)] shrink-0" />
              <span>{rbac403Banner}</span>
            </span>
            <button
              type="button"
              onClick={() => setRbac403Banner(null)}
              className="btn-action text-xs py-0.5 px-2"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Khu vực nội dung chính */}
      <main className="p-6 bg-[var(--surface)]">
        {activeTab === 'STUDENTS' && renderStudentSection()}

        {activeTab === 'MY_PROFILE' && isStudent && (
          <StudentSelfProfileView
            currentUser={currentUser}
            token={token}
            onNotify={msg => {
              showToast(msg);
              loadStudents();
            }}
          />
        )}

        {activeTab === 'CLASSES_FACULTIES' && canManageStudents && (
          <ClassFacultyView
            classes={classes}
            faculties={faculties}
            token={token}
            onRefresh={() => {
              loadMetadata();
              loadStudents();
            }}
            onNotify={showToast}
          />
        )}

        {activeTab === 'DASHBOARD_DB' && (
          <DashboardAndDbView
            token={token}
            currentUser={currentUser}
            onDatabaseSwitched={() => {
              loadMetadata();
              loadStudents();
            }}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Các cửa sổ Modal */}
      <StudentDetailModal
        open={Boolean(detailStudent)}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        currentUser={currentUser}
        onEditRequest={sv => {
          setFormMode('EDIT');
          setEditingStudent(sv);
          setFormModalOpen(true);
        }}
      />

      {canManageStudents && (
        <>
          <StudentFormModal
            open={formModalOpen}
            mode={formMode}
            initialData={editingStudent}
            classes={classes}
            faculties={faculties}
            token={token}
            onClose={() => setFormModalOpen(false)}
            onSuccess={msg => {
              showToast(msg);
              loadStudents();
              loadMetadata();
            }}
          />

          <DeleteConfirmModal
            open={Boolean(deletingStudent)}
            student={deletingStudent}
            token={token}
            onClose={() => setDeletingStudent(null)}
            onSuccess={msg => {
              showToast(msg);
              loadStudents();
              loadMetadata();
            }}
          />
        </>
      )}

      {/* Footer */}
      <footer className="flex flex-wrap justify-between items-center px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] text-xs no-print">
        <span>© 2026 Hệ thống Quản lý Sinh viên • GVHD: TS. Nguyễn Thái Cường</span>
        <span>
          Nhóm 11: Đỗ Đức Cảnh, Nguyễn Đức Thái, Nguyễn Tuấn Linh, Hoàng Duy Đức
        </span>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainPortal />
    </ThemeProvider>
  );
}
