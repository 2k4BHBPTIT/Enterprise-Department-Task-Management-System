### Bước 1 Master Prompt (Thiết lập Kiến trúc & Quy chuẩn Kỹ thuật).md

# ROLE & OBJECTIVE
Bạn là một Principal Full-Stack Software Architect. Nhiệm vụ của bạn là cùng tôi thiết kế và xây dựng hoàn chỉnh dự án Web: "Hệ thống quản lý phòng ban và phân công công việc trong doanh nghiệp" (Enterprise Department & Task Management System).

# TECH STACK YÊU CẦU
- Cơ sở dữ liệu: PostgreSQL.
- Backend: [Node.js + Express.js / TypeScript] kết nối DB qua [Prisma ORM / TypeORM].
- Frontend: [React.js + Vite + Tailwind CSS + Lucide Icons + Axios + React Query / Zustand].
- Authentication & Security: JWT (Access Token + Refresh Token), bcrypt, Helmet, CORS, Rate Limiting, Zod (Input Validation).

# TIÊU CHUẨN KỸ THUẬT BẮT BUỘC (CODING STANDARDS)
1. Kiến trúc: Áp dụng mô hình Layered Architecture (Routes -> Controllers -> Services -> Repositories/Data Access) kết hợp Middleware.
2. Bảo mật: Phòng chống triệt để SQL Injection, XSS, CSRF. Mọi biến nhạy cảm phải đọc từ biến môi trường (`.env`).
3. Phân quyền (RBAC): Kiểm soát chặt chẽ 3 vai trò:
   - `ADMIN` (Quản trị viên): Toàn quyền quản lý cấu trúc doanh nghiệp, phòng ban, chức vụ, nhân sự và tất cả dự án.
   - `MANAGER` (Trưởng phòng): Quản lý nhân viên trong phòng ban của mình, khởi tạo dự án/công việc, giao việc và duyệt tiến độ.
   - `EMPLOYEE` (Nhân viên): Xem công việc được giao, cập nhật trạng thái/tiến độ công việc cá nhân, bình luận trao đổi.
4. Xử lý lỗi & Toàn vẹn dữ liệu: Có Centralized Error Handling Middleware. Mọi thao tác cập nhật công việc (`Tasks`) đồng thời ghi lịch sử (`Task_History`) bắt buộc phải nằm trong Database Transaction (`ACID`).
5. Chất lượng Code: Code sạch, chia module rõ ràng, sẵn sàng cho môi trường Production (không viết code demo sơ sài, không dùng comment `// TODO` để bỏ qua logic).

# PHẠM VI NGHIỆP VỤ CỐT LÕI
1. Quản lý thông tin doanh nghiệp, phòng ban (Departments), chức vụ (Positions) và hồ sơ nhân viên (Employees liên kết Users).
2. Quản lý dự án (Projects) và công việc (Tasks): Tạo mới, phân công (Assign), thiết lập độ ưu tiên/deadline, cập nhật trạng thái (TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED) và phần trăm tiến độ (0-100%).
3. Lưu trữ lịch sử thay đổi công việc (Task_History) tự động khi có cập nhật và chức năng bình luận/trao đổi (Task_Comments) trong từng công việc.
4. Dashboard tổng quan: Thống kê nhân sự theo phòng ban, tiến độ dự án, tỷ lệ hoàn thành công việc đúng hạn/quá hạn.

# CẤU TRÚC PHẢN HỒI BẮT BUỘC
Trong mọi câu trả lời tiếp theo, bạn phải trình bày theo đúng 4 phần:
1. Analysis: Phân tích yêu cầu, luồng dữ liệu và các trường hợp biên (edge cases).
2. Solution Design: Giải thích quyết định thiết kế, cấu trúc thư mục hoặc sơ đồ luồng.
3. Implementation: Mã nguồn đầy đủ, rõ ràng, có thể chạy thực tế.
4. Improvements: Đề xuất tối ưu hiệu năng và bảo mật.

Hãy xác nhận bạn đã hiểu rõ kiến trúc hệ thống và xuất ra:
1. Cấu trúc thư mục (Folder Structure) chuẩn Production cho cả Backend và Frontend.
2. Phân tích chi tiết ma trận phân quyền (RBAC Permission Matrix) cho 3 nhóm người dùng trên.
Chưa viết code chi tiết ở bước này.

### Bước 2 Prompt Giai đoạn 1 – Thiết kế Cơ sở dữ liệu (PostgreSQL).md

# TASK: THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL & ORM SCHEMA
Dựa trên yêu cầu hệ thống, hãy thiết kế cơ sở dữ liệu PostgreSQL hoàn chỉnh dựa trên các thực thể gốc: `Users`, `Roles`, `Departments`, `Employees`, `Projects`, `Tasks`, `Task_History` và bổ sung các bảng phụ trợ cần thiết để đáp ứng trọn vẹn nghiệp vụ (như `Positions` cho chức vụ, `Task_Comments` cho trao đổi công việc, `Project_Members` cho thành viên dự án).

# YÊU CẦU CHI TIẾT:
1. Chuẩn hóa dữ liệu đạt chuẩn 3NF, phân tách rõ thông tin tài khoản đăng nhập (`Users`) và hồ sơ nhân sự (`Employees`).
2. Thiết lập đầy đủ Primary Key (UUID hoặc BIGSERIAL), Foreign Key kèm hành vi `ON DELETE` hợp lý (`RESTRICT`, `SET NULL`, `CASCADE`), và các ràng buộc `CHECK` (ví dụ: tiến độ công việc từ 0 đến 100, ngày kết thúc >= ngày bắt đầu).
3. Đánh Index (B-TreeIndex) cho các trường thường xuyên truy vấn và lọc dữ liệu (như `department_id`, `project_id`, `assignee_id`, `status`, `due_date`).
4. Cung cấp đầy đủ:
   - Sơ đồ ERD bằng cú pháp Mermaid.js.
   - Mã nguồn SQL DDL (`schema.sql`) chuẩn PostgreSQL (bao gồm cả `ENUM` types và Trigger tự động cập nhật `updated_at`).
   - File `schema.prisma` (nếu dùng Prisma ORM) và dữ liệu mẫu (`seed.sql`) cho 3 Roles, 2 Phòng ban và các tài khoản mẫu.

### Bước 3 Prompt Giai đoạn 2 – Xây dựng Backend Core, Auth & Phân quyền RBAC.md

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

### Bước 4 Prompt Giai đoạn 3 – Xây dựng API Nghiệp vụ (Phòng ban, Dự án, Công việc & Lịch sử).md

# TASK: XÂY DỰNG RESTFUL API NGHIỆP VỤ CỐT LÕI
Hãy triển khai đầy đủ Controller, Service, Repository và Zod Validation Schema cho các module nghiệp vụ sau:

1. Module Tổ chức & Nhân sự (`Departments` & `Employees`):
   - CRUD Phòng ban, bổ nhiệm Trưởng phòng.
   - Thêm mới nhân viên (tự động tạo tài khoản `Users` + hồ sơ `Employees` trong cùng 1 Database Transaction), điều chuyển phòng ban và cập nhật chức vụ.
2. Module Dự án & Phân công công việc (`Projects` & `Tasks`):
   - Tạo dự án gắn với phòng ban phụ trách, thêm thành viên vào dự án.
   - Tạo công việc (`Tasks`), giao việc cho nhân viên (kiểm tra nhân viên đó phải thuộc phòng ban/dự án hợp lệ).
   - Cập nhật trạng thái (`status`) và tiến độ (`progress`) công việc: BẮT BUỘC sử dụng Database Transaction để vừa cập nhật bảng `Tasks`, vừa tự động ghi bản ghi mới vào bảng `Task_History` (lưu rõ `changed_by`, `field_changed`, `old_value`, `new_value`, `changed_at`).
3. Module Trao đổi & Thống kê (`Task_Comments` & `Dashboard`):
   - API thêm bình luận trao đổi vào công việc và lấy danh sách lịch sử + bình luận theo thời gian.
   - API Dashboard (`/api/v1/dashboard/summary`): Sử dụng câu truy vấn tối ưu (`GROUP BY` / `COUNT FILTER`) để trả về số lượng nhân sự theo phòng ban, tiến độ các dự án, số lượng công việc theo trạng thái và danh sách công việc sắp đến hạn/quá hạn.

### Bước 5 Prompt Giai đoạn 4 – Xây dựng Giao diện Người dùng (Frontend).md

# TASK: XÂY DỰNG GIAO DIỆN FRONTEND (REACT + TAILWIND CSS)
Hãy xây dựng tầng Frontend kết nối với các API đã thiết kế ở trên, đảm bảo giao diện hiện đại, chuẩn UX doanh nghiệp và phân quyền hiển thị theo Role:

1. Cấu trúc Core Frontend:
   - Cấu hình Axios Instance có Interceptor tự động đính kèm Token và xử lý Refresh Token khi gặp lỗi 401.
   - Cấu hình `ProtectedRoute` chặn truy cập trái phép theo Role (`ADMIN`, `MANAGER`, `EMPLOYEE`).
   - Bố cục `MainLayout` gồm Sidebar điều hướng thông minh (ẩn/hiện menu theo Role) và Header hiển thị thông tin nhân viên + phòng ban.
2. Các màn hình chính (Pages & Components):
   - **Trang Dashboard Tổng quan:** Hiển thị các thẻ KPI (Tổng nhân sự, Dự án đang chạy, Công việc hoàn thành, Công việc quá hạn) và biểu đồ trực quan hóa tiến độ theo phòng ban/dự án.
   - **Trang Quản lý Phòng ban & Nhân sự:** Bảng danh sách nhân viên có bộ lọc theo phòng ban, chức vụ, tìm kiếm từ khóa và Modal thêm/sửa nhân sự.
   - **Trang Quản lý Công việc (Kanban Board & List View):** Hỗ trợ xem công việc theo cột trạng thái (To Do, In Progress, In Review, Done), lọc theo dự án/người thực hiện.
   - **Modal Chi tiết Công việc (Task Detail Drawer/Modal):** Cho phép cập nhật trạng thái, kéo thanh trượt tiến độ (%), xem dòng thời gian Lịch sử thay đổi (`Task History`) bên cạnh khu vực Bình luận trao đổi (`Task Comments`).

### Bước 6 Prompt viết Báo cáo Đồ án  Tài liệu Kỹ thuật.md

# TASK: XÂY DỰNG TÀI LIỆU ĐẶC TẢ HỆ THỐNG (SRS & SYSTEM DESIGN DOCUMENT)
Dựa trên toàn bộ hệ thống "Xây dựng hệ thống quản lý phòng ban và phân công công việc trong doanh nghiệp", hãy lập tài liệu thiết kế hệ thống chuẩn học thuật và doanh nghiệp gồm:
1. Danh sách Yêu cầu chức năng (Functional Requirements) và Yêu cầu phi chức năng (Non-Functional Requirements).
2. Biểu đồ Use Case tổng quát và phân rã theo 3 tác nhân (Admin, Trưởng phòng, Nhân viên) kèm bảng đặc tả chi tiết cho 3 Use Case quan trọng nhất: "Phân công công việc", "Cập nhật tiến độ & Ghi lịch sử", "Thống kê tiến độ phòng ban".
3. Biểu đồ tuần tự (Sequence Diagram - viết bằng mã Mermaid.js) cho luồng: Trưởng phòng giao việc -> Nhân viên cập nhật trạng thái -> Hệ thống ghi nhận Task History.
4. Đặc tả chi tiết các bảng Cơ sở dữ liệu (Data Dictionary) dưới dạng bảng Markdown (Tên trường, Kiểu dữ liệu, Ràng buộc, Mô tả).

