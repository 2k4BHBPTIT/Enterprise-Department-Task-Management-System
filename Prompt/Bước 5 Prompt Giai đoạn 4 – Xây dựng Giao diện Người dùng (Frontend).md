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