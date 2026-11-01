import React, { useEffect, useState } from 'react';
import { LoginView } from './features/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { useAuthStore } from './store/auth.store';

// PM Views
import { PMOverview } from './features/dashboard/PMOverview';
import { TaskList } from './features/tasks/TaskList';
import { ProjectList } from './features/projects/ProjectList';
import { MembersWorkload } from './features/members/MembersWorkload';
import { EisenhowerView } from './features/eisenhower/EisenhowerView';
import { AlertsView } from './features/alerts/AlertsView';
import { CalendarView } from './features/calendar/CalendarView';
import { GanttView } from './features/gantt/GanttView';
import { PermissionManagement } from './features/permissions/PermissionManagement';

// HR Views
import { HROverview } from './features/hr/HROverview';
import { HRScorecard } from './features/hr/HRScorecard';
import { HRTaskList } from './features/hr/HRTaskList';
import { HRComparison } from './features/hr/HRComparison';

// Email Config View
import { EmailConfigView } from './features/email-config/EmailConfigView';
import { DepartmentManagement } from './features/departments/DepartmentManagement';
import { authApi } from './services/api/auth.api';
import { Role, User } from './types';

export const App: React.FC = () => {
  const { activeTab, setCurrentUser } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')));
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(localStorage.getItem('accessToken')));

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    authApi.getCurrentUser()
      .then((current) => {
        const user: User = {
          id: current.userId,
          full_name: current.fullName,
          name: current.fullName,
          email: current.email,
          department_id: current.departmentId ?? 0,
          departmentId: current.departmentId ?? 0,
          system_role: current.systemRole as Role,
          role: current.systemRole as Role,
          status: 'ACTIVE',
        };
        setCurrentUser(user);
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
      })
      .finally(() => setIsRestoringSession(false));
  }, [setCurrentUser]);

  if (isRestoringSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">Đang khôi phục phiên đăng nhập...</div>;
  }

  if (!isLoggedIn) return <LoginView onLoggedIn={() => setIsLoggedIn(true)} />;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Tổng quan', subtitle: 'KPI, biểu đồ & danh sách cần xử lý' };
      case 'tasks':
        return { title: 'Công việc', subtitle: 'Tra cứu, lọc, cập nhật nhanh theo dự án/nhân sự/trạng thái' };
      case 'projects':
        return { title: 'Dự án', subtitle: 'Theo dõi tiến độ, click để xem Gantt và danh sách công việc' };
      case 'members':
        return { title: 'Nhân sự', subtitle: 'Workload & quá hạn theo người' };
      case 'departments':
        return { title: 'Quản lý phòng ban', subtitle: 'Cơ cấu phòng ban, trưởng phòng và nhân sự' };
      case 'permissions':
        return { title: 'Phân quyền', subtitle: 'Quản lý vai trò và quyền truy cập của người dùng' };
      case 'eisenhower':
        return { title: 'Eisenhower', subtitle: 'Ma trận quan trọng/khẩn cấp dựa trên 2 cột Quan trọng & Khẩn cấp' };
      case 'alerts':
        return { title: 'Cảnh báo', subtitle: 'Quá hạn / sắp đến hạn / log nhắc email' };
      case 'calendar':
        return { title: 'Lịch công việc', subtitle: 'Calendar theo ngày, dự án & nhân sự' };
      case 'gantt':
        return { title: 'Gantt', subtitle: 'Gantt chart theo dự án (click dự án để xem)' };
      case 'hr-overview':
        return { title: 'Tổng quan hiệu suất nhân sự', subtitle: 'Tỷ lệ hoàn thành đúng hạn, vi phạm deadline & điểm đánh giá' };
      case 'hr-scorecard':
        return { title: 'Bảng điểm nhân sự', subtitle: 'Chi tiết từng nhân sự theo điểm, deadline và số lần trả về' };
      case 'hr-tasks':
        return { title: 'Danh sách công việc', subtitle: 'Liệt kê công việc gắn với nhân sự để đánh giá kỷ luật' };
      case 'hr-comparison':
        return { title: 'So sánh nhân sự', subtitle: 'Biểu đồ xếp hạng điểm & tỷ lệ đúng hạn' };
      case 'email-settings':
        return { title: 'Cấu hình Email', subtitle: 'Tab quản lý gửi mail nhắc nhở tự động' };
      default:
        return { title: 'Hệ thống Quản lý', subtitle: 'Doanh nghiệp' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-[#EBF2FA] p-3 sm:p-5 flex flex-col gap-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header />

      {/* Main Body with Sidebar + View Content */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
        {/* Sidebar */}
        <Sidebar onRefresh={handleRefresh} />

        {/* Content Pane */}
        <main className="flex-1 w-full space-y-4">
          {activeTab !== 'email-settings' && (
            <FilterBar title={title} subtitle={subtitle} onReload={handleRefresh} />
          )}

          {isRefreshing ? (
            <div className="flex items-center justify-center p-20 bg-white/80 rounded-3xl shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-semibold">Đang đồng bộ dữ liệu...</span>
              </div>
            </div>
          ) : (
            <div className="transition-all duration-200">
              {activeTab === 'overview' && <PMOverview />}
              {activeTab === 'tasks' && <TaskList />}
              {activeTab === 'projects' && <ProjectList />}
              {activeTab === 'members' && <MembersWorkload />}
              {activeTab === 'departments' && <DepartmentManagement />}
              {activeTab === 'permissions' && <PermissionManagement />}
              {activeTab === 'eisenhower' && <EisenhowerView />}
              {activeTab === 'alerts' && <AlertsView />}
              {activeTab === 'calendar' && <CalendarView />}
              {activeTab === 'gantt' && <GanttView />}
              {activeTab === 'hr-overview' && <HROverview />}
              {activeTab === 'hr-scorecard' && <HRScorecard />}
              {activeTab === 'hr-tasks' && <HRTaskList />}
              {activeTab === 'hr-comparison' && <HRComparison />}
              {activeTab === 'email-settings' && <EmailConfigView />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
