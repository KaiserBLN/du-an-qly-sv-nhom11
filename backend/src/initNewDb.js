/**
 * Công cụ dòng lệnh (CLI) để khởi tạo nhanh một Database mới
 * Cách chạy: node src/initNewDb.js <Ten_Database_Moi> [--empty]
 */
import { createOrSwitchDatabase } from './db.js';

const args = process.argv.slice(2);
const dbName = args[0] || `QLSV_System_New_${Date.now()}`;
const isEmpty = args.includes('--empty');

createOrSwitchDatabase(dbName, !isEmpty).then(result => {
  console.log('===================================================================');
  console.log(' [THÀNH CÔNG] ĐÃ KHỞI TẠO CƠ SỞ DỮ LIỆU MỚI CHUẨN');
  console.log(` - Tên file CSDL : ${result.dbName}`);
  console.log(` - Đường dẫn vật lý: ${result.path}`);
  console.log(` - Chế độ dữ liệu : ${isEmpty ? 'Chỉ tạo 4 bảng rỗng (Empty Schema)' : 'Đã nạp sẵn dữ liệu mẫu '}`);
  console.log('===================================================================');
});
