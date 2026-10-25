import jwt from 'jsonwebtoken';
import { addAuditLog } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'QLSV_SYSTEM_NHOM11_IT6040003_SECRET_KEY_2026';

/**
 * Middleware xác thực người dùng (Authentication Guard)
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại (UC01).'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token xác thực không hợp lệ hoặc đã hết hạn.'
    });
  }
}

/**
 * Middleware phân quyền theo vai trò (Backend Controller RBAC Guard - Mục 3.1)
 * Nếu ROLE_STUDENT cố tình gửi lệnh POST/PUT/DELETE trái phép -> Phản hồi ngay 403 Forbidden
 */
export function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Chưa xác thực người dùng.'
      });
    }

    if (!allowedRoles.includes(req.user.vaiTro)) {
      addAuditLog(
        req.user.tenDangNhap,
        req.user.vaiTro,
        'RBAC_DENIED_403',
        `${req.method} ${req.originalUrl}`,
        `Chặn truy cập trái phép: Yêu cầu quyền [${allowedRoles.join(', ')}], vai trò hiện tại là [${req.user.vaiTro}]`
      );
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_403',
        status: 403,
        error: '403 Access Denied / Forbidden',
        message: `403 Access Denied: Tài khoản '${req.user.tenDangNhap}' (${req.user.vaiTro}) không có quyền thực hiện thao tác này. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}.`
      });
    }

    next();
  };
}
