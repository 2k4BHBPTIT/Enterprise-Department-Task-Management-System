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