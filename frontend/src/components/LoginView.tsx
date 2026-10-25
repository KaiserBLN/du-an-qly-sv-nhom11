import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Lock,
  KeyRound,
  HelpCircle,
  AlertTriangle,
  LogIn
} from 'lucide-react';
import { UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [portalMode, setPortalMode] = useState<'STAFF' | 'STUDENT'>('STAFF');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      } else {
        onLoginSuccess(data.token, data.user);
      }
    } catch {
      setErrorMsg('Không thể kết nối tới máy chủ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (user: string, pass: string, mode: 'STAFF' | 'STUDENT') => {
    setPortalMode(mode);
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="wireframe-container">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text)]">
              Hệ thống Quản lý Hồ sơ Sinh viên
            </div>
            <div className="text-xs text-[var(--muted)]">
              Cổng Quản trị &amp; Đào tạo Trực tuyến
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="btn-action text-xs"
          >
            <HelpCircle className="w-4 h-4 text-[var(--muted)]" />
            <span>Trợ giúp</span>
          </button>
        </div>
      </header>

      {/* Thanh điều hướng ngang */}
      <nav className="flex flex-wrap border-b border-[var(--border)] bg-[var(--ground)] px-6 py-2 gap-2 text-xs font-medium text-[var(--muted)]">
        <span className="px-3 py-1 rounded-md bg-[var(--active)] text-[var(--text)] font-semibold">
          Đăng nhập
        </span>
        <span className="px-3 py-1">Giới thiệu</span>
        <span className="px-3 py-1">Quy chế đào tạo</span>
        <span className="px-3 py-1">Liên hệ hỗ trợ</span>
      </nav>

      {/* Nội dung trung tâm */}
      <main className="p-6 md:p-12 bg-[var(--ground)]">
        <div className="max-w-xl mx-auto bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-6 text-center border-b border-[var(--border)]">
            <h1 className="text-lg font-semibold text-[var(--text)] m-0">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs mt-1 m-0 text-[var(--muted)]">
              Cổng Quản lý &amp; Tra cứu Thông tin Đào tạo
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            method="POST"
            action="/api/auth/login"
            className="p-6 space-y-4 text-sm"
            noValidate
          >
            {/* Phân hệ truy cập */}
            <fieldset className="border border-[var(--border)] rounded-md p-3 bg-[var(--raised)]">
              <legend className="text-xs font-medium px-2 text-[var(--muted)]">
                Vai trò truy cập
              </legend>
              <div className="flex flex-wrap gap-6 text-xs pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                  <input
                    type="radio"
                    name="portalMode"
                    value="STAFF"
                    checked={portalMode === 'STAFF'}
                    onChange={() => setPortalMode('STAFF')}
                  />
                  <span>Quản trị viên / Giáo vụ</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                  <input
                    type="radio"
                    name="portalMode"
                    value="STUDENT"
                    checked={portalMode === 'STUDENT'}
                    onChange={() => setPortalMode('STUDENT')}
                  />
                  <span>Sinh viên</span>
                </label>
              </div>
            </fieldset>

            {/* Tên đăng nhập */}
            <div>
              <label htmlFor="login-username" className="block font-medium text-xs text-[var(--muted)] mb-1">
                Tên đăng nhập / Mã sinh viên
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Nhập tài khoản hoặc mã sinh viên..."
                className="input-control"
                required
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="login-password" className="block font-medium text-xs text-[var(--muted)] mb-1">
                Mật khẩu
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                className="input-control"
                required
              />
            </div>

            {/* Ghi nhớ phiên làm việc */}
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span>Duy trì trạng thái đăng nhập</span>
              </label>
            </div>

            {/* Khung thông báo lỗi */}
            <div aria-live="polite">
              {errorMsg && (
                <div
                  data-testid="login-error-box"
                  className="p-3 rounded-md border border-[var(--negative)]/30 bg-[var(--pill-negative-bg)] text-[var(--negative)] text-xs font-medium flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Nút ĐĂNG NHẬP */}
            <div className="text-center pt-1">
              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit-btn"
                className="btn-action btn-primary-wf w-full py-2 text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              </button>
            </div>

            {/* Khu vực chọn nhanh tài khoản mẫu */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs">
              <div className="font-medium text-xs text-[var(--muted)] mb-2 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Tài khoản truy cập nhanh:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="demo-admin-btn"
                  onClick={() => fillDemoAccount('admin', 'Admin@123', 'STAFF')}
                  className="btn-action text-left justify-start text-xs py-1.5 px-2.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span>Quản trị viên (admin)</span>
                </button>
                <button
                  type="button"
                  data-testid="demo-staff-btn"
                  onClick={() => fillDemoAccount('giaovu_thai', 'Staff@123', 'STAFF')}
                  className="btn-action text-left justify-start text-xs py-1.5 px-2.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[var(--positive)] shrink-0" />
                  <span>Giáo vụ (giaovu_thai)</span>
                </button>
                <button
                  type="button"
                  data-testid="demo-student-btn"
                  onClick={() => fillDemoAccount('2026601001', 'Sv@123456', 'STUDENT')}
                  className="btn-action text-left justify-start text-xs py-1.5 px-2.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span>Sinh viên (2026601001)</span>
                </button>
                <button
                  type="button"
                  data-testid="demo-locked-btn"
                  onClick={() => fillDemoAccount('2026601004', 'Sv@123456', 'STUDENT')}
                  className="btn-action text-left justify-start text-xs py-1.5 px-2.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[var(--negative)] shrink-0" />
                  <span>Tài khoản khóa (2026601004)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              <button
                type="button"
                onClick={() =>
                  setErrorMsg(
                    'Vui lòng liên hệ Phòng Đào tạo hoặc Quản trị viên hệ thống để cấp lại mật khẩu.'
                  )
                }
                className="underline cursor-pointer bg-transparent border-0 p-0 hover:text-[var(--text)]"
              >
                Quên mật khẩu?
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="underline cursor-pointer bg-transparent border-0 p-0 hover:text-[var(--text)]"
              >
                Hướng dẫn truy cập
              </button>
            </div>
          </form>
        </div>

        {showGuide && (
          <div className="max-w-xl mx-auto mt-4 p-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--pill-warning-bg)] text-xs space-y-1.5 text-[var(--pill-warning-ink)]">
            <div className="font-semibold">Phân luồng cổng làm việc:</div>
            <div>• <strong>Quản trị viên</strong> (<code>admin</code> / <code>Admin@123</code>): Trang Quản trị Hệ thống chuyên biệt.</div>
            <div>• <strong>Giáo vụ</strong> (<code>giaovu_thai</code> / <code>Staff@123</code>): Cổng Quản lý Đào tạo &amp; Sinh viên.</div>
            <div>• <strong>Sinh viên</strong> (<code>2026601001</code> / <code>Sv@123456</code>): Cổng Thông tin Sinh viên.</div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex flex-wrap justify-between items-center px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] text-xs">
        <span>© 2026 Hệ thống Quản lý Sinh viên • Nhóm 11</span>
        <span>GVHD: TS. Nguyễn Thái Cường • Lớp KTPM-03K17</span>
      </footer>
    </div>
  );
};
