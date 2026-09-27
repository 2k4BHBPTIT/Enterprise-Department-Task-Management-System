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