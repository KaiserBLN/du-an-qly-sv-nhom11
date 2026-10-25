import React, { useState, useEffect, useCallback } from 'react';
import {
  AuditLogItem,
  DatabaseFileInfo,
  Khoa,
  Lop,
  RoleType,
  SinhVien,
  TaiKhoan,
  UserSession
} from '../types';

// ============================================================================
// 1. QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (ROLE_ADMIN ONLY)
// ============================================================================
export const AccountRBACView: React.FC<{ token: string; onNotify: (msg: string) => void }> = ({
  token,
  onNotify
}) => {
  const [accounts, setAccounts] = useState<TaiKhoan[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAcc, setNewAcc] = useState({
    TenDangNhap: '',
    MatKhau: 'Sv@123456',
    VaiTro: 'ROLE_STUDENT' as RoleType,
    TrangThai: 1,
    MaSV: ''
  });

  const loadAccounts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('vaiTro', roleFilter);

    const res = await fetch(`/api/tai-khoan?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      setAccounts(data.data);
    }
  }, [token, search, roleFilter]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tai-khoan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newAcc)
    });
    const data = await res.json();
    if (data.success) {
      onNotify(data.message);
      setShowCreate(false);
      setNewAcc({
        TenDangNhap: '',
        MatKhau: 'Sv@123456',
        VaiTro: 'ROLE_STUDENT',
        TrangThai: 1,
        MaSV: ''
      });
      loadAccounts();
    } else {
      onNotify(data.message);
    }
  };

  const handleToggleLock = async (acc: TaiKhoan) => {
    const nextStatus = acc.TrangThai === 1 ? 0 : 1;
    const res = await fetch(`/api/tai-khoan/${acc.TenDangNhap}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ TrangThai: nextStatus })
    });
    const data = await res.json();
    if (data.success) {
      onNotify(
        `Đã ${nextStatus === 1 ? 'mở khóa' : 'khóa'} tài khoản '${acc.TenDangNhap}' thành công.`
      );
      loadAccounts();
    } else {
      onNotify(data.message);
    }
  };

  const handleChangeRole = async (acc: TaiKhoan, nextRole: RoleType) => {
    const res = await fetch(`/api/tai-khoan/${acc.TenDangNhap}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ VaiTro: nextRole })
    });
    const data = await res.json();
    if (data.success) {
      onNotify(`Đã phân quyền lại tài khoản '${acc.TenDangNhap}' thành '${nextRole}'.`);
      loadAccounts();
    } else {
      onNotify(data.message);
    }
  };

  const handleResetPassword = async (acc: TaiKhoan) => {
    const nextPass = 'Sv@123456';
    const res = await fetch(`/api/tai-khoan/${acc.TenDangNhap}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ MatKhau: nextPass })
    });
    const data = await res.json();
    if (data.success) {
      onNotify(`Đã đặt lại mật khẩu cho tài khoản '${acc.TenDangNhap}' về 'Sv@123456'.`);
    } else {
      onNotify(data.message);
    }
  };

  return (
    <div data-testid="admin-rbac-view" className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)] m-0">
            Quản trị tài khoản &amp; phân quyền truy cập
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5 m-0">
            Quản lý người dùng, vai trò (RBAC) và trạng thái khóa tài khoản
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="btn-action btn-gold-modern text-xs"
        >
          {showCreate ? 'Đóng biểu mẫu' : '+ Tạo tài khoản mới'}
        </button>
      </div>

      {/* Thanh bộ lọc tài khoản */}
      <div className="wf-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              Tìm theo tên đăng nhập / họ tên
            </label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="VD: admin, giaovu, 2026..."
              className="input-control"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              Lọc theo vai trò (Role)
            </label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input-control"
            >
              <option value="">Tất cả vai trò</option>
              <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên)</option>
              <option value="ROLE_STAFF">ROLE_STAFF (Giáo vụ)</option>
              <option value="ROLE_STUDENT">ROLE_STUDENT (Sinh viên)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('');
              }}
              className="btn-action text-xs"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Form tạo tài khoản mới */}
      {showCreate && (
        <form onSubmit={handleCreateAccount} className="wf-card p-5 space-y-4 text-xs">
          <div className="font-semibold text-sm text-[var(--text)] border-b border-[var(--border)] pb-2">
            Khởi tạo tài khoản hệ thống mới
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-[var(--muted)] mb-1">Tên đăng nhập (*)</label>
              <input
                type="text"
                required
                value={newAcc.TenDangNhap}
                onChange={e => setNewAcc({ ...newAcc, TenDangNhap: e.target.value })}
                placeholder="VD: giaovu_cntt"
                className="input-control"
              />
            </div>
            <div>
              <label className="block font-medium text-[var(--muted)] mb-1">Mật khẩu khởi tạo (*)</label>
              <input
                type="text"
                required
                value={newAcc.MatKhau}
                onChange={e => setNewAcc({ ...newAcc, MatKhau: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="block font-medium text-[var(--muted)] mb-1">Vai trò (*)</label>
              <select
                value={newAcc.VaiTro}
                onChange={e => setNewAcc({ ...newAcc, VaiTro: e.target.value as RoleType })}
                className="input-control"
              >
                <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                <option value="ROLE_STAFF">ROLE_STAFF</option>
                <option value="ROLE_STUDENT">ROLE_STUDENT</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[var(--muted)] mb-1">Mã SV liên kết (nếu có)</label>
              <input
                type="text"
                value={newAcc.MaSV}
                onChange={e => setNewAcc({ ...newAcc, MaSV: e.target.value })}
                placeholder="VD: 2026601001"
                className="input-control"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-action">
              Hủy
            </button>
            <button type="submit" className="btn-action btn-primary-wf">
              Lưu tài khoản
            </button>
          </div>
        </form>
      )}

      {/* Bảng danh sách tài khoản */}
      <div className="wf-card p-5 overflow-x-auto">
        <table className="table-grid">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên đăng nhập</th>
              <th>Nhân sự / Sinh viên</th>
              <th>Vai trò (RBAC)</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => (
              <tr key={acc.TenDangNhap}>
                <td>{idx + 1}</td>
                <td className="font-mono">{acc.TenDangNhap}</td>
                <td>
                  {acc.TenSinhVien ? (
                    <span>
                      {acc.TenSinhVien} ({acc.MaSV})
                    </span>
                  ) : acc.TenDangNhap === 'giaovu_cuong' ? (
                    <span>TS. Nguyễn Thái Cường (GVHD)</span>
                  ) : (
                    <span>Cán bộ quản lý</span>
                  )}
                </td>
                <td>
                  <select
                    aria-label={`Đổi vai trò cho ${acc.TenDangNhap}`}
                    value={acc.VaiTro}
                    disabled={acc.TenDangNhap === 'admin'}
                    onChange={e => handleChangeRole(acc, e.target.value as RoleType)}
                    className="input-control text-xs py-1 px-2 font-mono"
                    style={{ minHeight: '32px' }}
                  >
                    <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                    <option value="ROLE_STAFF">ROLE_STAFF</option>
                    <option value="ROLE_STUDENT">ROLE_STUDENT</option>
                  </select>
                </td>
                <td>
                  <span
                    className={`pill ${
                      acc.TrangThai === 1 ? 'pill-pos' : 'pill-neg'
                    }`}
                  >
                    {acc.TrangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={acc.TenDangNhap === 'admin'}
                      onClick={() => handleToggleLock(acc)}
                      className="btn-action text-xs py-1 px-2.5"
                    >
                      {acc.TrangThai === 1 ? 'Khóa' : 'Mở khóa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(acc)}
                      className="btn-action text-xs py-1 px-2.5"
                    >
                      Đặt lại MK
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 2. MODULE QUẢN LÝ LỚP & KHOA ĐÀO TẠO
// ============================================================================
export const ClassFacultyView: React.FC<{
  classes: Lop[];
  faculties: Khoa[];
  token: string;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}> = ({ classes, faculties, token, onRefresh, onNotify }) => {
  const [newClass, setNewClass] = useState({
    MaLop: '',
    TenLop: '',
    KhoaHoc: 'Khóa 17 (2022 - 2026)',
    CoVanHocTap: 'TS. Nguyễn Thái Cường',
    MaKhoa: 'CNTT'
  });
  const [newFaculty, setNewFaculty] = useState({
    MaKhoa: '',
    TenKhoa: '',
    DienThoai: '',
    Email: ''
  });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/lop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newClass)
    });
    const data = await res.json();
    if (data.success) {
      onNotify(data.message);
      setNewClass({ ...newClass, MaLop: '', TenLop: '' });
      onRefresh();
    } else {
      onNotify(data.message);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/khoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newFaculty)
    });
    const data = await res.json();
    if (data.success) {
      onNotify(data.message);
      setNewFaculty({ MaKhoa: '', TenKhoa: '', DienThoai: '', Email: '' });
      onRefresh();
    } else {
      onNotify(data.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quản lý Khoa */}
      <section className="wf-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mt-0 mb-3 border-b border-[var(--border)] pb-2">
          Danh mục Khoa đào tạo
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="table-grid">
            <thead>
              <tr>
                <th>Mã Khoa</th>
                <th>Tên Khoa đào tạo</th>
                <th>Điện thoại</th>
                <th>Email liên hệ</th>
                <th>Số Lớp</th>
                <th>Tổng SV</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map(k => (
                <tr key={k.MaKhoa}>
                  <td className="font-mono">{k.MaKhoa}</td>
                  <td>{k.TenKhoa}</td>
                  <td>{k.DienThoai}</td>
                  <td>{k.Email}</td>
                  <td>{k.SoLop ?? 0}</td>
                  <td>{k.SoSinhVien ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddFaculty} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs">
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Mã Khoa (*)</label>
            <input
              type="text"
              required
              placeholder="VD: NN"
              value={newFaculty.MaKhoa}
              onChange={e => setNewFaculty({ ...newFaculty, MaKhoa: e.target.value })}
              className="input-control"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium text-[var(--muted)] mb-1">Tên Khoa (*)</label>
            <input
              type="text"
              required
              placeholder="VD: Khoa Ngoại ngữ"
              value={newFaculty.TenKhoa}
              onChange={e => setNewFaculty({ ...newFaculty, TenKhoa: e.target.value })}
              className="input-control"
            />
          </div>
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Điện thoại</label>
            <input
              type="text"
              placeholder="02437655..."
              value={newFaculty.DienThoai}
              onChange={e => setNewFaculty({ ...newFaculty, DienThoai: e.target.value })}
              className="input-control"
            />
          </div>
          <button type="submit" className="btn-action btn-primary-wf h-[36px]">
            + Thêm Khoa
          </button>
        </form>
      </section>

      {/* Quản lý Lớp */}
      <section className="wf-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mt-0 mb-3 border-b border-[var(--border)] pb-2">
          Danh mục Lớp sinh hoạt
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="table-grid">
            <thead>
              <tr>
                <th>Mã Lớp</th>
                <th>Tên Lớp sinh hoạt</th>
                <th>Khóa học</th>
                <th>Cố vấn học tập</th>
                <th>Khoa trực thuộc</th>
                <th>Sĩ số</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(l => (
                <tr key={l.MaLop}>
                  <td className="font-mono">{l.MaLop}</td>
                  <td>{l.TenLop}</td>
                  <td>{l.KhoaHoc}</td>
                  <td>{l.CoVanHocTap}</td>
                  <td>
                    {l.MaKhoa} - {l.TenKhoa}
                  </td>
                  <td>{l.SiSo ?? 0} SV</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs">
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Mã Lớp (*)</label>
            <input
              type="text"
              required
              placeholder="VD: KTPM-04K17"
              value={newClass.MaLop}
              onChange={e => setNewClass({ ...newClass, MaLop: e.target.value })}
              className="input-control"
            />
          </div>
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Tên Lớp (*)</label>
            <input
              type="text"
              required
              placeholder="Kỹ thuật Phần mềm 04"
              value={newClass.TenLop}
              onChange={e => setNewClass({ ...newClass, TenLop: e.target.value })}
              className="input-control"
            />
          </div>
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Cố vấn học tập</label>
            <input
              type="text"
              value={newClass.CoVanHocTap}
              onChange={e => setNewClass({ ...newClass, CoVanHocTap: e.target.value })}
              className="input-control"
            />
          </div>
          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Thuộc Khoa (*)</label>
            <select
              value={newClass.MaKhoa}
              onChange={e => setNewClass({ ...newClass, MaKhoa: e.target.value })}
              className="input-control"
            >
              {faculties.map(f => (
                <option key={f.MaKhoa} value={f.MaKhoa}>
                  {f.MaKhoa} - {f.TenKhoa}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-action btn-primary-wf h-[36px]">
            + Thêm Lớp
          </button>
        </form>
      </section>
    </div>
  );
};

// ============================================================================
// 3. MODULE BÁO CÁO THỐNG KÊ & QUẢN LÝ ĐA DATABASE
// ============================================================================
export const DashboardAndDbView: React.FC<{
  token: string;
  currentUser: UserSession;
  onDatabaseSwitched: () => void;
  onNotify: (msg: string) => void;
}> = ({ token, currentUser, onDatabaseSwitched, onNotify }) => {
  const [stats, setStats] = useState<any>(null);
  const [databases, setDatabases] = useState<DatabaseFileInfo[]>([]);
  const [newDbName, setNewDbName] = useState('');
  const [includeSeed, setIncludeSeed] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const loadData = useCallback(async () => {
    const resStats = await fetch('/api/thong-ke', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dStats = await resStats.json();
    if (dStats.success) setStats(dStats.data);

    if (currentUser.vaiTro === 'ROLE_ADMIN') {
      const resDb = await fetch('/api/databases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dDb = await resDb.json();
      if (dDb.success) setDatabases(dDb.databases);

      const resLogs = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dLogs = await resLogs.json();
      if (dLogs.success) setAuditLogs(dLogs.data);
    }
  }, [token, currentUser.vaiTro]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrSwitchDb = async (targetName: string, withSample: boolean) => {
    const res = await fetch('/api/databases/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dbName: targetName, includeSampleData: withSample })
    });
    const data = await res.json();
    if (data.success) {
      onNotify(data.message);
      setNewDbName('');
      loadData();
      onDatabaseSwitched();
    } else {
      onNotify(data.message);
    }
  };

  if (!stats) {
    return <div className="p-4 text-sm text-[var(--muted)]">Đang tải dữ liệu thống kê...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)] m-0">
          Thống kê đào tạo &amp; quản trị cơ sở dữ liệu
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5 m-0">
          Tổng hợp số liệu sinh viên theo khoa, trạng thái học tập và quản lý kết nối Database
        </p>
      </div>

      {/* 4 Ô chỉ số tổng quan: Single Divided Container */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border)] rounded-lg divide-y md:divide-y-0 md:divide-x divide-[var(--border)] bg-[var(--surface)]">
        <div className="p-4">
          <div className="text-xs font-normal text-[var(--muted)]">Tổng số Sinh viên</div>
          <div className="text-2xl font-normal text-[var(--text)] mt-1">{stats.summary.totalSV}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-normal text-[var(--muted)]">Tổng số Lớp học</div>
          <div className="text-2xl font-normal text-[var(--text)] mt-1">{stats.summary.totalLop}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-normal text-[var(--muted)]">Tổng số Khoa</div>
          <div className="text-2xl font-normal text-[var(--text)] mt-1">{stats.summary.totalKhoa}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-normal text-[var(--muted)]">Tài khoản Hệ thống</div>
          <div className="text-2xl font-normal text-[var(--text)] mt-1">
            {stats.summary.totalTaiKhoan}
          </div>
        </div>
      </div>

      {/* Thống kê theo Khoa & Trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="wf-card p-5">
          <div className="text-sm font-semibold text-[var(--text)] mb-3 border-b border-[var(--border)] pb-2">
            Phân bổ sinh viên theo Khoa
          </div>
          <table className="table-grid">
            <thead>
              <tr>
                <th>Mã Khoa</th>
                <th>Tên Khoa</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {stats.byKhoa.map((item: any) => (
                <tr key={item.MaKhoa}>
                  <td className="font-mono">{item.MaKhoa}</td>
                  <td>{item.TenKhoa}</td>
                  <td>{item.soLuong} SV</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="wf-card p-5">
          <div className="text-sm font-semibold text-[var(--text)] mb-3 border-b border-[var(--border)] pb-2">
            Thống kê theo Trạng thái học tập
          </div>
          <table className="table-grid">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {stats.byTrangThai.map((item: any) => (
                <tr key={item.TrangThai}>
                  <td>{item.TrangThai}</td>
                  <td>{item.soLuong} SV</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khu vực Quản lý & Thêm Database Mới trực tiếp (Admin Only) */}
      {currentUser.vaiTro === 'ROLE_ADMIN' && (
        <section data-testid="database-manager-section" className="wf-card p-5 space-y-4">
          <div className="text-sm font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Quản lý Đa Cơ sở dữ liệu (Multi-Database Manager)
          </div>

          <div className="text-xs space-y-1 text-[var(--muted)]">
            <div>
              • <strong>Database đang kết nối:</strong>{' '}
              <code className="text-[var(--text)]">{stats.dbInfo?.activeDb}</code>
            </div>
            <div>
              • <strong>Kịch bản SQL chuẩn 3NF:</strong>{' '}
              <code>database/schema_sqlserver.sql</code>,{' '}
              <code>database/schema_mysql.sql</code>,{' '}
              <code>database/schema_sqlite.sql</code>.
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (newDbName.trim()) {
                handleCreateOrSwitchDb(newDbName.trim(), includeSeed);
              }
            }}
            className="flex flex-wrap gap-3 items-end p-4 rounded-lg bg-[var(--raised)] border border-[var(--border)]"
          >
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="new-db-name" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Tên Database mới (.db)
              </label>
              <input
                id="new-db-name"
                data-testid="new-db-name-input"
                type="text"
                value={newDbName}
                onChange={e => setNewDbName(e.target.value)}
                placeholder="VD: QLSV_HocKy2_2026"
                className="input-control"
                required
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium pb-2 cursor-pointer text-[var(--text)]">
              <input
                type="checkbox"
                checked={includeSeed}
                onChange={e => setIncludeSeed(e.target.checked)}
              />
              <span>Khởi tạo kèm dữ liệu mẫu</span>
            </label>
            <button
              type="submit"
              data-testid="create-new-db-btn"
              className="btn-action btn-gold-modern"
            >
              + Tạo &amp; Kết nối DB
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="table-grid">
              <thead>
                <tr>
                  <th>Tên file Database</th>
                  <th>Trạng thái</th>
                  <th>Dung lượng</th>
                  <th>Đường dẫn lưu trữ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {databases.map(dbItem => (
                  <tr key={dbItem.name}>
                    <td className="font-mono">{dbItem.name}</td>
                    <td>
                      {dbItem.active ? (
                        <span className="pill pill-pos">
                          Đang kết nối
                        </span>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">Sẵn sàng</span>
                      )}
                    </td>
                    <td>{(dbItem.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="font-mono text-xs text-[var(--muted)]">{dbItem.fullPath}</td>
                    <td>
                      {!dbItem.active && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateOrSwitchDb(dbItem.name.replace(/\.db$/, ''), false)
                          }
                          className="btn-action text-xs py-1 px-2.5"
                        >
                          Kết nối
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Nhật ký Audit bảo mật (Admin Only) */}
      {currentUser.vaiTro === 'ROLE_ADMIN' && auditLogs.length > 0 && (
        <section className="wf-card p-5">
          <div className="text-sm font-semibold text-[var(--text)] mb-3 border-b border-[var(--border)] pb-2">
            Nhật ký Hoạt động Hệ thống
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="table-grid">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Tài khoản</th>
                  <th>Vai trò</th>
                  <th>Thao tác</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 12).map(log => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="font-mono">{log.actor}</td>
                    <td className="font-mono text-xs">{log.role}</td>
                    <td className="text-xs font-medium">{log.action}</td>
                    <td className="text-xs text-[var(--muted)]">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// 4. MODULE HỒ SƠ CÁ NHÂN SINH VIÊN
// ============================================================================
export const StudentSelfProfileView: React.FC<{
  currentUser: UserSession;
  token: string;
  onNotify: (msg: string) => void;
}> = ({ currentUser, token, onNotify }) => {
  const [profile, setProfile] = useState<SinhVien | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hometown, setHometown] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMyProfile = useCallback(async () => {
    if (!currentUser.maSV) return;
    const res = await fetch(`/api/sinh-vien/${currentUser.maSV}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      setProfile(data.data);
      setPhone(data.data.SoDienThoai || '');
      setEmail(data.data.Email || '');
      setHometown(data.data.QueQuan || '');
    }
  }, [currentUser.maSV, token]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.maSV) return;
    setSaving(true);
    const res = await fetch(`/api/sinh-vien/${currentUser.maSV}/lien-he`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ SoDienThoai: phone, Email: email, QueQuan: hometown })
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      onNotify(data.message);
      loadMyProfile();
    } else {
      onNotify(data.message);
    }
  };

  if (!profile) {
    return <div className="p-4 text-sm text-[var(--muted)]">Đang tải hồ sơ cá nhân...</div>;
  }

  return (
    <div data-testid="admin-rbac-view" className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text)] m-0">
        Hồ sơ cá nhân ({profile.HoTen} - {profile.MaSV})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="wf-card p-5 space-y-2.5 text-sm">
          <div className="font-semibold text-sm text-[var(--text)] border-b border-[var(--border)] pb-2">
            Thông tin học vụ
          </div>
          <div>
            <span className="text-[var(--muted)]">Mã sinh viên:</span>{' '}
            <strong className="font-mono text-[var(--text)]">{profile.MaSV}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Họ và tên:</span> <strong className="text-[var(--text)]">{profile.HoTen}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Ngày sinh:</span> <strong className="text-[var(--text)]">{profile.NgaySinh}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Giới tính:</span> <strong className="text-[var(--text)]">{profile.GioiTinh}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Lớp sinh hoạt:</span>{' '}
            <strong className="text-[var(--text)]">
              {profile.MaLop} ({profile.TenLop})
            </strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Khoa đào tạo:</span>{' '}
            <strong className="text-[var(--text)]">{profile.TenKhoa}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Cố vấn học tập:</span>{' '}
            <strong className="text-[var(--text)]">{profile.CoVanHocTap}</strong>
          </div>
          <div>
            <span className="text-[var(--muted)]">Trạng thái:</span>{' '}
            <strong className="text-[var(--text)]">{profile.TrangThai}</strong>
          </div>
        </div>

        <form onSubmit={handleSaveContact} className="wf-card p-5 space-y-3.5 text-sm">
          <div className="font-semibold text-sm text-[var(--text)] border-b border-[var(--border)] pb-2">
            Cập nhật thông tin liên lạc
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-control"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-control"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Địa chỉ / Quê quán</label>
            <input
              type="text"
              value={hometown}
              onChange={e => setHometown(e.target.value)}
              className="input-control"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-action btn-primary-wf">
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
};
