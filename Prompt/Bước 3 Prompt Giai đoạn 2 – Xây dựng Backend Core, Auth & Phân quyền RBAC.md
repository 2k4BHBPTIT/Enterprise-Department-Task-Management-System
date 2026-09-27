# TASK: XÂY DỰNG BACKEND CORE, AUTHENTICATION & RBAC MIDDLEWARE
Hãy viết mã nguồn hoàn chỉnh cho tầng Core của Backend bao gồm:
1. Cấu hình kết nối PostgreSQL, quản lý biến môi trường (`env.validation.ts` bằng Zod) và Centralized Error Handling (`AppError`, `errorMiddleware`).
2. Module Authentication (`AuthController`, `AuthService`, `AuthRoutes`):
   - Đăng nhập (kiểm tra trạng thái tài khoản active/locked, trả về Access Token & Refresh Token qua HttpOnly Cookie).
   - Làm mới token (Refresh Token) và Đăng xuất.
   - API lấy thông tin hồ sơ người dùng hiện tại (`/api/v1/auth/me`) kèm thông tin Phòng ban, Chức vụ và Role.
3. Middleware Bảo mật & Phân quyền (`auth.middleware.ts`, `rbac.middleware.ts`):
   - `authenticate`: Xác thực JWT.
   - `authorizeRoles(...allowedRoles)`: Kiểm tra quyền theo nhóm (ADMIN, MANAGER, EMPLOYEE).
   - `authorizeDepartmentScope`: Đảm bảo Trưởng phòng (`MANAGER`) chỉ được phép thao tác trên dữ liệu thuộc phòng ban của mình, và `EMPLOYEE` chỉ được cập nhật công việc được giao cho chính họ.